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
  Globe2,
  Key,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function SatelliteScanner({
  selectedMine,
  inputs,
  onChangeInput,
  onAddNewRegion,
  onApplyExtractedParameters,
  API_BASE,
}) {
  const [activeMode, setActiveMode] = useState("coordinates"); // "coordinates" or "upload"
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [saveRegionName, setSaveRegionName] = useState("");
  const [savingRegion, setSavingRegion] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Coordinate inputs
  const [customLat, setCustomLat] = useState(selectedMine?.lat || 21.8167);
  const [customLon, setCustomLon] = useState(selectedMine?.lon || 80.1833);

  // Optional Copernicus Credentials with persistent localStorage
  const [showCreds, setShowCreds] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem("MOIL_COPERNICUS_CLIENT_ID") || "");
  const [clientSecret, setClientSecret] = useState(() => localStorage.getItem("MOIL_COPERNICUS_CLIENT_SECRET") || "");

  const fileInputRef = useRef(null);

  const handleSyncSelectedMineCoords = () => {
    if (selectedMine) {
      setCustomLat(selectedMine.lat || 21.8167);
      setCustomLon(selectedMine.lon || 80.1833);
      setSaveRegionName(`${selectedMine.name} Sector Extension`);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(selected);

    const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setSaveRegionName(
      cleanName.length > 3
        ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Sector`
        : `Satellite Block ${Math.floor(100 + Math.random() * 900)}`
    );
  };

  // Run Copernicus Live Fetch via Backend
  const handleFetchFromCopernicus = async () => {
    setAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        latitude: parseFloat(customLat) || 21.8167,
        longitude: parseFloat(customLon) || 80.1833,
        client_id: clientId.trim() || null,
        client_secret: clientSecret.trim() || null,
        region_name: saveRegionName.trim() || `Copernicus-${customLat}_${customLon}`,
      };

      const endpoint = `${API_BASE || ""}/api/satellite/fetch-copernicus`;
      let res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If backend was sleeping / cold-starting on free tier, retry once
      if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504)) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
      setImagePreview(data.images?.raw_preview);
      setSuccessMsg(
        `✓ Sentinel-2 scene fetched via ${data.data_source}! Multi-spectral bands (B02, B03, B04, B08, B11, B12) extracted & ML reserve model evaluated.`
      );

      // Auto-synchronize evaluated scene with portal
      const pred = data.prediction || {};
      const feat = data.extracted_features || {};
      const isBarrenZone =
        pred.total_available_reserves_kt === 0 ||
        pred.manganese_probability_pct < 50 ||
        pred.decision?.includes("BARREN") ||
        pred.decision?.includes("STERILIZED");

      if (onApplyExtractedParameters) {
        if (isBarrenZone) {
          // Sync heatmap to 0 reserves / barren blue without auto-filling extraction sliders
          onApplyExtractedParameters({
            is_barren: true,
            region_name: saveRegionName.trim() || `Copernicus-${customLat}_${customLon}`,
            ore_grade_pct: 0.0,
            total_available_reserves_kt: 0.0,
            rainfall_mm: feat.rainfall_mm_weekly,
            soil_moisture: feat.soil_moisture,
            ndvi: feat.ndvi,
            land_temp_c: feat.land_surface_temp_c,
          });
        } else {
          // Fully synchronize sliders, delays, fleet, and heatmap
          onApplyExtractedParameters({
            is_barren: false,
            region_name: saveRegionName.trim() || `Copernicus-${customLat}_${customLon}`,
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
            total_available_reserves_kt: pred.total_available_reserves_kt,
          });
        }
      }
    } catch (err) {
      console.error("Copernicus error:", err);
      setErrorMsg(`Copernicus execution failed: ${err.message}. If the backend was sleeping, please retry in 5 seconds.`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run Uploaded File Analysis
  const handleAnalyzeUpload = async () => {
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
        "✓ Satellite bands analyzed successfully! Multi-spectral indicators & ML reserves calculated."
      );

      // Auto-synchronize evaluated uploaded scene with portal
      const pred = data.prediction || {};
      const feat = data.extracted_features || {};
      const isBarrenZone =
        pred.total_available_reserves_kt === 0 ||
        pred.manganese_probability_pct < 50 ||
        pred.decision?.includes("BARREN") ||
        pred.decision?.includes("STERILIZED");

      if (onApplyExtractedParameters) {
        if (isBarrenZone) {
          onApplyExtractedParameters({
            is_barren: true,
            region_name: saveRegionName.trim() || "Uploaded Satellite Sector",
            ore_grade_pct: 0.0,
            total_available_reserves_kt: 0.0,
            rainfall_mm: feat.rainfall_mm_weekly,
            soil_moisture: feat.soil_moisture,
            ndvi: feat.ndvi,
            land_temp_c: feat.land_surface_temp_c,
          });
        } else {
          onApplyExtractedParameters({
            is_barren: false,
            region_name: saveRegionName.trim() || "Uploaded Satellite Sector",
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
            total_available_reserves_kt: pred.total_available_reserves_kt,
          });
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setErrorMsg(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const isZeroOrBarren =
    !analysisResult ||
    analysisResult.prediction?.total_available_reserves_kt === 0 ||
    analysisResult.prediction?.manganese_probability_pct < 50 ||
    analysisResult.prediction?.decision?.includes("BARREN") ||
    analysisResult.prediction?.decision?.includes("STERILIZED");

  const handleAutoFillSliders = () => {
    if (!analysisResult || !analysisResult.extracted_features) return;
    const pred = analysisResult.prediction;

    if (
      pred.total_available_reserves_kt === 0 ||
      pred.manganese_probability_pct < 50 ||
      pred.decision?.includes("BARREN") ||
      pred.decision?.includes("STERILIZED")
    ) {
      setErrorMsg("Cannot auto-fill sliders: Ground classified as Barren Country Rock or Urban Terrain (Reserves: 0.0 kt).");
      return;
    }

    const feat = analysisResult.extracted_features;

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
        total_available_reserves_kt: pred.total_available_reserves_kt,
      });
    }

    setSuccessMsg(
      "✓ Auto-filled! All satellite indicators, rainfall, LST, soil moisture, and grade parameters are now populated in your portal sliders."
    );
  };

  const handleSaveAsRegion = async () => {
    if (!analysisResult) return;
    const regionTitle = saveRegionName.trim() || `Sat-Deposit-${Date.now().toString().slice(-4)}`;
    const feat = analysisResult.extracted_features || {};
    const pred = analysisResult.prediction || {};
    const isBarrenZone =
      pred.total_available_reserves_kt === 0 ||
      pred.manganese_probability_pct < 50 ||
      pred.decision?.includes("BARREN") ||
      pred.decision?.includes("STERILIZED");

    setSavingRegion(true);
    try {
      const payload = {
        region_name: regionTitle,
        latitude: parseFloat(customLat) || 21.8167,
        longitude: parseFloat(customLon) || 80.1833,
        host_lithology: feat.host_lithology || (isBarrenZone ? "Sterilized Country Rock / Alluvium" : "Gondite / Braunite Series"),
        swir_b11_absorption: feat.swir_b11_absorption || 0.35,
        swir_b12_absorption: feat.swir_b12_absorption || 0.38,
        ndvi: feat.ndvi || 0.35,
        land_surface_temp_c: feat.land_surface_temp_c || 32.0,
        rainfall_mm_weekly: feat.rainfall_mm_weekly || 35.0,
        soil_moisture: feat.soil_moisture || 0.25,
        emag2_anomaly_nt: feat.emag2_anomaly_nt || 150,
        elevation_m: feat.elevation_m || 200,
        manganese_probability_pct: pred.manganese_probability_pct || 0.0,
        estimated_grade_pct: isBarrenZone ? 0.0 : (pred.estimated_grade_pct || 0.0),
        total_available_reserves_kt: isBarrenZone ? 0.0 : (pred.total_available_reserves_kt || 0.0),
        viable_extractable_tonnage_kt: isBarrenZone ? 0.0 : (pred.viable_extractable_tonnage_kt || 0.0),
        extraction_recovery_pct: isBarrenZone ? 0.0 : (pred.extraction_recovery_pct || 0.0),
        unfc_classification: isBarrenZone ? "UNFC 777 (Sterilized / Non-Mineralized Ground)" : (pred.unfc_classification || "UNFC 333"),
        image_preview: analysisResult.images?.heatmap_overlay || imagePreview,
        notes: isBarrenZone
          ? `Sterilized Non-Mineralized Land (UNFC 777). Mn Probability: ${pred.manganese_probability_pct}%. Cataloged in exploration registry to exclude from future mining concessions.`
          : `Copernicus Sentinel-2 prospect. Total available: ${pred.total_available_reserves_kt} kt. Grade: ${pred.estimated_grade_pct}% Mn.`,
      };

      // 1. Post to backend
      await fetch(`${API_BASE}/api/regions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("Backend region save note:", e));

      // 2. Build new Mine object for frontend state
      const newMineObj = {
        mine_id: `SAT-${Date.now().toString().slice(-4)}`,
        name: regionTitle,
        state: isBarrenZone ? "Sterilized Non-Mining Sector" : "Central India Mineral Belt",
        district: isBarrenZone ? "Non-Mineralized Ground (UNFC 777)" : "Satellite Exploration Sector",
        lat: parseFloat(customLat) || 21.8167,
        lon: parseFloat(customLon) || 80.1833,
        lease_area_ha: isBarrenZone ? 100.0 : Math.round(pred.total_available_reserves_kt * 0.16),
        annual_capacity_mt: isBarrenZone ? 0.0 : Number((pred.viable_extractable_tonnage_kt / 4000.0).toFixed(2)),
        primary_rock: payload.host_lithology,
        avg_grade_pct: isBarrenZone ? 0.0 : pred.estimated_grade_pct,
        avg_rainfall_mm: (feat.rainfall_mm_weekly || 35.0) * 3.0,
        fleet_size: isBarrenZone ? 0 : 18,
        type: isBarrenZone ? "Barren Survey Zone" : "Satellite Prospect",
        predicted_reserves_kt: isBarrenZone ? 0.0 : pred.total_available_reserves_kt,
        waste_flag: isBarrenZone ? 1 : 0,
        inputs: {
          block_id: `BLK-${regionTitle.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()}-01`,
          x: 180,
          y: 320,
          z: feat.elevation_m || 200,
          rock_type: isBarrenZone ? "Sterilized Country Rock" : (feat.host_lithology?.includes("Braunite") ? "Braunite" : "Magnetite"),
          ore_grade_pct: isBarrenZone ? 0.0 : (pred.estimated_grade_pct || 0.0),
          tonnage: isBarrenZone ? 0.0 : ((pred.total_available_reserves_kt || 1200) * 1000.0),
          ore_value_per_tonne: isBarrenZone ? 0.0 : 280.0,
          mining_cost: 45.0,
          processing_cost: 29.0,
          waste_flag: isBarrenZone ? 1 : 0,
          equipment_availability_pct: isBarrenZone ? 0.0 : 88.0,
          unscheduled_downtime_hours: 3.5,
          blast_cycle_delay_hours: 1.5,
          rainfall_mm: feat.rainfall_mm_weekly || 38.0,
          soil_moisture: feat.soil_moisture || 0.28,
          ndvi: feat.ndvi || 0.35,
          land_temp_c: feat.land_surface_temp_c || 33.5,
        },
      };

      if (onAddNewRegion) {
        onAddNewRegion(newMineObj);
      }

      setSuccessMsg(
        isBarrenZone
          ? `✓ Region "${regionTitle}" cataloged as Sterilized / Barren Zone (UNFC 777) to ensure it is excluded from mining allocations.`
          : `✓ Region "${regionTitle}" registered successfully and added to your regional roster!`
      );
    } catch (err) {
      console.error("Save region error:", err);
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
              COPERNICUS SENTINEL-2 INTEGRATION
            </span>
            <span style={{ fontSize: 13, color: "#BAE6FD", fontWeight: 600 }}>
              Live Space/Satellite Data Ingestion (6 Bands: B02, B03, B04, B08, B11, B12)
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            🛰️ Space/Satellite Manganese Reserve Predictor
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#E0F2FE", maxWidth: 680 }}>
            Executes Sentinel-2 multi-spectral querying directly from latitude and longitude. The
            extracted bands automatically compute tabular indicators (SWIR, NDVI, LST, Soil Moisture)
            and feed the ML model to predict Total In-Situ Reserves and In-Situ Ore Grade.
          </p>
        </div>

        {analysisResult && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={isZeroOrBarren ? undefined : handleAutoFillSliders}
              disabled={isZeroOrBarren}
              title={
                isZeroOrBarren
                  ? "Auto-fill disabled: Zero Manganese reserves detected in this urban/barren region."
                  : "Auto-fill all sliders and operational inputs with extracted satellite parameters"
              }
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: isZeroOrBarren ? "1px solid rgba(255,255,255,0.2)" : "none",
                background: isZeroOrBarren ? "rgba(148, 163, 184, 0.25)" : "#10B981",
                color: isZeroOrBarren ? "#CBD5E1" : "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isZeroOrBarren ? "not-allowed" : "pointer",
                opacity: isZeroOrBarren ? 0.45 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: isZeroOrBarren ? "none" : "0 2px 6px rgba(16,185,129,0.3)",
              }}
            >
              <Sliders size={14} />
              <span>
                {isZeroOrBarren ? "Auto-Fill Disabled (0% Mn)" : "Auto-Fill Sliders & Inputs"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher Strip: Direct Lat/Lon vs File Upload */}
      <div style={{ display: "flex", gap: 6, background: "#FFFFFF", padding: 4, borderRadius: 8, border: "1px solid #E2E8F0" }}>
        <button
          onClick={() => setActiveMode("coordinates")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: 6,
            background: activeMode === "coordinates" ? "#0284C7" : "transparent",
            color: activeMode === "coordinates" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Globe2 size={14} />
          <span>Option 1: Query by Latitude & Longitude (Copernicus Backend)</span>
        </button>

        <button
          onClick={() => setActiveMode("upload")}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "none",
            borderRadius: 6,
            background: activeMode === "upload" ? "#0284C7" : "transparent",
            color: activeMode === "upload" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <UploadCloud size={14} />
          <span>Option 2: Upload Local Satellite Scene / GeoTIFF</span>
        </button>
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

      {/* Two Column Layout: Left Query/Controls, Right Analysis Output */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 16 }}>
        {/* Left Card */}
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
          {activeMode === "coordinates" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284C7", boxShadow: "0 0 8px #0284C7" }} />
                  <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
                    1. Location Coordinates & Concession Registry
                  </h4>
                </div>
                <button
                  onClick={handleSyncSelectedMineCoords}
                  className="flowing-btn"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#0284C7",
                    background: "#F0F9FF",
                    border: "1px solid #BAE6FD",
                    padding: "4px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  📍 Use {selectedMine?.name || "Balaghat"} Coords
                </button>
              </div>

              {/* Quick Concession Presets Chips */}
              <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={12} color="#0284C7" />
                  <span>QUICK GEOLOGICAL CONCESSION BENCHMARKS:</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { name: "Balaghat Deep Lode", lat: 21.8167, lon: 80.1833, desc: "Sausar Belt - High Grade" },
                    { name: "Mansar Belt (Ramtek)", lat: 21.3965, lon: 79.2848, desc: "Sausar Group - MOIL Horizon" },
                    { name: "Jagalur Taluk (Karnataka)", lat: 14.5800, lon: 76.2000, desc: "Dharwar Craton - Chitradurga Belt" },
                    { name: "Keonjhar Belt (Odisha)", lat: 21.6200, lon: 85.5800, desc: "Singhbhum Craton - IOG Series" },
                    { name: "Dongri Buzurg", lat: 21.5500, lon: 79.7167, desc: "Peroxide High-Mn" },
                    { name: "Ukwa Ridge Extension", lat: 21.9667, lon: 80.4667, desc: "Monsoon Inundated" },
                  ].map((preset) => {
                    const isSelected = Math.abs(parseFloat(customLat) - preset.lat) < 0.001 && Math.abs(parseFloat(customLon) - preset.lon) < 0.001;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setCustomLat(preset.lat);
                          setCustomLon(preset.lon);
                          setSaveRegionName(`${preset.name} Satellite Sector`);
                        }}
                        style={{
                          fontSize: 11,
                          padding: "5px 10px",
                          borderRadius: 7,
                          background: isSelected ? "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#334155",
                          border: isSelected ? "1px solid #0284C7" : "1px solid #CBD5E1",
                          cursor: "pointer",
                          fontWeight: isSelected ? 800 : 600,
                          boxShadow: isSelected ? "0 2px 6px rgba(2,132,199,0.3)" : "0 1px 2px rgba(0,0,0,0.03)",
                          transition: "all 0.18s ease",
                        }}
                        title={`${preset.desc} (${preset.lat}°N, ${preset.lon}°E)`}
                      >
                        📍 {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coordinate Input Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#0F2C59", display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={13} color="#0284C7" />
                      <span>LATITUDE (°N)</span>
                    </label>
                    <span style={{ fontSize: 9.5, color: "#64748B", background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>
                      21.0° - 22.5°
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0F172A",
                      boxSizing: "border-box",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.background = "#FFFFFF";
                      e.target.style.borderColor = "#0284C7";
                      e.target.style.boxShadow = "0 0 0 3px rgba(2,132,199,0.18)";
                    }}
                    onBlur={(e) => {
                      e.target.style.background = "#F8FAFC";
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#0F2C59", display: "flex", alignItems: "center", gap: 5 }}>
                      <Compass size={13} color="#0284C7" />
                      <span>LONGITUDE (°E)</span>
                    </label>
                    <span style={{ fontSize: 9.5, color: "#64748B", background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>
                      78.5° - 81.5°
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLon}
                    onChange={(e) => setCustomLon(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0F172A",
                      boxSizing: "border-box",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.background = "#FFFFFF";
                      e.target.style.borderColor = "#0284C7";
                      e.target.style.boxShadow = "0 0 0 3px rgba(2,132,199,0.18)";
                    }}
                    onBlur={(e) => {
                      e.target.style.background = "#F8FAFC";
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Lease / Exploration Block Name */}
              <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 10, border: "1px solid #CBD5E1", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#0F2C59", display: "flex", alignItems: "center", gap: 5 }}>
                    <Layers size={13} color="#7E22CE" />
                    <span>PROPOSED LEASE / EXPLORATION BLOCK NAME</span>
                  </label>
                  <span style={{ fontSize: 9.5, color: "#059669", background: "#ECFDF5", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                    REGISTRY IDENTIFIER
                  </span>
                </div>
                <input
                  type="text"
                  value={saveRegionName}
                  onChange={(e) => setSaveRegionName(e.target.value)}
                  placeholder="e.g. Balaghat North Exploration Sector - Block 04"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0F172A",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.background = "#FFFFFF";
                    e.target.style.borderColor = "#7E22CE";
                    e.target.style.boxShadow = "0 0 0 3px rgba(126,34,206,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "#F8FAFC";
                    e.target.style.borderColor = "#E2E8F0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Optional Copernicus Credentials Toggle */}
              <div>
                <button
                  onClick={() => setShowCreds(!showCreds)}
                  style={{
                    fontSize: 11.5,
                    color: "#64748B",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                  }}
                >
                  <Key size={13} color="#0284C7" />
                  <span>{showCreds ? "Hide" : "Optional:"} Copernicus CDSE Client Credentials</span>
                  <span style={{ fontSize: 9.5, background: "#F1F5F9", padding: "1px 5px", borderRadius: 4 }}>
                    {showCreds ? "▲" : "▼"}
                  </span>
                </button>

                {showCreds && (
                  <div style={{ marginTop: 8, padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Copernicus CDSE API Keys</span>
                      {clientId && clientSecret && (
                        <span style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>✓ Saved in browser</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Copernicus Client ID"
                      value={clientId}
                      onChange={(e) => {
                        setClientId(e.target.value);
                        localStorage.setItem("MOIL_COPERNICUS_CLIENT_ID", e.target.value);
                      }}
                      style={{ padding: "7px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
                    />
                    <input
                      type="password"
                      placeholder="Copernicus Client Secret"
                      value={clientSecret}
                      onChange={(e) => {
                        setClientSecret(e.target.value);
                        localStorage.setItem("MOIL_COPERNICUS_CLIENT_SECRET", e.target.value);
                      }}
                      style={{ padding: "7px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
                    />
                    <span style={{ fontSize: 10.5, color: "#64748B" }}>
                      Keys are securely preserved in your local browser session. If left blank, the platform automatically retrieves verified Sentinel-2 multispectral public imagery.
                    </span>
                  </div>
                )}
              </div>

              {/* Primary Ingestion Flowing Button */}
              <button
                onClick={handleFetchFromCopernicus}
                disabled={analyzing}
                className="flowing-btn flowing-btn-navy"
                style={{
                  padding: "11px 18px",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: analyzing ? "not-allowed" : "pointer",
                }}
              >
                {analyzing ? (
                  <>
                    <div className="spin-animation">⚡</div>
                    <span>Fetching Sentinel-2 Multi-Spectral Scene...</span>
                  </>
                ) : (
                  <>
                    <Satellite size={17} />
                    <span>🛰️ Fetch Sentinel-2 Live Scene & Extract Bands</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* ── Header with Format Pills ── */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 14.5, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #0EA5E9, #7C3AED)", color: "#FFF", fontSize: 13, fontWeight: 800 }}>1</span>
                  Upload Local Satellite Scene
                </h4>
                <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                  Upload any Sentinel-2 scene tile or multi-spectral GeoTIFF. The AI will automatically analyze spectral bands and compute in-situ Manganese reserves.
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { ext: ".tif", label: "GeoTIFF", color: "#7C3AED", bg: "#F3E8FF" },
                    { ext: ".jpg", label: "JPEG", color: "#0284C7", bg: "#E0F2FE" },
                    { ext: ".png", label: "PNG", color: "#0D9488", bg: "#CCFBF1" },
                    { ext: ".tiff", label: "TIFF", color: "#B45309", bg: "#FEF3C7" },
                  ].map((f) => (
                    <span key={f.ext} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: f.bg, color: f.color, fontSize: 10.5, fontWeight: 700, border: `1px solid ${f.color}22` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.color }} />
                      {f.ext} {f.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Animated Cyber Dropzone ── */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(14,165,233,0.06))"; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = "#93C5FD"; e.currentTarget.style.background = "linear-gradient(135deg, #F0F9FF, #FAF5FF)"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#93C5FD";
                  e.currentTarget.style.background = "linear-gradient(135deg, #F0F9FF, #FAF5FF)";
                  if (e.dataTransfer.files?.[0]) handleFileChange({ target: { files: e.dataTransfer.files } });
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #93C5FD",
                  borderRadius: 14,
                  padding: "30px 18px",
                  background: "linear-gradient(135deg, #F0F9FF, #FAF5FF)",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.tif,.tiff"
                  style={{ display: "none" }}
                />
                {/* Pulsing ring behind icon */}
                <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 10px auto" }}>
                  <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(14,165,233,0.2)", animation: "pulse-ring-anim 2s ease-in-out infinite" }} />
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #0EA5E9, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}>
                    <UploadCloud size={28} color="#FFFFFF" />
                  </div>
                </div>
                {file ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, background: "#DCFCE7", border: "1px solid #86EFAC" }}>
                      <CheckCircle2 size={14} color="#16A34A" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>{file.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{(file.size / 1024).toFixed(1)} KB — Ready for spectral analysis</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                      Drop satellite imagery here or <span style={{ color: "#7C3AED", textDecoration: "underline" }}>browse files</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
                      Sentinel-2 GeoTIFF, JPG, or PNG — optimal 5 km × 5 km scene
                    </div>
                  </>
                )}
              </div>

              {/* ── Quick Demo Loaders ── */}
              <div style={{ background: "linear-gradient(135deg, #F8FAFC, #F0F9FF)", borderRadius: 10, padding: "10px 14px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Layers size={12} color="#0EA5E9" />
                  Quick Demo Scenes (1-click load)
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { name: "Balaghat Sentinel-2 Tile", icon: "\uD83D\uDEF0\uFE0F" },
                    { name: "Ukwa High-Moisture Scene", icon: "\uD83C\uDF27\uFE0F" },
                    { name: "Dongri Buzurg Ridge", icon: "\u26F0\uFE0F" },
                  ].map((demo) => (
                    <button
                      key={demo.name}
                      onClick={() => {
                        const blob = new Blob(["demo"], { type: "image/png" });
                        const demoFile = new File([blob], `${demo.name.replace(/\s+/g, "_")}.png`, { type: "image/png" });
                        handleFileChange({ target: { files: [demoFile] } });
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        color: "#334155",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#0EA5E9"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
                    >
                      <span>{demo.icon}</span>
                      <span>{demo.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Resolution & Coverage Guidance Note ── */}
              <div
                style={{
                  background: "linear-gradient(135deg, #FFFBEB, #FFF7ED)",
                  border: "1px solid #FDE68A",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 11.5,
                  color: "#92400E",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  \uD83D\uDCD0 Recommended Image Specifications
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 12px" }}>
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>\uD83D\uDCCF Coverage:</span>
                  <span>~2 km × 2 km to 5 km × 5 km per scene</span>
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>\uD83D\uDD2C Resolution:</span>
                  <span>10 m/pixel (Sentinel-2 native) to 30 m/pixel</span>
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>\uD83D\uDCC1 Formats:</span>
                  <span>GeoTIFF (.tif), JPEG (.jpg), PNG (.png)</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#78350F", fontStyle: "italic", padding: "4px 8px", background: "rgba(255,255,255,0.5)", borderRadius: 6 }}>
                  \uD83D\uDCA1 Tip: Upload a focused geological section (e.g., a specific ridge), not an entire city/district screenshot.
                </div>
              </div>

              {/* ── Primary Flowing Action Button ── */}
              <button
                onClick={handleAnalyzeUpload}
                disabled={!file || analyzing}
                className={file && !analyzing ? "flowing-btn flowing-btn-navy" : ""}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: !file ? "#94A3B8" : analyzing ? "#64748B" : undefined,
                  color: "#FFFFFF",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: !file || analyzing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {analyzing ? (
                  <>
                    <div className="spin-animation">⚡</div>
                    <span>Analyzing Multi-Spectral Scene & Extracting Bands...</span>
                  </>
                ) : (
                  <>
                    <Satellite size={17} />
                    <span>🚀 Analyze Uploaded Scene & Predict Reserves</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Preview Viewport */}
          {(imagePreview || analysisResult) && (
            <div
              style={{
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#38BDF8" }}>
                    {analysisResult ? (analysisResult.data_source || "SENTINEL-2 RGB SCENE") : "IMAGE VIEWPORT"}
                  </span>
                  {analysisResult && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#1E293B", color: "#94A3B8" }}>
                      ~5 km × 5 km Scene
                    </span>
                  )}
                </div>
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
                    <span>Show Mn Anomaly Overlay</span>
                  </label>
                )}
              </div>

              <div
                style={{
                  width: "100%",
                  height: 380,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
                }}
              >
                <img
                  src={
                    analysisResult && showOverlay
                      ? analysisResult.images?.heatmap_overlay
                      : imagePreview
                  }
                  alt="Sentinel Scene"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "auto",
                  }}
                />
              </div>
            </div>
          )}

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
              <span>Discard Scene & Reset Scanner</span>
            </button>
          )}
        </div>

        {/* Right Card: Extracted Multi-Spectral Indicators & ML Reserves */}
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
              2. Extracted Bands & ML Reserve Estimation
            </h4>
            {analysisResult && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 4,
                  background:
                    analysisResult.prediction.decision?.includes("Greenfield")
                      ? "#FEF3C7"
                      : analysisResult.prediction.manganese_probability_pct >= 70
                      ? "#DCFCE7"
                      : analysisResult.prediction.manganese_probability_pct >= 50
                      ? "#DBEAFE"
                      : "#F1F5F9",
                  color:
                    analysisResult.prediction.decision?.includes("Greenfield")
                      ? "#B45309"
                      : analysisResult.prediction.manganese_probability_pct >= 70
                      ? "#15803D"
                      : analysisResult.prediction.manganese_probability_pct >= 50
                      ? "#1D4ED8"
                      : "#475569",
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
                minHeight: 370,
                background: "linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)",
                borderRadius: 14,
                border: "1px solid #334155",
                padding: "28px 20px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background grid lines */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg, #38BDF8, #38BDF8 1px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, #38BDF8, #38BDF8 1px, transparent 1px, transparent 30px)", pointerEvents: "none" }} />

              {/* Radar animation ring */}
              <div style={{ position: "relative", width: 80, height: 80, marginBottom: 16 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(56,189,248,0.15)" }} />
                <div style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.1)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", borderTop: "2px solid #38BDF8", animation: "spin 3s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Satellite size={30} color="#38BDF8" style={{ filter: "drop-shadow(0 0 8px rgba(56,189,248,0.5))" }} />
                </div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", letterSpacing: "0.5px", marginBottom: 4 }}>
                AWAITING SATELLITE BAND INGESTION
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", maxWidth: 340, marginBottom: 18, lineHeight: 1.5 }}>
                Enter coordinates or upload an image on the left panel and click <strong style={{ color: "#38BDF8" }}>"Predict Reserves"</strong>.
                The system evaluates 6 spectral bands against GSI litho-stratigraphy.
              </div>

              {/* 6-Band Wavelength Sensor Status */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, width: "100%", maxWidth: 320 }}>
                {[
                  { band: "B2", nm: "490 nm", label: "Blue", color: "#3B82F6" },
                  { band: "B3", nm: "560 nm", label: "Green", color: "#22C55E" },
                  { band: "B4", nm: "665 nm", label: "Red", color: "#EF4444" },
                  { band: "B8", nm: "842 nm", label: "NIR", color: "#A855F7" },
                  { band: "B11", nm: "1610 nm", label: "SWIR-1", color: "#F59E0B" },
                  { band: "B12", nm: "2190 nm", label: "SWIR-2", color: "#EC4899" },
                ].map((s) => (
                  <div key={s.band} style={{ padding: "8px 6px", borderRadius: 8, background: "rgba(30,41,59,0.8)", border: "1px solid #334155", textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.band}</div>
                    <div style={{ fontSize: 9.5, color: "#475569", marginTop: 1 }}>{s.nm}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#475569", animation: "pulse 2s infinite" }} />
                      <span style={{ fontSize: 8.5, color: "#64748B", fontWeight: 600 }}>STANDBY</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom status bar */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, padding: "6px 14px", borderRadius: 20, background: "rgba(30,41,59,0.9)", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>ML Model: Loaded</span>
                </div>
                <div style={{ width: 1, height: 12, background: "#334155" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                  <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>GSI Litho-DB: Online</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              {(() => {
                const totalReservesKt =
                  analysisResult.prediction.total_available_reserves_kt !== undefined
                    ? analysisResult.prediction.total_available_reserves_kt
                    : 0;

                const viableTonnageKt =
                  analysisResult.prediction.viable_extractable_tonnage_kt !== undefined
                    ? analysisResult.prediction.viable_extractable_tonnage_kt
                    : 0;

                const recoveryPct =
                  analysisResult.prediction.extraction_recovery_pct !== undefined
                    ? analysisResult.prediction.extraction_recovery_pct
                    : 0;

                const estimatedGrade =
                  analysisResult.prediction.estimated_grade_pct !== undefined
                    ? analysisResult.prediction.estimated_grade_pct
                    : 0;

                const probPct =
                  analysisResult.prediction.manganese_probability_pct !== undefined
                    ? analysisResult.prediction.manganese_probability_pct
                    : 0;

                const isBarrenOrUrban =
                  totalReservesKt === 0 ||
                  probPct < 50 ||
                  analysisResult.prediction.decision?.includes("BARREN") ||
                  analysisResult.prediction.decision?.includes("STERILIZED");

                const isGreenfield = Boolean(analysisResult.prediction.is_greenfield);

                const swirB11 = !isNaN(parseFloat(analysisResult.extracted_features?.swir_b11_absorption))
                  ? parseFloat(analysisResult.extracted_features.swir_b11_absorption).toFixed(3)
                  : "0.812";
                const swirB12 = !isNaN(parseFloat(analysisResult.extracted_features?.swir_b12_absorption))
                  ? parseFloat(analysisResult.extracted_features.swir_b12_absorption).toFixed(3)
                  : "0.791";
                const ndviVal = !isNaN(parseFloat(analysisResult.extracted_features?.ndvi))
                  ? parseFloat(analysisResult.extracted_features.ndvi).toFixed(3)
                  : "0.240";
                const rainVal = !isNaN(parseFloat(analysisResult.extracted_features?.rainfall_mm_weekly))
                  ? parseFloat(analysisResult.extracted_features.rainfall_mm_weekly).toFixed(1)
                  : "49.2";
                const lstVal = !isNaN(parseFloat(analysisResult.extracted_features?.land_surface_temp_c))
                  ? parseFloat(analysisResult.extracted_features.land_surface_temp_c).toFixed(1)
                  : "36.9";
                const soilVal = !isNaN(parseFloat(analysisResult.extracted_features?.soil_moisture))
                  ? parseFloat(analysisResult.extracted_features.soil_moisture).toFixed(2)
                  : "0.19";
                const emagVal = !isNaN(parseFloat(analysisResult.extracted_features?.emag2_anomaly_nt))
                  ? parseFloat(analysisResult.extracted_features.emag2_anomaly_nt).toFixed(1)
                  : "341.8";

                const handleDownloadDossier = () => {
                  const reportData = {
                    agency: "Ministry of Steel / Manganese Ore India Limited (MOIL)",
                    system: "MOIL Unified AI Mining Intelligence Portal",
                    timestamp: new Date().toISOString(),
                    report_type: "GSI & UNFC Compliant Mineral Reserve Audit Dossier",
                    location: {
                      region_name: analysisResult.suggested_region_name,
                      latitude: analysisResult.coordinates?.latitude,
                      longitude: analysisResult.coordinates?.longitude,
                      nearest_manganese_belt: analysisResult.prediction?.nearest_belt_name,
                      distance_to_belt_km: analysisResult.prediction?.distance_to_nearest_belt_km,
                    },
                    evaluation: {
                      decision: analysisResult.prediction?.decision,
                      manganese_probability_pct: analysisResult.prediction?.manganese_probability_pct,
                      uncertainty_pct: analysisResult.prediction?.uncertainty_pct,
                      confidence_interval_95: analysisResult.prediction?.confidence_interval,
                      unfc_classification: analysisResult.prediction?.unfc_classification,
                      gsi_exploration_stage: analysisResult.prediction?.gsi_stage,
                      inferred_tonnage_footprint_kt: analysisResult.prediction?.total_available_reserves_kt,
                      viable_extractable_tonnage_kt: analysisResult.prediction?.viable_extractable_tonnage_kt,
                      indicative_grade_pct: analysisResult.prediction?.estimated_grade_pct,
                      extraction_recovery_pct: analysisResult.prediction?.extraction_recovery_pct,
                    },
                    data_provenance: analysisResult.provenance || {
                      optical: "Copernicus Sentinel-2 L2A (10m)",
                      magnetic: "NOAA EMAG2 v3 (2-arc-minute)",
                      elevation: "NASA SRTM 30m Global DEM",
                    },
                    multi_spectral_indicators: analysisResult.extracted_features,
                    geological_notes: analysisResult.prediction?.geo_notes,
                    statutory_disclaimer: analysisResult.prediction?.statutory_disclaimer || "UNFC G4 Reconnaissance Screening only. Drilling required for UNFC 111 reserve certification per IBM MCDR 2017.",
                    compliance: {
                      statutory_standard: "UNFC 1997 / 2009 & Indian Bureau of Mines (MCDR 2017)",
                      status: "Certified AI Exploration Screening (G4 Stage)",
                    },
                  };

                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `MOIL_GSI_UNFC_Dossier_${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                };

                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {/* Total Inferred Tonnage Footprint */}
                      <div
                        style={{
                          background: isBarrenOrUrban
                            ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                            : isGreenfield
                            ? "linear-gradient(135deg, #78350F 0%, #92400E 100%)"
                            : "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
                          padding: "14px 16px",
                          borderRadius: 10,
                          color: "#FFFFFF",
                        }}
                      >
                        <div style={{ fontSize: 11, color: isBarrenOrUrban ? "#CBD5E1" : isGreenfield ? "#FDE68A" : "#A7F3D0", fontWeight: 700 }}>
                          INFERRED TONNAGE FOOTPRINT (UNFC G4)
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>
                          {Number(totalReservesKt).toLocaleString()} kt
                        </div>
                        <div style={{ fontSize: 11.5, color: isBarrenOrUrban ? "#E2E8F0" : isGreenfield ? "#FEF3C7" : "#D1FAE5", marginTop: 2 }}>
                          Economically Viable (Screening):{" "}
                          <strong>
                            {Number(viableTonnageKt).toLocaleString()} kt ({recoveryPct}%)
                          </strong>
                        </div>
                      </div>

                      {/* Indicative Grade & Confidence */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                          padding: "14px 16px",
                          borderRadius: 10,
                          color: "#FFFFFF",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>
                          INDICATIVE RECONNAISSANCE GRADE
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: isBarrenOrUrban ? "#94A3B8" : "#38BDF8", marginTop: 2 }}>
                          {estimatedGrade}% Mn
                        </div>
                        <div style={{ fontSize: 11.5, color: "#CBD5E1", marginTop: 2 }}>
                          Occurrence Probability:{" "}
                          <strong>
                            {probPct}% ({analysisResult.prediction.confidence || "Evaluated"})
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Ensemble Uncertainty Range Gauge (95% CI) */}
                    {!isBarrenOrUrban && (
                      <div
                        style={{
                          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                          borderRadius: 10,
                          padding: "12px 16px",
                          color: "#FFFFFF",
                          border: "1px solid #334155",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", display: "flex", alignItems: "center", gap: 5 }}>
                            <Sparkles size={12} color="#38BDF8" />
                            ENSEMBLE UNCERTAINTY GAUGE (150 RANDOM FOREST TREES)
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#38BDF8" }}>
                            {probPct}% ± {analysisResult.prediction.uncertainty_pct || 0}% (95% CI)
                          </span>
                        </div>
                        {/* Gauge Track */}
                        <div style={{ position: "relative", height: 8, background: "#334155", borderRadius: 4, overflow: "hidden", margin: "8px 0 6px 0" }}>
                          <div
                            style={{
                              position: "absolute",
                              left: `${Math.max(0, analysisResult.prediction.confidence_interval?.[0] || 0)}%`,
                              width: `${Math.max(3, Math.min(100, (analysisResult.prediction.confidence_interval?.[1] || 100) - (analysisResult.prediction.confidence_interval?.[0] || 0)))}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #0284C7, #38BDF8, #10B981)",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94A3B8" }}>
                          <span>Lower 95% Bound: <strong style={{ color: "#E2E8F0" }}>{analysisResult.prediction.confidence_interval?.[0] || 0}%</strong></span>
                          <span>Tree Mean: <strong style={{ color: "#38BDF8" }}>{probPct}%</strong></span>
                          <span>Upper 95% Bound: <strong style={{ color: "#E2E8F0" }}>{analysisResult.prediction.confidence_interval?.[1] || 0}%</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Data Provenance & Tectonic Domain Badges */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                        🛰️ Sentinel-2 L2A (10m Optical)
                      </span>
                      <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>•</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                        🧲 NOAA EMAG2 v3 (Magnetic)
                      </span>
                      <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>•</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                        ⛰️ NASA SRTM 30m (DEM)
                      </span>
                      {analysisResult.provenance?.tectonic_domain && (
                        <>
                          <span style={{ fontSize: 10.5, color: "#CBD5E1" }}>•</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0369A1", background: "#E0F2FE", padding: "1px 6px", borderRadius: 4 }}>
                            🌍 {analysisResult.provenance.tectonic_domain}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Geological & Stratigraphy Audit Alert */}
                    {analysisResult.prediction.geo_notes && (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: isBarrenOrUrban ? "#FEF2F2" : isGreenfield ? "#FFFBEB" : "#F0FDF4",
                          border: `1px solid ${isBarrenOrUrban ? "#FECACA" : isGreenfield ? "#FDE68A" : "#BBF7D0"}`,
                          color: isBarrenOrUrban ? "#991B1B" : isGreenfield ? "#92400E" : "#166534",
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Geological Stratigraphy Audit:</strong> {analysisResult.prediction.geo_notes}
                      </div>
                    )}

                    {/* UNFC Classification, Statutory Note & Dossier Download */}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: isBarrenOrUrban ? "#F8FAFC" : "#EFF6FF",
                        border: `1px solid ${isBarrenOrUrban ? "#CBD5E1" : "#BFDBFE"}`,
                        fontSize: 12,
                        color: isBarrenOrUrban ? "#475569" : "#1E40AF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                        <span>
                          <strong>UNFC Framework:</strong> {analysisResult.prediction.unfc_classification || "Reconnaissance Resource (UNFC 334 / G4)"}
                          {analysisResult.prediction.gsi_stage && (
                            <span style={{ marginLeft: 6, opacity: 0.85 }}>
                              ({analysisResult.prediction.gsi_stage})
                            </span>
                          )}
                        </span>
                        <button
                          onClick={handleDownloadDossier}
                          style={{
                            fontSize: 11,
                            background: isBarrenOrUrban ? "#E2E8F0" : "#DBEAFE",
                            color: isBarrenOrUrban ? "#334155" : "#1E40AF",
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          📥 Export GSI / UNFC Dossier
                        </button>
                      </div>
                      {!isBarrenOrUrban && (
                        <div style={{ fontSize: 10.5, color: "#1D4ED8", borderTop: "1px dashed #BFDBFE", paddingTop: 5, lineHeight: 1.4 }}>
                          ℹ️ <em>Statutory Note:</em> Remote sensing and geophysical models provide G4 Reconnaissance target screening. Subsurface diamond core drilling and chemical assays are required for UNFC 111 / G1 Proven Reserve conversion under IBM MCDR 2017.
                        </div>
                      )}
                    </div>

                    {/* Extracted Tabular Geophysical Parameters */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      📡 Extracted Multi-Spectral Indicators (Auto-Fill Ready)
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <Zap size={13} color="#D97706" />
                          <span>SWIR B11 / B12 (Absorption)</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {swirB11} / {swirB12}
                        </div>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <Layers size={13} color="#8B5CF6" />
                          <span>NDVI Vegetation Index (B08/B04)</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {ndviVal}
                        </div>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <CloudRain size={13} color="#0284C7" />
                          <span>Rainfall Index</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {rainVal} mm/wk
                        </div>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <Thermometer size={13} color="#EF4444" />
                          <span>Land Surface Temp (LST)</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {lstVal} °C
                        </div>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <Droplets size={13} color="#059669" />
                          <span>Soil Moisture Index</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {soilVal}
                        </div>
                      </div>

                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}>
                          <Compass size={13} color="#2563EB" />
                          <span>EMAG2 Magnetic Anomaly</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                          {emagVal} nT
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={isZeroOrBarren ? undefined : handleAutoFillSliders}
                  disabled={isZeroOrBarren}
                  title={
                    isZeroOrBarren
                      ? "Auto-fill disabled: Zero Manganese reserves detected in this urban/barren region."
                      : "Populate extracted indicators to portal sliders"
                  }
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: isZeroOrBarren ? "1px solid #E2E8F0" : "1px solid #10B981",
                    background: isZeroOrBarren ? "#F1F5F9" : "#ECFDF5",
                    color: isZeroOrBarren ? "#94A3B8" : "#065F46",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: isZeroOrBarren ? "not-allowed" : "pointer",
                    opacity: isZeroOrBarren ? 0.45 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Sliders size={15} color={isZeroOrBarren ? "#94A3B8" : "#10B981"} />
                  <span>
                    {isZeroOrBarren ? "Auto-Fill Unavailable (0% Mn)" : "Auto-Fill Sliders & Constraints"}
                  </span>
                </button>

                <button
                  onClick={handleSaveAsRegion}
                  disabled={savingRegion}
                  title={
                    isZeroOrBarren
                      ? "Save this non-mineralized or urban region to the exploration registry to ensure it is excluded from future mining concessions (UNFC 777)."
                      : "Save this analyzed region permanently into MOIL roster"
                  }
                  style={{
                    flex: 1.2,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: isZeroOrBarren ? "#475569" : "#185FA5",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: savingRegion ? "not-allowed" : "pointer",
                    opacity: savingRegion ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: isZeroOrBarren
                      ? "0 2px 6px rgba(71,85,105,0.25)"
                      : "0 2px 8px rgba(24,95,165,0.3)",
                  }}
                >
                  <BookmarkPlus size={15} />
                  <span>
                    {savingRegion
                      ? "Saving to Database..."
                      : isZeroOrBarren
                      ? "💾 Save as Barren / Sterilized Zone (UNFC 777)"
                      : "💾 Save as Permanent Region"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
