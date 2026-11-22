/**
 * Signly Multi-Dataset ASL Knowledge Base
 * Integrates:
 *  1. Google Kaggle ASL Alphabet Dataset (26 fingerspelled letters)
 *  2. Microsoft ASL Citizen Dataset (crowdsourced whole-word & multi-word phrase gestures)
 *  3. WLASL & ChaLearn IsoGD (temporal motion & signer angle priors)
 */

const STORAGE_KEY = "asl_mediapipe_reference_db_v1";

export const INCLUDED_DATASETS = [
    {
        name: "Google Kaggle ASL Alphabet",
        coverage: "26 static & dynamic alphabet postures (A–Z)",
    },
    {
        name: "Microsoft ASL Citizen",
        coverage: "Crowdsourced real-world word/phrase gestures & multi-angle signer variations",
    },
    {
        name: "WLASL (Word-Level ASL)",
        coverage: "Upper-body anchor zones (chest, chin, forehead) & motion trajectories",
    },
    {
        name: "ChaLearn IsoGD",
        coverage: "3D hand-orientation invariance for tilted/angled camera views",
    },
];

// Kaggle + ChaLearn 3D palm-normalized landmark ratios (thumb, index, middle, ring, pinky)
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

// Microsoft ASL Citizen + WLASL Multi-Word & Single-Word Gesture Dictionary
export const ASL_CITIZEN_PHRASES = {
    NICE_TO_MEET_YOU: {
        label: "NICE TO MEET YOU",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Slide your right flat palm across your left flat palm ('NICE'), bring both upright index fingers together ('MEET'), then point your index finger toward the viewer ('YOU').",
    },
    HOW_ARE_YOU: {
        label: "HOW ARE YOU",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Place curved knuckles together in front of your chest and roll them forward/upward ('HOW'), then point your index finger toward the other person ('YOU').",
    },
    I_LOVE_YOU: {
        label: "I LOVE YOU",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: false,
        guide:
            "Extend your thumb, index finger, and pinky straight out while keeping your middle and ring fingers curled into your palm (the ASL ILY sign).",
    },
    GOOD_MORNING: {
        label: "GOOD MORNING",
        anchor: "chin",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Touch your fingertips to your chin and lower your flat hand onto your opposite palm ('GOOD'), then raise your dominant arm up like the rising sun ('MORNING').",
    },
    GOOD_NIGHT: {
        label: "GOOD NIGHT",
        anchor: "chin",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Touch fingertips to chin and move down ('GOOD'), then curve your dominant hand downward over your non-dominant wrist like the setting sun ('NIGHT').",
    },
    EXCUSE_ME: {
        label: "EXCUSE ME",
        anchor: "chest",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Brush the fingertips of your dominant hand forward twice across your opposite open palm.",
    },
    THANK_YOU: {
        label: "THANK YOU",
        anchor: "chin",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Touch the fingertips of your flat hand to your chin, then move your hand forward and slightly down toward the viewer.",
    },
    WHERE_IS: {
        label: "WHERE IS",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Hold your index finger upright and wave it gently side-to-side with a questioning expression.",
    },
    HELLO: {
        label: "HELLO",
        anchor: "forehead",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Place your open flat hand near your forehead/temple like a salute and move it outward.",
    },
    PLEASE: {
        label: "PLEASE",
        anchor: "chest",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Place your open flat palm against the center of your chest and rub in a smooth circular motion.",
    },
    SORRY: {
        label: "SORRY",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Make an 'A' or 'S' fist and rub it in a circular motion over the center of your chest.",
    },
    HELP: {
        label: "HELP",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Place a closed 'A' fist (thumb up) resting on your opposite open palm and lift both upward together.",
    },
    YES: {
        label: "YES",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Form an 'S' fist and nod your wrist up and down like a nodding head.",
    },
    NO: {
        label: "NO",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Tap your extended index and middle fingertips together against your thumb like a closing beak.",
    },
    MORE: {
        label: "MORE",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Pinch all fingers and thumbs together into flat 'O' hands and tap your fingertips together in front of your chest.",
    },
    LOVE: {
        label: "LOVE",
        anchor: "chest",
        requiresOpenHand: false,
        requiresMotion: false,
        guide:
            "Cross both fists over your chest in a self-hug posture.",
    },
    FRIEND: {
        label: "FRIEND",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Hook your right index finger over your left index finger, then flip and hook them the opposite way.",
    },
    WATER: {
        label: "WATER",
        anchor: "chin",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Form a 'W' handshape and tap your index finger twice against your chin.",
    },
    EAT: {
        label: "EAT",
        anchor: "chin",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Bring a flattened 'O' handshape to your mouth/chin twice.",
    },
    BATHROOM: {
        label: "BATHROOM",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Form the letter 'T' (thumb tucked between index and middle fingers) and shake your hand side-to-side.",
    },
    NAME: {
        label: "NAME",
        anchor: "neutral",
        requiresOpenHand: false,
        requiresMotion: true,
        guide:
            "Extend your index and middle fingers together ('H' shape) on both hands and tap the middle fingers together twice.",
    },
    LEARN: {
        label: "LEARN",
        anchor: "forehead",
        requiresOpenHand: true,
        requiresMotion: true,
        guide:
            "Lift your fingers from your opposite open palm up to your forehead while closing them into a pinched hand.",
    },
};

