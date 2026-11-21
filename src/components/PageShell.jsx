import React from "react";
import Background from "./Background";
import Navigation from "./Navigation";
import { colors, fontFamily, STAGE_WIDTH } from "./theme";

/**
 * Shared responsive frame: full-bleed gradient background and a centered
 * content column (max 1440px) with the navigation on top.
 */
export default function PageShell({ current, onNavigate, children }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        background: colors.pageBg,
        fontFamily,
      }}
    >
      <Background />
      <div
        style={{
          position: "relative",
          maxWidth: STAGE_WIDTH,
          minHeight: "100vh",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        <Navigation current={current} onNavigate={onNavigate} />
        {children}
      </div>
    </div>
  );
}
