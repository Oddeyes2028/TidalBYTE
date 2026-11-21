import React, { useEffect, useRef, useState } from "react";
import { DrawingUtils, HolisticLandmarker } from "@mediapipe/tasks-vision";
import { getHolisticLandmarker, extractFeatureVector } from "../MediapipeService";
import {
    loadSignDatabase,
    saveSignSequence,
    scoreLiveFrameAgainstSign,
} from "../SignDatabase";

export default function SignTracker() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recordedFramesRef = useRef([]);

    const [status, setStatus] = useState("Loading MediaPipe models...");
    const [database, setDatabase] = useState(() => loadSignDatabase());
    const [selectedWord, setSelectedWord] = useState("HELLO");
    const [isRecording, setIsRecording] = useState(false);
    const [matchScore, setMatchScore] = useState(null);

    useEffect(() => {
        let animationFrameId;
        let stream;
        let active = true;

        async function init() {
            try {
                const landmarker = await getHolisticLandmarker();
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 },
                    audio: false,
                });

                if (!active || !videoRef.current) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setStatus("Ready");

                const canvasCtx = canvasRef.current.getContext("2d");
                const drawingUtils = new DrawingUtils(canvasCtx);
                let lastVideoTime = -1;

                const renderLoop = () => {
                    if (!active || !videoRef.current) return;
                    const video = videoRef.current;

                    if (video.currentTime !== lastVideoTime) {
                        lastVideoTime = video.currentTime;
                        const result = landmarker.detectForVideo(video, performance.now());

                        canvasCtx.save();
                        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                        // Draw pose & hand skeletons
                        if (result.poseLandmarks?.[0]) {
                            drawingUtils.drawConnectors(
                                result.poseLandmarks[0],
                                HolisticLandmarker.POSE_CONNECTIONS,
                                { color: "#00FFAA", lineWidth: 2 }
                            );
                        }
                        for (const hand of [result.leftHandLandmarks?.[0], result.rightHandLandmarks?.[0]]) {
                            if (hand) {
                                drawingUtils.drawConnectors(hand, HolisticLandmarker.HAND_CONNECTIONS, {
                                    color: "#FFFFFF",
                                    lineWidth: 2,
                                });
                                drawingUtils.drawLandmarks(hand, { color: "#FF4081", radius: 3 });
                            }
                        }
                        canvasCtx.restore();

                        const featureVector = extractFeatureVector(result);

                        if (recordedFramesRef.current.recording) {
                            recordedFramesRef.current.frames.push(featureVector);
                        } else {
                            const currentSign = loadSignDatabase()[selectedWord];
                            const score = scoreLiveFrameAgainstSign(featureVector, currentSign);
                            setMatchScore(score);
                        }
                    }
                    animationFrameId = requestAnimationFrame(renderLoop);
                };

                renderLoop();
            } catch (err) {
                setStatus(`Initialization error: ${err.message}`);
            }
        }

        init();

        return () => {
            active = false;
            cancelAnimationFrame(animationFrameId);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, [selectedWord]);

    const toggleRecording = () => {
        if (!isRecording) {
            recordedFramesRef.current = { recording: true, frames: [] };
            setIsRecording(true);
        } else {
            recordedFramesRef.current.recording = false;
            setIsRecording(false);
            const frames = recordedFramesRef.current.frames;
            if (frames.length > 0) {
                const entry = database[selectedWord];
                const updated = saveSignSequence(
                    selectedWord,
                    entry?.category,
                    entry?.description,
                    frames
                );
                setDatabase(updated);
            }
        }
    };

    const activeSign = database[selectedWord];

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto" }}>
            <h2>Sign Language Practice ({status})</h2>

            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                <label>
                    Target Sign:{" "}
                    <select value={selectedWord} onChange={(e) => setSelectedWord(e.target.value)}>
                        {Object.keys(database).map((key) => (
                            <option key={key} value={key}>
                                {key} ({database[key].frames.length} reference frames)
                            </option>
                        ))}
                    </select>
                </label>

                <button onClick={toggleRecording}>
                    {isRecording ? "Stop & Save Reference" : "Record Reference Sign"}
                </button>
            </div>

            {activeSign?.description && <p>{activeSign.description}</p>}

            <div style={{ position: "relative", width: 640, height: 480, background: "#111" }}>
                <video
                    ref={videoRef}
                    width={640}
                    height={480}
                    style={{ position: "absolute", top: 0, left: 0, transform: "scaleX(-1)" }}
                    muted
                    playsInline
                />
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    style={{ position: "absolute", top: 0, left: 0, transform: "scaleX(-1)" }}
                />
            </div>

            <div style={{ marginTop: 12, fontSize: 18 }}>
                {activeSign?.frames.length === 0 ? (
                    <span>No reference recorded yet. Click "Record Reference Sign" to capture one.</span>
                ) : (
                    <span>Live Match Confidence: <strong>{matchScore ?? 0}%</strong></span>
                )}
            </div>
        </div>
    );
}
