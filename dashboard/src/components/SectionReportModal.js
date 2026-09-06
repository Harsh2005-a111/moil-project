import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Cpu,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { SECTION_REPORTS } from "../data/sectionReportsData";

export default function SectionReportModal({ reportId, isOpen, onClose, selectedMineName }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !reportId) return null;

  const report = SECTION_REPORTS[reportId] || {
    title: "Section Operational Documentation",
    badge: "STANDARD SPECIFICATION",
    category: "System Documentation",
    executiveSummary: "Detailed technical documentation for this module.",
    problemSolved: "Streamlines mining exploration and operational analysis.",
    mathematicalCore: [],
    parametersTable: [],
    outputGuide: [],
    dependencies: [],
    judgePitch: [],
  };

  const mineContext = selectedMineName || "Active Exploration Lease";

  // Generate downloadable plain-text / markdown document
  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `MOIL_${reportId.toUpperCase()}_REPORT_${timestamp}.txt`;

    let content = `================================================================================
MOIL LIMITED — AI & SPACE TECHNOLOGY EXPLORATION PLATFORM
OFFICIAL TECHNICAL AUDIT & OPERATIONAL MANUAL: ${report.title.toUpperCase()}
Target Mine Context: ${mineContext}
Classification: ${report.badge} | Subsystem: ${report.category}
Generated At: ${new Date().toLocaleString()}
================================================================================

1. EXECUTIVE OVERVIEW:
${report.executiveSummary}

2. INDUSTRIAL PROBLEM SOLVED:
${report.problemSolved}

3. MATHEMATICAL & ALGORITHMIC FORMULATIONS:
${(report.mathematicalCore || [])
  .map(
    (item, idx) =>
      `[${idx + 1}] FORMULA: ${item.formula}\n    DESCRIPTION: ${item.description}\n`
  )
  .join("\n")}

4. COMPLETE PARAMETER & INPUT DICTIONARY:
${(report.parametersTable || [])
  .map(
    (p) =>
      `• ${p.name.padEnd(30)} | Unit: ${p.unit.padEnd(10)} | Range: ${p.range.padEnd(16)} | Default: ${p.default}\n  Operational Impact: ${p.operationalImpact}\n`
  )
  .join("\n")}

5. HOW TO READ & INTERPRET OUTPUTS:
${(report.outputGuide || [])
  .map(
    (o) =>
      `• OUTPUT: ${o.outputName}\n  Interpretation: ${o.interpretation}\n  Threshold / Alert Rule: ${o.normalVsAlert}\n`
  )
  .join("\n")}

6. CROSS-MODULE SYSTEM DEPENDENCIES:
${(report.dependencies || [])
  .map((d) => `• Target Module: ${d.targetModule}\n  Effect: ${d.effectDescription}\n`)
  .join("\n")}

7. HACKATHON JURY & OPERATOR DEFENSE SCRIPT:
${(report.judgePitch || []).map((j, i) => `[Point ${i + 1}] ${j}`).join("\n")}

================================================================================
END OF OFFICIAL SECTION AUDIT REPORT — MOIL LIMITED & MINISTRY OF STEEL
================================================================================
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const textToCopy = `${report.title} (${report.badge})\n\n${report.executiveSummary}\n\nKey Formulas:\n${(report.mathematicalCore || []).map(m => m.formula).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(15, 44, 89, 0.35)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          animation: "modalSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #0F2C59 0%, #1A56A0 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              <BookOpen size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    background: "#7E22CE",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {report.badge}
                </span>
                <span style={{ fontSize: 11, color: "#93C5FD", fontWeight: 600 }}>
                  {report.category} • {mineContext}
                </span>
              </div>
              <h2 style={{ margin: "3px 0 0 0", fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>
                {report.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.35)",
              }}
              title="Download Section Audit Report as .txt document"
            >
              <Download size={14} />
              <span>Download Report</span>
            </button>

            <button
              onClick={handleCopySummary}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 11px",
                background: "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Copy Summary to Clipboard"
            >
              {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 11px",
                background: "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Print or Save as PDF"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                cursor: "pointer",
                marginLeft: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: "flex",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            padding: "0 24px",
            gap: 16,
          }}
        >
          {[
            { key: "overview", label: "Overview & Purpose" },
            { key: "math", label: "Formulas & Equations" },
            { key: "parameters", label: "Parameter Dictionary" },
            { key: "outputs", label: "Reading Outputs" },
            { key: "dependencies", label: "Dependencies & Pitch" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "11px 4px",
                border: "none",
                background: "transparent",
                color: activeTab === tab.key ? "#0F2C59" : "#64748B",
                fontSize: 12.5,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: "pointer",
                position: "relative",
                borderBottom: activeTab === tab.key ? "3px solid #0F2C59" : "3px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div
                style={{
                  background: "#F0FDF4",
                  borderLeft: "4px solid #10B981",
                  padding: 16,
                  borderRadius: "0 10px 10px 0",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", letterSpacing: "0.04em" }}>
                  OPERATIONAL OBJECTIVE
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 13, lineHeight: 1.6, color: "#1E293B" }}>
                  {report.executiveSummary}
                </p>
              </div>

              <div
                style={{
                  background: "#FAF5FF",
                  borderLeft: "4px solid #7E22CE",
                  padding: 16,
                  borderRadius: "0 10px 10px 0",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#6B21A8", letterSpacing: "0.04em" }}>
                  WHY THIS MATTERS (INDUSTRIAL BOTTLENECK SOLVED)
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 13, lineHeight: 1.6, color: "#1E293B" }}>
                  {report.problemSolved}
                </p>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16 }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#0F2C59" }}>
                  Active Mining Lease Context
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>TARGET BLOCK</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{mineContext}</div>
                  </div>
                  <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>REGULATORY STANDARD</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7E22CE" }}>{report.badge}</div>
                  </div>
                  <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>SUBSYSTEM</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A56A0" }}>{report.category}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MATHEMATICAL & ALGORITHMIC FORMULATIONS */}
          {activeTab === "math" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>
                Mathematical formulations and physical models governing calculations in this module:
              </div>
              {(report.mathematicalCore || []).map((mathItem, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0F172A",
                    borderRadius: 10,
                    padding: 16,
                    color: "#F8FAFC",
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Cpu size={15} color="#38BDF8" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", letterSpacing: "0.05em" }}>
                      FORMULATION #{idx + 1}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#A7F3D0",
                      background: "rgba(255, 255, 255, 0.08)",
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginBottom: 8,
                      overflowX: "auto",
                    }}
                  >
                    {mathItem.formula}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>
                    {mathItem.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PARAMETER DICTIONARY */}
          {activeTab === "parameters" && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                Parameters, input sliders, and variables governing this section:
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#0F2C59", color: "#FFFFFF", textAlign: "left" }}>
                    <th style={{ padding: "9px 12px", borderRadius: "6px 0 0 0" }}>Parameter Name</th>
                    <th style={{ padding: "9px 12px" }}>Unit</th>
                    <th style={{ padding: "9px 12px" }}>Typical Range</th>
                    <th style={{ padding: "9px 12px" }}>Default</th>
                    <th style={{ padding: "9px 12px", borderRadius: "0 6px 0 0" }}>Operational Sensitivity</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.parametersTable || []).map((p, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF",
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#0F172A" }}>{p.name}</td>
                      <td style={{ padding: "9px 12px", color: "#64748B" }}>{p.unit}</td>
                      <td style={{ padding: "9px 12px", color: "#1E293B" }}>{p.range}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "#7E22CE" }}>{p.default}</td>
                      <td style={{ padding: "9px 12px", color: "#334155" }}>{p.operationalImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: READING OUTPUTS */}
          {activeTab === "outputs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                How to read, evaluate, and interpret the visual and numerical metrics generated by this section:
              </div>
              {(report.outputGuide || []).map((out, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F2C59" }}>{out.outputName}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#E0F2FE",
                        color: "#0369A1",
                      }}
                    >
                      KEY METRIC
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.5 }}>
                    <strong>Interpretation:</strong> {out.interpretation}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "#991B1B",
                      background: "#FEF2F2",
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #FEE2E2",
                    }}
                  >
                    <strong>Threshold Rule / Alert:</strong> {out.normalVsAlert}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DEPENDENCIES & JURY PITCH */}
          {activeTab === "dependencies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#0F2C59" }}>
                  Cross-Module Dependency Map
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(report.dependencies || []).map((dep, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          background: "#E0E7FF",
                          color: "#3730A3",
                          padding: "4px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dep.targetModule}
                      </div>
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                        {dep.effectDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)",
                  border: "1px solid #D8B4FE",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Sparkles size={16} color="#7E22CE" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#6B21A8", letterSpacing: "0.04em" }}>
                    30-SECOND DEFENSE SCRIPT FOR JURY / JUDGES
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: "#3B0764", lineHeight: 1.6 }}>
                  {(report.judgePitch || []).map((pitch, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      {pitch}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 11, color: "#64748B" }}>
            MOIL AI-Space Platform • Smart India Hackathon 2024–2026 • Ministry of Steel
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "#0F2C59",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              <span>Download This Section Report (.txt)</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "6px 14px",
                background: "#E2E8F0",
                color: "#1E293B",
                border: "none",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
