/**
 * Signly ASL Knowledge Base & Complex Matrix Prototype Store
 * Combines Google Kaggle ASL Alphabet geometric prototypes, structured lesson plans,
 * reference visual guides, and local custom sign sequences.
 */

const STORAGE_KEY = "asl_mediapipe_reference_db_v1";

// Kaggle ASL Alphabet normalized landmark ratios (thumb, index, middle, ring, pinky)
export const KAGGLE_ASL_MATRIX = {
    A: { thumb: 1.05, index: 0.92, middle: 0.88, ring: 0.85, pinky: 0.82 },
    B: { thumb: 0.62, index: 1.85, middle: 1.92, ring: 1.84, pinky: 1.65 },
    C: { thumb: 1.18, index: 1.38, middle: 1.42, ring: 1.36, pinky: 1.24 },
    D: { thumb: 0.85, index: 1.85, middle: 1.05, ring: 0.98, pinky: 0.92 },
    E: { thumb: 0.65, index: 0.86, middle: 0.84, ring: 0.82, pinky: 0.78 },
    F: { thumb: 0.88, index: 1.05, middle: 1.88, ring: 1.82, pinky: 1.66 },
    G: { thumb: 1.15, index: 1.55, middle: 0.92, ring: 0.88, pinky: 0.84 },
    H: { thumb: 0.95, index: 1.62, middle: 1.65, ring: 0.90, pinky: 0.85 },
    I: { thumb: 0.75, index: 0.90, middle: 0.88, ring: 0.86, pinky: 1.62 },
    J: { thumb: 0.75, index: 0.90, middle: 0.88, ring: 0.86, pinky: 1.62, dynamic: true },
    K: { thumb: 1.02, index: 1.82, middle: 1.75, ring: 0.92, pinky: 0.86 },
    L: { thumb: 1.38, index: 1.86, middle: 0.90, ring: 0.86, pinky: 0.82 },
    M: { thumb: 0.68, index: 0.96, middle: 0.95, ring: 0.93, pinky: 0.82 },
    N: { thumb: 0.74, index: 0.96, middle: 0.95, ring: 0.85, pinky: 0.80 },
    O: { thumb: 0.92, index: 1.15, middle: 1.16, ring: 1.12, pinky: 1.04 },
    P: { thumb: 1.02, index: 1.52, middle: 1.44, ring: 0.90, pinky: 0.84 },
    Q: { thumb: 1.12, index: 1.48, middle: 0.90, ring: 0.86, pinky: 0.82 },
    R: { thumb: 0.78, index: 1.82, middle: 1.84, ring: 0.90, pinky: 0.85 },
    S: { thumb: 0.72, index: 0.86, middle: 0.84, ring: 0.82, pinky: 0.78 },
    T: { thumb: 0.82, index: 0.94, middle: 0.88, ring: 0.84, pinky: 0.80 },
    U: { thumb: 0.76, index: 1.84, middle: 1.88, ring: 0.90, pinky: 0.84 },
    V: { thumb: 0.78, index: 1.85, middle: 1.89, ring: 0.90, pinky: 0.84 },
    W: { thumb: 0.76, index: 1.84, middle: 1.90, ring: 1.82, pinky: 0.86 },
    X: { thumb: 0.80, index: 1.32, middle: 0.88, ring: 0.84, pinky: 0.80 },
    Y: { thumb: 1.36, index: 0.90, middle: 0.86, ring: 0.84, pinky: 1.64 },
    Z: { thumb: 0.82, index: 1.82, middle: 0.90, ring: 0.86, pinky: 0.82, dynamic: true },
};

