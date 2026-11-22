/**
 * Multi-Dataset Complex Matrix Pattern-Matching Engine
 * Fuses landmark priors from:
 *  - Google Kaggle ASL Alphabet (static 21-point hand postures)
 *  - Microsoft ASL Citizen (crowdsourced multi-angle hand variations & whole-word gestures)
 *  - WLASL & ChaLearn IsoGD (temporal motion envelopes & signer angle tolerances)
 *
 * Includes high-precision geometric & temporal disambiguation for:
 *  - Q (downward-pointing index + thumb with foreshortening invariance)
 *  - S vs. T vs. A vs. M vs. N (thumb wrapped across fist vs. tucked between index/middle)
 *  - Z (corner-turning & multi-segment zig-zag trajectory tracker with persistence hold)
 *  - P vs. K, R vs. U vs. V, G vs. H, and dynamic J
 */

const TRAIL_LIMIT = 45;
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

    const { local, eY, palmScale } = projectToPalmFrame(hand);
    if (isLeftHand) {
        for (const pt of local) pt.x = -pt.x;
    }

    // Record palm-normalized temporal trails so Z and J work at any distance from the camera
    pinkyTrail.push({ x: hand[20].x, y: hand[20].y, scale: palmScale });
    indexTrail.push({ x: hand[8].x, y: hand[8].y, scale: palmScale });
    wristTrail.push({ x: hand[0].x, y: hand[0].y, z: hand[0].z || 0 });
    if (pinkyTrail.length > TRAIL_LIMIT) pinkyTrail.shift();
    if (indexTrail.length > TRAIL_LIMIT) indexTrail.shift();
    if (wristTrail.length > TRAIL_LIMIT) wristTrail.shift();

    // Joint-bend angles (PIP angles)
    const indexBend = jointAngle(hand[5], hand[6], hand[8]);
    const middleBend = jointAngle(hand[9], hand[10], hand[12]);
    const ringBend = jointAngle(hand[13], hand[14], hand[16]);
    const pinkyBend = jointAngle(hand[17], hand[18], hand[20]);
    const thumbBend = jointAngle(hand[2], hand[3], hand[4]);

    // World-space pointing directions (in screen coordinates, +Y is DOWNWARD)
    const indexDirWorld = norm3(sub3(hand[8], hand[5]));
    const middleDirWorld = norm3(sub3(hand[12], hand[9]));
    const thumbDirWorld = norm3(sub3(hand[4], hand[2]));

    // Palm-frame relative coordinates for close/overlapping joint disambiguation
    const profile = {
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
        // Lateral & depth separation between index (8) and middle (12) tips
        indexMiddleTipGapX: local[12].x - local[8].x,
        indexMiddleTipDist: dist3(local[8], local[12]),
        // Thumb tip (4) position relative to curled fingers & PIP knuckles
        thumbTipX: local[4].x,
        thumbTipY: local[4].y,
        thumbTipZ: local[4].z,
        // Distance from thumb tip (4) to index PIP (6) and middle PIP (10) (key for T vs S vs A)
        thumbToIndexPip: dist3(local[4], local[6]),
        thumbToMiddlePip: dist3(local[4], local[10]),
        // Vertical reach of curled fingertips (8, 12, 16) relative to thumb tip (4) in palm-Y
        indexOverThumb: local[4].y - local[8].y,
        middleOverThumb: local[4].y - local[12].y,
        ringOverThumb: local[4].y - local[16].y,
        // Thumb lateral nesting between index MCP (5), middle MCP (9), and ring MCP (13)
        thumbPastIndexMcp: local[4].x - local[5].x,
        thumbBeforeRingMcp: local[13].x - local[4].x,
        // World-space orientation flags (+Y is downward in MediaPipe image coords)
        palmPointingDown: eY.y > 0.22 || indexDirWorld.y > 0.30 || middleDirWorld.y > 0.32,
        indexPointingDown: indexDirWorld.y > 0.28,
        thumbPointingDown: thumbDirWorld.y > 0.15 || local[4].y > 0.85,
        middlePointingDown: middleDirWorld.y > 0.32,
        palmPointingHorizontal: Math.abs(eY.x) > 0.5 && Math.abs(eY.y) < 0.55,
        palmPointingUp: eY.y < -0.45,
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
        let score = Math.max(0, 1 - rmse * 0.72);

        // Targeted 3D joint-overlap & angle rules for tricky letters:
        // Q, S, T, P, N, M, A, G, H, R, U, V
        if (letter === "Q") {
            // Q: Index & thumb extended downward (like G pointed down).
            // Foreshortening-resilient: checks index straightness + middle/ring/pinky curled + downward index vector.
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
        } else if (letter === "S") {
            // S: Tight fist with thumb wrapped across the front of the curled fingers.
            // Works even when camera z-depth is noisy by checking thumbTipX across index/middle knuckles
            // and thumbTipY resting over the middle phalanges (not tucked underneath like M/N, not beside like A).
            const fist =
                profile.indexBend < 1.85 &&
                profile.middleBend < 1.85 &&
                profile.ringBend < 1.85 &&
                profile.pinkyBend < 1.85;
            const thumbAcrossFingers =
                profile.thumbTipX >= 0.06 &&
                profile.thumbTipX <= 0.78 &&
                profile.thumbTipY >= 0.55 &&
                profile.thumbTipY <= 1.25;
            const notTuckedUnder = profile.indexOverThumb < 0.08;

            if (fist && thumbAcrossFingers && notTuckedUnder) {
                score = Math.max(score + 0.30, 0.83);
            } else if (fist && thumbAcrossFingers) {
                score = Math.max(score + 0.18, 0.75);
            } else {
                score -= 0.16;
            }
        } else if (letter === "T") {
            // T: Fist with thumb tucked specifically between index and middle fingers
            // (thumb tip sits close to index/middle PIP joints and index curls over/around thumb).
            const fist =
                profile.indexBend < 1.95 &&
                profile.middleBend < 1.85 &&
                profile.ringBend < 1.85 &&
                profile.pinkyBend < 1.85;
            const thumbBetweenIndexMiddle =
                profile.thumbTipX >= -0.05 &&
                profile.thumbTipX <= 0.45 &&
                (profile.thumbToIndexPip < 0.45 || profile.thumbToMiddlePip < 0.45);
            const indexOverOrBesideThumb =
                profile.indexOverThumb > -0.18 && profile.middleOverThumb <= 0.08;

            if (fist && thumbBetweenIndexMiddle && indexOverOrBesideThumb) {
                score = Math.max(score + 0.32, 0.84);
            } else if (fist && thumbBetweenIndexMiddle) {
                score = Math.max(score + 0.20, 0.76);
            } else {
                score -= 0.16;
            }
        } else if (letter === "A") {
            // A: Closed fist with thumb resting upright on the outer side of the index finger
            const fist =
                profile.indexBend < 1.85 &&
                profile.middleBend < 1.85 &&
                profile.ringBend < 1.85 &&
                profile.pinkyBend < 1.85;
            const thumbBeside = profile.thumbTipX < 0.08 && profile.thumbTipY > 0.55;
            if (fist && thumbBeside) {
                score = Math.max(score + 0.26, 0.81);
            } else {
                score -= 0.16;
            }
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
        } else if (letter === "N") {
            const fourCurled =
                profile.indexBend < 2.05 &&
                profile.middleBend < 2.05 &&
                profile.ringBend < 1.85 &&
                profile.pinkyBend < 1.85;
            const twoOverThumb =
                profile.indexOverThumb > -0.22 &&
                profile.middleOverThumb > -0.22;
            const ringTuckedLower =
                profile.ringOverThumb <= -0.02 || profile.ring < profile.middle - 0.04;
            const thumbNestedUnderIndexMiddle =
                profile.thumbPastIndexMcp > -0.15 && profile.thumbBeforeRingMcp > -0.18;

            if (fourCurled && twoOverThumb && ringTuckedLower && thumbNestedUnderIndexMiddle) {
                score = Math.max(score + 0.30, 0.82);
            } else if (fourCurled && twoOverThumb && thumbNestedUnderIndexMiddle) {
                score = Math.max(score + 0.20, 0.75);
            } else {
                score -= 0.16;
            }
        } else if (letter === "M") {
            const fourCurled =
                profile.indexBend < 2.05 &&
                profile.middleBend < 2.05 &&
                profile.ringBend < 2.05 &&
                profile.pinkyBend < 1.85;
            const threeOverThumb =
                profile.indexOverThumb > -0.20 &&
                profile.middleOverThumb > -0.20 &&
                profile.ringOverThumb > -0.16 &&
                profile.ring >= profile.middle - 0.03;
            if (fourCurled && threeOverThumb) {
                score = Math.max(score + 0.28, 0.80);
            } else {
                score -= 0.18;
            }
        } else if (letter === "R") {
            const twoUp = profile.indexBend > 2.35 && profile.middleBend > 2.35 && profile.ringBend < 1.85;
            const crossed = profile.indexMiddleTipGapX < 0.05;
            score += twoUp && crossed ? 0.24 : -0.22;
        } else if (letter === "U") {
            const twoUp = profile.indexBend > 2.4 && profile.middleBend > 2.4 && profile.ringBend < 1.85;
            const tightTogether =
                profile.indexMiddleTipGapX >= 0.05 && profile.indexMiddleTipDist < 0.35;
            score += twoUp && tightTogether ? 0.24 : -0.20;
        } else if (letter === "V") {
            const twoUp = profile.indexBend > 2.4 && profile.middleBend > 2.4 && profile.ringBend < 1.85;
            const spreadApart = profile.indexMiddleTipDist >= 0.35;
            score += twoUp && spreadApart ? 0.24 : -0.20;
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

    let motionPathSummary = "3D palm-aligned static posture";
    if (jScore > 0.72) {
        motionPathSummary = "Downward curved pinky trajectory detected (J-motion)";
    } else if (zScore > 0.72) {
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
    if (now - lastJHitTime < 1800) return 0.91;
    if (trail.length < 8) return 0.30;

    const avgScale =
        trail.reduce((acc, p) => acc + (p.scale || 0.12), 0) / trail.length;
    const start = trail[0];
    const mid = trail[Math.floor(trail.length / 2)];
    const end = trail[trail.length - 1];

    const dropY = (mid.y - start.y) / avgScale;
    const scoopX = Math.abs(end.x - mid.x) / avgScale;
    if (dropY > 0.25 && scoopX > 0.18) {
        lastJHitTime = now;
        return Math.min(0.97, 0.78 + (dropY + scoopX) * 0.15);
    }
    return 0.36;
}

/**
 * Scale-normalized, corner-aware Z-trajectory detector:
 * Scans the recent index-fingertip trail for 3 directional strokes
 * (horizontal -> diagonal downward -> horizontal) normalized by palmScale
 * so both small/fast and large/slow Z motions trigger reliably and hold for 1.8s
 * so Nemotron's polling loop catches the completed Z.
 */
function detectZMotion(trail, profile) {
    const now = Date.now();
    const indexExtended =
        profile.indexBend > 2.1 &&
        profile.middleBend < 1.95 &&
        profile.ringBend < 1.95 &&
        profile.pinkyBend < 1.95;

    if (!indexExtended) return 0.08;
    if (now - lastZHitTime < 1800) return 0.92;
    if (trail.length < 10) return 0.32;

    const avgScale =
        trail.reduce((acc, p) => acc + (p.scale || 0.12), 0) / trail.length;

    // Search over candidate corner indices (i < j < k) in the trail so speed variations work
    const n = trail.length;
    for (let i = 0; i < n - 6; i += 2) {
        for (let j = i + 2; j < n - 4; j += 2) {
            for (let k = j + 2; k < n - 2; k += 2) {
                const p0 = trail[i];
                const p1 = trail[j];
                const p2 = trail[k];
                const p3 = trail[n - 1];

                const dx1 = (p1.x - p0.x) / avgScale;
                const dy1 = Math.abs(p1.y - p0.y) / avgScale;

                const dx2 = (p2.x - p1.x) / avgScale;
                const dy2 = (p2.y - p1.y) / avgScale; // downward drop (+Y)

                const dx3 = (p3.x - p2.x) / avgScale;
                const dy3 = Math.abs(p3.y - p2.y) / avgScale;

                // Top stroke moves sideways, diagonal drops down & reverses X, bottom stroke reverses X again
                const validTop = Math.abs(dx1) > 0.24 && dy1 < Math.abs(dx1) * 0.9;
                const validDiag = dy2 > 0.22 && dx1 * dx2 < 0 && Math.abs(dx2) > 0.16;
                const validBottom = Math.abs(dx3) > 0.24 && dx2 * dx3 < 0 && dy3 < Math.abs(dx3) * 0.9;

                if (validTop && validDiag && validBottom) {
                    lastZHitTime = now;
                    const spanBonus = Math.min(
                        0.16,
                        (Math.abs(dx1) + dy2 + Math.abs(dx3)) * 0.08
                    );
                    return Math.min(0.97, 0.80 + spanBonus);
                }
            }
        }
    }

    // Give partial progress feedback while user is actively tracing the Z
    const xs = trail.map((p) => p.x);
    const ys = trail.map((p) => p.y);
    const spanX = (Math.max(...xs) - Math.min(...xs)) / avgScale;
    const spanY = (Math.max(...ys) - Math.min(...ys)) / avgScale;
    if (spanX > 0.25 && spanY > 0.20) {
        return 0.56;
    }

    return 0.34;
}
