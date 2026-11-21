import React from "react";
import PageShell from "../components/PageShell";
import { colors, fontFamily } from "../components/theme";

// Horizontal page gutter: 115px on a 1440px design, shrinking on small screens
const GUTTER = "clamp(20px, 8vw, 115px)";

const card = {
  boxSizing: "border-box",
  flex: "1 1 320px",
  width: "100%",
  maxWidth: 513,
  minHeight: 480,
  padding: "clamp(20px, 2.2vw, 32px)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  borderRadius: 24,
  background:
    "linear-gradient(rgba(12,21,48,0.2), rgba(12,21,48,0.2)), rgba(244,236,255,0.09)",
  border: "1px solid rgba(255,246,250,0.22)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  boxShadow: "0 12px 32px rgba(5,6,20,0.16)",
};

function FeatureCard({ title, blurb, cta, onClick, image }) {
  return (
    <div style={card}>
      {/* Image field — pass `image` (URL) or leave for the placeholder */}
      <div
        style={{
          height: 224,
          flexShrink: 0,
          borderRadius: 16,
          background: "rgba(24,29,55,0.25)",
          border: "1px solid rgba(255,246,250,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          overflow: "hidden",
        }}
      >
        {image ? (
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <span style={{ fontWeight: 500, fontSize: 18, lineHeight: "26px", color: colors.textBrand }}>
              Add image
            </span>
            <span style={{ fontWeight: 400, fontSize: 14, lineHeight: "22px", color: colors.textPlaceholder }}>
              Your ASL image goes here
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: "clamp(24px, 2.1vw, 30px)",
            lineHeight: 1.27,
            color: colors.textBrand,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontWeight: 400,
            fontSize: 17,
            lineHeight: "27px",
            color: colors.textMuted,
          }}
        >
          {blurb}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={onClick}
        style={{
          height: 52,
          flexShrink: 0,
          border: "none",
          borderRadius: 12,
          background: colors.pinkCta,
          color: colors.textOnPink,
          fontFamily,
          fontWeight: 600,
          fontSize: 17,
          lineHeight: "24px",
          cursor: "pointer",
        }}
      >
        {cta}
      </button>
    </div>
  );
}

export default function HomePage({ onNavigate = () => {} }) {
  return (
    <PageShell current="home" onNavigate={onNavigate}>
      {/* Hero: headline left, welcome blurb right; stacks on narrow screens */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "clamp(24px, 4vw, 56px)",
          margin: `clamp(48px, 13.4vw, 193px) ${GUTTER} 0`,
          padding: "0 clamp(0px, 5.6vw, 81px) 0 clamp(0px, 5.6vw, 81px)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(40px, 5.3vw, 76px)",
            lineHeight: 1,
            color: colors.textPrimary,
            whiteSpace: "pre-line",
          }}
        >
          {"LEARNING ASL\nMADE EASY"}
        </h1>

        <p
          style={{
            margin: 0,
            width: 354,
            maxWidth: "100%",
            fontWeight: 700,
            fontSize: "clamp(18px, 1.67vw, 24px)",
            lineHeight: 1,
            color: colors.textWhite,
            whiteSpace: "pre-line",
          }}
        >
          {
            "Welcome to Signly, an ASL learning platform!\n\nPractice American Sign Language with real time AI hand-tracking feedback"
          }
        </p>
      </section>

      {/* Feature cards: side by side on wide screens, stacked when narrow */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "stretch",
          columnGap: "clamp(24px, 12.9vw, 186px)",
          rowGap: 32,
          margin: `clamp(48px, 20vw, 296px) ${GUTTER} 0`,
        }}
      >
        <FeatureCard
          title="Learn the ASL Alphabet"
          blurb="Build your confidence by starting with the basics and responsive feedback. Learn to sign the ASL alphabet to get started on your ASL journey!"
          cta="Start learning"
          onClick={() => onNavigate("learn")}
        />
        <FeatureCard
          title="Learn to sign any sentence"
          blurb="Enter a sentence that you want to learn! Signly will convert it to ASL and teach you how to sign it with responsive feedback!"
          cta="Translate anything"
          onClick={() => onNavigate("translate")}
        />
      </section>

      <footer
        style={{
          marginTop: "auto",
          padding: "clamp(48px, 10vw, 150px) clamp(20px, 2.9vw, 42px) 32px",
          fontWeight: 400,
          fontSize: "clamp(14px, 1.67vw, 24px)",
          lineHeight: 1.25,
          color: colors.textWhite,
        }}
      >
        Powered by NVIDIA Nemotron | Google Kaggle | Icons by Icons8
      </footer>
    </PageShell>
  );
}
