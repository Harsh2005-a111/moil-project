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

  let variantClass = "flowing-btn-navy";
  if (variant === "purple") variantClass = "flowing-btn-purple";
  else if (variant === "emerald") variantClass = "flowing-btn-emerald";
  else if (variant === "amber") variantClass = "flowing-btn-amber";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flowing-btn flowing-report-btn ${variantClass}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: variant === "compact" ? "6px 12px" : "8px 15px",
          borderRadius: 9,
          fontSize: variant === "compact" ? 11.5 : 12.5,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          border: "1px solid rgba(255, 255, 255, 0.28)",
        }}
        title="View comprehensive technical audit, formulas, parameters and download official section PDF report"
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <BookOpen size={variant === "compact" ? 13 : 15} />
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -3,
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#34D399",
              boxShadow: "0 0 6px #34D399",
            }}
          />
        </div>
        <span>{buttonText}</span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 900,
            background: "rgba(255, 255, 255, 0.24)",
            padding: "1.5px 6px",
            borderRadius: 6,
            letterSpacing: "0.03em",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          📄 PDF
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
