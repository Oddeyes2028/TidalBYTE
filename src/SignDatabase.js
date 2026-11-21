/**
 * Local JSON/IndexedDB Sign Reference Store.
 * Ships with seed sign templates and lets contributors record/export
 * new sign sequences directly from their webcam into a shareable JSON database.
 */

const STORAGE_KEY = "asl_mediapipe_reference_db_v1";

// Starter reference dictionary (seed entries with target dominant hand & keyframe signatures)
const DEFAULT_SIGNS = {
    HELLO: {
        word: "HELLO",
        category: "Greetings",
        description: "Touch forehead near temple with flat hand, then move outward in a small salute.",
        frames: [],
    },
    THANK_YOU: {
        word: "THANK_YOU",
        category: "Politeness",
        description: "Touch fingertips to chin and move hand forward and slightly down toward the viewer.",
        frames: [],
    },
    PLEASE: {
        word: "PLEASE",
        category: "Politeness",
        description: "Place flat palm on center of chest and rub in a circular motion.",
        frames: [],
    },
};

export function loadSignDatabase() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...DEFAULT_SIGNS, ...JSON.parse(saved) };
        }
    } catch (err) {
        console.warn("Could not read local sign database, using defaults:", err);
    }
    return { ...DEFAULT_SIGNS };
}

export function saveSignSequence(word, category, description, frames) {
    const db = loadSignDatabase();
    const key = word.trim().toUpperCase().replace(/\s+/g, "_");
    db[key] = {
        word: key,
        category: category || "Custom",
        description: description || "",
        updatedAt: new Date().toISOString(),
        frames,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
}

/**
 * Computes cosine similarity (0 to 1) between two landmark feature vectors.
 */
export function compareFeatureVectors(vecA, vecB) {
    if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Scores a live frame against a stored sign sequence by finding the closest matching keyframe.
 */
export function scoreLiveFrameAgainstSign(liveVector, signEntry) {
    if (!signEntry?.frames?.length) return null;
    let bestScore = 0;
    for (const frameVec of signEntry.frames) {
        const sim = compareFeatureVectors(liveVector, frameVec);
        if (sim > bestScore) bestScore = sim;
    }
    return Math.round(bestScore * 100);
}
