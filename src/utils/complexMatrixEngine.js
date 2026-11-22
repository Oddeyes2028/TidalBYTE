/**
 * Multi-Dataset Complex Matrix Pattern-Matching Engine
 * Fuses landmark priors from:
 *  - Google Kaggle ASL Alphabet (static 21-point hand postures)
 *  - Microsoft ASL Citizen (crowdsourced multi-angle hand variations & whole-word gestures)
 *  - WLASL & ChaLearn IsoGD (temporal motion envelopes & signer angle tolerances)
 *
 * Upgraded in this revision:
 *  1. True Left- & Right-Hand Mirror Invariance:
 *     Projects landmarks into a handedness-aware 3D palm basis where +X ALWAYS points
 *     from the index side toward the pinky side for BOTH right and left hands.
 *  2. Closed-Fist Disambiguation (M vs. T vs. S vs. E vs. N vs. A):
 *     Uses exact thumb-tip nesting relative to PIP/MCP knuckles & fingertip palm-Y reach.
 *  3. R vs. U vs. V Precision:
 *     Checks lateral crossing (R: middle tip crosses to thumb/index side of index tip),
 *     tight parallel contact (U), and V separation (V) for both hands.
 *  4. Reliable Z-Motion Completion:
 *     Detects 2-corner zig-zag OR 3-segment Z-strokes regardless of left/right drawing direction,
 *     and holds the verified Z state for 2.5 seconds so Nemotron & lesson progression always catch it.
 *  5. Preserves all existing calibrated rules for P, Q, G, H, J, K, L, B, C, D, F, I, O, W, X, Y.
 */

const TRAIL_LIMIT = 50;
let pinkyTrail = [];
let indexTrail = [];
let wristTrail = [];
let lastZHitTime = 0;
let lastJHitTime = 0;

