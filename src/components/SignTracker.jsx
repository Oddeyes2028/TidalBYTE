import React, { useEffect, useRef, useState } from "react";
import { DrawingUtils, HolisticLandmarker } from "@mediapipe/tasks-vision";
import { getHolisticLandmarker } from "../MediapipeService";
import { KAGGLE_ASL_MATRIX, SIGN_GUIDES } from "../SignDatabase";
import {
    evaluateComplexMatrix,
    resetMotionHistory,
} from "../utils/complexMatrixEngine";
import { getNemotronFeedback } from "../services/nemotronService";
import { colors, fontFamily } from "./theme";

const pinkButton = {
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    fontFamily,
    fontWeight: 600,
    fontSize: 17,
    lineHeight: 1.45,
    color: colors.textOnPink,
    cursor: "pointer",
    whiteSpace: "nowrap",
};

/**
 * Live camera + MediaPipe Holistic skeleton overlay + Complex Matrix + NVIDIA Nemotron coach.
 * Preserves Signly's dark glassmorphism aesthetic.
 */
export default function SignTracker({
    targetSign = "A",
    mode = "lesson",
    autoStart = false,
    onSignSuccess = () => { },
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const lastEvalRef = useRef(0);
    const evaluatingRef = useRef(false);
    const successNotifiedRef = useRef(false);

    const [cameraActive, setCameraActive] = useState(autoStart);
    const [status, setStatus] = useState(
        autoStart ? "Initializing camera..." : "Camera off"
    );
    const [matrixResult, setMatrixResult] = useState(null);
    const [coaching, setCoaching] = useState({
        isCorrect: false,
        score: 0,
        headline: `Ready to sign "${targetSign}"`,
        feedback:
            SIGN_GUIDES[targetSign] ||
            `Show the sign for "${targetSign}" in front of your camera.`,
        suggestions: [],
    });

    // Reset motion history & coaching when target sign changes
    useEffect(() => {
        resetMotionHistory();
        successNotifiedRef.current = false;
        setMatrixResult(null);
        setCoaching({
            isCorrect: false,
            score: 0,
            headline: `Target Sign: "${targetSign}"`,
            feedback:
                SIGN_GUIDES[targetSign] ||
                `Form the sign for "${targetSign}" clearly in view of the camera.`,
            suggestions: [],
        });
    }, [targetSign]);

    useEffect(() => {
        if (!cameraActive) return;

        let animationFrameId;
        let stream;
        let active = true;

        async function startTracking() {
            try {
                setStatus("Loading MediaPipe models...");
                const landmarker = await getHolisticLandmarker();

                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                    audio: false,
                });

                if (!active || !videoRef.current) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStatus("Camera live");

                const canvasCtx = canvasRef.current.getContext("2d");
                const drawingUtils = new DrawingUtils(canvasCtx);
                let lastVideoTime = -1;

                const renderLoop = async () => {
                    if (!active || !videoRef.current) return;
                    const video = videoRef.current;

                    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                        lastVideoTime = video.currentTime;
                        const result = landmarker.detectForVideo(video, performance.now());

                        // Draw live hand & pose landmarks
                        canvasCtx.save();
                        canvasCtx.clearRect(
                            0,
                            0,
                            canvasRef.current.width,
                            canvasRef.current.height
                        );

                        if (result.poseLandmarks?.[0]) {
                            drawingUtils.drawConnectors(
                                result.poseLandmarks[0],
                                HolisticLandmarker.POSE_CONNECTIONS,
                                { color: "#00FFAA", lineWidth: 2 }
                            );
                        }
                        for (const hand of [
                            result.leftHandLandmarks?.[0],
                            result.rightHandLandmarks?.[0],
                        ]) {
                            if (hand) {
                                drawingUtils.drawConnectors(
                                    hand,
                                    HolisticLandmarker.HAND_CONNECTIONS,
                                    { color: "#FFFFFF", lineWidth: 2 }
                                );
                                drawingUtils.drawLandmarks(hand, {
                                    color: "#f77cae",
                                    radius: 3.5,
                                });
                            }
                        }
                        canvasCtx.restore();

                        // Run Complex Matrix pattern matching
                        const evalResult = evaluateComplexMatrix(
                            result,
                            KAGGLE_ASL_MATRIX
                        );
                        setMatrixResult(evalResult);

                        // Periodically query NVIDIA Nemotron for coaching & verification
                        const now = Date.now();
                        if (
                            evalResult.topMatch &&
                            now - lastEvalRef.current > 1500 &&
                            !evaluatingRef.current
                        ) {
                            lastEvalRef.current = now;
                            evaluatingRef.current = true;

                            const nemotronResponse = await getNemotronFeedback({
                                targetSign,
                                mode,
                                matrixResult: evalResult,
                            });

                            if (active) {
                                setCoaching(nemotronResponse);
                                if (
                                    nemotronResponse.isCorrect &&
                                    !successNotifiedRef.current
                                ) {
                                    successNotifiedRef.current = true;
                                    onSignSuccess(targetSign, nemotronResponse);
                                }
                            }
                            evaluatingRef.current = false;
                        }
                    }

                    animationFrameId = requestAnimationFrame(renderLoop);
                };

                renderLoop();
            } catch (err) {
                if (active) {
                    setStatus(`Camera error: ${err.message}`);
                }
            }
        }

        startTracking();

        return () => {
            active = false;
            cancelAnimationFrame(animationFrameId);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [cameraActive, targetSign, mode]);

    const confidencePct = matrixResult
        ? Math.round(matrixResult.confidence * 100)
        : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header status pill */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontWeight: 600,
                        fontSize: 18,
                        color: colors.textBrand,
                    }}
                >
                    Target: "{targetSign}"
                </span>

                <span
                    style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        background: cameraActive
                            ? "rgba(247,124,174,0.22)"
                            : "rgba(255,246,250,0.08)",
                        border: "1px solid rgba(255,246,250,0.18)",
                        fontWeight: 500,
                        fontSize: 14,
                        color: colors.textWhite,
                    }}
                >
                    {status}
                </span>
            </div>

            {/* Camera stage + Nemotron Real-time Feedback side by side */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "stretch",
                    gap: 20,
                }}
            >
                {/* Live Video + Skeleton Canvas */}
                <div
                    style={{
                        flex: "522 1 300px",
                        minHeight: 360,
                        position: "relative",
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "rgba(9,15,33,0.92)",
                        border: "1px solid rgba(255,246,250,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {!cameraActive && (
                        <div style={{ padding: 24, textAlign: "center" }}>
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontWeight: 600,
                                    fontSize: 22,
                                    color: colors.textBrand,
                                }}
                            >
                                Your live video will appear here
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    color: colors.textMuted,
                                }}
                            >
                                Click "Start camera" below to begin real-time ASL tracking.
                            </p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        width={640}
                        height={480}
                        muted
                        playsInline
                        style={{
                            display: cameraActive ? "block" : "none",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scaleX(-1)",
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        width={640}
                        height={480}
                        style={{
                            display: cameraActive ? "block" : "none",
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scaleX(-1)",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                {/* NVIDIA Nemotron + Complex Matrix Feedback Panel */}
                <div
                    style={{
                        flex: "520 1 300px",
                        padding: 20,
                        borderRadius: 16,
                        background: coaching.isCorrect
                            ? "rgba(46, 160, 105, 0.18)"
                            : "rgba(24,29,55,0.75)",
                        border: coaching.isCorrect
                            ? "1px solid rgba(110, 231, 183, 0.55)"
                            : "1px solid rgba(255,246,250,0.18)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: 20,
                                color: coaching.isCorrect ? "#86efac" : colors.textBrand,
                            }}
                        >
                            {coaching.headline}
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: "rgba(255,246,250,0.1)",
                                color: colors.textMuted,
                            }}
                        >
                            NVIDIA Nemotron
                        </span>
                    </div>

                    <p
                        style={{
                            margin: 0,
                            fontSize: 16,
                            lineHeight: 1.5,
                            color: colors.textWhite,
                        }}
                    >
                        {coaching.feedback}
                    </p>

                    {SIGN_GUIDES[targetSign] && (
                        <div
                            style={{
                                padding: 12,
                                borderRadius: 12,
                                background: "rgba(255,246,250,0.06)",
                                fontSize: 15,
                                lineHeight: 1.45,
                                color: colors.textMuted,
                            }}
                        >
                            <strong style={{ color: colors.textBrand }}>How to sign "{targetSign}": </strong>
                            {SIGN_GUIDES[targetSign]}
                        </div>
                    )}

                    {coaching.suggestions?.length > 0 && (
                        <div>
                            <strong
                                style={{
                                    display: "block",
                                    marginBottom: 6,
                                    fontSize: 15,
                                    color: colors.pinkTranslate,
                                }}
                            >
                                Nemotron Suggestions:
                            </strong>
                            <ul
                                style={{
                                    margin: 0,
                                    paddingLeft: 20,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    fontSize: 15,
                                    color: colors.textWhite,
                                }}
                            >
                                {coaching.suggestions.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: "auto",
                            paddingTop: 10,
                            borderTop: "1px solid rgba(255,246,250,0.12)",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            gap: 8,
                            fontSize: 14,
                            color: colors.textMuted,
                        }}
                    >
                        <span>
                            Matrix Top Match:{" "}
                            <strong style={{ color: colors.textWhite }}>
                                {matrixResult?.topMatch || "—"}
                            </strong>
                        </span>
                        <span>
                            Confidence:{" "}
                            <strong style={{ color: colors.textWhite }}>
                                {confidencePct}%
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Camera Toggle Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                    onClick={() => setCameraActive((prev) => !prev)}
                    style={{ ...pinkButton, background: colors.pinkLearn }}
                >
                    {cameraActive ? "Stop camera" : "Start camera"}
                </button>
                <span
                    style={{
                        fontWeight: 600,
                        fontSize: 16,
                        color: colors.textWhite,
                    }}
                >
                    Live Match Confidence: {confidencePct}%
                </span>
            </div>
        </div>
    );
}
