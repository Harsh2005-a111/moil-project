import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Truck,
  Compass,
  TrendingUp,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Satellite,
  ArrowRight,
} from "lucide-react";
import { PRESET_SCENARIOS, SAMPLE_CSV_CONTENT } from "../data/moilData";
import SatelliteScanner from "./SatelliteScanner";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";


export default function ReserveIngestionHub({
  mines,
  selectedMine,
  inputs,
  onChangeInput,
  onSubmitEvaluation,
  onLoadPreset,
  onAddNewRegion,
  loading,
}) {
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner", "prospector", "operations", "heatmap", "upload"
  const [depthSlice, setDepthSlice] = useState("all");
  const [cutoffGrade, setCutoffGrade] = useState(30.0);
  const [reservesData, setReservesData] = useState(null);

  // Satellite-First Indicator State
  const [hostLithology, setHostLithology] = useState(inputs?.rock_type || "Gondite / Braunite Series");
  const [swirAbsorption, setSwirAbsorption] = useState(0.74);
  const [emagAnomaly, setEmagAnomaly] = useState(420);
  const [ndvi, setNdvi] = useState(inputs?.ndvi || 0.35);
  const [landTemp, setLandTemp] = useState(inputs?.land_temp_c || 33.5);
  const [rainfallMm, setRainfallMm] = useState(inputs?.rainfall_mm || 38.0);
  const [soilMoisture, setSoilMoisture] = useState(inputs?.soil_moisture || 0.28);

  const handleApplyExtractedParameters = (params) => {
    if (params.rainfall_mm !== undefined) {
      setRainfallMm(params.rainfall_mm);
      onChangeInput("rainfall_mm", params.rainfall_mm);
    }
    if (params.soil_moisture !== undefined) {
      setSoilMoisture(params.soil_moisture);
      onChangeInput("soil_moisture", params.soil_moisture);
    }
    if (params.ndvi !== undefined) {
      setNdvi(params.ndvi);
      onChangeInput("ndvi", params.ndvi);
    }
    if (params.land_temp_c !== undefined) {
      setLandTemp(params.land_temp_c);
      onChangeInput("land_temp_c", params.land_temp_c);
    }
    if (params.rock_type !== undefined) {
      const lith = params.rock_type.includes("Braunite") ? "Gondite / Braunite Series" : params.rock_type;
      setHostLithology(lith);
      onChangeInput("rock_type", params.rock_type.split(" / ")[0]);
    }
    if (params.ore_grade_pct !== undefined) {
      setSyncTargetGrade(params.ore_grade_pct);
      onChangeInput("ore_grade_pct", params.ore_grade_pct);
    }
    if (params.swir_b11_absorption !== undefined) {
      setSwirAbsorption(params.swir_b11_absorption);
    }
    if (params.emag2_anomaly_nt !== undefined) {
      setEmagAnomaly(params.emag2_anomaly_nt);
    }
    if (params.elevation_m !== undefined) {
      onChangeInput("z", params.elevation_m);
    }
    setActiveTab("prospector");
  };

  // Optional Ground Survey
  const [includeGroundSurvey, setIncludeGroundSurvey] = useState(false);
  const [ipChargeability, setIpChargeability] = useState(19.5);
  const [resistivity, setResistivity] = useState(42);

  const [prospectResults, setProspectResults] = useState(null);
  const [prospectLoading, setProspectLoading] = useState(false);

  // Target Grade Goal-Seek Sync State
  const [syncTargetGrade, setSyncTargetGrade] = useState(inputs?.ore_grade_pct || 40.0);

  // Upload Feedback
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', msg: string }

  // Sync inputs with selectedMine changes
  useEffect(() => {
    if (inputs) {
      if (inputs.rainfall_mm !== undefined) setRainfallMm(inputs.rainfall_mm);
      if (inputs.soil_moisture !== undefined) setSoilMoisture(inputs.soil_moisture);
      if (inputs.ndvi !== undefined) setNdvi(inputs.ndvi);
      if (inputs.land_temp_c !== undefined) setLandTemp(inputs.land_temp_c);
      if (inputs.rock_type) setHostLithology(inputs.rock_type.includes("Braunite") ? "Gondite / Braunite Series" : inputs.rock_type);
    }
  }, [selectedMine]);

  // Fetch reserves & run prospector
  useEffect(() => {
    fetchReserves();
  }, [selectedMine, depthSlice, cutoffGrade]);

  useEffect(() => {
    runProspector();
  }, [selectedMine, hostLithology, swirAbsorption, emagAnomaly, ndvi, landTemp, rainfallMm, soilMoisture, includeGroundSurvey, ipChargeability, resistivity]);

  const fetchReserves = () => {
    fetch(`${API_BASE}/api/reserves/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_name: selectedMine?.name || "Balaghat Formation",
        x_range: [0, 500],
        y_range: [0, 500],
        depth_m: depthSlice === "surface" ? 25.0 : depthSlice === "mid" ? 60.0 : depthSlice === "deep" ? 110.0 : 85.0,
        ore_grade_cutoff: parseFloat(cutoffGrade) || 30.0,
        rainfall_mm: parseFloat(rainfallMm),
        soil_moisture: parseFloat(soilMoisture),
        ndvi: parseFloat(ndvi),
        land_temp_c: parseFloat(landTemp),
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

    fetch(`${API_BASE}/api/reserves/prospect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        setProspectResults(data);
        if (data?.predicted_ore_grade_pct) {
          onChangeInput("ore_grade_pct", data.predicted_ore_grade_pct);
          setSyncTargetGrade(data.predicted_ore_grade_pct);
        }
      })
      .catch((err) => console.error("Prospector error:", err))
      .finally(() => setProspectLoading(false));
  };

  // Inverse Goal-Seek: Setting a Target Mn% automatically calculates and synchronizes required indicators
  const handleGoalSeekGrade = (targetGrade) => {
    const gradeVal = parseFloat(targetGrade);
    setSyncTargetGrade(gradeVal);
    onChangeInput("ore_grade_pct", gradeVal);

    const normalized = Math.max(0.05, Math.min(0.95, (gradeVal - 18.0) / 30.0));
    const newSwir = parseFloat((0.25 + normalized * 0.70).toFixed(2));
    const newEmag = Math.round(100 + normalized * 650);
    const newNdvi = parseFloat((0.58 - normalized * 0.32).toFixed(2));
    const newTemp = parseFloat((29.0 + normalized * 9.0).toFixed(1));

    let newLith = "Gondite / Braunite Series";
    if (gradeVal < 26.0) newLith = "Calc-Granulite / Marble";
    else if (gradeVal < 34.0) newLith = "Quartz-Mica Schist";
    else if (gradeVal < 42.0) newLith = "Mansar / Chorbaoli Formation";

    setSwirAbsorption(newSwir);
    setEmagAnomaly(newEmag);
    setNdvi(newNdvi);
    setLandTemp(newTemp);
    setHostLithology(newLith);
    onChangeInput("rock_type", newLith.split(" / ")[0]);
  };

  // Intelligent CSV Upload & Validation
  const handleFileUpload = (e) => {
    setUploadStatus(null);
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const allLines = text.split("\n").map((l) => l.trim());
        // Filter out comments (starting with #) and empty lines
        const dataLines = allLines.filter((l) => l.length > 0 && !l.startsWith("#"));

        if (dataLines.length < 2) {
          setUploadStatus({
            type: "error",
            msg: "Upload Failed: CSV file is empty or missing data rows under comments.",
          });
          return;
        }

        const headers = dataLines[0].split(",").map((h) => h.trim().toLowerCase());
        
        // Strict column check
        const requiredCols = [
          "region_name", "block_id", "rock_type", "tonnage", 
          "ore_value_per_tonne", "mining_cost", "processing_cost",
          "equipment_availability_pct", "unscheduled_downtime_hours", "blast_cycle_delay_hours"
        ];
        
        const missingCols = requiredCols.filter((col) => !headers.includes(col));
        if (missingCols.length > 0) {
          setUploadStatus({
            type: "error",
            msg: `Upload Failed: Missing required columns: [${missingCols.join(", ")}]. Do not rename or remove header attributes.`,
          });
          return;
        }

        const vals = dataLines[1].split(",").map((v) => v.trim());
        const row = {};
        headers.forEach((h, i) => {
          row[h] = vals[i];
        });

        // Numeric validity check
        const numericFields = ["tonnage", "mining_cost", "processing_cost", "equipment_availability_pct", "unscheduled_downtime_hours", "blast_cycle_delay_hours"];
        for (const f of numericFields) {
          if (row[f] === undefined || row[f] === "" || isNaN(parseFloat(row[f]))) {
            setUploadStatus({
              type: "error",
              msg: `Upload Failed: Column '${f}' contains missing or invalid non-numeric value ('${row[f]}'). All numeric fields are required.`,
            });
            return;
          }
        }

        // Check if region is new
        const uploadedRegionName = row.region_name || "Uploaded Lease";
        const existingMine = mines?.find((m) => m.name.toLowerCase() === uploadedRegionName.toLowerCase());

        const parsedInputs = {
          block_id: row.block_id || "BLK-UPLOAD",
          x: parseFloat(row.x) || 180.0,
          y: parseFloat(row.y) || 320.0,
          z: parseFloat(row.z) || 80.0,
          rock_type: row.rock_type || "Braunite",
          ore_grade_pct: parseFloat(row.ore_grade_pct) || 41.5,
          tonnage: parseFloat(row.tonnage),
          ore_value_per_tonne: parseFloat(row.ore_value_per_tonne) || 275.0,
          mining_cost: parseFloat(row.mining_cost),
          processing_cost: parseFloat(row.processing_cost),
          waste_flag: parseInt(row.waste_flag) || 0,
          equipment_availability_pct: parseFloat(row.equipment_availability_pct),
          unscheduled_downtime_hours: parseFloat(row.unscheduled_downtime_hours),
          blast_cycle_delay_hours: parseFloat(row.blast_cycle_delay_hours),
          rainfall_mm: parseFloat(row.rainfall_mm) || 38.0,
          soil_moisture: parseFloat(row.soil_moisture) || 0.28,
          ndvi: parseFloat(row.ndvi) || 0.35,
          land_temp_c: parseFloat(row.land_temp_c) || 33.5,
        };

        if (!existingMine && onAddNewRegion) {
          // Register new mine in dropdown and history
          const newMineObj = {
            mine_id: `Cust-${Date.now().toString().slice(-4)}`,
            name: uploadedRegionName,
            state: "Central India Formation",
            district: "Exploration Sector",
            lat: 21.80 + Math.random() * 0.2,
            lon: 79.80 + Math.random() * 0.4,
            lease_area_ha: 220.0,
            annual_capacity_mt: 0.30,
            primary_rock: parsedInputs.rock_type,
            avg_grade_pct: parsedInputs.ore_grade_pct,
            avg_rainfall_mm: parsedInputs.rainfall_mm,
            fleet_size: 20,
            type: "Open Cast / Sub-surface",
            inputs: parsedInputs,
          };
          onAddNewRegion(newMineObj);
        } else {
          // Prefill existing region inputs
          Object.keys(parsedInputs).forEach((k) => {
            onChangeInput(k, parsedInputs[k]);
          });
        }

        // Synchronize prospector state
        if (row.rainfall_mm) setRainfallMm(parseFloat(row.rainfall_mm));
        if (row.soil_moisture) setSoilMoisture(parseFloat(row.soil_moisture));
        if (row.ndvi) setNdvi(parseFloat(row.ndvi));
        if (row.land_temp_c) setLandTemp(parseFloat(row.land_temp_c));
        if (row.ore_grade_pct) handleGoalSeekGrade(parseFloat(row.ore_grade_pct));

        // Trigger evaluation
        onSubmitEvaluation();

        setUploadStatus({
          type: "success",
          msg: `Ingestion Successful: Block '${parsedInputs.block_id}' for region '${uploadedRegionName}' ingested. Region added to dropdown history & all parameters prefilled.`,
        });
        setActiveTab("operations");
      } catch (err) {
        setUploadStatus({
          type: "error",
          msg: `Upload Error: Unable to parse file format. Details: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "moil_unified_input_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const grid = reservesData?.probability_grid || [];
  const depthSlices = reservesData?.depth_slices || [];

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 7,
    border: "1px solid #CBD5E1",
    fontSize: 12.5,
    background: "#FFFFFF",
    color: "#0F172A",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top Unified Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#1D9E75", color: "#fff" }}>
              MODULE A + INGESTION HUB
            </span>
            <span style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
              {selectedMine?.name} ({selectedMine?.state})
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
            Reserve Mapping & Multi-Source Ingestion Hub
          </h2>
        </div>

        {/* Preset Loaders */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRESET_SCENARIOS.map((ps) => (
            <button
              key={ps.id}
              onClick={() => {
                onLoadPreset(ps.data);
                if (ps.data.ore_grade_pct) handleGoalSeekGrade(ps.data.ore_grade_pct);
              }}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#334155",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Sparkles size={11} color="#185FA5" />
              <span>{ps.title.split(" (")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Feedback Banners */}
      {uploadStatus && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: uploadStatus.type === "success" ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${uploadStatus.type === "success" ? "#86EFAC" : "#FECACA"}`,
            color: uploadStatus.type === "success" ? "#166534" : "#991B1B",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          {uploadStatus.type === "success" ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color="#DC2626" />}
          <span>{uploadStatus.msg}</span>
        </div>
      )}

      {/* Bidirectional % Mn Synchronization Master Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
          borderRadius: 12,
          padding: "16px 20px",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <RefreshCw size={14} color="#38BDF8" className={prospectLoading ? "spin-animation" : ""} />
            <strong style={{ fontSize: 13, color: "#38BDF8" }}>
              Bidirectional % Mn Synchronization
            </strong>
          </div>
          <div style={{ fontSize: 12, color: "#CBD5E1" }}>
            Drag to target a desired extraction grade (e.g. <strong>40% Mn</strong>). All satellite & geological indicators will automatically synchronize to show conditions required to achieve this grade without waste dilution.
          </div>
        </div>

        {/* Master Slider & Sync Output */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 320 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span>Target Extraction Grade</span>
              <strong style={{ color: "#34D399", fontSize: 14 }}>{syncTargetGrade}% Mn</strong>
            </div>
            <input
              type="range"
              min="20.0"
              max="48.0"
              step="0.5"
              value={syncTargetGrade}
              onChange={(e) => handleGoalSeekGrade(e.target.value)}
              style={{ width: "100%", accentColor: "#34D399" }}
            />
          </div>

          <div
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>AI Predicted</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#38BDF8" }}>
              {prospectResults?.predicted_ore_grade_pct || syncTargetGrade}% Mn
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div style={{ display: "flex", gap: 4, background: "#FFFFFF", padding: 4, borderRadius: 10, border: "1px solid #E2E8F0", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("scanner")}
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: 7,
            background: activeTab === "scanner" ? "#0284C7" : "transparent",
            color: activeTab === "scanner" ? "#FFFFFF" : "#0369A1",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: activeTab === "scanner" ? "0 2px 6px rgba(2,132,199,0.25)" : "none",
          }}
        >
          <Sparkles size={14} />
          <span>🛰️ Satellite Image AI Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab("prospector")}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            border: "none",
            borderRadius: 7,
            background: activeTab === "prospector" ? "#185FA5" : "transparent",
            color: activeTab === "prospector" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Satellite size={14} />
          <span>1. Satellite & Geological Indicators (Sliders)</span>
        </button>

        <button
          onClick={() => setActiveTab("operations")}
          style={{
            flex: 1,
            minWidth: 160,
            padding: "8px 12px",
            border: "none",
            borderRadius: 7,
            background: activeTab === "operations" ? "#185FA5" : "transparent",
            color: activeTab === "operations" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Database size={14} />
          <span>2. Operational Constraints</span>
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            border: "none",
            borderRadius: 7,
            background: activeTab === "heatmap" ? "#185FA5" : "transparent",
            color: activeTab === "heatmap" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Compass size={14} />
          <span>3. 2D/3D Reserve Heatmap & Slices</span>
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          style={{
            padding: "8px 14px",
            border: "none",
            borderRadius: 7,
            background: activeTab === "upload" ? "#185FA5" : "transparent",
            color: activeTab === "upload" ? "#FFFFFF" : "#64748B",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <FileSpreadsheet size={14} />
          <span>Batch CSV</span>
        </button>
      </div>

      {/* Tab 0: Satellite Image AI Scanner */}
      {activeTab === "scanner" && (
        <SatelliteScanner
          selectedMine={selectedMine}
          inputs={inputs}
          onChangeInput={onChangeInput}
          onAddNewRegion={onAddNewRegion}
          onApplyExtractedParameters={handleApplyExtractedParameters}
          API_BASE={API_BASE}
        />
      )}

      {/* Tab 1: Satellite Indicators (Sliders) */}
      {activeTab === "prospector" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
          {/* Sliders Box */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              🛰️ Primary Satellite & Geophysical Inputs
            </h3>

            {/* Host Lithology */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                Host Lithology (GSI Geological Map)
              </label>
              <select
                value={hostLithology}
                onChange={(e) => {
                  setHostLithology(e.target.value);
                  onChangeInput("rock_type", e.target.value.split(" / ")[0]);
                }}
                style={inputStyle}
              >
                <option value="Gondite / Braunite Series">Gondite / Braunite Series (Sausar Group — High Mn)</option>
                <option value="Mansar / Chorbaoli Formation">Mansar / Chorbaoli Formation (Known MOIL Belt)</option>
                <option value="Quartz-Mica Schist">Quartz-Mica Schist (Medium Grade)</option>
                <option value="Calc-Granulite / Marble">Calc-Granulite / Marble (Low Grade)</option>
                <option value="Granite Gneiss">Granite Gneiss (Barren)</option>
              </select>
            </div>

            {/* SWIR */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>🛰️ Sentinel-2 SWIR Absorption</span>
                <strong style={{ color: "#0D9488" }}>{swirAbsorption} (B11/B12)</strong>
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
            </div>

            {/* Magnetic Anomaly */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>🧲 NOAA EMAG2 Magnetics (nT)</span>
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
            </div>

            {/* NDVI */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>🌿 Sentinel-2 NDVI Index</span>
                <strong style={{ color: "#16A34A" }}>{ndvi}</strong>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.02"
                value={ndvi}
                onChange={(e) => {
                  setNdvi(e.target.value);
                  onChangeInput("ndvi", parseFloat(e.target.value));
                }}
                style={{ width: "100%", accentColor: "#16A34A" }}
              />
            </div>

            {/* Rainfall */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>🌧️ NASA GPM Rainfall (mm/wk)</span>
                <strong style={{ color: "#0284C7" }}>{rainfallMm} mm</strong>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                value={rainfallMm}
                onChange={(e) => {
                  setRainfallMm(e.target.value);
                  onChangeInput("rainfall_mm", parseFloat(e.target.value));
                }}
                style={{ width: "100%", accentColor: "#0284C7" }}
              />
            </div>

            {/* Land Temp */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>🌡️ Landsat Thermal LST (°C)</span>
                <strong style={{ color: "#D97706" }}>{landTemp} °C</strong>
              </div>
              <input
                type="range"
                min="22"
                max="46"
                step="0.5"
                value={landTemp}
                onChange={(e) => {
                  setLandTemp(e.target.value);
                  onChangeInput("land_temp_c", parseFloat(e.target.value));
                }}
                style={{ width: "100%", accentColor: "#D97706" }}
              />
            </div>
          </div>

          {/* AI Inference Summary Card */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>AI Assessment</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#DCFCE7", color: "#166534" }}>
                  {prospectResults?.resource_classification || "Proven"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 12, background: "#F0FDF4", borderRadius: 8, border: "1px solid #86EFAC" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#166534" }}>PREDICTED GRADE</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>
                    {prospectResults?.predicted_ore_grade_pct || syncTargetGrade}% Mn
                  </div>
                </div>

                <div style={{ padding: 12, background: "#EFF6FF", borderRadius: 8, border: "1px solid #93C5FD" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1E40AF" }}>PROBABILITY</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#185FA5", marginTop: 2 }}>
                    {((prospectResults?.manganese_reserve_probability || 0.75) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Indicator Contributions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {prospectResults?.satellite_indicators?.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ padding: "6px 10px", background: "#F8FAFC", borderRadius: 6, fontSize: 11.5, display: "flex", justifyContent: "space-between", border: "1px solid #E2E8F0" }}>
                    <strong>{c.factor} ({c.weight_pct}%)</strong>
                    <span style={{ color: "#16A34A", fontWeight: 600 }}>{c.availability.split(" — ")[0]}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: 10, background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 11.5, color: "#92400E" }}>
                📌 <strong>Recommendation:</strong> {prospectResults?.exploration_recommendation}
              </div>
            </div>

            <button
              onClick={() => {
                onSubmitEvaluation();
                setActiveTab("operations");
              }}
              style={{
                marginTop: 12,
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: "#185FA5",
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
              <span>Review Operational Constraints</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Operational Constraints */}
      {activeTab === "operations" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Production & Economics */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0", borderTop: "3px solid #185FA5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <TrendingUp size={16} color="#185FA5" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                1. Production Targets & Economics
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Weekly Extraction Target (t)
                </label>
                <input
                  type="number"
                  value={inputs.tonnage}
                  onChange={(e) => onChangeInput("tonnage", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Ore Realization Value (₹/t)
                </label>
                <input
                  type="number"
                  value={inputs.ore_value_per_tonne}
                  onChange={(e) => onChangeInput("ore_value_per_tonne", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Mining Unit Cost (₹/t)
                </label>
                <input
                  type="number"
                  value={inputs.mining_cost}
                  onChange={(e) => onChangeInput("mining_cost", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Processing / Beneficiation Cost (₹/t)
                </label>
                <input
                  type="number"
                  value={inputs.processing_cost}
                  onChange={(e) => onChangeInput("processing_cost", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Equipment & Blasting Constraints */}
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0", borderTop: "3px solid #BA7517" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Truck size={16} color="#BA7517" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                2. Equipment & Blasting Constraints
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Fleet Availability (%)
                </label>
                <input
                  type="number"
                  value={inputs.equipment_availability_pct}
                  onChange={(e) => onChangeInput("equipment_availability_pct", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Unscheduled Breakdown (hrs/wk)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.unscheduled_downtime_hours}
                  onChange={(e) => onChangeInput("unscheduled_downtime_hours", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Blasting Safety Delay (hrs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.blast_cycle_delay_hours}
                  onChange={(e) => onChangeInput("blast_cycle_delay_hours", parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                  Waste Flag
                </label>
                <select
                  value={inputs.waste_flag}
                  onChange={(e) => onChangeInput("waste_flag", parseInt(e.target.value) || 0)}
                  style={inputStyle}
                >
                  <option value={0}>0 - Economically Viable Ore</option>
                  <option value={1}>1 - Barren Overburden</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 2D/3D Reserve Heatmap & Depth Slices */}
      {activeTab === "heatmap" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                2D/3D Spatial Probability Grid (50m Resolution)
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ color: "#94A3B8" }}>Barren</span>
                <div style={{ width: 50, height: 6, borderRadius: 3, background: "linear-gradient(to right, #E2E8F0, #1D9E75, #065F46)" }} />
                <span style={{ color: "#065F46", fontWeight: 700 }}>Ore-Bearing</span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid.length || 12}, 1fr)`,
                gap: 3,
                padding: 10,
                background: "#0F172A",
                borderRadius: 8,
                aspectRatio: "1 / 1",
                maxHeight: 320,
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
                        borderRadius: 2,
                        background: `rgba(29, 158, 117, ${0.15 + val * 0.85})`,
                        border: isHigh ? "1px solid #34D399" : isViable ? "1px solid rgba(255,255,255,0.1)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
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

          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Stratigraphic Depth Bands
            </h3>
            {depthSlices.map((slice, idx) => (
              <div key={idx} style={{ padding: 10, borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{slice.depth_band}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Proven Tonnage: <strong style={{ color: "#1D9E75" }}>{slice.proven_tonnage_kt} kt</strong></div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "#E0F2FE", color: "#0369A1" }}>
                  {slice.avg_grade_pct}% Mn
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Batch Upload */}
      {activeTab === "upload" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 22, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Batch Exploration & Telemetry Upload
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                Upload borehole logs or fleet telemetry. Ingested regions are automatically added to the portal dropdown.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              style={{
                padding: "7px 12px",
                borderRadius: 7,
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#185FA5",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📥 Download Sample CSV
            </button>
          </div>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed #CBD5E1",
              borderRadius: 10,
              padding: "28px 16px",
              background: "#F8FAFC",
              cursor: "pointer",
            }}
          >
            <UploadCloud size={32} color="#185FA5" />
            <strong style={{ fontSize: 13, color: "#0F172A", marginTop: 8 }}>Click to Browse or Drag and Drop .CSV / .XLSX</strong>
            <span style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Contains 1 sample ID & ore type with strict instruction header</span>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      )}
    </div>
  );
}
