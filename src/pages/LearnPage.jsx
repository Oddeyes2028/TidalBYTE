import React, { useState } from "react";
import PageShell from "../components/PageShell";
import SignTracker from "../components/SignTracker";
import { LESSON_LEVELS } from "../SignDatabase";
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
  gap: 18,
};

export default function LearnPage({ onNavigate = () => { } }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState(0);
  // Tracks completed letters permanently so going back never re-locks levels or loses checkmarks
  const [completedLetters, setCompletedLetters] = useState(() => new Set());

  const activeLevel = LESSON_LEVELS[levelIdx];
  const targetLetter = activeLevel.letters[stepIdx];
  const isCurrentLetterCompleted = completedLetters.has(targetLetter);

  const handleSignSuccess = (signedLetter) => {
    setCompletedLetters((prev) => {
      const next = new Set(prev);
      next.add(signedLetter);

      // Unlock next level immediately if every letter in the current level is now completed
      const allInLevelDone = activeLevel.letters.every((ltr) => next.has(ltr));
      if (allInLevelDone && levelIdx + 1 < LESSON_LEVELS.length) {
        setHighestUnlockedLevel((currMax) => Math.max(currMax, levelIdx + 1));
      }
      return next;
    });
  };

  const handlePrevious = () => {
    if (stepIdx > 0) {
      setStepIdx((prev) => prev - 1);
    } else if (levelIdx > 0) {
      const prevLevelIdx = levelIdx - 1;
      setLevelIdx(prevLevelIdx);
      setStepIdx(LESSON_LEVELS[prevLevelIdx].letters.length - 1);
    }
  };

  const handleNext = () => {
    if (stepIdx + 1 < activeLevel.letters.length) {
      setStepIdx((prev) => prev + 1);
    } else if (levelIdx + 1 < LESSON_LEVELS.length) {
      const nextLevel = levelIdx + 1;
      setHighestUnlockedLevel((prev) => Math.max(prev, nextLevel));
      setLevelIdx(nextLevel);
      setStepIdx(0);
    }
  };

  const isFirstLetterOverall = levelIdx === 0 && stepIdx === 0;
  const isFinalStepOfAllLevels =
    levelIdx === LESSON_LEVELS.length - 1 &&
    stepIdx === activeLevel.letters.length - 1;

  return (
    <PageShell current="learn" onNavigate={onNavigate}>
      {/* Top Bar */}
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
          ALPHABET LESSONS
        </h1>
      </div>

      {/* Main Lesson Content */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          margin: `27px ${GUTTER} 0`,
          paddingBottom: 40,
        }}
      >
        {/* Level Progression Selector */}
        <section style={panel}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontWeight: 600,
                fontSize: 22,
                color: colors.textBrand,
              }}
            >
              Lesson Curriculum
            </h2>
            <span style={{ fontSize: 15, color: colors.textMuted }}>
              Click any unlocked level or letter below to review without losing progress
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LESSON_LEVELS.map((lvl, idx) => {
              const unlocked = idx <= highestUnlockedLevel;
              const active = idx === levelIdx;
              const levelCompleted = lvl.letters.every((ltr) =>
                completedLetters.has(ltr)
              );

              return (
                <button
                  key={lvl.id}
                  disabled={!unlocked}
                  onClick={() => {
                    setLevelIdx(idx);
                    setStepIdx(0);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: active
                      ? `2px solid ${colors.pinkLearn}`
                      : "1px solid rgba(255,246,250,0.22)",
                    background: active
                      ? "rgba(247, 124, 174, 0.25)"
                      : "rgba(24, 29, 55, 0.65)",
                    color: unlocked ? colors.textWhite : colors.textPlaceholder,
                    opacity: unlocked ? 1 : 0.45,
                    fontFamily,
                    fontWeight: active ? 700 : 500,
                    fontSize: 15,
                    cursor: unlocked ? "pointer" : "not-allowed",
                  }}
                >
                  {lvl.title} {levelCompleted ? "✓" : unlocked ? "" : "🔒"}
                </button>
              );
            })}
          </div>

          {/* Interactive Letter Pills inside Current Level */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
            }}
          >
            {activeLevel.letters.map((letter, idx) => {
              const done = completedLetters.has(letter);
              const current = idx === stepIdx;
              const canJumpTo =
                done ||
                idx <= stepIdx ||
                levelIdx < highestUnlockedLevel ||
                (idx > 0 && completedLetters.has(activeLevel.letters[idx - 1]));

              return (
                <button
                  key={letter}
                  disabled={!canJumpTo}
                  onClick={() => setStepIdx(idx)}
                  title={
                    canJumpTo
                      ? `Practice letter ${letter}`
                      : `Complete ${activeLevel.letters[idx - 1]} first`
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 18,
                    cursor: canJumpTo ? "pointer" : "not-allowed",
                    background: done
                      ? "rgba(46, 160, 105, 0.35)"
                      : current
                        ? colors.pinkLearn
                        : "rgba(255,246,250,0.08)",
                    color:
                      current && !done ? colors.textOnPink : colors.textWhite,
                    border: current
                      ? "2px solid #fff"
                      : "1px solid rgba(255,246,250,0.2)",
                  }}
                >
                  {letter}
                </button>
              );
            })}

            <span
              style={{
                marginLeft: "auto",
                fontSize: 15,
                color: colors.pinkTranslate,
              }}
            >
              Tip: {activeLevel.tip}
            </span>
          </div>
        </section>

        {/* Live Camera Practice & Nemotron Verification */}
        <section style={panel}>
          <SignTracker
            targetSign={targetLetter}
            mode="lesson"
            onSignSuccess={handleSignSuccess}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              paddingTop: 8,
            }}
          >
            <button
              disabled={isFirstLetterOverall}
              onClick={handlePrevious}
              style={{
                border: "1px solid rgba(255,246,250,0.28)",
                borderRadius: 12,
                padding: "12px 22px",
                fontFamily,
                fontWeight: 600,
                fontSize: 16,
                background: isFirstLetterOverall
                  ? "rgba(255,246,250,0.06)"
                  : "rgba(24,29,55,0.85)",
                color: isFirstLetterOverall
                  ? colors.textPlaceholder
                  : colors.textWhite,
                opacity: isFirstLetterOverall ? 0.5 : 1,
                cursor: isFirstLetterOverall ? "not-allowed" : "pointer",
              }}
            >
              ← Previous Letter
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {!isCurrentLetterCompleted && (
                <span style={{ fontSize: 15, color: colors.textMuted }}>
                  Sign "{targetLetter}" accurately to unlock the next step
                </span>
              )}

              <button
                disabled={!isCurrentLetterCompleted || isFinalStepOfAllLevels}
                onClick={handleNext}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 26px",
                  fontFamily,
                  fontWeight: 600,
                  fontSize: 17,
                  background: isCurrentLetterCompleted
                    ? colors.pinkCta
                    : "rgba(255,246,250,0.15)",
                  color: isCurrentLetterCompleted
                    ? colors.textOnPink
                    : colors.textPlaceholder,
                  cursor: isCurrentLetterCompleted ? "pointer" : "not-allowed",
                }}
              >
                {isFinalStepOfAllLevels && isCurrentLetterCompleted
                  ? "All Levels Complete!"
                  : stepIdx + 1 < activeLevel.letters.length
                    ? `Next Letter (${activeLevel.letters[stepIdx + 1]}) →`
                    : "Next Level →"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

