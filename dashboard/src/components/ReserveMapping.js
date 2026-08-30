import React, { useState, useEffect } from "react";
import {
  Filter,
  Compass,
  Sparkles,
  TrendingUp,
  Satellite,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function ReserveMapping({ selectedMine, inputs, onApplyPredictedGrade }) {
  const [activeTab, setActiveTab] = useState("prospector"); // "map" or "prospector"
  const [depthSlice, setDepthSlice] = useState("all");
  const [cutoffGrade, setCutoffGrade] = useState(30.0);
  const [reservesData, setReservesData] = useState(null);

  // Satellite-First Indicator State (Freely available data)
  const [hostLithology, setHostLithology] = useState("Gondite / Braunite Series");
  const [swirAbsorption, setSwirAbsorption] = useState(0.74);
  const [emagAnomaly, setEmagAnomaly] = useState(420);
  const [ndvi, setNdvi] = useState(0.35);
  const [landTemp, setLandTemp] = useState(33.5);
  const [rainfallMm, setRainfallMm] = useState(inputs?.rainfall_mm || 35.0);
  const [soilMoisture, setSoilMoisture] = useState(inputs?.soil_moisture || 0.28);

  // Optional Ground Survey Inputs (GSI / NMET physical surveys)
  const [includeGroundSurvey, setIncludeGroundSurvey] = useState(false);
  const [ipChargeability, setIpChargeability] = useState(19.5);
  const [resistivity, setResistivity] = useState(42);

  const [prospectResults, setProspectResults] = useState(null);
  const [prospectLoading, setProspectLoading] = useState(false);

  useEffect(() => {
    fetchReserves();
  }, [selectedMine, depthSlice, cutoffGrade]);

  useEffect(() => {
    runProspector();
  }, [selectedMine, hostLithology, swirAbsorption, emagAnomaly, ndvi, landTemp, rainfallMm, soilMoisture, includeGroundSurvey, ipChargeability, resistivity]);

  const fetchReserves = () => {
    fetch("http://localhost:8000/api/reserves/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_name: selectedMine?.name || "Balaghat Formation",
        x_range: [0, 500],
        y_range: [0, 500],
        depth_m: depthSlice === "surface" ? 25.0 : depthSlice === "mid" ? 60.0 : depthSlice === "deep" ? 110.0 : 85.0,
        ore_grade_cutoff: parseFloat(cutoffGrade) || 30.0,
        rainfall_mm: inputs?.rainfall_mm || 35.0,
        soil_moisture: inputs?.soil_moisture || 0.28,
        ndvi: inputs?.ndvi || 0.42,
        land_temp_c: inputs?.land_temp_c || 32.5,
      }),
    })
      .then((r) => r.json())
      .then(setReservesData)
      .catch((err) => console.error("Error fetching reserves:", err));
  };

  const runProspector = () => {
    setProspectLoading(true);
    const payload = {
      region_name: selectedMine?.name || "Central India Sausar Exploration Zone",
      latitude: selectedMine?.lat || 21.80,
      longitude: selectedMine?.lon || 80.15,
      swir_mn_absorption_index: parseFloat(swirAbsorption),
      ndvi: parseFloat(ndvi),
      land_surface_temp_c: parseFloat(landTemp),
      rainfall_mm: parseFloat(rainfallMm),
      soil_moisture: parseFloat(soilMoisture),
      emag2_magnetic_anomaly_nt: parseFloat(emagAnomaly),
      host_lithology: hostLithology,
      ip_chargeability_mv_v: includeGroundSurvey ? parseFloat(ipChargeability) : null,
      electrical_resistivity_ohm_m: includeGroundSurvey ? parseFloat(resistivity) : null,
    };

    fetch("http://localhost:8000/api/reserves/prospect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then(setProspectResults)
      .catch((err) => console.error("Prospector error:", err))
      .finally(() => setProspectLoading(false));
  };

  const grid = reservesData?.probability_grid || [];
  const depthSlices = reservesData?.depth_slices || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Module A Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#1D9E75", color: "#fff" }}>
              MODULE A: SATELLITE MINERAL PROSPECTOR
            </span>
            <span style={{ fontSize: 13, color: "#64748B" }}>
              {selectedMine?.name} ({selectedMine?.state})
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            Satellite-First Manganese Reserve Identification & Grade Prediction
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
            Identifies mineralized reserves solely using freely available open-access satellites (Sentinel-2, Landsat, NOAA EMAG2) & GSI geological formations.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setActiveTab("prospector")}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              background: activeTab === "prospector" ? "#FFFFFF" : "transparent",
              color: activeTab === "prospector" ? "#0F172A" : "#64748B",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Sparkles size={13} color="#1D9E75" />
            <span>AI Satellite Prospector</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              background: activeTab === "map" ? "#FFFFFF" : "transparent",
              color: activeTab === "map" ? "#0F172A" : "#64748B",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            2D/3D Reserve Heatmap
          </button>
        </div>
      </div>

      {activeTab === "prospector" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Transparency & Scientific Rationale Banner */}
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Satellite size={16} color="#16A34A" />
              <strong style={{ fontSize: 13, color: "#166534" }}>
                100% Free & Open-Access Data Pipeline (No Pre-Assayed Grade Required)
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#15803D", lineHeight: 1.5 }}>
              The AI predicts whether Manganese is present by cross-referencing:
              <strong> (1) ESA Sentinel-2 SWIR</strong> Band 11/12 absorption (Mn-oxides),
              <strong> (2) NOAA EMAG2</strong> Aeromagnetic anomaly (&gt;250 nT for Braunite/Jacobsite),
              <strong> (3) Sentinel-2 NDVI</strong> geochemical vegetation stress, and
              <strong> (4) USGS Landsat LST</strong> thermal anomalies. Ground IP surveys are strictly optional.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.25fr", gap: 16 }}>
            {/* Primary Satellite Indicators Form */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                    Primary Satellite Indicators
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#DCFCE7", color: "#166534" }}>
                    FREE SATELLITE DATA
                  </span>
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>
                  Open remote sensing inputs fetched via Sentinel-2, Landsat, and EMAG2 grids.
                </p>
              </div>

              {/* Host Lithology */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                    Host Lithology (GSI Geological Map)
                  </label>
                  <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600 }}>GSI NGDR (Free)</span>
                </div>
                <select
                  value={hostLithology}
                  onChange={(e) => setHostLithology(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                >
                  <option value="Gondite / Braunite Series">Gondite / Braunite Series (Sausar Group — Primary Mn Host)</option>
                  <option value="Mansar / Chorbaoli Formation">Mansar / Chorbaoli Formation (Known MOIL Belt)</option>
                  <option value="Quartz-Mica Schist">Quartz-Mica Schist (Secondary Country Rock)</option>
                  <option value="Calc-Granulite / Marble">Calc-Granulite / Marble (Low Potential)</option>
                  <option value="Granite Gneiss">Granite Gneiss (Barren Basement Rock)</option>
                </select>
              </div>

              {/* Slider 1: SWIR Absorption */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>🛰️ Sentinel-2 SWIR Mn-Oxide Absorption</span>
                  <strong style={{ color: "#0D9488" }}>{swirAbsorption} (Band 11/12)</strong>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.02"
                  value={swirAbsorption}
                  onChange={(e) => setSwirAbsorption(e.target.value)}
                  style={{ width: "100%", accentColor: "#0D9488" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: ESA Copernicus / ISRO Bhuvan (Free)</div>
              </div>

              {/* Slider 2: EMAG2 Magnetic Anomaly */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>🧲 EMAG2 Aeromagnetic Anomaly (nT)</span>
                  <strong style={{ color: "#185FA5" }}>{emagAnomaly} nT</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="850"
                  value={emagAnomaly}
                  onChange={(e) => setEmagAnomaly(e.target.value)}
                  style={{ width: "100%", accentColor: "#185FA5" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: NOAA / BGS Global Magnetic Grid (Free)</div>
              </div>

              {/* Slider 3: NDVI Vegetation Stress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>🌿 NDVI Index (Low = Heavy Metal Stress)</span>
                  <strong style={{ color: "#16A34A" }}>{ndvi}</strong>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.02"
                  value={ndvi}
                  onChange={(e) => setNdvi(e.target.value)}
                  style={{ width: "100%", accentColor: "#16A34A" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: Sentinel-2 B8/B4 Vegetation Index (Free)</div>
              </div>

              {/* Slider 4: Land Surface Temperature */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>🌡️ Landsat Thermal LST Anomaly</span>
                  <strong style={{ color: "#D97706" }}>{landTemp} °C</strong>
                </div>
                <input
                  type="range"
                  min="22.0"
                  max="46.0"
                  step="0.5"
                  value={landTemp}
                  onChange={(e) => setLandTemp(e.target.value)}
                  style={{ width: "100%", accentColor: "#D97706" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: USGS Landsat-9 TIRS Band 10 (Free)</div>
              </div>

              {/* Slider 5: Satellite Rainfall Precipitation */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>🌧️ NASA GPM Satellite Precipitation</span>
                  <strong style={{ color: "#0284C7" }}>{rainfallMm} mm/wk</strong>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="160.0"
                  step="1.0"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(e.target.value)}
                  style={{ width: "100%", accentColor: "#0284C7" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: NASA GPM IMERG / ISRO MOSDAC (Free)</div>
              </div>

              {/* Slider 6: Soil Moisture Index */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>💧 NASA SMAP Soil Moisture Index</span>
                  <strong style={{ color: "#0D9488" }}>{soilMoisture}</strong>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.65"
                  step="0.01"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(e.target.value)}
                  style={{ width: "100%", accentColor: "#0D9488" }}
                />
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Source: NASA SMAP L3 / Sentinel-1 SAR (Free)</div>
              </div>

              {/* Optional Ground Survey Section */}
              <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                  <input
                    type="checkbox"
                    checked={includeGroundSurvey}
                    onChange={(e) => setIncludeGroundSurvey(e.target.checked)}
                  />
                  <span>Include Optional GSI Physical Ground Survey (IP/Resistivity)</span>
                </label>
                <p style={{ margin: "4px 0 0 24px", fontSize: 11, color: "#64748B" }}>
                  Only enabled when GSI/NMET ground geophysics reports exist for this specific lease block.
                </p>

                {includeGroundSurvey && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, paddingLeft: 24 }}>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>IP Chargeability: {ipChargeability} mV/V</span>
                      <input
                        type="range"
                        min="2"
                        max="35"
                        value={ipChargeability}
                        onChange={(e) => setIpChargeability(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, fontWeight: 600 }}>Resistivity: {resistivity} Ω·m</span>
                      <input
                        type="range"
                        min="10"
                        max="250"
                        value={resistivity}
                        onChange={(e) => setResistivity(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Prediction Results Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 22,
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                      AI Inference Engine
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "#EFF6FF", color: "#1E40AF", fontWeight: 600 }}>
                      {prospectResults?.scoring_mode || "Satellite-Only"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: prospectResults?.manganese_reserve_probability > 0.7 ? "#DCFCE7" : "#FEF3C7",
                      color: prospectResults?.manganese_reserve_probability > 0.7 ? "#15803D" : "#B45309",
                    }}
                  >
                    {prospectResults?.confidence_level || "Evaluating"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: 14, background: "#F0FDF4", borderRadius: 10, border: "1px solid #86EFAC" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>PREDICTED ORE GRADE</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>
                      {prospectResults?.predicted_ore_grade_pct || "42.5"}% Mn
                    </div>
                    <div style={{ fontSize: 11, color: "#15803D" }}>
                      CI: {prospectResults?.confidence_interval_pct_mn?.[0]}% - {prospectResults?.confidence_interval_pct_mn?.[1]}% Mn
                    </div>
                  </div>

                  <div style={{ padding: 14, background: "#EFF6FF", borderRadius: 10, border: "1px solid #93C5FD" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF" }}>RESERVE PROBABILITY</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#185FA5", marginTop: 2 }}>
                      {((prospectResults?.manganese_reserve_probability || 0.85) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 11, color: "#1E40AF" }}>
                      Est. Tonnage: {prospectResults?.estimated_tonnage_kt || 1400} kt
                    </div>
                  </div>
                </div>

                {/* Satellite Indicator Data Source Transparency */}
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    Open Satellite Data Source Transparency
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {prospectResults?.satellite_indicators?.map((c, i) => (
                      <div key={i} style={{ padding: "8px 10px", background: "#F8FAFC", borderRadius: 6, fontSize: 11.5, color: "#334155", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{c.factor} ({c.weight_pct}% weight)</strong>
                          <span style={{ color: "#16A34A", fontWeight: 700 }}>{c.availability}</span>
                        </div>
                        <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>{c.scientific_basis}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 10, background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E" }}>
                  📌 <strong>Recommendation:</strong> {prospectResults?.exploration_recommendation}
                </div>
              </div>

              {onApplyPredictedGrade && prospectResults && (
                <button
                  onClick={() => onApplyPredictedGrade(prospectResults.predicted_ore_grade_pct)}
                  style={{
                    marginTop: 14,
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#185FA5",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <TrendingUp size={15} />
                  <span>Apply Predicted Grade ({prospectResults.predicted_ore_grade_pct}% Mn) to Shortfall Engine</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filter Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "12px 18px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Compass size={15} color="#185FA5" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>Depth Slice:</span>
                <select
                  value={depthSlice}
                  onChange={(e) => setDepthSlice(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                >
                  <option value="all">Full Depth (0 - 120m)</option>
                  <option value="surface">Surface Bench (0 - 25m)</option>
                  <option value="mid">Mid-Bench (25 - 60m)</option>
                  <option value="deep">Deep Lode (60 - 120m)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Filter size={15} color="#0D9488" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>Economic Cutoff:</span>
                <select
                  value={cutoffGrade}
                  onChange={(e) => setCutoffGrade(parseFloat(e.target.value))}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                >
                  <option value={25.0}>25% Mn (Low Cutoff)</option>
                  <option value={30.0}>30% Mn (Standard Cutoff)</option>
                  <option value={38.0}>38% Mn (High Grade)</option>
                  <option value={42.0}>42% Mn (Ferroalloy Grade)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748B" }}>
              Total Viable Reserve: <strong style={{ color: "#1D9E75" }}>{reservesData?.economically_viable_tonnage_kt || 1420} kt</strong>
            </div>
          </div>

          {/* Main Grid Visuals: 2D/3D Heatmap + Stratigraphy */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
            {/* Heatmap */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                  2D/3D Spatial Probability Grid (50m Resolution)
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ color: "#94A3B8" }}>Barren</span>
                  <div style={{ width: 60, height: 8, borderRadius: 4, background: "linear-gradient(to right, #E2E8F0, #1D9E75, #065F46)" }} />
                  <span style={{ color: "#065F46", fontWeight: 700 }}>Ore-Bearing</span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${grid.length || 12}, 1fr)`,
                  gap: 4,
                  padding: 12,
                  background: "#0F172A",
                  borderRadius: 10,
                  aspectRatio: "1 / 1",
                  maxHeight: 380,
                }}
              >
                {grid.map((row, rIdx) =>
                  row.map((val, cIdx) => {
                    const isHigh = val > 0.75;
                    const isViable = val >= cutoffGrade / 100.0;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        title={`Cell [X:${(cIdx + 1) * 40}m, Y:${(rIdx + 1) * 40}m] - Prob: ${(val * 100).toFixed(1)}% | Est Grade: ${(20 + val * 32).toFixed(1)}% Mn`}
                        style={{
                          borderRadius: 3,
                          background: `rgba(29, 158, 117, ${0.15 + val * 0.85})`,
                          border: isHigh ? "1px solid #34D399" : isViable ? "1px solid rgba(255,255,255,0.1)" : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: val > 0.6 ? "#FFFFFF" : "#94A3B8",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {val > 0.8 ? "★" : ""}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Depth Slices */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Stratigraphic Depth Bands (UNFC Classified)
              </h3>
              {depthSlices.map((slice, idx) => (
                <div key={idx} style={{ padding: 12, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{slice.depth_band}</div>
                    <div style={{ fontSize: 11.5, color: "#64748B" }}>Proven Tonnage: <strong style={{ color: "#1D9E75" }}>{slice.proven_tonnage_kt} kt</strong></div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#E0F2FE", color: "#0369A1" }}>
                    {slice.avg_grade_pct}% Mn
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
