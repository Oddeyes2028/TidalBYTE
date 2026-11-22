import React, { useState } from "react";
import PageShell from "../components/PageShell";
import SignTracker from "../components/SignTracker";
import {
  ASL_CITIZEN_PHRASES,
  INCLUDED_DATASETS,
  parseTextToSignSteps,
} from "../SignDatabase";
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
  const [sentence, setSentence] = useState("PLEASE HELP");
  const [focused, setFocused] = useState(false);
  const [steps, setSteps] = useState(() =>
    parseTextToSignSteps("PLEASE HELP")
  );
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const submit = (overrideText) => {
    const query = typeof overrideText === "string" ? overrideText : sentence;
    const parsed = parseTextToSignSteps(query);
    if (!parsed.length) return;
    setSteps(parsed);
    setActiveStepIdx(0);
  };

  const currentStep = steps[activeStepIdx] || {
    token: "PLEASE",
    display: "PLEASE",
    type: "gesture",
    dataset: "Microsoft ASL Citizen",
    guide: ASL_CITIZEN_PHRASES.PLEASE.guide,
  };

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
        <section style={{ ...panel, gap: 14 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <h2 style={heading}>Your letter, word, or phrase</h2>
            <span style={{ fontSize: 14, color: colors.textMuted }}>
              Known phrases teach full ASL gestures; other words fingerspell letter-by-letter
            </span>
          </div>

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
                placeholder="Try 'Nice to meet you', 'Thank you', 'Please', 'I love you'…"
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
              onClick={() => submit()}
              style={{ ...pinkButton, background: colors.pinkCta }}
            >
              Translate to ASL
            </button>
          </div>

          {/* Quick-try ASL Citizen phrase pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                color: colors.textMuted,
                alignSelf: "center",
                marginRight: 4,
              }}
            >
              Quick ASL Citizen Phrases:
            </span>
            {[
              "PLEASE",
              "THANK YOU",
              "HELLO",
              "NICE TO MEET YOU",
              "HOW ARE YOU",
              "I LOVE YOU",
              "SORRY",
              "HELP",
            ].map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  setSentence(phrase);
                  submit(phrase);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,246,250,0.22)",
                  background: "rgba(255,246,250,0.08)",
                  color: colors.textWhite,
                  fontFamily,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {phrase}
              </button>
            ))}
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
            <h2 style={heading}>How to sign it (click any step to practice)</h2>
            <span style={{ fontSize: 15, color: colors.textMuted }}>
              Step {activeStepIdx + 1} of {steps.length}
            </span>
          </div>

          {/* Gesture & Letter Step Cards */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {steps.map((step, idx) => {
              const isSelected = idx === activeStepIdx;
              const isGesture = step.type === "gesture";
              return (
                <button
                  key={`${step.token}-${idx}`}
                  onClick={() => setActiveStepIdx(idx)}
                  style={{
                    minWidth: isGesture ? 136 : 74,
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
                  <span style={{ fontSize: isGesture ? 19 : 26, fontWeight: 700 }}>
                    {step.display}
                  </span>
                  <span style={{ fontSize: 12, color: colors.pinkTranslate }}>
                    {isGesture ? "ASL Gesture" : "Fingerspell"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Visual Demonstration Card */}
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
                minWidth: 120,
                padding: "14px 16px",
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
                  fontSize: currentStep.type === "gesture" ? 22 : 42,
                  fontWeight: 700,
                  color: colors.textBrand,
                  textAlign: "center",
                }}
              >
                {currentStep.display}
              </span>
              <span style={{ fontSize: 11, color: colors.pinkTranslate }}>
                {currentStep.type === "gesture" ? "PHRASE GESTURE" : "LETTER"}
              </span>
            </div>

            <div style={{ flex: "1 1 260px" }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 19,
                    color: colors.textBrand,
                  }}
                >
                  How to sign "{currentStep.display}"
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(255,246,250,0.1)",
                    color: colors.pinkTranslate,
                  }}
                >
                  Source: {currentStep.dataset}
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
                {currentStep.guide}
              </p>
            </div>
          </div>
        </section>

        {/* Live practice & NVIDIA Nemotron feedback */}
        <section style={{ ...panel, gap: 20 }}>
          <h2 style={heading}>Live practice & NVIDIA Nemotron feedback</h2>

          <SignTracker
            targetSign={currentStep.token}
            mode="translator"
            onSignSuccess={() => {
              if (activeStepIdx + 1 < steps.length) {
                setTimeout(() => {
                  setActiveStepIdx((prev) =>
                    prev + 1 < steps.length ? prev + 1 : prev
                  );
                }, 1300);
              }
            }}
          />

          {/* Active Datasets Footer */}
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid rgba(255,246,250,0.14)",
              fontSize: 13,
              color: colors.textMuted,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <strong style={{ color: colors.textBrand }}>Active Datasets:</strong>
            {INCLUDED_DATASETS.map((ds) => (
              <span key={ds.name}>
                • {ds.name} ({ds.coverage})
              </span>
            ))}
          </div>
        </section>
      </main>

      <style>{`.signly-sentence-input::placeholder { color: #dbd9eb; opacity: 1; }`}</style>
    </PageShell>
  );
}