export function resetMotionHistory() {
    pinkyTrail = [];
    indexTrail = [];
    wristTrail = [];
    lastZHitTime = 0;
    lastJHitTime = 0;
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
 * Projects all 21 hand landmarks into a handedness-invariant 3D palm basis:
 *  - origin: wrist (0)
 *  - eY: wrist (0) -> middle MCP (9) (palm length axis, +Y points toward fingertips)
 *  - eX: orthogonalized vector from index MCP (5) -> pinky MCP (17)
 *        (Guaranteed +X = pinky side, -X = thumb/index side for BOTH left and right hands!)
 *  - eZ: cross(eX, eY) (normal vector pointing out of the palm face for right hand;
 *        flipped for left hand so +Z ALWAYS points out of the palm face!)
 */
function projectToPalmFrame(hand, isLeftHand) {
    const wrist = hand[0];
    const indexMcp = hand[5];
    const middleMcp = hand[9];
    const pinkyMcp = hand[17];

    const palmScale = Math.max(dist3(wrist, middleMcp), 1e-4);
    const eY = norm3(sub3(middleMcp, wrist));

    // Project (pinkyMcp - indexMcp) perpendicular to eY so +eX ALWAYS points from index -> pinky
    const rawX = sub3(pinkyMcp, indexMcp);
    const projX = sub3(rawX, {
        x: eY.x * dot3(rawX, eY),
        y: eY.y * dot3(rawX, eY),
        z: eY.z * dot3(rawX, eY),
    });
    const eX = norm3(projX);

    // Palm-outward normal (+Z points out of the front/palmar surface for BOTH hands)
    let eZ = norm3(cross3(eX, eY));
    if (isLeftHand) {
        eZ = { x: -eZ.x, y: -eZ.y, z: -eZ.z };
    }

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

    // Canonical palm coordinates where:
    //  -X = thumb/index side, +X = pinky side (for BOTH right and left hands!)
    //  +Y = from wrist toward fingertips
    //  +Z = outward from palm face
    const { local, eY, palmScale } = projectToPalmFrame(hand, isLeftHand);

    // Record palm-normalized temporal trails for Z and J
    pinkyTrail.push({ x: hand[20].x, y: hand[20].y, scale: palmScale });
    indexTrail.push({ x: hand[8].x, y: hand[8].y, scale: palmScale });
    wristTrail.push({ x: hand[0].x, y: hand[0].y, z: hand[0].z || 0 });
    if (pinkyTrail.length > TRAIL_LIMIT) pinkyTrail.shift();
    if (indexTrail.length > TRAIL_LIMIT) indexTrail.shift();
    if (wristTrail.length > TRAIL_LIMIT) wristTrail.shift();

    // Joint-bend angles (PIP angles: ~3.14 = straight, < 1.8 = curled)
    const indexBend = jointAngle(hand[5], hand[6], hand[8]);
    const middleBend = jointAngle(hand[9], hand[10], hand[12]);
    const ringBend = jointAngle(hand[13], hand[14], hand[16]);
    const pinkyBend = jointAngle(hand[17], hand[18], hand[20]);
    const thumbBend = jointAngle(hand[2], hand[3], hand[4]);

    // World-space pointing directions (+Y is downward in MediaPipe image coords)
    const indexDirWorld = norm3(sub3(hand[8], hand[5]));
    const middleDirWorld = norm3(sub3(hand[12], hand[9]));

    // Canonical knuckle X references (-X = index side, +X = pinky side)
    const indexMcpX = local[5].x;
    const pinkyMcpX = local[17].x;

    // Normalized lateral thumb position across the knuckles:
    //  < 0.0  => outside index finger (A)
    //  0.0..0.42 => between index and middle fingers (T)
    //  0.42..0.78 => across middle/ring front (S)
    //  0.75..1.15 => tucked deep past ring/pinky knuckles under 3 fingers (M)
    const knuckleSpanX = Math.max(pinkyMcpX - indexMcpX, 0.25);
    const thumbAcrossRatio = (local[4].x - indexMcpX) / knuckleSpanX;

    const profile = {
        handedness: isLeftHand ? "Left" : "Right",
        thumb: dist3(local[4], local[0]),
        index: dist3(local[8], local[0]),
        middle: dist3(local[12], local[0]),
        ring: dist3(local[16], local[0]),
        pinky: dist3(local[20], local[0]),
        indexBend,
        middleBend,
        ringBend,
        pinkyBend,
        thumbBend,
        // R vs. U vs. V measurements in canonical palm-X (-X = index side, +X = pinky side)
        indexMiddleTipGapX: local[12].x - local[8].x,
        indexMiddlePipGapX: local[10].x - local[6].x,
        indexMiddleTipDist: dist3(local[8], local[12]),
        // Thumb canonical coordinates
        thumbTipX: local[4].x,
        thumbTipY: local[4].y,
        thumbTipZ: local[4].z,
        thumbAcrossRatio,
        thumbToIndexPip: dist3(local[4], local[6]),
        thumbToMiddlePip: dist3(local[4], local[10]),
        // Fingertip palm-Y positions (smaller Y = curled deeper down toward palm base)
        indexTipY: local[8].y,
        middleTipY: local[12].y,
        ringTipY: local[16].y,
        pinkyTipY: local[20].y,
        // How far each fingertip drapes down relative to thumb tip Y
        indexOverThumb: local[4].y - local[8].y,
        middleOverThumb: local[4].y - local[12].y,
        ringOverThumb: local[4].y - local[16].y,
        // Distance from curled fingertips to thumb tip (critical for E where fingertips rest ON thumb)
        fingertipsToThumbDist:
            (dist3(local[8], local[4]) +
                dist3(local[12], local[4]) +
                dist3(local[16], local[4])) /
            3,
        // World-space orientation flags
        palmPointingDown: eY.y > 0.22 || indexDirWorld.y > 0.30 || middleDirWorld.y > 0.32,
        indexPointingDown: indexDirWorld.y > 0.28,
        middlePointingDown: middleDirWorld.y > 0.32,
        palmPointingHorizontal: Math.abs(eY.x) > 0.5 && Math.abs(eY.y) < 0.55,
    };

    // Check if target is an ASL Citizen whole-word gesture
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
    const isDynamicMotion = jScore > 0.72 || zScore > 0.72;

    // Shared closed-fist check (all four fingers curled)
    const isClosedFist =
        profile.indexBend < 2.05 &&
        profile.middleBend < 2.05 &&
        profile.ringBend < 2.05 &&
        profile.pinkyBend < 2.05;

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
        let score = Math.max(0, 1 - rmse * 0.70);

        // =========================================================================
        // 1. CLOSED-FIST DISAMBIGUATION: M vs. N vs. T vs. S vs. E vs. A
        // =========================================================================
        if (letter === "M") {
            const threeFingersOver =
                profile.indexOverThumb > -0.18 &&
                profile.middleOverThumb > -0.18 &&
                profile.ringOverThumb > -0.14;
            const thumbUnderThree = profile.thumbAcrossRatio >= 0.52 && profile.thumbTipY < 1.05;
            if (isClosedFist && threeFingersOver && thumbUnderThree) {
                score = Math.max(score + 0.34, 0.85);
            } else if (isClosedFist && threeFingersOver) {
                score = Math.max(score + 0.18, 0.74);
            } else {
                score -= 0.22;
            }
        } else if (letter === "N") {
            const twoFingersOver =
                profile.indexOverThumb > -0.20 &&
                profile.middleOverThumb > -0.20;
            const ringNotOver =
                profile.ringOverThumb <= -0.02 || profile.ringTipY < profile.middleTipY - 0.04;
            const thumbUnderTwo =
                profile.thumbAcrossRatio >= 0.22 && profile.thumbAcrossRatio <= 0.85;
            if (isClosedFist && twoFingersOver && ringNotOver && thumbUnderTwo) {
                score = Math.max(score + 0.34, 0.85);
            } else if (isClosedFist && twoFingersOver && thumbUnderTwo) {
                score = Math.max(score + 0.20, 0.76);
            } else {
                score -= 0.20;
            }
        } else if (letter === "T") {
            const thumbBetweenIndexMiddle =
                profile.thumbAcrossRatio >= -0.05 &&
                profile.thumbAcrossRatio <= 0.44 &&
                (profile.thumbToIndexPip < 0.48 || profile.thumbToMiddlePip < 0.48);
            const indexWrapsThumb =
                profile.indexOverThumb > -0.16 && profile.middleTipY < profile.indexTipY + 0.12;
            if (isClosedFist && thumbBetweenIndexMiddle && indexWrapsThumb) {
                score = Math.max(score + 0.35, 0.86);
            } else if (isClosedFist && thumbBetweenIndexMiddle) {
                score = Math.max(score + 0.22, 0.77);
            } else {
                score -= 0.22;
            }
        } else if (letter === "S") {
            const thumbAcrossFront =
                profile.thumbAcrossRatio >= 0.22 &&
                profile.thumbAcrossRatio <= 0.90 &&
                profile.thumbTipY >= 0.55 &&
                profile.thumbTipY <= 1.15;
            const fingertipsNotDrapedOverThumb =
                profile.indexOverThumb < 0.04 && profile.middleOverThumb < 0.04;
            const notE = profile.fingertipsToThumbDist > 0.34;
            if (isClosedFist && thumbAcrossFront && fingertipsNotDrapedOverThumb && notE) {
                score = Math.max(score + 0.34, 0.85);
            } else if (isClosedFist && thumbAcrossFront && notE) {
                score = Math.max(score + 0.18, 0.75);
            } else {
                score -= 0.20;
            }
        } else if (letter === "E") {
            const tipsRestingOnThumb = profile.fingertipsToThumbDist <= 0.44;
            const thumbTuckedLow = profile.thumbTipY <= 0.86 && profile.thumbAcrossRatio >= 0.10;
            if (isClosedFist && tipsRestingOnThumb && thumbTuckedLow) {
                score = Math.max(score + 0.36, 0.87);
            } else if (isClosedFist && tipsRestingOnThumb) {
                score = Math.max(score + 0.22, 0.77);
            } else {
                score -= 0.20;
            }
        } else if (letter === "A") {
            const thumbBeside = profile.thumbAcrossRatio < 0.14 && profile.thumbTipY > 0.65;
            if (isClosedFist && thumbBeside) {
                score = Math.max(score + 0.30, 0.84);
            } else {
                score -= 0.20;
            }

            // =========================================================================
            // 2. TWO-FINGER UPRIGHT DISAMBIGUATION: R vs. U vs. V
            // =========================================================================
        } else if (letter === "R") {
            const twoUp =
                profile.indexBend > 2.25 &&
                profile.middleBend > 2.25 &&
                profile.ringBend < 1.9 &&
                profile.pinkyBend < 1.9;
            const tipsCrossed =
                profile.indexMiddleTipGapX <= 0.06 ||
                profile.indexMiddleTipGapX < profile.indexMiddlePipGapX * 0.45;
            if (twoUp && tipsCrossed) {
                score = Math.max(score + 0.35, 0.87);
            } else {
                score -= 0.26;
            }
        } else if (letter === "U") {
            const twoUp =
                profile.indexBend > 2.3 &&
                profile.middleBend > 2.3 &&
                profile.ringBend < 1.9 &&
                profile.pinkyBend < 1.9;
            const parallelAndTouch =
                profile.indexMiddleTipGapX > 0.06 &&
                profile.indexMiddleTipDist >= 0.12 &&
                profile.indexMiddleTipDist <= 0.38;
            if (twoUp && parallelAndTouch) {
                score = Math.max(score + 0.34, 0.86);
            } else {
                score -= 0.24;
            }
        } else if (letter === "V") {
            const twoUp =
                profile.indexBend > 2.3 &&
                profile.middleBend > 2.3 &&
                profile.ringBend < 1.9 &&
                profile.pinkyBend < 1.9;
            const spreadApart =
                profile.indexMiddleTipGapX > 0.18 && profile.indexMiddleTipDist > 0.38;
            if (twoUp && spreadApart) {
                score = Math.max(score + 0.34, 0.86);
            } else {
                score -= 0.24;
            }

            // =========================================================================
            // 3. EXISTING CALIBRATED LETTERS (P, Q, K, G, H, J, Z)
            // =========================================================================
        } else if (letter === "P") {
            const indexAndMiddleOpen = profile.indexBend > 1.85 && profile.middleBend > 1.65;
            const ringAndPinkyCurled = profile.ringBend < 1.95 && profile.pinkyBend < 1.95;
            const downwardTilt = profile.palmPointingDown || profile.middlePointingDown;
            if (indexAndMiddleOpen && ringAndPinkyCurled && downwardTilt) {
                score = Math.max(score + 0.32, 0.84);
            } else if (indexAndMiddleOpen && downwardTilt) {
                score = Math.max(score + 0.22, 0.76);
            } else {
                score -= 0.18;
            }
        } else if (letter === "K") {
            const indexAndMiddleOpen = profile.indexBend > 2.0 && profile.middleBend > 1.85;
            const ringAndPinkyCurled = profile.ringBend < 1.85 && profile.pinkyBend < 1.85;
            if (indexAndMiddleOpen && ringAndPinkyCurled && !profile.palmPointingDown) {
                score += 0.24;
            } else {
                score -= 0.18;
            }
        } else if (letter === "Q") {
            const indexExtended = profile.indexBend > 1.85;
            const othersCurled =
                profile.middleBend < 1.95 &&
                profile.ringBend < 1.95 &&
                profile.pinkyBend < 1.95;
            const thumbOpen = profile.thumb > 0.72;
            const pointingDown = profile.indexPointingDown || profile.palmPointingDown;

            if (indexExtended && othersCurled && pointingDown && thumbOpen) {
                score = Math.max(score + 0.34, 0.85);
            } else if (indexExtended && othersCurled && pointingDown) {
                score = Math.max(score + 0.24, 0.78);
            } else {
                score -= 0.20;
            }
        } else if (letter === "G") {
            const indexOut = profile.indexBend > 2.15 && profile.middleBend < 1.8;
            score += indexOut && profile.palmPointingHorizontal ? 0.24 : -0.16;
        } else if (letter === "H") {
            const twoOut = profile.indexBend > 2.15 && profile.middleBend > 2.15 && profile.ringBend < 1.8;
            score += twoOut && profile.palmPointingHorizontal ? 0.24 : -0.18;
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

    let motionPathSummary = `${profile.handedness} hand 3D palm-aligned posture`;
    if (jScore > 0.72) {
        motionPathSummary = `Downward curved pinky trajectory verified (${profile.handedness} hand J-motion)`;
    } else if (zScore > 0.72) {
        motionPathSummary = `Zig-zag index trajectory verified (${profile.handedness} hand Z-motion)`;
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
            bodyAnchorScore = d < 0.30 ? 0.92 : 0.50;
        } else if (wordSpec.anchor === "chin") {
            const d = Math.hypot(hand[12].x - nose.x, hand[12].y - (nose.y + 0.08));
            bodyAnchorScore = d < 0.26 ? 0.92 : 0.52;
        } else if (wordSpec.anchor === "forehead") {
            const d = Math.hypot(hand[12].x - nose.x, hand[12].y - (nose.y - 0.07));
            bodyAnchorScore = d < 0.26 ? 0.92 : 0.52;
        }
    }

    const shapeScore = wordSpec.requiresOpenHand ? (openPalm ? 0.9 : 0.48) : 0.82;
    const motionScore = wordSpec.requiresMotion
        ? motionSpread > 0.035
            ? 0.92
            : 0.50
        : 0.86;

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
    const now = Date.now();
    const pinkyExtended =
        profile.pinkyBend > 2.15 &&
        profile.indexBend < 1.9 &&
        profile.middleBend < 1.9 &&
        profile.ringBend < 1.9;

    if (!pinkyExtended) return 0.08;
    if (now - lastJHitTime < 2200) return 0.92;
    if (trail.length < 8) return 0.30;

    const avgScale =
        trail.reduce((acc, p) => acc + (p.scale || 0.12), 0) / trail.length;
    const start = trail[0];
    const mid = trail[Math.floor(trail.length / 2)];
    const end = trail[trail.length - 1];

    const dropY = (mid.y - start.y) / avgScale;
    const scoopX = Math.abs(end.x - mid.x) / avgScale;
    if (dropY > 0.22 && scoopX > 0.16) {
        lastJHitTime = now;
        return Math.min(0.97, 0.80 + (dropY + scoopX) * 0.15);
    }
    return 0.36;
}

/**
 * Hand-agnostic (left & right hand) Z-trajectory verifier:
 * Checks for a true zig-zag Z shape (top horizontal stroke -> downward diagonal
 * reversing X -> bottom horizontal stroke reversing X again) using palm-scaled
 * coordinates, and holds the verified score (0.93) for 2.5 seconds once traced
 * so Nemotron & lesson advancement reliably confirm the completed Z.
 */
function detectZMotion(trail, profile) {
    const now = Date.now();
    const indexExtended =
        profile.indexBend > 2.05 &&
        profile.middleBend < 1.95 &&
        profile.ringBend < 1.95 &&
        profile.pinkyBend < 1.95;

    if (!indexExtended) return 0.08;
    if (now - lastZHitTime < 2500) return 0.93;
    if (trail.length < 8) return 0.32;

    const avgScale =
        trail.reduce((acc, p) => acc + (p.scale || 0.12), 0) / trail.length;

    const n = trail.length;
    for (let i = 0; i < n - 5; i += 2) {
        for (let j = i + 2; j < n - 3; j += 2) {
            for (let k = j + 2; k < n - 1; k += 2) {
                const p0 = trail[i];
                const p1 = trail[j];
                const p2 = trail[k];
                const p3 = trail[n - 1];

                const dx1 = (p1.x - p0.x) / avgScale;
                const dy1 = Math.abs(p1.y - p0.y) / avgScale;

                const dx2 = (p2.x - p1.x) / avgScale;
                const dy2 = (p2.y - p1.y) / avgScale; // downward drop (+Y in image coords)

                const dx3 = (p3.x - p2.x) / avgScale;
                const dy3 = Math.abs(p3.y - p2.y) / avgScale;

                const validTop = Math.abs(dx1) > 0.18 && dy1 <= Math.abs(dx1) * 1.1;
                const validDiag = dy2 > 0.18 && dx1 * dx2 < 0 && Math.abs(dx2) > 0.12;
                const validBottom = Math.abs(dx3) > 0.18 && dx2 * dx3 < 0 && dy3 <= Math.abs(dx3) * 1.1;

                if (validTop && validDiag && validBottom) {
                    lastZHitTime = now;
                    const spanBonus = Math.min(
                        0.14,
                        (Math.abs(dx1) + dy2 + Math.abs(dx3)) * 0.07
                    );
                    return Math.min(0.98, 0.83 + spanBonus);
                }
            }
        }
    }

    // While actively tracing the Z, return 0.58 so Nemotron knows motion is underway (not yet completed)
    const xs = trail.map((p) => p.x);
    const ys = trail.map((p) => p.y);
    const spanX = (Math.max(...xs) - Math.min(...xs)) / avgScale;
    const spanY = (Math.max(...ys) - Math.min(...ys)) / avgScale;
    if (spanX > 0.22 && spanY > 0.18) {
        return 0.58;
    }

    return 0.34;
}
