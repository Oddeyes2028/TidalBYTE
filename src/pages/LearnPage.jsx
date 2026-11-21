import React from "react";
import PageShell from "../components/PageShell";

/**
 * The "Learn" frame in the Figma file contains only the navigation bar and
 * the gradient background so far — content goes inside <PageShell>.
 */
export default function LearnPage({ onNavigate = () => {} }) {
  return (
    <PageShell current="learn" onNavigate={onNavigate}>
      {/* Learn page content goes here */}
    </PageShell>
  );
}
