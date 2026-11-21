import React, { useState } from "react";
import SignTracker from "../components/SignTracker";


export default function HomePage() {
    const [started, setStarted] = useState(false);

    if (started) {
        return (
            <div style={{ minHeight: "100vh", padding: "2rem 1rem", backgroundColor: "#f8fafc", color: "#0f172a" }}>
                <div style={{ maxWidth: 720, margin: "0 auto 1rem" }}>
                    <button
                        onClick={() => setStarted(false)}
                        style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.95rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                        }}
                    >
                        ← Back to Home
                    </button>
                </div>
                <SignTracker />
            </div>
        );
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                fontFamily: "system-ui, -apple-system, sans-serif",
                textAlign: "center",
            }}
        >
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem", maxWidth: "640px" }}>
                Welcome to Signly - an ASL learning Platform
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#475569", marginBottom: "2rem", maxWidth: "520px" }}>
                Practice American Sign Language in real time using your webcam and AI hand-tracking feedback.
            </p>
            <button
                onClick={() => setStarted(true)}
                style={{
                    padding: "0.85rem 2rem",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    backgroundColor: "#2563eb",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                }}
            >
                Start Practicing
            </button>
        </main>
    );
}
