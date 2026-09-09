import React from "react";
import { Home } from "lucide-react";

/** Document-flow footer button — sits at the end of page content (not sticky/fixed). */
export default function SectionHomeButton({ onHome }) {
  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 18,
        paddingBottom: 8,
        borderTop: "1px solid #E2E8F0",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={onHome}
        className="flowing-btn flowing-btn-navy"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <Home size={16} />
        Home
      </button>
    </div>
  );
}