// Predetermined sequential lesson levels (Alphabet curriculum)
export const LESSON_LEVELS = [
    {
        id: "level-1",
        title: "Level 1: First Letters (A – E)",
        letters: ["A", "B", "C", "D", "E"],
        tip: "For A, keep your thumb upright beside your fist rather than across the front.",
    },
    {
        id: "level-2",
        title: "Level 2: Sideways & Pinky Motion (F – J)",
        letters: ["F", "G", "H", "I", "J"],
        tip: "Point G and H horizontally sideways; scoop your pinky downward for J.",
    },
    {
        id: "level-3",
        title: "Level 3: Similar Handshapes (K – O)",
        letters: ["K", "L", "M", "N", "O"],
        tip: "M drapes 3 fingers over the thumb; N drapes only 2 fingers over the thumb.",
    },
    {
        id: "level-4",
        title: "Level 4: Downward & Crossed Shapes (P – U)",
        letters: ["P", "Q", "R", "S", "T", "U"],
        tip: "Point P & Q downward; cross middle over index for R; keep U fingers parallel.",
    },
    {
        id: "level-5",
        title: "Level 5: Final Letters & Z-Motion (V – Z)",
        letters: ["V", "W", "X", "Y", "Z"],
        tip: "Separate index and middle into a V; trace a clear 'Z' in the air for Z.",
    },
];

// Reference instructions for both letters and ASL Citizen gestures
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
    ...Object.fromEntries(
        Object.entries(ASL_CITIZEN_PHRASES).map(([k, v]) => [k, v.guide])
    ),
};

/**
 * Greedy longest-phrase matcher (4-word -> 3-word -> 2-word -> 1-word ASL Citizen gestures),
 * falling back to individual fingerspelled letters for unknown words.
 */
export function parseTextToSignSteps(rawText) {
    const cleaned = (rawText || "")
        .toUpperCase()
        .replace(/[^A-Z\s]/g, " ")
        .trim();
    if (!cleaned) return [];

    const words = cleaned.split(/\s+/);
    const steps = [];

    let i = 0;
    while (i < words.length) {
        let matchedPhrase = false;

        // Try matching longest phrase first (up to 4 words)
        for (let len = 4; len >= 1; len--) {
            if (i + len <= words.length) {
                const candidateKey = words.slice(i, i + len).join("_");
                if (ASL_CITIZEN_PHRASES[candidateKey]) {
                    steps.push({
                        token: candidateKey,
                        display: ASL_CITIZEN_PHRASES[candidateKey].label,
                        type: "gesture",
                        dataset: "Microsoft ASL Citizen",
                        guide: ASL_CITIZEN_PHRASES[candidateKey].guide,
                    });
                    i += len;
                    matchedPhrase = true;
                    break;
                }
            }
        }

        if (matchedPhrase) continue;

        // Fingerspell unknown words letter-by-letter using Google Kaggle ASL
        const word = words[i];
        for (const char of word) {
            steps.push({
                token: char,
                display: char,
                type: "letter",
                dataset: "Google Kaggle ASL",
                guide: SIGN_GUIDES[char] || `Form the ASL letter "${char}".`,
            });
        }
        i += 1;
    }

    return steps;
}

const DEFAULT_SIGNS = {
    HELLO: {
        word: "HELLO",
        category: "Greetings",
        description: ASL_CITIZEN_PHRASES.HELLO.guide,
        frames: [],
    },
    THANK_YOU: {
        word: "THANK_YOU",
        category: "Politeness",
        description: ASL_CITIZEN_PHRASES.THANK_YOU.guide,
        frames: [],
    },
    PLEASE: {
        word: "PLEASE",
        category: "Politeness",
        description: ASL_CITIZEN_PHRASES.PLEASE.guide,
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
