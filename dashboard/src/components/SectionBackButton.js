import React from "react";
import { ArrowLeft } from "lucide-react";

export default function SectionBackButton({ onBack }) {
  return (
    <div
      className="section-back-bar"
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        marginTop: 12,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -20,
        padding: "14px 24px",
        background: "linear-gradient(180deg, rgba(241,245,249,0) 0%, #F1F5F9 28%, #F1F5F9 100%)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flowing-btn flowing-btn-navy"
        style={{
          pointerEvents: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(11, 37, 69, 0.28)",
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
    </div>
  );
}
