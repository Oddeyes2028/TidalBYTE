import { FilesetResolver, HolisticLandmarker } from "@mediapipe/tasks-vision";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const HOLISTIC_MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task";

let landmarkerInstance = null;

/**
 * Automatically initializes and caches the MediaPipe HolisticLandmarker
 * by pulling the WASM runtime and pre-trained .task model from Google's CDN.
 */
export async function getHolisticLandmarker() {
    if (landmarkerInstance) {
        return landmarkerInstance;
    }

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
    landmarkerInstance = await HolisticLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: HOLISTIC_MODEL_URL,
            delegate: "GPU",
        },
        runningMode: "VIDEO",
        minFaceDetectionConfidence: 0.5,
        minPoseDetectionConfidence: 0.5,
    });

    return landmarkerInstance;
}

/**
 * Extracts normalized [x, y, z] vectors for hands and upper pose
 * into a flat feature array matching Google's Kaggle ASL landmark schema.
 */
export function extractFeatureVector(result) {
    const flatten = (landmarks, expectedCount) => {
        if (!landmarks || landmarks.length === 0) {
            return new Array(expectedCount * 3).fill(0);
        }
        return landmarks.slice(0, expectedCount).flatMap((pt) => [pt.x, pt.y, pt.z]);
    };

    const leftHand = flatten(result.leftHandLandmarks?.[0], 21);
    const rightHand = flatten(result.rightHandLandmarks?.[0], 21);
    const pose = flatten(result.poseLandmarks?.[0], 33);

    return [...leftHand, ...rightHand, ...pose];
}