// Predetermined sequential lesson levels (Alphabet curriculum)
export const LESSON_LEVELS = [
    {
        id: "level-1",
        title: "Level 1: First Letters (A – E)",
        letters: ["A", "B", "C", "D", "E"],
        tip: "Focus on clean thumb placement against curled vs. extended fingers.",
    },
    {
        id: "level-2",
        title: "Level 2: Motion & Pinky Control (F – J)",
        letters: ["F", "G", "H", "I", "J"],
        tip: "For 'J', start with 'I' and scoop your pinky downward in a hook.",
    },
    {
        id: "level-3",
        title: "Level 3: Similar Handshapes (K – O)",
        letters: ["K", "L", "M", "N", "O"],
        tip: "M drapes 3 fingers over the thumb; N drapes only 2 fingers over the thumb.",
    },
    {
        id: "level-4",
        title: "Level 4: Crossed & Fist Shapes (P – U)",
        letters: ["P", "Q", "R", "S", "T", "U"],
        tip: "Watch thumb position: across fingers for S, between index & middle for T.",
    },
    {
        id: "level-5",
        title: "Level 5: Final Letters & Z-Motion (V – Z)",
        letters: ["V", "W", "X", "Y", "Z"],
        tip: "Trace a clear 'Z' in the air with your extended index finger.",
    },
];

// Reference instructions & visual cues for the Translator & Lesson guides
export const SIGN_GUIDES = {
    A: "Make a fist with fingers curled into your palm and your thumb resting upright beside your index finger.",
    B: "Hold all four fingers straight up together and tuck your thumb across your palm.",
    C: "Curve your thumb and fingers into a C-shape facing slightly sideways.",
    D: "Point your index finger straight up while touching your thumb to your middle, ring, and pinky tips.",
    E: "Curl all four fingertips down onto the top edge of your tucked thumb.",
    F: "Touch your index finger and thumb tips together in a circle while extending your middle, ring, and pinky fingers.",
    G: "Point your index finger and thumb horizontally parallel to each other.",
    H: "Extend your index and middle fingers horizontally side-by-side.",
    I: "Make a fist with your thumb across your fingers and extend your pinky straight up.",
    J: "Start in the 'I' handshape (pinky up), then scoop your pinky downward and curve up like a 'J'.",
    K: "Extend your index and middle fingers in a V with your thumb pressed between them.",
    L: "Extend your index finger straight up and your thumb out to the side in an 'L' shape.",
    M: "Tuck your thumb under THREE fingers (index, middle, and ring) so the thumb peeks out past the ring finger.",
    N: "Tuck your thumb under TWO fingers (index and middle), keeping the ring and pinky fingers tucked down.",
    O: "Curve all fingers and thumb together so their tips meet in a round 'O'.",
    P: "Form a 'K' handshape and tilt your wrist downward so the middle finger points down.",
    Q: "Form a 'G' handshape and point your index finger and thumb straight downward.",
    R: "Cross your middle finger behind your index finger while keeping both extended upward.",
    S: "Make a tight fist with your thumb wrapped firmly across the front of your curled fingers.",
    T: "Make a fist with your thumb tucked cleanly between your index and middle fingers.",
    U: "Extend your index and middle fingers straight up pressed tightly together.",
    V: "Extend your index and middle fingers straight up separated in a 'V' shape.",
    W: "Extend your index, middle, and ring fingers upward in a three-finger fan.",
    X: "Make a fist and raise your index finger bent like a hook.",
    Y: "Extend your thumb and pinky outward while keeping your three middle fingers curled.",
    Z: "Point your index finger forward and trace a 'Z' path through the air.",
};

const DEFAULT_SIGNS = {
    HELLO: {
        word: "HELLO",
        category: "Greetings",
        description:
            "Touch forehead near temple with flat hand, then move outward in a small salute.",
        frames: [],
    },
    THANK_YOU: {
        word: "THANK_YOU",
        category: "Politeness",
        description:
            "Touch fingertips to chin and move hand forward and slightly down toward the viewer.",
        frames: [],
    },
    PLEASE: {
        word: "PLEASE",
        category: "Politeness",
        description:
            "Place flat palm on center of chest and rub in a circular motion.",
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

export function scoreLiveFrameAgainstSign(liveVector, signEntry) {
    if (!signEntry?.frames?.length) return null;
    let bestScore = 0;
    for (const frameVec of signEntry.frames) {
        const sim = compareFeatureVectors(liveVector, frameVec);
        if (sim > bestScore) bestScore = sim;
    }
    return Math.round(bestScore * 100);
}
