import React from "react";
import { colors, fontFamily } from "./theme";

const glass = {
  background: "rgba(245,240,255,0.085)",
  border: "1px solid rgba(255,242,251,0.2)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  boxShadow: "0 12px 32px rgba(4,6,18,0.16)",
};

const buttonBase = {
  height: 44,
  padding: "10px clamp(12px, 1.4vw, 20px)",
  border: "none",
  borderRadius: 12,
  fontFamily,
  fontWeight: 500,
  fontSize: "clamp(15px, 1.25vw, 18px)",
  lineHeight: "24px",
  color: colors.textOnPink,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

/**
 * Responsive top navigation bar (translucent blur).
 * `onNavigate("home" | "learn" | "translate")` is called on click.
 * `current` marks the active page (sets aria-current).
 */
export default function Navigation({ onNavigate = () => {}, current }) {
  return (
    <nav
      style={{
        ...glass,
        position: "relative",
        margin: "26px clamp(16px, 4.6vw, 66px) 0",
        minHeight: 71,
        boxSizing: "border-box",
        borderRadius: 24,
        padding: "0 clamp(12px, 1.7vw, 24px) 0 clamp(20px, 3.3vw, 48px)",
        display: "flex",
        alignItems: "center",
        gap: "clamp(8px, 1.4vw, 16px)",
        zIndex: 2,
      }}
    >
      <button
        onClick={() => onNavigate("home")}
        aria-current={current === "home" ? "page" : undefined}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginRight: "auto",
          cursor: "pointer",
          fontFamily,
          fontWeight: 600,
          fontSize: "clamp(22px, 2vw, 28px)",
          lineHeight: "24px",
          color: colors.textBrand,
        }}
      >
        SIGNLY
      </button>

      <button
        onClick={() => onNavigate("learn")}
        aria-current={current === "learn" ? "page" : undefined}
        style={{ ...buttonBase, background: colors.pinkLearn }}
      >
        Learn
      </button>
      <button
        onClick={() => onNavigate("translate")}
        aria-current={current === "translate" ? "page" : undefined}
        style={{ ...buttonBase, background: colors.pinkTranslate }}
      >
        Translate
      </button>
    </nav>
  );
}
