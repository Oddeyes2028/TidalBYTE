import React, { useState } from "react";
import PageShell from "../components/PageShell";
import SignTracker from "../components/SignTracker";
import { SIGN_GUIDES } from "../SignDatabase";
import { colors, fontFamily } from "../components/theme";

const GUTTER = "clamp(20px, 8vw, 115px)";

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

export default function TranslatePage({ onNavigate = () => { } }) {
  const [sentence, setSentence] = useState("HELLO");
  const [focused, setFocused] = useState(false);
  const [tokens, setTokens] = useState(["H", "E", "L", "L", "O"]);
  const [activeTokenIdx, setActiveTokenIdx] = useState(0);

  const submit = () => {
    const cleaned = sentence
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .trim();
    if (!cleaned) return;
    setTokens(cleaned.split(""));
    setActiveTokenIdx(0);
  };

  const currentSign = tokens[activeTokenIdx] || "A";

  return (
    <PageShell current="translate" onNavigate={onNavigate}>
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
        {/* Sentence / Phrase input */}
        <section style={{ ...panel, gap: 12 }}>
          <h2 style={heading}>Your letter, word, or phrase</h2>

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
                border: `1px solid ${focused ? "rgba(255,246,250,0.8)" : "rgba(255,246,250,0.35)"
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
                placeholder="Type a letter, word, or sentence you’d like to learn…"
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

            <button
              onClick={submit}
              style={{ ...pinkButton, background: colors.pinkCta }}
            >
              Translate to ASL
            </button>
          </div>
        </section>

        {/* Visual Sign Reference Breakdown */}
        <section style={{ ...panel, gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2 style={heading}>How to sign it (click any letter to practice)</h2>
            <span style={{ fontSize: 15, color: colors.textMuted }}>
              Step {activeTokenIdx + 1} of {tokens.length}
            </span>
          </div>

          {/* Character cards showing visual handshape guide */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {tokens.map((char, idx) => {
              const isSelected = idx === activeTokenIdx;
              return (
                <button
                  key={`${char}-${idx}`}
                  onClick={() => setActiveTokenIdx(idx)}
                  style={{
                    minWidth: 72,
                    padding: "12px 16px",
                    borderRadius: 16,
                    border: isSelected
                      ? `2px solid ${colors.pinkLearn}`
                      : "1px solid rgba(255,246,250,0.2)",
                    background: isSelected
                      ? "rgba(247, 124, 174, 0.25)"
                      : "rgba(24,29,55,0.8)",
                    color: colors.textWhite,
                    fontFamily,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 700 }}>{char}</span>
                  <span style={{ fontSize: 12, color: colors.pinkTranslate }}>
                    ASL Sign
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed visual demonstration card for the selected sign */}
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(9,15,33,0.7)",
              border: "1px solid rgba(255,246,250,0.16)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 16,
                background: "rgba(247, 124, 174, 0.18)",
                border: "1px solid rgba(247, 124, 174, 0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: colors.textBrand,
                }}
              >
                {currentSign}
              </span>
              <span style={{ fontSize: 11, color: colors.pinkTranslate }}>
                REFERENCE
              </span>
            </div>

            <div style={{ flex: "1 1 260px" }}>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 19,
                  color: colors.textBrand,
                }}
              >
                Demonstration Guide for "{currentSign}"
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: colors.textWhite,
                }}
              >
                {SIGN_GUIDES[currentSign] ||
                  `Form the ASL posture for "${currentSign}" facing the camera.`}
              </p>
            </div>
          </div>
        </section>

        {/* Live practice & NVIDIA Nemotron feedback */}
        <section style={{ ...panel, gap: 20 }}>
          <h2 style={heading}>Live practice & NVIDIA Nemotron feedback</h2>

          <SignTracker
            targetSign={currentSign}
            mode="translator"
            onSignSuccess={() => {
              if (activeTokenIdx + 1 < tokens.length) {
                setTimeout(() => {
                  setActiveTokenIdx((prev) =>
                    prev + 1 < tokens.length ? prev + 1 : prev
                  );
                }, 1200);
              }
            }}
          />
        </section>
      </main>

      <style>{`.signly-sentence-input::placeholder { color: #dbd9eb; opacity: 1; }`}</style>
    </PageShell>
  );
}
