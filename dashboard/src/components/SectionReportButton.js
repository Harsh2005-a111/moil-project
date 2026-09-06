import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import SectionReportModal from "./SectionReportModal";

export default function SectionReportButton({
  reportId,
  selectedMineName,
  buttonText = "Technical Report & Guide",
  variant = "default", // "default", "purple", "compact", "amber"
}) {
  const [isOpen, setIsOpen] = useState(false);

  let bgStyle = "linear-gradient(135deg, #0F2C59 0%, #1A56A0 100%)";
  let borderStyle = "1px solid rgba(255, 255, 255, 0.2)";
  let textColor = "#FFFFFF";
  let shadow = "0 2px 8px rgba(15, 44, 89, 0.2)";

  if (variant === "purple") {
    bgStyle = "linear-gradient(135deg, #7E22CE 0%, #9333EA 100%)";
    shadow = "0 2px 8px rgba(126, 34, 206, 0.25)";
  } else if (variant === "emerald") {
    bgStyle = "linear-gradient(135deg, #059669 0%, #10B981 100%)";
    shadow = "0 2px 8px rgba(16, 185, 129, 0.25)";
  } else if (variant === "amber") {
    bgStyle = "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)";
    shadow = "0 2px 8px rgba(217, 119, 6, 0.25)";
  } else if (variant === "outline") {
    bgStyle = "#FFFFFF";
    borderStyle = "1px solid #CBD5E1";
    textColor = "#0F2C59";
    shadow = "0 1px 3px rgba(0,0,0,0.05)";
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="section-report-btn hover-lift"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: variant === "compact" ? "5px 10px" : "7px 13px",
          background: bgStyle,
          color: textColor,
          border: borderStyle,
          borderRadius: 8,
          fontSize: variant === "compact" ? 11.5 : 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: shadow,
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
        title="View comprehensive technical audit, formulas, parameters and download official section report"
      >
        <BookOpen size={variant === "compact" ? 13 : 14} />
        <span>{buttonText}</span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            background: "rgba(255, 255, 255, 0.25)",
            padding: "1px 5px",
            borderRadius: 10,
            letterSpacing: "0.02em",
          }}
        >
          REPORT
        </span>
      </button>

      <SectionReportModal
        reportId={reportId}
        selectedMineName={selectedMineName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
