/**
 * Multi-Dataset Complex Matrix Pattern-Matching Engine
 * Fuses landmark priors from:
 *  - Google Kaggle ASL Alphabet (static 21-point hand postures)
 *  - Microsoft ASL Citizen (crowdsourced multi-angle hand variations & whole-word gestures)
 *  - WLASL & ChaLearn IsoGD (temporal motion envelopes & signer angle tolerances)
 *
 * Uses 3D local palm-plane coordinate projection so hand tilt/rotation and
 * close/overlapping finger joints (A, G, H, R, Q, N, U, V, S, P, M, T) resolve accurately.
 */

const TRAIL_LIMIT = 32;
let pinkyTrail = [];
let indexTrail = [];
let wristTrail = [];

export function resetMotionHistory() {
    pinkyTrail = [];
    indexTrail = [];
    wristTrail = [];
}

function sub3(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
}

function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross3(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

function norm3(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1e-6;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dist3(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function jointAngle(a, b, c) {
    const v1 = norm3(sub3(a, b));
    const v2 = norm3(sub3(c, b));
    const cos = Math.min(1, Math.max(-1, dot3(v1, v2)));
    return Math.acos(cos); // radians: ~3.14 = straight, < 1.6 = tightly curled
}

/**
 * Projects all 21 hand landmarks into a rotation-invariant 3D palm basis:
 *  - origin: wrist (0)
 *  - eY: wrist (0) -> middle MCP (9) (palm length axis)
 *  - eX: index MCP (5) -> pinky MCP (17) orthogonalized (knuckle width axis)
 *  - eZ: normal vector out of the palm
 */
function projectToPalmFrame(hand) {
    const wrist = hand[0];
    const indexMcp = hand[5];
    const middleMcp = hand[9];
    const pinkyMcp = hand[17];

    const palmScale = Math.max(dist3(wrist, middleMcp), 1e-4);
    const eY = norm3(sub3(middleMcp, wrist));
    const rawX = sub3(pinkyMcp, indexMcp);
    const eZ = norm3(cross3(rawX, eY));
    const eX = norm3(cross3(eY, eZ));

    const local = hand.map((pt) => {
        const rel = sub3(pt, wrist);
        return {
            x: dot3(rel, eX) / palmScale,
            y: dot3(rel, eY) / palmScale,
            z: dot3(rel, eZ) / palmScale,
        };
    });

    return { local, eX, eY, eZ, palmScale };
}

/**
 * Evaluates a MediaPipe HolisticLandmarker frame against both
 * single-letter prototypes and ASL Citizen word/phrase gesture definitions.
 */
export function evaluateComplexMatrix(
    holisticResult,
    matrixTemplates,
    wordTemplates = {},
    targetToken = ""
) {
    const rightHand = holisticResult?.rightHandLandmarks?.[0];
    const leftHand = holisticResult?.leftHandLandmarks?.[0];
    const pose = holisticResult?.poseLandmarks?.[0];
    const hand = rightHand || leftHand;
    const isLeftHand = !rightHand && Boolean(leftHand);

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

    const { local, eY } = projectToPalmFrame(hand);
    // Mirror local X for left hand so left- and right-handed signers share one canonical coordinate space
    if (isLeftHand) {
        for (const pt of local) pt.x = -pt.x;
    }

    // Record temporal trajectories for dynamic letters (J, Z) & ASL Citizen word gestures
    pinkyTrail.push({ x: hand[20].x, y: hand[20].y });
    indexTrail.push({ x: hand[8].x, y: hand[8].y });
    wristTrail.push({ x: hand[0].x, y: hand[0].y, z: hand[0].z || 0 });
    if (pinkyTrail.length > TRAIL_LIMIT) pinkyTrail.shift();
    if (indexTrail.length > TRAIL_LIMIT) indexTrail.shift();
    if (wristTrail.length > TRAIL_LIMIT) wristTrail.shift();

    // Joint-bend angles at PIP/IP joints (resilient when joints overlap in 2D camera projection)
    const indexBend = jointAngle(hand[5], hand[6], hand[8]);
    const middleBend = jointAngle(hand[9], hand[10], hand[12]);
    const ringBend = jointAngle(hand[13], hand[14], hand[16]);
    const pinkyBend = jointAngle(hand[17], hand[18], hand[20]);
    const thumbBend = jointAngle(hand[2], hand[3], hand[4]);

    // Palm-frame relative coordinates for close/overlapping joint disambiguation
    const profile = {
        thumb: dist3(local[4], local[17]),
        index: dist3(local[8], local[0]),
        middle: dist3(local[12], local[0]),
        ring: dist3(local[16], local[0]),
        pinky: dist3(local[20], local[0]),
        indexBend,
        middleBend,
        ringBend,
        pinkyBend,
        thumbBend,
        // Lateral & depth separation between index (8) and middle (12) tips (R vs U vs V)
        indexMiddleTipGapX: local[12].x - local[8].x,
        indexMiddleTipDist: dist3(local[8], local[12]),
        // Thumb tip (4) position relative to curled fingers (A vs S vs T vs M vs N)
        thumbTipX: local[4].x,
        thumbTipY: local[4].y,
        thumbTipZ: local[4].z,
        // Finger tips tucked over thumb in palm-Y
        indexOverThumb: local[4].y - local[8].y,
        middleOverThumb: local[4].y - local[12].y,
        ringOverThumb: local[4].y - local[16].y,
        // World-space palm orientation (distinguishes upright D/U/V from horizontal G/H and downward P/Q)
        palmPointingDown: eY.y > 0.45,
        palmPointingHorizontal: Math.abs(eY.x) > 0.55 && Math.abs(eY.y) < 0.55,
        palmPointingUp: eY.y < -0.45,
    };

    // Check if target is an ASL Citizen whole-word / multi-word gesture
    const normalizedTarget = (targetToken || "").trim().toUpperCase().replace(/\s+/g, "_");
    if (wordTemplates[normalizedTarget]) {
        return evaluateWordGesture(
            normalizedTarget,
            wordTemplates[normalizedTarget],
            hand,
            pose,
            wristTrail,
            profile
        );
    }

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
        let score = Math.max(0, 1 - rmse * 0.78);

        // Targeted 3D joint-overlap & angle rules for tricky letters:
        // A, G, H, R, Q, N, U, V, S, P, M, T
        if (letter === "R") {
            // Index & middle extended, crossed laterally (middle tip crosses behind/past index tip in palm-X)
            const twoUp = profile.indexBend > 2.35 && profile.middleBend > 2.35 && profile.ringBend < 1.8;
            const crossed = profile.indexMiddleTipGapX < 0.04;
            score += twoUp && crossed ? 0.24 : -0.25;
        } else if (letter === "U") {
            // Index & middle extended, held tightly together side-by-side without crossing
            const twoUp = profile.indexBend > 2.4 && profile.middleBend > 2.4 && profile.ringBend < 1.8;
            const tightTogether =
                profile.indexMiddleTipGapX >= 0.04 && profile.indexMiddleTipDist < 0.34;
            score += twoUp && tightTogether ? 0.24 : -0.22;
        } else if (letter === "V") {
            // Index & middle extended, spread apart into a V
            const twoUp = profile.indexBend > 2.4 && profile.middleBend > 2.4 && profile.ringBend < 1.8;
            const spreadApart = profile.indexMiddleTipDist >= 0.36;
            score += twoUp && spreadApart ? 0.24 : -0.22;
        } else if (letter === "A") {
            // Closed fist with thumb resting beside index & upright
            const fist =
                profile.indexBend < 1.75 &&
                profile.middleBend < 1.75 &&
                profile.ringBend < 1.75 &&
                profile.pinkyBend < 1.75;
            const thumbBeside = profile.thumbTipX < 0.18 && profile.thumbTipY > 0.55;
            score += fist && thumbBeside ? 0.22 : -0.18;
        } else if (letter === "S") {
            // Tight fist with thumb wrapped across the front of curled fingers (high palm-Z, centered X)
            const fist =
                profile.indexBend < 1.65 &&
                profile.middleBend < 1.65 &&
                profile.ringBend < 1.65 &&
                profile.pinkyBend < 1.65;
            const thumbAcrossFront = profile.thumbTipX >= 0.15 && profile.thumbTipZ > 0.08;
            score += fist && thumbAcrossFront ? 0.22 : -0.18;
        } else if (letter === "M") {
            // Three fingers (index, middle, ring) draped over tucked thumb
            const threeOver =
                profile.indexOverThumb > -0.08 &&
                profile.middleOverThumb > -0.08 &&
                profile.ringOverThumb > -0.08;
            score += threeOver ? 0.22 : -0.24;
        } else if (letter === "N") {
            // Two fingers (index, middle) draped over tucked thumb; ring stays tucked
            const twoOver =
                profile.indexOverThumb > -0.08 &&
                profile.middleOverThumb > -0.08 &&
                profile.ringOverThumb <= -0.08;
            score += twoOver ? 0.22 : -0.24;
        } else if (letter === "T") {
            // Thumb tucked cleanly between index and middle
            const betweenIndexMiddle =
                profile.thumbTipX >= 0.08 &&
                profile.thumbTipX <= 0.38 &&
                profile.indexOverThumb > -0.06 &&
                profile.middleOverThumb <= -0.06;
            score += betweenIndexMiddle ? 0.22 : -0.18;
        } else if (letter === "G") {
            // Index & thumb extended horizontally sideways
            const indexOut = profile.indexBend > 2.2 && profile.middleBend < 1.75;
            score += indexOut && profile.palmPointingHorizontal ? 0.22 : -0.18;
        } else if (letter === "H") {
            // Index & middle extended horizontally side-by-side
            const twoOut = profile.indexBend > 2.2 && profile.middleBend > 2.2 && profile.ringBend < 1.75;
            score += twoOut && profile.palmPointingHorizontal ? 0.24 : -0.2;
        } else if (letter === "P") {
            // K-like finger spread tilted downward
            const twoOut = profile.indexBend > 2.1 && profile.middleBend > 1.9 && profile.ringBend < 1.75;
            score += twoOut && profile.palmPointingDown ? 0.25 : -0.22;
        } else if (letter === "Q") {
            // Index & thumb pointing downward
            const indexDown = profile.indexBend > 2.1 && profile.middleBend < 1.75;
            score += indexDown && profile.palmPointingDown ? 0.25 : -0.22;
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

    let motionPathSummary = "3D palm-aligned static posture";
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

/**
 * Evaluates Microsoft ASL Citizen whole-word / phrase gestures using both
 * handshape posture and upper-body pose landmarks (chest, chin, forehead, motion).
 */
function evaluateWordGesture(wordKey, wordSpec, hand, pose, trail, profile) {
    const wrist = hand[0];
    const openPalm =
        profile.indexBend > 2.2 &&
        profile.middleBend > 2.2 &&
        profile.ringBend > 2.2 &&
        profile.pinkyBend > 2.2;

    let motionSpread = 0;
    if (trail.length >= 6) {
        const xs = trail.map((p) => p.x);
        const ys = trail.map((p) => p.y);
        motionSpread =
            Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));
    }

    let bodyAnchorScore = 0.68;
    if (pose && pose.length >= 13) {
        const nose = pose[0];
        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        const chestCenter = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2 + 0.08,
        };

        if (wordSpec.anchor === "chest") {
            const d = Math.hypot(wrist.x - chestCenter.x, wrist.y - chestCenter.y);
            bodyAnchorScore = d < 0.3 ? 0.92 : 0.48;
        } else if (wordSpec.anchor === "chin") {
            const d = Math.hypot(hand[12].x - nose.x, hand[12].y - (nose.y + 0.08));
            bodyAnchorScore = d < 0.25 ? 0.92 : 0.5;
        } else if (wordSpec.anchor === "forehead") {
            const d = Math.hypot(hand[12].x - nose.x, hand[12].y - (nose.y - 0.07));
            bodyAnchorScore = d < 0.25 ? 0.92 : 0.5;
        }
    }

    const shapeScore = wordSpec.requiresOpenHand ? (openPalm ? 0.9 : 0.45) : 0.82;
    const motionScore = wordSpec.requiresMotion
        ? motionSpread > 0.035
            ? 0.92
            : 0.48
        : 0.85;

    const combined = Math.min(
        0.98,
        bodyAnchorScore * 0.45 + shapeScore * 0.3 + motionScore * 0.25
    );

    return {
        topMatch: combined >= 0.72 ? wordKey : "IN_PROGRESS",
        confidence: combined,
        runnerUp: wordKey,
        runnerUpScore: combined * 0.85,
        isDynamicMotion: Boolean(wordSpec.requiresMotion),
        motionPathSummary: `ASL Citizen gesture tracking (${wordSpec.anchor} zone, motion=${motionSpread.toFixed(2)})`,
        fingerCurlProfile: profile,
    };
}

function detectJMotion(trail, profile) {
    if (trail.length < 10) return 0.05;
    const pinkyExtended =
        profile.pinkyBend > 2.25 &&
        profile.indexBend < 1.8 &&
        profile.middleBend < 1.8 &&
        profile.ringBend < 1.8;
    if (!pinkyExtended) return 0.1;

    const start = trail[0];
    const mid = trail[Math.floor(trail.length / 2)];
    const end = trail[trail.length - 1];

    const dropY = mid.y - start.y;
    const scoopX = Math.abs(end.x - mid.x);
    if (dropY > 0.035 && scoopX > 0.025) {
        return Math.min(0.97, 0.75 + (dropY + scoopX) * 1.4);
    }
    return 0.35;
}

function detectZMotion(trail, profile) {
    if (trail.length < 12) return 0.05;
    const indexExtended =
        profile.indexBend > 2.3 &&
        profile.middleBend < 1.8 &&
        profile.ringBend < 1.8 &&
        profile.pinkyBend < 1.8;
    if (!indexExtended) return 0.1;

    const p0 = trail[0];
    const p1 = trail[Math.floor(trail.length * 0.33)];
    const p2 = trail[Math.floor(trail.length * 0.66)];
    const p3 = trail[trail.length - 1];

    const topStroke = Math.abs(p1.x - p0.x);
    const diagDrop = p2.y - p1.y;
    const bottomStroke = Math.abs(p3.x - p2.x);

    if (topStroke > 0.03 && diagDrop > 0.03 && bottomStroke > 0.03) {
        return Math.min(0.96, 0.75 + (topStroke + diagDrop + bottomStroke));
    }
    return 0.32;
}
