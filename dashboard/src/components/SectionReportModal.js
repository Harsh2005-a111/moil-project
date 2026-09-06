import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  MapPin,
  FlaskConical,
  Scale,
  Settings2,
  TreePine,
} from "lucide-react";
import { SECTION_REPORTS } from "../data/sectionReportsData";
import { generateGovtReportPDF } from "../utils/pdfReportGenerator";

export default function SectionReportModal({ reportId, isOpen, onClose, selectedMineName }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("govReport");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !reportId) return null;

  const report = SECTION_REPORTS[reportId] || {
    title: "Section Operational Documentation",
    badge: "STANDARD SPECIFICATION",
    category: "System Documentation",
    executiveSummary: "Detailed technical documentation for this module.",
    explainableAiRationale: "Explainable AI breaks down operational decisions into transparent parameters.",
    govPillars: {},
    parametersTable: [],
    outputGuide: [],
    dependencies: [],
    judgePitch: [],
  };

  const mineContext = selectedMineName || "Balaghat Mining Lease (Active)";
  const pillars = report.govPillars || {};

  // Download official Government PDF Report
  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPDF(true);
      setTimeout(() => {
        try {
          generateGovtReportPDF(report, mineContext);
          setIsGeneratingPDF(false);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (innerErr) {
          console.error("PDF generation inner error:", innerErr);
          setIsGeneratingPDF(false);
          alert(`PDF Generation failed: ${innerErr.message || "Unknown error"}`);
        }
      }, 50);
    } catch (err) {
      console.error("PDF generation error:", err);
      setIsGeneratingPDF(false);
      alert(`PDF Generation failed: ${err.message || "Unknown error"}`);
    }
  };

  const handleCopySummary = () => {
    const textToCopy = `================================================================================
GOVERNMENT OF INDIA • MINISTRY OF MINES & MINISTRY OF STEEL
INDIAN BUREAU OF MINES (IBM) & GEOLOGICAL SURVEY OF INDIA (GSI)
OFFICIAL STATUTORY MINERAL DOSSIER: ${report.title.toUpperCase()}
================================================================================
Target Concession:     ${mineContext.toUpperCase()}
Statutory Standard:    UNFC-1997 / UNFC-2009 • ${report.badge}
Functional Domain:     ${report.category}
Date of Generation:    ${new Date().toLocaleString("en-IN")}
Platform Security:     MOIL AI-Space Exploration & Shortfall Mitigation System
================================================================================

EXECUTIVE MANDATE & AUDIT TRAIL:
${report.executiveSummary}

EXPLAINABLE AI (XAI) DECISION RATIONALE:
${report.explainableAiRationale}

--------------------------------------------------------------------------------
AREA 1: GEOLOGICAL & SPATIAL MAPPING (G-AXIS)
--------------------------------------------------------------------------------
1.1 Geographical Boundaries: ${pillars.geologicalMapping?.geographicalBoundaries || "Surveyed and georeferenced to national grid."}
1.2 Lithology & Stratigraphy: ${pillars.geologicalMapping?.lithologyStratigraphy || "Sausar Group Proterozoic metasedimentary manganese formation."}
1.3 Structural Geology: ${pillars.geologicalMapping?.structuralGeology || "Regional strike ENE-WSW with moderate to steep dip."}

--------------------------------------------------------------------------------
AREA 2: MINERALOGICAL & CHEMICAL QUALITY
--------------------------------------------------------------------------------
2.1 Certified Manganese Grade: ${pillars.mineralogicalComposition?.manganeseGrade || "Certified metallurgical ore grade."}
2.2 Dominant Mineral Forms: ${pillars.mineralogicalComposition?.mineralForms || "Braunite, Pyrolusite, Psilomelane assemblage."}
2.3 Deleterious Impurities & Ratios: ${pillars.mineralogicalComposition?.impuritiesAndRatios || "Mn/Fe ratio, SiO2, Al2O3, P, S within limits."}

--------------------------------------------------------------------------------
AREA 3: RESOURCE ESTIMATION & UNFC FRAMEWORK
--------------------------------------------------------------------------------
3.1 UNFC Stage Classification: ${pillars.resourceEstimation?.unfcFramework || "Categorized under UNFC-1997/2009 norms."}
3.2 In-Situ Tonnage & Volumetric Geometry: ${pillars.resourceEstimation?.tonnageVolume || "Delineated based on core drilling density."}

--------------------------------------------------------------------------------
AREA 4: METALLURGICAL & BENEFICIATION POTENTIAL
--------------------------------------------------------------------------------
4.1 Processing Viability: ${pillars.metallurgicalBeneficiation?.processingViability || "Responsive to mechanical crushing and wet gravity separation."}
4.2 Bulk Sampling & Recovery Analysis: ${pillars.metallurgicalBeneficiation?.bulkSampling || "High metallurgical recovery confirmed."}

--------------------------------------------------------------------------------
AREA 5: ENVIRONMENTAL, INFRASTRUCTURE & DGMS SAFETY
--------------------------------------------------------------------------------
5.1 Ecological Sensitivity & Forest Setbacks: ${pillars.environmentalSocioEconomic?.ecologicalSensitivity || "Conforms to MoEFCC statutory exclusion norms."}
5.2 Regional Rail & Logistics Infrastructure: ${pillars.environmentalSocioEconomic?.infrastructureLogistics || "Direct SECR siding and national highway connectivity."}
5.3 Occupational Health, Safety & Wet Suppression: ${pillars.environmentalSocioEconomic?.healthSafetyDust || "DGMS compliant wet suppression and PPE standards."}

================================================================================
END OF OFFICIAL STATUTORY DOSSIER — MOIL LIMITED & MINISTRY OF MINES
================================================================================`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        backgroundColor: "rgba(15, 23, 42, 0.75)",
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
          maxWidth: 980,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(15, 44, 89, 0.4)",
          border: "1px solid #CBD5E1",
          overflow: "hidden",
          animation: "modalSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            flexShrink: 0,
            padding: "16px 24px",
            background: "linear-gradient(135deg, #0F2C59 0%, #1A56A0 50%, #0D254C 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 4px 14px rgba(15, 44, 89, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            >
              <BookOpen size={24} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    background: "#059669",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: 5,
                    boxShadow: "0 2px 6px rgba(5, 150, 105, 0.35)",
                  }}
                >
                  {report.badge}
                </span>
                <span style={{ fontSize: 11.5, color: "#93C5FD", fontWeight: 600 }}>
                  {report.category} • {mineContext}
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={report.title}
              >
                {report.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flowing-btn flowing-btn-emerald"
              style={{
                padding: "8px 16px",
                fontSize: 12.5,
                opacity: isGeneratingPDF ? 0.75 : 1,
                cursor: isGeneratingPDF ? "wait" : "pointer",
              }}
              title="Download Official Government Statutory Dossier as PDF Document"
            >
              {downloadSuccess ? (
                <Check size={15} color="#FFFFFF" />
              ) : (
                <Download size={15} className={isGeneratingPDF ? "animate-spin" : ""} />
              )}
              <span>{isGeneratingPDF ? "Generating PDF..." : downloadSuccess ? "Downloaded PDF!" : "Download Official PDF"}</span>
              <span
                style={{
                  fontSize: 9.5,
                  background: "rgba(255, 255, 255, 0.28)",
                  padding: "1px 6px",
                  borderRadius: 6,
                  fontWeight: 900,
                }}
              >
                PDF
              </span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flowing-btn"
              style={{
                padding: "8px 13px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                fontSize: 11.5,
              }}
              title="Copy Formal Statutory Dossier to Clipboard"
            >
              {copied ? <Check size={13} color="#34D399" /> : <Copy size={13} />}
              <span>{copied ? "Copied!" : "Copy Dossier"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flowing-btn"
              style={{
                padding: "8px 13px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                fontSize: 11.5,
              }}
              title="Print Official Dossier Stationery"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 9,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s ease",
                marginLeft: 4,
              }}
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            padding: "8px 20px",
            gap: 10,
            overflowX: "auto",
            minHeight: 52,
          }}
        >
          {[
            { key: "govReport", label: "Statutory Govt Report (5 Areas)", icon: "🏛️" },
            { key: "parameters", label: "Explainable AI & Parameters", icon: "🧭" },
            { key: "outputs", label: "Output Guide & Reading Metrics", icon: "📊" },
            { key: "dependencies", label: "Dependencies & Defense Pitch", icon: "🔗" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flowing-btn"
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: isActive
                    ? "linear-gradient(135deg, #0F2C59 0%, #1A56A0 100%)"
                    : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#475569",
                  border: isActive ? "1px solid #0F2C59" : "1px solid #CBD5E1",
                  boxShadow: isActive
                    ? "0 3px 10px rgba(15, 44, 89, 0.3)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* TAB 1: OFFICIAL GOVERNMENT STATUTORY REPORT (THE 5 MANDATORY AREAS) */}
          {activeTab === "govReport" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Executive Summary & Explainable AI Box */}
              <div style={{ background: "#F1F5F9", borderRadius: 10, padding: 16, border: "1px solid #CBD5E1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span className="live-beacon" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#0F2C59", letterSpacing: "0.04em" }}>
                    EXPLAINABLE AI (XAI) OPERATIONAL OBJECTIVE
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#1E293B" }}>
                  {report.executiveSummary}
                </p>
                <div style={{ marginTop: 10, padding: 10, background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
                  💡 <strong>Decision Rationale:</strong> {report.explainableAiRationale}
                </div>
              </div>

              {/* Area 1: Geological & Spatial Mapping */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, borderLeft: "4px solid #1E40AF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <MapPin size={18} color="#1E40AF" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F2C59" }}>
                    1. Geological & Spatial Mapping
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Geographical Boundaries: </strong>
                    <span style={{ color: "#475569" }}>{pillars.geologicalMapping?.geographicalBoundaries}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Lithology & Stratigraphy: </strong>
                    <span style={{ color: "#475569" }}>{pillars.geologicalMapping?.lithologyStratigraphy}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Structural Geology (Faults, Folds, Dip & Strike): </strong>
                    <span style={{ color: "#475569" }}>{pillars.geologicalMapping?.structuralGeology}</span>
                  </div>
                </div>
              </div>

              {/* Area 2: Mineralogical & Chemical Composition */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, borderLeft: "4px solid #7E22CE" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <FlaskConical size={18} color="#7E22CE" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F2C59" }}>
                    2. Mineralogical & Chemical Composition (Ore Quality)
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Manganese Grade: </strong>
                    <span style={{ color: "#6B21A8", fontWeight: 700 }}>{pillars.mineralogicalComposition?.manganeseGrade}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Mineral Forms Present: </strong>
                    <span style={{ color: "#475569" }}>{pillars.mineralogicalComposition?.mineralForms}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Impurities & Ratios (Mn/Fe, Silica, Phosphorus, Sulfur): </strong>
                    <span style={{ color: "#475569" }}>{pillars.mineralogicalComposition?.impuritiesAndRatios}</span>
                  </div>
                </div>
              </div>

              {/* Area 3: Resource Estimation & UNFC Classification */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, borderLeft: "4px solid #059669" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Scale size={18} color="#059669" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F2C59" }}>
                    3. Resource Estimation & UNFC Framework Classification
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• UNFC Framework Classification: </strong>
                    <span style={{ color: "#047857", fontWeight: 700 }}>{pillars.resourceEstimation?.unfcFramework}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Tonnage & Volume: </strong>
                    <span style={{ color: "#475569" }}>{pillars.resourceEstimation?.tonnageVolume}</span>
                  </div>
                </div>
              </div>

              {/* Area 4: Metallurgical & Beneficiation Potential */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, borderLeft: "4px solid #D97706" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Settings2 size={18} color="#D97706" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F2C59" }}>
                    4. Metallurgical & Beneficiation Potential
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Processing Viability (Crushing, Washing, Jigging): </strong>
                    <span style={{ color: "#475569" }}>{pillars.metallurgicalBeneficiation?.processingViability}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Bulk Sampling & Recovery Data: </strong>
                    <span style={{ color: "#475569" }}>{pillars.metallurgicalBeneficiation?.bulkSampling}</span>
                  </div>
                </div>
              </div>

              {/* Area 5: Environmental & Socio-Economic Baselines */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, borderLeft: "4px solid #0D9488" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <TreePine size={18} color="#0D9488" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F2C59" }}>
                    5. Environmental, Infrastructure & Socio-Economic Baselines
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Ecological Sensitivity & Forest Setbacks: </strong>
                    <span style={{ color: "#475569" }}>{pillars.environmentalSocioEconomic?.ecologicalSensitivity}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Regional Infrastructure & Rail Logistics: </strong>
                    <span style={{ color: "#475569" }}>{pillars.environmentalSocioEconomic?.infrastructureLogistics}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#1E293B" }}>• Health, Safety & Manganese Dust Suppression: </strong>
                    <span style={{ color: "#475569" }}>{pillars.environmentalSocioEconomic?.healthSafetyDust}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPLAINABLE AI & PARAMETER DICTIONARY */}
          {activeTab === "parameters" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2C59", marginBottom: 4 }}>
                  HOW EXPLAINABLE AI (XAI) INTERPRETS PORTAL PARAMETERS
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                  Instead of treating artificial intelligence as a black box, our portal provides clear physical explanations for how each parameter controls the geological, operational, and financial outputs.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#0F2C59", color: "#FFFFFF", textAlign: "left" }}>
                      <th style={{ padding: "9px 12px", borderRadius: "6px 0 0 0" }}>Parameter Name</th>
                      <th style={{ padding: "9px 12px" }}>Unit</th>
                      <th style={{ padding: "9px 12px" }}>Mining Range</th>
                      <th style={{ padding: "9px 12px" }}>Default</th>
                      <th style={{ padding: "9px 12px", borderRadius: "0 6px 0 0" }}>Operational Role & Explanation</th>
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
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: "#059669" }}>{p.default}</td>
                        <td style={{ padding: "9px 12px", color: "#334155" }}>{p.operationalImpact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: READING OUTPUTS */}
          {activeTab === "outputs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Guidance for government officials, mine managers, and inspectors on reading visual badges and numbers:
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
                      STATUTORY INDICATOR
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.5 }}>
                    <strong>Operational Meaning:</strong> {out.interpretation}
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
                    <strong>Threshold Rule / Action:</strong> {out.normalVsAlert}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DEPENDENCIES & DEFENSE PITCH */}
          {activeTab === "dependencies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#0F2C59" }}>
                  Cross-Module System Continuity Map
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
                    30-SECOND DEFENSE SCRIPT FOR JURY / MINING OFFICIALS
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
            flexShrink: 0,
            padding: "14px 24px",
            background: "#F8FAFC",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11.5, color: "#64748B" }}>
            Conforms to Indian Bureau of Mines (IBM) & GSI Mineral Report Standards • Smart India Hackathon
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flowing-btn flowing-btn-emerald"
              style={{
                padding: "8px 18px",
                fontSize: 12,
                opacity: isGeneratingPDF ? 0.75 : 1,
                cursor: isGeneratingPDF ? "wait" : "pointer",
              }}
              title="Generate and download official PDF document"
            >
              {downloadSuccess ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Download size={14} className={isGeneratingPDF ? "animate-spin" : ""} />
              )}
              <span>{isGeneratingPDF ? "Generating PDF..." : downloadSuccess ? "Downloaded PDF!" : "Download Official PDF"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flowing-btn flowing-btn-navy"
              style={{
                padding: "8px 14px",
                fontSize: 12,
              }}
              title="Print official dossier formatted for A4 stationery"
            >
              <Printer size={14} />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="flowing-btn"
              style={{
                padding: "8px 14px",
                background: "#E2E8F0",
                color: "#1E293B",
                border: "1px solid #CBD5E1",
                fontSize: 12,
              }}
              title="Copy formal summary to clipboard"
            >
              {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Dossier"}</span>
            </button>
            <button
              onClick={onClose}
              className="flowing-btn"
              style={{
                padding: "8px 16px",
                background: "#F1F5F9",
                color: "#475569",
                border: "1px solid #CBD5E1",
                fontSize: 12,
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
