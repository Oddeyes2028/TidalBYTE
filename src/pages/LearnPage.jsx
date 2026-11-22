import React, { useEffect, useState } from "react";
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
  // Permanently tracks completed letters & skipped letters so users can come back anytime
  const [completedLetters, setCompletedLetters] = useState(() => new Set());
  const [skippedLetters, setSkippedLetters] = useState(() => new Set());
  const [secondsOnStep, setSecondsOnStep] = useState(0);

  const activeLevel = LESSON_LEVELS[levelIdx];
  const targetLetter = activeLevel.letters[stepIdx];
  const isCurrentLetterCompleted = completedLetters.has(targetLetter);
  const isCurrentLetterSkipped = skippedLetters.has(targetLetter);
  const canAdvance = isCurrentLetterCompleted || isCurrentLetterSkipped;

  // 10-second timer per letter so users can skip to the next step/level and return later
  useEffect(() => {
    setSecondsOnStep(0);
    if (isCurrentLetterCompleted || isCurrentLetterSkipped) return;

    const timer = setInterval(() => {
      setSecondsOnStep((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [levelIdx, stepIdx, isCurrentLetterCompleted, isCurrentLetterSkipped]);

  const handleSignSuccess = (signedLetter) => {
    setSkippedLetters((prev) => {
      const next = new Set(prev);
      next.delete(signedLetter);
      return next;
    });

    setCompletedLetters((prev) => {
      const next = new Set(prev);
      next.add(signedLetter);

      const allInLevelResolved = activeLevel.letters.every(
        (ltr) => next.has(ltr) || skippedLetters.has(ltr)
      );
      if (allInLevelResolved && levelIdx + 1 < LESSON_LEVELS.length) {
        setHighestUnlockedLevel((currMax) => Math.max(currMax, levelIdx + 1));
      }
      return next;
    });
  };

  const handleSkip = () => {
    setSkippedLetters((prev) => {
      const next = new Set(prev);
      next.add(targetLetter);

      const allInLevelResolved = activeLevel.letters.every(
        (ltr) => completedLetters.has(ltr) || next.has(ltr)
      );
      if (allInLevelResolved && levelIdx + 1 < LESSON_LEVELS.length) {
        setHighestUnlockedLevel((currMax) => Math.max(currMax, levelIdx + 1));
      }
      return next;
    });

    // Advance immediately to the next letter or next level
    if (stepIdx + 1 < activeLevel.letters.length) {
      setStepIdx((prev) => prev + 1);
    } else if (levelIdx + 1 < LESSON_LEVELS.length) {
      const nextLevel = levelIdx + 1;
      setHighestUnlockedLevel((prev) => Math.max(prev, nextLevel));
      setLevelIdx(nextLevel);
      setStepIdx(0);
    }
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
  const skipUnlocked = secondsOnStep >= 10 && !isCurrentLetterCompleted;
  const remainingSkipSeconds = Math.max(0, 10 - secondsOnStep);

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
              Green = Completed • Amber = Skipped (come back anytime) • Levels stay unlocked
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LESSON_LEVELS.map((lvl, idx) => {
              const unlocked = idx <= highestUnlockedLevel;
              const active = idx === levelIdx;
              const levelCompleted = lvl.letters.every((ltr) =>
                completedLetters.has(ltr)
              );
              const hasSkippedInLevel = lvl.letters.some((ltr) =>
                skippedLetters.has(ltr)
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
                  {lvl.title}{" "}
                  {levelCompleted
                    ? "✓"
                    : hasSkippedInLevel
                      ? "↺"
                      : unlocked
                        ? ""
                        : "🔒"}
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
              const skipped = skippedLetters.has(letter) && !done;
              const current = idx === stepIdx;
              const prevLetter = idx > 0 ? activeLevel.letters[idx - 1] : null;
              const canJumpTo =
                done ||
                skipped ||
                idx <= stepIdx ||
                levelIdx < highestUnlockedLevel ||
                (prevLetter &&
                  (completedLetters.has(prevLetter) ||
                    skippedLetters.has(prevLetter)));

              return (
                <button
                  key={letter}
                  disabled={!canJumpTo}
                  onClick={() => setStepIdx(idx)}
                  title={
                    done
                      ? `${letter} completed — click to review`
                      : skipped
                        ? `${letter} skipped — click to practice now`
                        : canJumpTo
                          ? `Practice letter ${letter}`
                          : `Complete or skip ${prevLetter} first`
                  }
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 17,
                    cursor: canJumpTo ? "pointer" : "not-allowed",
                    background: done
                      ? "rgba(46, 160, 105, 0.35)"
                      : skipped
                        ? "rgba(245, 158, 11, 0.28)"
                        : current
                          ? colors.pinkLearn
                          : "rgba(255,246,250,0.08)",
                    color:
                      current && !done && !skipped
                        ? colors.textOnPink
                        : colors.textWhite,
                    border: current
                      ? "2px solid #fff"
                      : skipped
                        ? "1px solid rgba(251, 191, 36, 0.65)"
                        : "1px solid rgba(255,246,250,0.2)",
                  }}
                >
                  <span>{letter}</span>
                  {skipped && (
                    <span style={{ fontSize: 9, lineHeight: 1 }}>SKIPPED</span>
                  )}
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

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
              }}
            >
              {!isCurrentLetterCompleted && !isFinalStepOfAllLevels && (
                <button
                  disabled={!skipUnlocked && !isCurrentLetterSkipped}
                  onClick={handleSkip}
                  style={{
                    border: "1px solid rgba(255,246,250,0.28)",
                    borderRadius: 12,
                    padding: "12px 20px",
                    fontFamily,
                    fontWeight: 600,
                    fontSize: 15,
                    background:
                      skipUnlocked || isCurrentLetterSkipped
                        ? "rgba(245, 158, 11, 0.25)"
                        : "rgba(255,246,250,0.06)",
                    color:
                      skipUnlocked || isCurrentLetterSkipped
                        ? "#fde68a"
                        : colors.textPlaceholder,
                    cursor:
                      skipUnlocked || isCurrentLetterSkipped
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  {skipUnlocked || isCurrentLetterSkipped
                    ? "Skip for now (come back later) ⏭"
                    : `Skip available in ${remainingSkipSeconds}s`}
                </button>
              )}

              <button
                disabled={!canAdvance || isFinalStepOfAllLevels}
                onClick={handleNext}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 26px",
                  fontFamily,
                  fontWeight: 600,
                  fontSize: 17,
                  background: canAdvance
                    ? colors.pinkCta
                    : "rgba(255,246,250,0.15)",
                  color: canAdvance
                    ? colors.textOnPink
                    : colors.textPlaceholder,
                  cursor: canAdvance ? "pointer" : "not-allowed",
                }}
              >
                {isFinalStepOfAllLevels && canAdvance
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
