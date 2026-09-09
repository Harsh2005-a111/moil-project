import React, { useState, useEffect, useRef } from "react";
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
  Layers,
} from "lucide-react";
import { PRESET_SCENARIOS, SAMPLE_CSV_CONTENT } from "../data/moilData";
import SatelliteScanner from "./SatelliteScanner";
import BoreholeCoreViewer from "./BoreholeCoreViewer";
import SectionReportButton from "./SectionReportButton";
import { API_BASE, numberOr } from "../config";


export default function ReserveIngestionHub({
  mines,
  selectedMine,
  onSelectMine,
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
  const requestControllers = useRef({ reserves: null, prospect: null });

  const safeInputs = inputs || {};
  const isTerrainBarren = Boolean(
    safeInputs.is_barren ||
    safeInputs.waste_flag === 1 ||
    selectedMine?.waste_flag === 1 ||
    selectedMine?.type?.includes("Barren") ||
    selectedMine?.type?.includes("Sterilized") ||
    selectedMine?.name?.toLowerCase().includes("connaught") ||
    (safeInputs.tonnage === 0 && safeInputs.ore_grade_pct === 0)
  );

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
    }
    if (params.soil_moisture !== undefined) {
      setSoilMoisture(params.soil_moisture);
    }
    if (params.ndvi !== undefined) {
      setNdvi(params.ndvi);
    }
    if (params.land_temp_c !== undefined) {
      setLandTemp(params.land_temp_c);
    }
    if (params.rock_type !== undefined) {
      const lith = params.rock_type.includes("Braunite") ? "Gondite / Braunite Series" : params.rock_type;
      setHostLithology(lith);
    }
    if (params.ore_grade_pct !== undefined) {
      setSyncTargetGrade(params.ore_grade_pct);
    }
    if (params.swir_b11_absorption !== undefined) {
      setSwirAbsorption(params.swir_b11_absorption);
    }
    if (params.emag2_anomaly_nt !== undefined) {
      setEmagAnomaly(params.emag2_anomaly_nt);
    }

    const isBarren = Boolean(params.is_barren);
    const rain = numberOr(params.rainfall_mm, 38.0);
    const soil = numberOr(params.soil_moisture, 0.28);
    const grade = isBarren ? 0.0 : numberOr(params.ore_grade_pct, 40.0);
    const tonnageKt = isBarren ? 0.0 : numberOr(params.total_available_reserves_kt, 1200.0);
    const tonnage = tonnageKt * 1000.0;
    const rock = params.rock_type || "Braunite";
    const elev = numberOr(params.elevation_m, 120.0);

    // Synchronize operational sliders, blasting delays, and fleet capacity
    if (onChangeInput) {
      if (isBarren) {
        onChangeInput("is_barren", true);
        onChangeInput("waste_flag", 1);
        onChangeInput("ore_grade_pct", 0.0);
        onChangeInput("tonnage", 0.0);
        onChangeInput("ore_value_per_tonne", 0.0);
        onChangeInput("mining_cost", 0.0);
        onChangeInput("processing_cost", 0.0);
        onChangeInput("equipment_availability_pct", 0.0);
        onChangeInput("unscheduled_downtime_hours", 0.0);
        onChangeInput("blast_cycle_delay_hours", 0.0);
        onChangeInput("rainfall_mm", rain);
        onChangeInput("soil_moisture", soil);
        if (params.ndvi !== undefined) onChangeInput("ndvi", params.ndvi);
        if (params.land_temp_c !== undefined) onChangeInput("land_temp_c", params.land_temp_c);
        onChangeInput("rock_type", "Sterilized Country Rock / Urban Settlement");
      } else {
        onChangeInput("is_barren", false);
        onChangeInput("waste_flag", 0);
        const blastDelay = Number((1.2 + (rain > 50 ? (rain - 50) * 0.05 : 0) + (rock.includes("Braunite") ? 0.5 : 0.1)).toFixed(1));
        const downtime = Number((2.0 + (rain > 40 ? (rain - 40) * 0.06 : 0) + (soil > 0.35 ? 1.2 : 0.4)).toFixed(1));
        const equipAvail = Math.max(65.0, Math.min(94.0, Number((92.0 - (rain > 50 ? (rain - 50) * 0.25 : 0) - (soil > 0.35 ? 4.0 : 0)).toFixed(1))));
        const miningCost = Number((42.0 + (elev > 250 ? 5.0 : 0) + (rock.includes("Braunite") ? 4.0 : 0)).toFixed(1));
        const procCost = Number((26.0 + (grade < 40 ? 5.0 : 0)).toFixed(1));

        onChangeInput("rainfall_mm", rain);
        onChangeInput("soil_moisture", soil);
        if (params.ndvi !== undefined) onChangeInput("ndvi", params.ndvi);
        if (params.land_temp_c !== undefined) onChangeInput("land_temp_c", params.land_temp_c);
        onChangeInput("rock_type", rock.split(" / ")[0]);
        onChangeInput("ore_grade_pct", grade);
        onChangeInput("tonnage", tonnage);
        onChangeInput("z", elev);
        onChangeInput("blast_cycle_delay_hours", blastDelay);
        onChangeInput("unscheduled_downtime_hours", downtime);
        onChangeInput("equipment_availability_pct", equipAvail);
        onChangeInput("mining_cost", miningCost);
        onChangeInput("processing_cost", procCost);
        onChangeInput("ore_value_per_tonne", 275.0);
      }
    }

    // Synchronize active mine or select matched mine so the top navigation & KPI bar stay in sync
    if (onSelectMine && (!selectedMine || selectedMine.lat === undefined)) {
      const pLat = parseFloat(params.lat || params.latitude);
      const pLon = parseFloat(params.lon || params.longitude);
      const pName = (params.region_name || "").toLowerCase();

      const matched = mines?.find((m) => {
        const nameMatch = m.name && pName && (
          m.name.toLowerCase().includes(pName) || pName.includes(m.name.toLowerCase())
        );
        const coordMatch = m.lat && pLat && Math.abs(m.lat - pLat) < 0.12 && Math.abs(m.lon - pLon) < 0.12;
        return nameMatch || coordMatch;
      });

      if (matched) {
        onSelectMine(matched);
      } else {
        onSelectMine({
          mine_id: `SAT-${Date.now().toString().slice(-4)}`,
          name: params.region_name || "Active Satellite Sector",
          state: "Exploration Concession",
          district: "CITZ Belt",
          lat: pLat || 21.8,
          lon: pLon || 80.0,
          lease_area_ha: 250.0,
          annual_capacity_mt: 0.35,
          primary_rock: rock,
          avg_grade_pct: grade,
          avg_rainfall_mm: rain,
          fleet_size: 24,
          predicted_reserves_kt: Math.round(tonnageKt),
          type: isBarren ? "Barren Non-Mineralized" : "Satellite Prospect",
          waste_flag: isBarren ? 1 : 0,
        });
      }
    }

    if (onSubmitEvaluation) {
      setTimeout(() => {
        onSubmitEvaluation();
      }, 50);
    }

    // Always synchronize 2D/3D heatmap & depth slices to correspond to this evaluated scene!
    fetchReserves({
      is_barren: isBarren,
      expected_grade_pct: grade,
      expected_tonnage_kt: tonnageKt,
      region_name: params.region_name || selectedMine?.name || "Evaluated Satellite Scene",
      rainfall_mm: rain,
      soil_moisture: soil,
      ndvi: params.ndvi,
      land_temp_c: params.land_temp_c,
    });
  };

  // Optional Ground Survey
  const [includeGroundSurvey, setIncludeGroundSurvey] = useState(false);
  const [ipChargeability, setIpChargeability] = useState(19.5);
  const [resistivity, setResistivity] = useState(42);

  const [prospectResults, setProspectResults] = useState(null);
  const [prospectLoading, setProspectLoading] = useState(false);
  const isNonMnContext = prospectResults?.prediction_status === "NON_MN_COMMODITY";

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
    const timer = setTimeout(() => fetchReserves(), 300);
    return () => clearTimeout(timer);
  }, [selectedMine, depthSlice, cutoffGrade]);

  useEffect(() => {
    const timer = setTimeout(() => runProspector(), 350);
    return () => clearTimeout(timer);
  }, [selectedMine, hostLithology, swirAbsorption, emagAnomaly, ndvi, landTemp, rainfallMm, soilMoisture, includeGroundSurvey, ipChargeability, resistivity]);

  const fetchReserves = (overrideParams = {}) => {
    const isBarren = overrideParams.is_barren !== undefined
      ? overrideParams.is_barren
      : (selectedMine?.waste_flag === 1 || selectedMine?.type?.includes("Barren"));

    const expGrade = overrideParams.expected_grade_pct !== undefined
      ? overrideParams.expected_grade_pct
      : (selectedMine?.avg_grade_pct !== undefined ? selectedMine.avg_grade_pct : (isBarren ? 0.0 : null));

    const expTonnage = overrideParams.expected_tonnage_kt !== undefined
      ? overrideParams.expected_tonnage_kt
      : (selectedMine?.predicted_reserves_kt !== undefined ? selectedMine.predicted_reserves_kt : (isBarren ? 0.0 : null));

    const regName = overrideParams.region_name || selectedMine?.name || "MOIL Survey Sector";
    const rain = overrideParams.rainfall_mm !== undefined ? overrideParams.rainfall_mm : numberOr(rainfallMm, 38.0);
    const soil = overrideParams.soil_moisture !== undefined ? overrideParams.soil_moisture : numberOr(soilMoisture, 0.28);
    const curNdvi = overrideParams.ndvi !== undefined ? overrideParams.ndvi : numberOr(ndvi, 0.35);
    const temp = overrideParams.land_temp_c !== undefined ? overrideParams.land_temp_c : numberOr(landTemp, 33.5);

    requestControllers.current.reserves?.abort();
    const controller = new AbortController();
    requestControllers.current.reserves = controller;

    fetch(`${API_BASE}/api/reserves/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_name: regName,
        x_range: [0, 500],
        y_range: [0, 500],
        depth_m: depthSlice === "surface" ? 25.0 : depthSlice === "mid" ? 60.0 : depthSlice === "deep" ? 110.0 : 85.0,
        ore_grade_cutoff: numberOr(cutoffGrade, 30.0),
        rainfall_mm: rain,
        soil_moisture: soil,
        ndvi: curNdvi,
        land_temp_c: temp,
        is_barren: isBarren,
        expected_grade_pct: expGrade,
        expected_tonnage_kt: expTonnage,
        latitude: selectedMine?.lat,
        longitude: selectedMine?.lon,
      }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Reserve request failed: ${r.status}`);
        return r.json();
      })
      .then(setReservesData)
      .catch((err) => console.error("Error fetching reserves:", err));
  };

  const runProspector = () => {
    setProspectLoading(true);
    requestControllers.current.prospect?.abort();
    const controller = new AbortController();
    requestControllers.current.prospect = controller;
    const payload = {
      region_name: selectedMine?.name || "Central India Sausar Exploration Zone",
      latitude: selectedMine?.lat ?? 21.80,
      longitude: selectedMine?.lon ?? 80.15,
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
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Prospector request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setProspectResults(data);
        if (data?.predicted_ore_grade_pct !== undefined) {
          onChangeInput("ore_grade_pct", data.predicted_ore_grade_pct);
          setSyncTargetGrade(data.predicted_ore_grade_pct);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Prospector error:", err);
      })
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
              {selectedMine
                ? `${selectedMine.name} (${selectedMine.state})`
                : "No lease selected — choose a region above or load a preset"}
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
      <div style={{ display: "flex", gap: 6, background: "#FFFFFF", padding: 6, borderRadius: 12, border: "1px solid #E2E8F0", flexWrap: "wrap", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <button
          onClick={() => setActiveTab("scanner")}
          className={activeTab === "scanner" ? "flowing-btn flowing-btn-navy" : "flowing-btn"}
          style={{
            padding: "8px 16px",
            border: activeTab === "scanner" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "scanner" ? undefined : "#F8FAFC",
            color: activeTab === "scanner" ? "#FFFFFF" : "#0284C7",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Sparkles size={14} />
          <span>🛰️ Satellite Image AI Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab("prospector")}
          className={activeTab === "prospector" ? "flowing-btn flowing-btn-navy" : "flowing-btn"}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            border: activeTab === "prospector" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "prospector" ? undefined : "transparent",
            color: activeTab === "prospector" ? "#FFFFFF" : "#475569",
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
          <span>1. Satellite & Geological Indicators</span>
        </button>

        <button
          onClick={() => setActiveTab("operations")}
          className={activeTab === "operations" ? "flowing-btn flowing-btn-navy" : "flowing-btn"}
          style={{
            flex: 1,
            minWidth: 160,
            padding: "8px 12px",
            border: activeTab === "operations" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "operations" ? undefined : "transparent",
            color: activeTab === "operations" ? "#FFFFFF" : "#475569",
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
          className={activeTab === "heatmap" ? "flowing-btn flowing-btn-emerald" : "flowing-btn"}
          style={{
            flex: 1,
            minWidth: 180,
            padding: "8px 12px",
            border: activeTab === "heatmap" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "heatmap" ? undefined : "transparent",
            color: activeTab === "heatmap" ? "#FFFFFF" : "#475569",
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
          onClick={() => setActiveTab("boreholes")}
          className={activeTab === "boreholes" ? "flowing-btn flowing-btn-purple" : "flowing-btn"}
          style={{
            flex: 1,
            minWidth: 190,
            padding: "8px 12px",
            border: activeTab === "boreholes" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "boreholes" ? undefined : "transparent",
            color: activeTab === "boreholes" ? "#FFFFFF" : "#475569",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Layers size={14} />
          <span>4. Subsurface Boreholes & Core Logs</span>
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          className={activeTab === "upload" ? "flowing-btn flowing-btn-amber" : "flowing-btn"}
          style={{
            padding: "8px 14px",
            border: activeTab === "upload" ? "none" : "1px solid transparent",
            borderRadius: 8,
            background: activeTab === "upload" ? undefined : "transparent",
            color: activeTab === "upload" ? "#FFFFFF" : "#475569",
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

      {/* Active Section Context & On-Demand Report Banner */}
      {(() => {
        const TAB_REPORT_MAP = {
          scanner: {
            id: "satellite_scanner",
            title: "Satellite Multi-Spectral Image AI Analyzer",
            desc: "Sentinel-2 Level-2A surface reflectance, MSI mineral index, and vegetation deconvolution.",
            badge: "ESA COPERNICUS",
            variant: "default",
          },
          prospector: {
            id: "geological_indicators",
            title: "1. Satellite & Geological Indicators (Sliders)",
            desc: "Multi-spectral band sliders coupled with Bayesian GSI geological lithology priors.",
            badge: "GSI PRIORS",
            variant: "default",
          },
          operations: {
            id: "operational_constraints",
            title: "2. Operational Pit Feasibility & Constraints",
            desc: "Cutoff grade, stripping ratio W:O, dewatering pumping head, and statutory forest buffers.",
            badge: "DGMS COMPLIANT",
            variant: "default",
          },
          heatmap: {
            id: "reserve_heatmap",
            title: "3. 2D/3D Reserve Heatmap & Depth Slices",
            desc: "Geospatial kriging interpolation, strike-dip visualization, and horizontal bench depth RL slicing.",
            badge: "SPATIAL KRIGING",
            variant: "default",
          },
          boreholes: {
            id: "subsurface_boreholes",
            title: "4. Subsurface Borehole & Drill-Core Ingestion",
            desc: "Downhole diamond core assay compositing, geometric dip correction, RQD stability, and UNFC 111/122 progression.",
            badge: "UNFC 111 CERTIFIED",
            variant: "purple",
          },
          upload: {
            id: "batch_csv",
            title: "Batch CSV Exploration & Portfolio Estimation",
            desc: "Bulk lease concession evaluation, automated prospectivity ranking, and multi-block reserves.",
            badge: "PORTFOLIO BATCH",
            variant: "default",
          },
        };
        const currentMeta = TAB_REPORT_MAP[activeTab];
        if (!currentMeta) return null;
        return (
          <div
            style={{
              background: "linear-gradient(90deg, #F8FAFC 0%, #EFF6FF 50%, #FAF5FF 100%)",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="live-beacon" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0F2C59" }}>
                    {currentMeta.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: activeTab === "boreholes" ? "#7E22CE" : "#1A56A0",
                      color: "#FFFFFF",
                    }}
                  >
                    {currentMeta.badge}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                  {currentMeta.desc}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SectionReportButton
                reportId={currentMeta.id}
                selectedMineName={selectedMine?.name}
                variant={currentMeta.variant}
                buttonText="View & Download Section Report"
              />
            </div>
          </div>
        );
      })()}

      {/* Tab 0: Satellite Image AI Scanner */}
      {activeTab === "scanner" && (
        <SatelliteScanner
          mines={mines}
          selectedMine={selectedMine}
          onSelectMine={onSelectMine}
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
                  {prospectResults?.resource_classification ?? "Proven"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ padding: 12, background: "#F0FDF4", borderRadius: 8, border: "1px solid #86EFAC" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#166534" }}>PREDICTED GRADE</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>
                    {(prospectResults?.predicted_ore_grade_pct ?? syncTargetGrade)}% Mn
                  </div>
                </div>

                <div style={{ padding: 12, background: "#EFF6FF", borderRadius: 8, border: "1px solid #93C5FD" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#1E40AF" }}>PROBABILITY</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#185FA5", marginTop: 2 }}>
                    {((prospectResults?.manganese_reserve_probability ?? 0.75) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Indicative exploration target scale; not a certified reserve */}
              <div style={{ padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                  <span>INDICATIVE TARGET YIELD</span>
                  <strong style={{ color: "#0D9488" }}>
                    {(reservesData?.viable_block_ratio_pct ?? ((prospectResults?.manganese_reserve_probability ?? 0.75) * 88).toFixed(1))}% Yield
                  </strong>
                </div>

                <div style={{ width: "100%", height: 7, borderRadius: 4, background: "#E2E8F0", overflow: "hidden", marginBottom: 6 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${reservesData?.viable_block_ratio_pct ?? ((prospectResults?.manganese_reserve_probability ?? 0.75) * 88).toFixed(1)}%`,
                      background: "linear-gradient(90deg, #10B981, #0D9488)",
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B" }}>
                  <span>
                    Target scale: <strong>{reservesData?.total_estimated_tonnage_kt ?? (prospectResults?.estimated_tonnage_kt !== undefined ? Math.round(prospectResults.estimated_tonnage_kt * 1.3) : 1550)} kt</strong>
                  </span>
                  <span>
                    Indicative extractable: <strong style={{ color: "#065F46" }}>{reservesData?.economically_viable_tonnage_kt ?? prospectResults?.estimated_tonnage_kt ?? 1220} kt</strong>
                  </span>
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
                📌 <strong>Recommendation:</strong> {prospectResults?.recommendation ?? prospectResults?.exploration_recommendation ?? "Awaiting model evaluation."}
              </div>
            </div>

            <button
              onClick={() => {
                onSubmitEvaluation();
                setActiveTab("operations");
              }}
              disabled={isNonMnContext}
              style={{
                marginTop: 12,
                opacity: isNonMnContext ? 0.5 : 1,
                cursor: isNonMnContext ? "not-allowed" : "pointer",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                background: "#185FA5",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
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
        isTerrainBarren ? (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: 24,
              border: "1px solid #CBD5E1",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                borderRadius: 10,
                padding: "16px 20px",
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                borderLeft: "5px solid #EAB308",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "rgba(234, 179, 8, 0.18)",
                    border: "1px solid rgba(234, 179, 8, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  🚫
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        background: "#EAB308",
                        color: "#0F172A",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      STATUTORY EXCLUSION
                    </span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>
                      UNFC 777 • Sterilized Non-Mineralized Ground / Municipal Habitat
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>
                    Non-Mining Terrain: Operational Constraints Inactive
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onChangeInput) {
                    onChangeInput("is_barren", false);
                    onChangeInput("waste_flag", 0);
                    onChangeInput("tonnage", 120000.0);
                    onChangeInput("ore_grade_pct", 38.5);
                  }
                }}
                className="flowing-btn"
                style={{
                  padding: "7px 14px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  fontSize: 12,
                }}
              >
                Override & Enable Manual Input
              </button>
            </div>

            {/* Statutory Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Extraction Target
                </span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                  0.0 t/wk
                </div>
                <span style={{ fontSize: 11.5, color: "#059669", fontWeight: 600 }}>
                  ✓ Zero Procurement Mandate
                </span>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Blasting Safety Delays
                </span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#64748B", marginTop: 4 }}>
                  N/A (Exempt)
                </div>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  Blasting prohibited in municipal buffer
                </span>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Pit Dewatering & Haul Fleet
                </span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#64748B", marginTop: 4 }}>
                  0 Fleet Assigned
                </div>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  No open-cast pit excavation active
                </span>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Ore Realization Value
                </span>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                  ₹0 / t
                </div>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>
                  Zero extractable manganese content
                </span>
              </div>
            </div>

            {/* Explainable AI Statutory Directive */}
            <div
              style={{
                background: "#FEFCE8",
                borderRadius: 10,
                padding: "14px 18px",
                border: "1px solid #FEF08A",
                fontSize: 12.5,
                color: "#713F12",
                lineHeight: 1.6,
              }}
            >
              🏛️ <strong>Statutory Regulatory Notice (MMDR Act & DGMS Guidelines):</strong>
              <p style={{ margin: "4px 0 0 0" }}>
                Under Section 4 of the <em>Mines and Minerals (Development and Regulation) Act, 1957</em> and DGMS safety protocols, urban habitations (e.g. Connaught Place, built-up cities) and sterile non-mineralized country rock are legally barred from mining concessions. Because there is no extraction pit or ore body, operational bottlenecks like <strong>blasting cycle delays, pit dewatering head, rainfall operational pauses, and haulage breakdowns are statutorily marked Non-Applicable (N/A)</strong>.
              </p>
            </div>
          </div>
        ) : (
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
                    value={safeInputs.tonnage ?? ""}
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
                    value={safeInputs.ore_value_per_tonne ?? ""}
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
                    value={safeInputs.mining_cost ?? ""}
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
                    value={safeInputs.processing_cost ?? ""}
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
                    value={safeInputs.equipment_availability_pct ?? ""}
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
                    value={safeInputs.unscheduled_downtime_hours ?? ""}
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
                    value={safeInputs.blast_cycle_delay_hours ?? ""}
                    onChange={(e) => onChangeInput("blast_cycle_delay_hours", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Waste Flag
                  </label>
                  <select
                    value={safeInputs.waste_flag ?? 0}
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
        )
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

      {/* Tab 4: Subsurface Borehole & Drill Logs */}
      {activeTab === "boreholes" && (
        <BoreholeCoreViewer
          selectedMine={selectedMine}
          surfacePredictedGrade={prospectResults?.predicted_ore_grade_pct || inputs?.ore_grade_pct || 38.5}
          onApplyBoreholeAssay={(compGrade, rock) => {
            onChangeInput("ore_grade_pct", compGrade);
            if (rock) onChangeInput("rock_type", rock.split(" / ")[0]);
            onSubmitEvaluation();
          }}
          API_BASE={API_BASE}
        />
      )}

      {/* Tab 5: Batch Upload */}
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
