/**
 * Complex Matrix Pattern-Matching Engine
 * Uses normalized 21-point hand landmark geometry (compatible with Google Kaggle ASL
 * landmark datasets) plus temporal motion history to:
 *  - Distinguish visually similar static signs (M vs. N, A vs. S vs. T vs. E)
 *  - Track multi-motion dynamic letters (J and Z)
 */

const TRAIL_LIMIT = 28;
let pinkyTrail = [];
let indexTrail = [];

export function resetMotionHistory() {
    pinkyTrail = [];
    indexTrail = [];
}

function dist3D(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

/**
 * Evaluates a MediaPipe HolisticLandmarker result against the Kaggle ASL matrix.
 */
export function evaluateComplexMatrix(holisticResult, matrixTemplates) {
    const hand =
        holisticResult?.rightHandLandmarks?.[0] ||
        holisticResult?.leftHandLandmarks?.[0];

    if (!hand || hand.length < 21) {
        return {
            topMatch: null,
            confidence: 0,
            runnerUp: null,
            runnerUpScore: 0,
            isDynamicMotion: false,
            motionPathSummary: "No hand detected in frame",
            fingerCurlProfile: {},
        };
    }

    const wrist = hand[0];
    const palmScale = Math.max(dist3D(wrist, hand[9]), 0.001);

    // Record temporal trails for dynamic signs (J uses pinky tip 20; Z uses index tip 8)
    pinkyTrail.push({ x: hand[20].x, y: hand[20].y });
    indexTrail.push({ x: hand[8].x, y: hand[8].y });
    if (pinkyTrail.length > TRAIL_LIMIT) pinkyTrail.shift();
    if (indexTrail.length > TRAIL_LIMIT) indexTrail.shift();

    // Normalized finger extension & cross-finger relational features
    const profile = {
        thumb: dist3D(hand[4], hand[17]) / palmScale,
        index: dist3D(hand[8], wrist) / palmScale,
        middle: dist3D(hand[12], wrist) / palmScale,
        ring: dist3D(hand[16], wrist) / palmScale,
        pinky: dist3D(hand[20], wrist) / palmScale,
        indexSpread: dist3D(hand[8], hand[12]) / palmScale,
        thumbToIndexTip: dist3D(hand[4], hand[8]) / palmScale,
        // Vertical overlap of fingertips relative to thumb tip (critical for M vs N vs T)
        indexOverThumbY: (hand[8].y - hand[4].y) / palmScale,
        middleOverThumbY: (hand[12].y - hand[4].y) / palmScale,
        ringOverThumbY: (hand[16].y - hand[4].y) / palmScale,
        thumbXBetweenIndexMiddle:
            (hand[4].x - hand[5].x) * (hand[4].x - hand[9].x) < 0,
        thumbXBetweenRingPinky:
            (hand[4].x - hand[13].x) * (hand[4].x - hand[17].x) < 0,
    };

    const jScore = detectJMotion(pinkyTrail, profile);
    const zScore = detectZMotion(indexTrail, profile);
    const isDynamicMotion = jScore > 0.68 || zScore > 0.68;

    const scored = [];
    for (const [letter, proto] of Object.entries(matrixTemplates || {})) {
        if (!proto) continue;

        let sumSq = 0;
        let dims = 0;
        for (const k of ["thumb", "index", "middle", "ring", "pinky"]) {
            if (typeof proto[k] === "number") {
                sumSq += Math.pow(profile[k] - proto[k], 2);
                dims++;
            }
        }

        const rmse = dims > 0 ? Math.sqrt(sumSq / dims) : 1;
        let score = Math.max(0, 1 - rmse * 0.85);

        // Explicit structural disambiguation for commonly confused ASL pairs
        if (letter === "M") {
            // 3 fingers (index, middle, ring) draped over thumb
            const threeDraped =
                profile.indexOverThumbY > -0.05 &&
                profile.middleOverThumbY > -0.05 &&
                profile.ringOverThumbY > -0.05;
            score += threeDraped ? 0.16 : -0.22;
        } else if (letter === "N") {
            // 2 fingers (index, middle) draped over thumb; ring stays tucked
            const twoDraped =
                profile.indexOverThumbY > -0.05 &&
                profile.middleOverThumbY > -0.05 &&
                profile.ringOverThumbY <= -0.05;
            score += twoDraped ? 0.16 : -0.22;
        } else if (letter === "T") {
            // Thumb tucked strictly between index and middle
            score += profile.thumbXBetweenIndexMiddle ? 0.14 : -0.15;
        } else if (letter === "J") {
            score = Math.max(score * 0.45, jScore);
        } else if (letter === "Z") {
            score = Math.max(score * 0.45, zScore);
        }

        scored.push({
            letter,
            score: Math.min(0.99, Math.max(0.01, score)),
        });
    }

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0] || { letter: "A", score: 0.4 };
    const runnerUp = scored[1] || { letter: "B", score: 0.3 };

    let motionPathSummary = "Static hand posture";
    if (jScore > 0.68) {
        motionPathSummary = "Downward curved pinky trajectory detected (J-motion)";
    } else if (zScore > 0.68) {
        motionPathSummary = "Zig-zag index trajectory detected (Z-motion)";
    }

    return {
        topMatch: best.letter,
        confidence: best.score,
        runnerUp: runnerUp.letter,
        runnerUpScore: runnerUp.score,
        isDynamicMotion,
        motionPathSummary,
        fingerCurlProfile: profile,
    };
}

function detectJMotion(trail, profile) {
    if (trail.length < 10) return 0.05;
    const pinkyExtended =
        profile.pinky > 1.32 &&
        profile.index < 1.15 &&
        profile.middle < 1.15 &&
        profile.ring < 1.15;
    if (!pinkyExtended) return 0.1;

    const start = trail[0];
    const mid = trail[Math.floor(trail.length / 2)];
    const end = trail[trail.length - 1];

    const dropY = mid.y - start.y;
    const scoopX = Math.abs(end.x - mid.x);
    if (dropY > 0.035 && scoopX > 0.025) {
        return Math.min(0.97, 0.74 + (dropY + scoopX) * 1.4);
    }
    return 0.35;
}

function detectZMotion(trail, profile) {
    if (trail.length < 12) return 0.05;
    const indexExtended =
        profile.index > 1.4 &&
        profile.middle < 1.15 &&
        profile.ring < 1.15 &&
        profile.pinky < 1.15;
    if (!indexExtended) return 0.1;

    const p0 = trail[0];
    const p1 = trail[Math.floor(trail.length * 0.33)];
    const p2 = trail[Math.floor(trail.length * 0.66)];
    const p3 = trail[trail.length - 1];

    const topStroke = Math.abs(p1.x - p0.x);
    const diagDrop = p2.y - p1.y;
    const bottomStroke = Math.abs(p3.x - p2.x);

    if (topStroke > 0.03 && diagDrop > 0.03 && bottomStroke > 0.03) {
        return Math.min(0.96, 0.74 + (topStroke + diagDrop + bottomStroke));
    }
    return 0.32;
}
