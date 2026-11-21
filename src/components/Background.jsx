import React from "react";
import { colors } from "./theme";

/**
 * Navy & pink pointillist gradient background (fills its positioned parent).
 * Glow sizes are percentages so the background scales with the viewport.
 */
export default function Background() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: colors.pageBg,
        zIndex: 0,
      }}
    >
      {/* Base linear gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(147deg, #070f29 0%, #172447 38%, #57416b 66%, #d783a6 100%)",
        }}
      />
      {/* Blue glow, top-left */}
      <div
        style={{
          position: "absolute",
          left: "-58%",
          top: "5%",
          width: "139%",
          height: "84%",
          background:
            "radial-gradient(closest-side, rgba(55,99,157,0.8), rgba(32,56,92,0))",
        }}
      />
      {/* Pink glow, bottom-right */}
      <div
        style={{
          position: "absolute",
          left: "29%",
          top: "37%",
          width: "132%",
          height: "93%",
          background:
            "radial-gradient(closest-side, rgba(248,172,197,0.75), rgba(207,128,169,0))",
        }}
      />
      {/* Pointillist grain */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "soft-light" }}
      >
        <filter id="signly-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#signly-grain)" />
      </svg>
    </div>
  );
}
