import React, { useState, useEffect } from "react";
import {
  Layers,
  UploadCloud,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import SectionReportButton from "./SectionReportButton";

export default function BoreholeCoreViewer({
  selectedMine,
  surfacePredictedGrade,
  onApplyBoreholeAssay,
  API_BASE = "http://127.0.0.1:8000",
}) {
  const [presets, setPresets] = useState(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState("BH-BGT-42");
  const [boreholeData, setBoreholeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customCsv, setCustomCsv] = useState("");
  const [showCsvBox, setShowCsvBox] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch presets on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/reserves/borehole/presets`)
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success" && res.presets) {
          setPresets(res.presets);
          analyzePreset(res.presets["BH-BGT-42"]);
        }
      })
      .catch((err) => {
        console.error("Error loading borehole presets:", err);
      });
  }, [API_BASE]);

  const analyzePreset = (presetData) => {
    if (!presetData) return;
    setLoading(true);
    setErrorMsg(null);
    fetch(`${API_BASE}/api/reserves/borehole/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hole_data: presetData,
        cutoff_grade_pct: 30.0,
        surface_predicted_grade_pct: surfacePredictedGrade || 38.5,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setBoreholeData(res.data);
        } else {
          setErrorMsg("Failed to analyze borehole log.");
        }
      })
      .catch((err) => {
        console.error("Borehole analysis error:", err);
        setErrorMsg("API connection error analyzing drill log.");
      })
      .finally(() => setLoading(false));
  };

  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    if (presets && presets[key]) {
      analyzePreset(presets[key]);
    }
  };

  const handleUploadCsv = () => {
    if (!customCsv.trim()) {
      setErrorMsg("Please paste or upload CSV text.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    fetch(`${API_BASE}/api/reserves/borehole/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv_text: customCsv,
        cutoff_grade_pct: 30.0,
        surface_predicted_grade_pct: surfacePredictedGrade || 38.5,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setBoreholeData(res.data);
          setShowCsvBox(false);
        } else {
          setErrorMsg(res.detail || "Error parsing CSV log.");
        }
      })
      .catch((err) => {
        setErrorMsg("Failed to upload borehole CSV.");
      })
      .finally(() => setLoading(false));
  };

  const getLithologyColor = (lith) => {
    const l = (lith || "").toLowerCase();
    if (l.includes("braunite") || l.includes("gondite") || l.includes("ore")) {
      return { bg: "#7E22CE", border: "#A855F7", text: "#FAF5FF" }; // Deep violet
    }
    if (l.includes("schist")) {
      return { bg: "#475569", border: "#64748B", text: "#F8FAFC" }; // Slate
    }
    if (l.includes("gneiss")) {
      return { bg: "#334155", border: "#475569", text: "#F1F5F9" }; // Dark charcoal
    }
    if (l.includes("laterite") || l.includes("overburden") || l.includes("soil")) {
      return { bg: "#B45309", border: "#D97706", text: "#FFFBEB" }; // Amber/Rust
    }
    if (l.includes("basalt")) {
      return { bg: "#1E293B", border: "#334155", text: "#F8FAFC" }; // Basalt dark
    }
    return { bg: "#64748B", border: "#94A3B8", text: "#FFFFFF" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Header & Preset Bar */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0", borderTop: "3px solid #7E22CE" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} color="#7E22CE" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Subsurface Borehole & Drill-Core Ingestion (GSI / UNFC G1–G4 Engine)
              </h3>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 11.5, color: "#64748B" }}>
              Ground-truth diamond core assay intervals (0m–120m) cross-validated with surface satellite remote sensing
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => handleSelectPreset("BH-BGT-42")}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                border: selectedPresetKey === "BH-BGT-42" ? "2px solid #7E22CE" : "1px solid #CBD5E1",
                background: selectedPresetKey === "BH-BGT-42" ? "#F3E8FF" : "#FFFFFF",
                color: selectedPresetKey === "BH-BGT-42" ? "#6B21A8" : "#334155",
              }}
            >
              ⭐ BH-BGT-42 (Balaghat Deep Lode - G1)
            </button>

            <button
              onClick={() => handleSelectPreset("BH-UKW-18")}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                border: selectedPresetKey === "BH-UKW-18" ? "2px solid #7E22CE" : "1px solid #CBD5E1",
                background: selectedPresetKey === "BH-UKW-18" ? "#F3E8FF" : "#FFFFFF",
                color: selectedPresetKey === "BH-UKW-18" ? "#6B21A8" : "#334155",
              }}
            >
              BH-UKW-18 (Ukwa North - G2)
            </button>

            <button
              onClick={() => handleSelectPreset("BH-BRN-05")}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                border: selectedPresetKey === "BH-BRN-05" ? "2px solid #7E22CE" : "1px solid #CBD5E1",
                background: selectedPresetKey === "BH-BRN-05" ? "#F3E8FF" : "#FFFFFF",
                color: selectedPresetKey === "BH-BRN-05" ? "#6B21A8" : "#334155",
              }}
            >
              BH-BRN-05 (Sterilized Barren Ground)
            </button>

            <button
              onClick={() => setShowCsvBox(!showCsvBox)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                border: "1px dashed #7E22CE",
                background: showCsvBox ? "#EDE9FE" : "#FAF5FF",
                color: "#7E22CE",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <UploadCloud size={13} />
              <span>{showCsvBox ? "Close CSV" : "Upload Custom CSV"}</span>
            </button>

            <SectionReportButton
              reportId="subsurface_boreholes"
              selectedMineName={selectedMine?.name}
              variant="purple"
              buttonText="View & Download Core Report"
            />
          </div>
        </div>

        {/* Upload Custom CSV Panel */}
        {showCsvBox && (
          <div style={{ background: "#FAF5FF", border: "1px solid #D8B4FE", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6B21A8", marginBottom: 6 }}>
              Paste Core Assay Interval CSV (Format: from_m, to_m, lithology, mn_pct, fe_pct, sio2_pct, rqd_pct)
            </div>
            <textarea
              rows={5}
              value={customCsv}
              onChange={(e) => setCustomCsv(e.target.value)}
              placeholder={`from_m,to_m,lithology,mn_pct,fe_pct,sio2_pct,rqd_pct\n0.0,15.0,Overburden Laterite,3.5,30.0,42.0,45.0\n15.0,45.0,Mansar Mica Schist,17.2,14.0,50.0,65.0\n45.0,85.0,Braunite Massive Lode,43.5,7.2,9.5,88.0\n85.0,110.0,Granite Gneiss Basement,4.2,4.8,69.0,92.0`}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, fontFamily: "monospace", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
              <button
                onClick={() => setShowCsvBox(false)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: 11.5, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCsv}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#7E22CE", color: "#FFFFFF", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                Parse & Cross-Validate Drill Log
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, color: "#991B1B", fontSize: 12, marginBottom: 12 }}>
            {errorMsg}
          </div>
        )}

        {/* 4 Summary Score Cards */}
        {boreholeData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {/* Card 1: Composite Ore Grade */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B" }}>DOWNHOLE COMPOSITE GRADE</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: boreholeData.composite_ore_grade_pct >= 30 ? "#7E22CE" : "#DC2626", marginTop: 2 }}>
                {boreholeData.composite_ore_grade_pct}% Mn
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                Cutoff: <strong>{boreholeData.cutoff_grade_pct}% Mn</strong>
              </div>
            </div>

            {/* Card 2: True Intercept Thickness */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B" }}>TRUE ORE INTERCEPT</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0D9488", marginTop: 2 }}>
                {boreholeData.true_ore_thickness_m} m
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                Total Depth: <strong>{boreholeData.total_depth_m} m</strong>
              </div>
            </div>

            {/* Card 3: Geotechnical RQD */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B" }}>ROCK QUALITY (RQD)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>
                {boreholeData.composite_rqd_pct}%
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                Stability: <strong>{boreholeData.composite_rqd_pct >= 85 ? "Excellent (Competent)" : "Moderate"}</strong>
              </div>
            </div>

            {/* Card 4: UNFC Stage Progression */}
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#166534" }}>UNFC EXPLORATION STAGE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#15803D", marginTop: 2 }}>
                {boreholeData.unfc_code}
              </div>
              <div style={{ fontSize: 11, color: "#166534", marginTop: 3 }}>
                {boreholeData.gsi_stage.split(" / ")[0]} ({boreholeData.drill_grid_spacing_m}m grid)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Strip Chart & Cross-Validation Visualizer */}
      {boreholeData && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* Downhole Stratigraphic Strip Chart */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                Downhole Stratigraphic & Core Assay Column ({boreholeData.hole_id})
              </h4>
              <span style={{ fontSize: 11, color: "#64748B" }}>
                Depth: 0m to {boreholeData.total_depth_m}m
              </span>
            </div>

            {/* Stratum Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px solid #E2E8F0", borderRadius: 8, padding: 10, background: "#0F172A" }}>
              {boreholeData.intervals?.map((intv, idx) => {
                const style = getLithologyColor(intv.lithology);
                const heightPx = Math.max(42, Math.round(intv.thickness_m * 1.8));

                return (
                  <div
                    key={idx}
                    style={{
                      height: heightPx,
                      background: style.bg,
                      border: intv.is_economic_ore ? "2px solid #FACC15" : `1px solid ${style.border}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: style.text,
                      position: "relative",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, background: "rgba(0,0,0,0.35)", padding: "1px 6px", borderRadius: 4 }}>
                          {intv.from_m}m - {intv.to_m}m ({intv.thickness_m}m)
                        </span>
                        <strong style={{ fontSize: 12 }}>{intv.lithology}</strong>
                        {intv.is_economic_ore && (
                          <span style={{ background: "#FACC15", color: "#78350F", fontSize: 9.5, fontWeight: 800, padding: "1px 6px", borderRadius: 10 }}>
                            ECONOMIC ORE LODE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>
                        Fe: {intv.fe_pct}% | SiO₂: {intv.sio2_pct}% | Geotech: {intv.geotech_quality}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: intv.is_economic_ore ? "#FACC15" : "#FFFFFF" }}>
                        {intv.mn_pct}% Mn
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>RQD: {intv.rqd_pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sync Button */}
            <button
              onClick={() => {
                if (onApplyBoreholeAssay) {
                  onApplyBoreholeAssay(boreholeData.composite_ore_grade_pct, boreholeData.intervals[2]?.lithology || "Gondite / Braunite Series");
                }
              }}
              style={{
                marginTop: 14,
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: "#7E22CE",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} />
              <span>Synchronize Portal Ingestion with this Borehole Assay ({boreholeData.composite_ore_grade_pct}% Mn)</span>
            </button>
          </div>

          {/* Subsurface vs Satellite Spectral Cross-Validation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {boreholeData.satellite_cross_validation && (
              <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0", borderTop: "3px solid #16A34A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                    Spectral vs Subsurface Cross-Validation
                  </h4>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#166534" }}>SURFACE SATELLITE (SWIR)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D", marginTop: 2 }}>
                      {boreholeData.satellite_cross_validation.surface_satellite_grade_pct}% Mn
                    </div>
                  </div>

                  <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6B21A8" }}>DRILL-CORE ASSAY (TRUTH)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#7E22CE", marginTop: 2 }}>
                      {boreholeData.satellite_cross_validation.subsurface_drilled_grade_pct}% Mn
                    </div>
                  </div>
                </div>

                <div style={{ padding: 10, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span>GROUND TRUTH CORRELATION</span>
                    <strong style={{ color: "#16A34A" }}>
                      {boreholeData.satellite_cross_validation.spectral_ground_truth_correlation_pct}% MATCH
                    </strong>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${boreholeData.satellite_cross_validation.spectral_ground_truth_correlation_pct}%`,
                        background: "linear-gradient(90deg, #10B981, #7E22CE)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: "#065F46", background: "#DCFCE7", padding: "8px 10px", borderRadius: 6, fontWeight: 600 }}>
                  ✓ {boreholeData.satellite_cross_validation.validation_verdict}
                </div>
              </div>
            )}

            {/* UNFC & GSI Stage Progression Guidelines Card */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                Indian Mineral Evidence Rules (UNFC / GSI):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "#475569" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: boreholeData.unfc_code === "UNFC 111" ? "#EDE9FE" : "#F8FAFC", borderRadius: 4 }}>
                  <strong>G1 Detailed Mining Grid (≤ 50m)</strong>
                  <span style={{ color: "#7E22CE", fontWeight: 700 }}>UNFC 111 (Proven)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: boreholeData.unfc_code === "UNFC 221" ? "#EDE9FE" : "#F8FAFC", borderRadius: 4 }}>
                  <strong>G2 Pre-Feasibility Grid (100m–150m)</strong>
                  <span style={{ color: "#185FA5", fontWeight: 700 }}>UNFC 221 (Probable)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: boreholeData.unfc_code === "UNFC 333" ? "#EDE9FE" : "#F8FAFC", borderRadius: 4 }}>
                  <strong>G3 Prospecting Grid (200m–350m)</strong>
                  <span style={{ color: "#D97706", fontWeight: 700 }}>UNFC 333 (Inferred)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: boreholeData.unfc_code === "UNFC 777" ? "#FEE2E2" : "#F8FAFC", borderRadius: 4 }}>
                  <strong>Non-Mineralized Country Rock</strong>
                  <span style={{ color: "#DC2626", fontWeight: 700 }}>UNFC 777 (Sterilized)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
