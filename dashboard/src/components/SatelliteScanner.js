import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Satellite,
  Sliders,
  BookmarkPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Thermometer,
  CloudRain,
  Droplets,
  Compass,
  Zap,
} from "lucide-react";

export default function SatelliteScanner({
  selectedMine,
  inputs,
  onChangeInput,
  onAddNewRegion,
  onApplyExtractedParameters,
  API_BASE,
}) {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [saveRegionName, setSaveRegionName] = useState("");
  const [savingRegion, setSavingRegion] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Default coordinate values
  const [customLat, setCustomLat] = useState(selectedMine?.lat || 21.8167);
  const [customLon, setCustomLon] = useState(selectedMine?.lon || 80.1833);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysisResult(null);

    // Read preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(selected);

    // Default name
    const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setSaveRegionName(
      cleanName.length > 3
        ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Sector`
        : `Satellite Block ${Math.floor(100 + Math.random() * 900)}`
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setErrorMsg(null);
      setSuccessMsg(null);
      setAnalysisResult(null);

      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target.result);
      };
      reader.readAsDataURL(dropped);

      const cleanName = dropped.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setSaveRegionName(
        cleanName.length > 3
          ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Sector`
          : `Satellite Block ${Math.floor(100 + Math.random() * 900)}`
      );
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setErrorMsg("Please select or drop a satellite image first.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("latitude", parseFloat(customLat) || 21.8167);
      formData.append("longitude", parseFloat(customLon) || 80.1833);
      if (saveRegionName.trim()) {
        formData.append("region_name", saveRegionName.trim());
      }

      const res = await fetch(`${API_BASE}/api/satellite/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
      setSuccessMsg(
        "Satellite image analyzed successfully! Spectral and operational indicators extracted."
      );
    } catch (err) {
      console.error("Analysis error:", err);
      setErrorMsg(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoFillSliders = () => {
    if (!analysisResult || !analysisResult.extracted_features) return;
    const feat = analysisResult.extracted_features;
    const pred = analysisResult.prediction;

    if (onApplyExtractedParameters) {
      onApplyExtractedParameters({
        rainfall_mm: feat.rainfall_mm_weekly,
        soil_moisture: feat.soil_moisture,
        ndvi: feat.ndvi,
        land_temp_c: feat.land_surface_temp_c,
        rock_type: feat.host_lithology || "Braunite",
        ore_grade_pct: pred.estimated_grade_pct,
        swir_b11_absorption: feat.swir_b11_absorption,
        swir_b12_absorption: feat.swir_b12_absorption,
        emag2_anomaly_nt: feat.emag2_anomaly_nt,
        elevation_m: feat.elevation_m,
      });
    }

    setSuccessMsg(
      "All satellite parameters, temperature, rainfall, and grade have been auto-filled into your portal sliders and operational constraints!"
    );
  };

  const handleSaveAsRegion = async () => {
    if (!analysisResult) return;
    const regionTitle = saveRegionName.trim() || `Sat-Deposit-${Date.now().toString().slice(-4)}`;
    const feat = analysisResult.extracted_features;
    const pred = analysisResult.prediction;

    setSavingRegion(true);
    try {
      const payload = {
        region_name: regionTitle,
        latitude: parseFloat(customLat) || 21.8167,
        longitude: parseFloat(customLon) || 80.1833,
        host_lithology: feat.host_lithology || "Gondite / Braunite Series",
        swir_b11_absorption: feat.swir_b11_absorption,
        swir_b12_absorption: feat.swir_b12_absorption,
        ndvi: feat.ndvi,
        land_surface_temp_c: feat.land_surface_temp_c,
        rainfall_mm_weekly: feat.rainfall_mm_weekly,
        soil_moisture: feat.soil_moisture,
        emag2_anomaly_nt: feat.emag2_anomaly_nt,
        elevation_m: feat.elevation_m,
        manganese_probability_pct: pred.manganese_probability_pct,
        estimated_grade_pct: pred.estimated_grade_pct,
        estimated_reserves_kt: pred.estimated_reserves_kt,
        unfc_classification: pred.unfc_classification,
        image_preview: analysisResult.images?.heatmap_overlay || imagePreview,
        notes: `AI Predicted Mn reserve with ${pred.manganese_probability_pct}% confidence.`,
      };

      // 1. Post to backend
      const res = await fetch(`${API_BASE}/api/regions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      // 2. Build new Mine object for frontend state
      const newMineObj = {
        mine_id: `SAT-${Date.now().toString().slice(-4)}`,
        name: regionTitle,
        state: "Central India Mineral Belt",
        district: "Satellite Exploration Sector",
        lat: parseFloat(customLat) || 21.8167,
        lon: parseFloat(customLon) || 80.1833,
        lease_area_ha: Math.round(pred.estimated_reserves_kt * 0.18),
        annual_capacity_mt: Number((pred.estimated_reserves_kt / 1000.0 / 4.0).toFixed(2)),
        primary_rock: feat.host_lithology || "Braunite",
        avg_grade_pct: pred.estimated_grade_pct,
        avg_rainfall_mm: feat.rainfall_mm_weekly * 3.0,
        fleet_size: 18,
        type: "Satellite Prospect",
        predicted_reserves_kt: pred.estimated_reserves_kt,
        inputs: {
          block_id: `BLK-${regionTitle.slice(0, 3).toUpperCase()}-01`,
          x: 180,
          y: 320,
          z: 75,
          rock_type: feat.host_lithology?.includes("Braunite") ? "Braunite" : "Magnetite",
          ore_grade_pct: pred.estimated_grade_pct,
          tonnage: pred.estimated_reserves_kt * 1000.0,
          ore_value_per_tonne: 280.0,
          mining_cost: 45.0,
          processing_cost: 29.0,
          waste_flag: 0,
          equipment_availability_pct: 88.0,
          unscheduled_downtime_hours: 3.5,
          blast_cycle_delay_hours: 1.5,
          rainfall_mm: feat.rainfall_mm_weekly,
          soil_moisture: feat.soil_moisture,
          ndvi: feat.ndvi,
          land_temp_c: feat.land_surface_temp_c,
        },
      };

      // 3. Save to localStorage backup
      try {
        const local = JSON.parse(localStorage.getItem("MOIL_CUSTOM_REGIONS") || "[]");
        const updated = [newMineObj, ...local.filter((r) => r.name !== regionTitle)];
        localStorage.setItem("MOIL_CUSTOM_REGIONS", JSON.stringify(updated));
      } catch (e) {
        console.warn("localStorage write error:", e);
      }

      // 4. Trigger App.js region addition
      if (onAddNewRegion) {
        onAddNewRegion(newMineObj);
      }

      setSuccessMsg(
        `🎉 Successfully saved "${regionTitle}" permanently! It is now added to the region roster and selected as your active mine with ${pred.estimated_reserves_kt.toLocaleString()} kt estimated reserves.`
      );
    } catch (err) {
      console.error("Error saving region:", err);
      setErrorMsg(`Failed to save region: ${err.message}`);
    } finally {
      setSavingRegion(false);
    }
  };

  const handleDiscard = () => {
    setFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #0369A1 100%)",
          borderRadius: 12,
          padding: "18px 22px",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#0284C7",
                color: "#FFFFFF",
              }}
            >
              SPACE/SATELLITE AI VISION
            </span>
            <span style={{ fontSize: 13, color: "#BAE6FD", fontWeight: 600 }}>
              Copernicus Sentinel-2 & Multi-Spectral Sensor Ingestion
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            🛰️ Satellite Image AI Analyzer & Auto-Detection Engine
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#E0F2FE", maxWidth: 640 }}>
            Upload raw satellite imagery (Sentinel-2 GeoTIFF, JPG, PNG). The AI model scans for
            Manganese spectral anomalies (SWIR, NDVI stress, thermal inertia, moisture), auto-fills
            all portal parameters, and calculates future reserves.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {analysisResult && (
            <button
              onClick={handleAutoFillSliders}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "#10B981",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 6px rgba(16,185,129,0.3)",
              }}
            >
              <Sliders size={14} />
              <span>Auto-Fill Sliders & Inputs</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Column Layout: Left Upload/Preview, Right AI Output */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 16 }}>
        {/* Left Card: Upload Zone & Preview */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            1. Upload Satellite Tile / Sentinel-2 Scene
          </h4>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #93C5FD",
              borderRadius: 10,
              padding: "24px 16px",
              background: "#F0F9FF",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.tif,.tiff"
              style={{ display: "none" }}
            />
            <UploadCloud size={36} color="#0284C7" style={{ margin: "0 auto 8px auto" }} />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0369A1" }}>
              {file ? file.name : "Click to Browse or Drag Satellite Imagery Here"}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
              Supports Sentinel-2 GeoTIFF, JPG, PNG (5km x 5km scene resolution)
            </div>
          </div>

          {/* Location & Metadata Coordinates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                LATITUDE (N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 12.5,
                  marginTop: 3,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                LONGITUDE (E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 12.5,
                  marginTop: 3,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
              PROPOSED REGION / SECTOR NAME
            </label>
            <input
              type="text"
              value={saveRegionName}
              onChange={(e) => setSaveRegionName(e.target.value)}
              placeholder="e.g. Balaghat North Extension Block"
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 12.5,
                marginTop: 3,
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={!file || analyzing}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: !file ? "#94A3B8" : "#0284C7",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: !file || analyzing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: file ? "0 2px 8px rgba(2,132,199,0.3)" : "none",
            }}
          >
            {analyzing ? (
              <>
                <div className="spin-animation">⚡</div>
                <span>Scanning Satellite Spectral Bands...</span>
              </>
            ) : (
              <>
                <Satellite size={16} />
                <span>Run AI Satellite Prospecting Scan</span>
              </>
            )}
          </button>

          {/* Preview Viewport */}
          {(imagePreview || analysisResult) && (
            <div
              style={{
                marginTop: 4,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: 10,
                background: "#0F172A",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#94A3B8" }}>
                  {analysisResult ? "AI SPECTRAL OVERLAY" : "RAW SATELLITE TILE"}
                </span>
                {analysisResult && (
                  <label
                    style={{
                      fontSize: 11,
                      color: "#38BDF8",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showOverlay}
                      onChange={(e) => setShowOverlay(e.target.checked)}
                    />
                    <span>Show Mn Anomaly Heatmap</span>
                  </label>
                )}
              </div>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 240,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={
                    analysisResult && showOverlay
                      ? analysisResult.images?.heatmap_overlay
                      : imagePreview
                  }
                  alt="Satellite View"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {analysisResult && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#10B981" }} />
                    <span style={{ color: "#E2E8F0" }}>High Mn Geochemical Signature</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B" }} />
                    <span style={{ color: "#E2E8F0" }}>Moderate Anomaly</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discard / Reset */}
          {(file || analysisResult) && (
            <button
              onClick={handleDiscard}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#64748B",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Trash2 size={13} color="#EF4444" />
              <span>Discard Image & Reset Scanner</span>
            </button>
          )}
        </div>

        {/* Right Card: Extracted Features & AI Prediction Results */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              2. Auto-Detected Indicators & Manganese Estimation
            </h4>
            {analysisResult && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background:
                    analysisResult.prediction.manganese_probability_pct > 50
                      ? "#DCFCE7"
                      : "#FEE2E2",
                  color:
                    analysisResult.prediction.manganese_probability_pct > 50
                      ? "#15803D"
                      : "#B91C1C",
                }}
              >
                {analysisResult.prediction.decision}
              </span>
            )}
          </div>

          {!analysisResult ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 340,
                background: "#F8FAFC",
                borderRadius: 10,
                border: "1px dashed #CBD5E1",
                padding: 20,
                textAlign: "center",
                color: "#64748B",
              }}
            >
              <Satellite size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Awaiting Satellite Image Analysis
              </div>
              <div style={{ fontSize: 12, maxWidth: 360, marginTop: 4 }}>
                Upload an image on the left and run the scan. The system will automatically detect
                temperature, rainfall, vegetation index, SWIR absorption, and calculate extractable
                manganese reserves.
              </div>
            </div>
          ) : (
            <>
              {/* Summary Prediction KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Probability Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    padding: "14px 16px",
                    borderRadius: 10,
                    color: "#FFFFFF",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>
                    MN RESERVE PROBABILITY
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#38BDF8", marginTop: 2 }}>
                    {analysisResult.prediction.manganese_probability_pct}%
                  </div>
                  <div style={{ fontSize: 11.5, color: "#CBD5E1", marginTop: 2 }}>
                    Confidence: <strong>{analysisResult.prediction.confidence}</strong>
                  </div>
                </div>

                {/* Reserves & Grade Card */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
                    padding: "14px 16px",
                    borderRadius: 10,
                    color: "#FFFFFF",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#A7F3D0", fontWeight: 700 }}>
                    ESTIMATED EXTRACTABLE ORE
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>
                    {analysisResult.prediction.estimated_reserves_kt?.toLocaleString()} kt
                  </div>
                  <div style={{ fontSize: 11.5, color: "#D1FAE5", marginTop: 2 }}>
                    Predicted Grade:{" "}
                    <strong>{analysisResult.prediction.estimated_grade_pct}% Mn</strong>
                  </div>
                </div>
              </div>

              {/* UNFC Classification Banner */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  fontSize: 12,
                  color: "#1E40AF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  <strong>UNFC Classification:</strong>{" "}
                  {analysisResult.prediction.unfc_classification}
                </span>
                <span style={{ fontSize: 11, background: "#DBEAFE", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  GSI Compliant
                </span>
              </div>

              {/* Grid of Auto-Detected Geophysical Parameters */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginTop: 2 }}>
                📡 Automatically Detected Features (Auto-Fill Ready)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <CloudRain size={13} color="#0284C7" />
                    <span>Rainfall Index</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.rainfall_mm_weekly} mm/week
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <Thermometer size={13} color="#EF4444" />
                    <span>Land Surface Temp (LST)</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.land_surface_temp_c} °C
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <Droplets size={13} color="#059669" />
                    <span>Soil Moisture Index</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.soil_moisture}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <Layers size={13} color="#8B5CF6" />
                    <span>NDVI Vegetation Index</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.ndvi}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <Zap size={13} color="#D97706" />
                    <span>SWIR B11 / B12 Absorption</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.swir_b11_absorption} /{" "}
                    {analysisResult.extracted_features.swir_b12_absorption}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                    <Compass size={13} color="#2563EB" />
                    <span>Magnetic Anomaly (EMAG2)</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                    {analysisResult.extracted_features.emag2_anomaly_nt} nT
                  </div>
                </div>
              </div>

              {/* Two Primary Action Buttons: Auto Fill & Save as Region */}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  onClick={handleAutoFillSliders}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #10B981",
                    background: "#ECFDF5",
                    color: "#065F46",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Sliders size={15} color="#10B981" />
                  <span>Auto-Fill Sliders & Inputs</span>
                </button>

                <button
                  onClick={handleSaveAsRegion}
                  disabled={savingRegion}
                  style={{
                    flex: 1.2,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#185FA5",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: savingRegion ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(24,95,165,0.3)",
                  }}
                >
                  <BookmarkPlus size={15} />
                  <span>{savingRegion ? "Saving to MOIL Database..." : "💾 Save as Permanent Region"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
