import React, { useState } from "react";
import PageShell from "../components/PageShell";
import { colors, fontFamily } from "../components/theme";

// Horizontal page gutter: 115px on a 1440px design, shrinking on small screens
const GUTTER = "clamp(20px, 8vw, 115px)";

// Translucent panel used by "Your sentence" and "Live practice"
const panel = {
  boxSizing: "border-box",
  width: "100%",
  padding: 24,
  borderRadius: 24,
  background:
    "linear-gradient(rgba(255,246,250,0.055), rgba(255,246,250,0.055)), rgba(28,36,64,0.75)",
  border: "1px solid rgba(255,246,250,0.2)",
  display: "flex",
  flexDirection: "column",
};

const heading = {
  margin: 0,
  fontWeight: 600,
  fontSize: 22,
  lineHeight: 1.45,
  color: colors.textBrand,
};

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
 * Props
 *  - onNavigate("home" | "learn" | "translate")  nav + "Back to Home"
 *  - onTranslate(sentence)                        "Translate to ASL" / Enter key
 *  - onStartCamera()                              "Start camera"
 */
export default function LearnPage({
  onNavigate = () => {},
  onTranslate = () => {},
  onStartCamera = () => {},
}) {
  const [sentence, setSentence] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = () => onTranslate(sentence.trim());

  return (
    <PageShell current="learn" onNavigate={onNavigate}>
      {/* Back to Home + page header */}
      <div
        style={{
          margin: `clamp(24px, 4vw, 58px) ${GUTTER} 0`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <button
          onClick={() => onNavigate("home")}
          style={{
            height: 44,
            padding: "10px 20px",
            border: "none",
            borderRadius: 12,
            background: "#6f81bd",
            color: colors.textWhite,
            fontFamily,
            fontWeight: 700,
            fontSize: 18,
            lineHeight: "24px",
            cursor: "pointer",
          }}
        >
          ← Back to Home
        </button>
        <h1
          style={{
            margin: 0,
            marginLeft: "auto",
            textAlign: "right",
            fontWeight: 700,
            fontSize: "clamp(36px, 5.3vw, 76px)",
            lineHeight: 1,
            color: colors.textPrimary,
          }}
        >
          SIGN ANY SENTENCE
        </h1>
      </div>

      {/* Workspace */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          margin: `27px ${GUTTER} 0`,
          paddingBottom: "clamp(24px, 2.7vw, 39px)",
        }}
      >
        {/* Sentence input */}
        <section style={{ ...panel, gap: 12 }}>
          <h2 style={heading}>Your sentence</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 16,
              rowGap: 12,
            }}
          >
            <label
              style={{
                flex: "1 1 240px",
                minWidth: 240,
                boxSizing: "border-box",
                display: "flex",
                padding: 20,
                borderRadius: 12,
                background: "rgba(24,29,55,0.85)",
                border: `1px solid ${
                  focused ? "rgba(255,246,250,0.8)" : "rgba(255,246,250,0.35)"
                }`,
              }}
            >
              <input
                type="text"
                className="signly-sentence-input"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Type a sentence you’d like to learn…"
                aria-label="Your sentence"
                style={{
                  width: "100%",
                  height: "1.45em",
                  padding: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily,
                  fontWeight: 400,
                  fontSize: 20,
                  lineHeight: 1.45,
                  color: colors.textBrand,
                }}
              />
            </label>

            <button onClick={submit} style={{ ...pinkButton, background: colors.pinkCta }}>
              Translate to ASL
            </button>
          </div>
        </section>

        {/* Live video input and display */}
        <section style={{ ...panel, gap: 20, padding: "24px 24px 13px" }}>
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              columnGap: 16,
              rowGap: 12,
            }}
          >
            <h2 style={heading}>Live practice</h2>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                background: "rgba(255,246,250,0.08)",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: 1.45,
                color: colors.textPlaceholderAlt,
              }}
            >
              Camera off
            </span>
          </header>

          {/* Camera preview + directions */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: 16,
              padding: "12px clamp(0px, 1.7vw, 24px)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                flex: "522 1 280px",
                minHeight: 363,
                boxSizing: "border-box",
                padding: "0 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderRadius: 16,
                background: "rgba(9,15,33,0.92)",
                border: "1px solid rgba(255,246,250,0.15)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  alignSelf: "stretch",
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: 24,
                  lineHeight: 1.45,
                  color: colors.textBrand,
                }}
              >
                Your live video will appear here
              </p>
              <p
                style={{
                  margin: 0,
                  alignSelf: "stretch",
                  textAlign: "center",
                  fontWeight: 400,
                  fontSize: 17,
                  lineHeight: 1.45,
                  color: colors.textPlaceholderAlt,
                }}
              >
                Keep your hands and upper body in view for real-time feedback.
              </p>
            </div>

            <p
              style={{
                flex: "573 1 280px",
                margin: 0,
                fontWeight: 600,
                fontSize: 17,
                lineHeight: 1.45,
                color: colors.textWhite,
                whiteSpace: "pre-line",
              }}
            >
              {
                "Touch forehead near temple with flat hand, then move outward in a small salute.\n\nFeedback:"
              }
            </p>
          </div>

          {/* Camera controls */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: 16,
              padding: "12px clamp(0px, 1.7vw, 24px)",
              borderRadius: 12,
            }}
          >
            <button onClick={onStartCamera} style={{ ...pinkButton, background: colors.pinkLearn }}>
              Start camera
            </button>
            <span
              style={{
                fontWeight: 600,
                fontSize: 17,
                lineHeight: 1.45,
                color: colors.textWhite,
              }}
            >
              Live Match Confidence: 0%
            </span>
          </div>
        </section>
      </main>

      {/* Placeholder color for the sentence field (inline styles can't style ::placeholder) */}
      <style>{`.signly-sentence-input::placeholder { color: #dbd9eb; opacity: 1; }`}</style>
    </PageShell>
  );
}
