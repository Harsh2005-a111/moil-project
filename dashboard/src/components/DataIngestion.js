import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  TrendingUp,
  Truck,
  Satellite,
  Download,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { PRESET_SCENARIOS, SAMPLE_CSV_CONTENT } from "../data/moilData";

export default function DataIngestion({
  inputs,
  onChangeInput,
  onSubmitEvaluation,
  onLoadPreset,
  loading,
  selectedMine,
}) {
  const [activeTab, setActiveTab] = useState("form");
  const [csvPreview, setCsvPreview] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.trim().split("\n");
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i];
          });
          return obj;
        });
        setCsvPreview(rows);
        setUploadSuccess(true);

        // Populate first row into live form
        if (rows.length > 0) {
          const r = rows[0];
          onChangeInput("region_name", r.region_name || selectedMine?.name || "Custom Region");
          onChangeInput("block_id", r.block_id || "BLK-UPLOAD");
          if (r.x) onChangeInput("x", parseFloat(r.x));
          if (r.y) onChangeInput("y", parseFloat(r.y));
          if (r.z) onChangeInput("z", parseFloat(r.z));
          if (r.rock_type) onChangeInput("rock_type", r.rock_type);
          if (r.ore_grade_pct) onChangeInput("ore_grade_pct", parseFloat(r.ore_grade_pct));
          if (r.tonnage) onChangeInput("tonnage", parseFloat(r.tonnage));
          if (r.ore_value_per_tonne) onChangeInput("ore_value_per_tonne", parseFloat(r.ore_value_per_tonne));
          if (r.mining_cost) onChangeInput("mining_cost", parseFloat(r.mining_cost));
          if (r.processing_cost) onChangeInput("processing_cost", parseFloat(r.processing_cost));
          if (r.rainfall_mm) onChangeInput("rainfall_mm", parseFloat(r.rainfall_mm));
          if (r.soil_moisture) onChangeInput("soil_moisture", parseFloat(r.soil_moisture));
          if (r.ndvi) onChangeInput("ndvi", parseFloat(r.ndvi));
          if (r.land_temp_c) onChangeInput("land_temp_c", parseFloat(r.land_temp_c));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "moil_multi_pillar_input_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Banner */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              Multi-Source Ingestion & Operational Parameter Hub
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
              Ingests operational constraint telemetry (Equipment downtime, Blasting cycle lags, Production targets, Weather) while <strong>Manganese Ore Grade (% Mn)</strong> is automatically inferred by the Module A Satellite Prospector.
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRESET_SCENARIOS.map((ps) => (
              <button
                key={ps.id}
                onClick={() => onLoadPreset(ps.data)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#334155",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Sparkles size={12} color="#185FA5" />
                <span>{ps.title.split(" (")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: 12, marginTop: 18, borderBottom: "1px solid #E2E8F0" }}>
          <button
            onClick={() => setActiveTab("form")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === "form" ? "2px solid #185FA5" : "2px solid transparent",
              background: "transparent",
              color: activeTab === "form" ? "#185FA5" : "#64748B",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Live Parameter Entry Form
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: activeTab === "upload" ? "2px solid #185FA5" : "2px solid transparent",
              background: "transparent",
              color: activeTab === "upload" ? "#185FA5" : "#64748B",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Batch File Upload (.CSV / .XLSX)</span>
          </button>
        </div>
      </div>

      {activeTab === "form" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitEvaluation();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* 4 Quadrants for the 4 Pillars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Pillar 1: Geological & Sub-surface Data */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 18,
                border: "1px solid #E2E8F0",
                borderTop: "3px solid #0D9488",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Layers size={18} color="#0D9488" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  1. Geological & Sub-surface Inputs
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Block / Section ID
                  </label>
                  <input
                    type="text"
                    value={inputs.block_id}
                    onChange={(e) => onChangeInput("block_id", e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Primary Rock Type
                  </label>
                  <select
                    value={inputs.rock_type}
                    onChange={(e) => onChangeInput("rock_type", e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Magnetite">Magnetite (Hard Rock)</option>
                    <option value="Hematite">Hematite (Medium)</option>
                    <option value="Braunite">Braunite (High Grade Mn)</option>
                    <option value="Psilomelane">Psilomelane (Hydrous Mn)</option>
                    <option value="Waste">Waste / Overburden</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>
                      Ore Grade (% Mn)
                    </label>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#DCFCE7", color: "#166534" }}>
                      🤖 AI Inferred (Mod A)
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.ore_grade_pct}
                    onChange={(e) => onChangeInput("ore_grade_pct", parseFloat(e.target.value) || 0)}
                    style={{
                      ...inputStyle,
                      background: "#F0FDF4",
                      borderColor: "#86EFAC",
                      fontWeight: 700,
                      color: "#166534",
                    }}
                    title="Inferred by Module A Satellite Prospector. Can be overridden if laboratory core assay certificates exist."
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Estimated Tonnage (t)
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
                    Spatial Easting (X in m)
                  </label>
                  <input
                    type="number"
                    value={inputs.x}
                    onChange={(e) => onChangeInput("x", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Spatial Northing (Y in m)
                  </label>
                  <input
                    type="number"
                    value={inputs.y}
                    onChange={(e) => onChangeInput("y", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Depth / Elevation (Z in m)
                  </label>
                  <input
                    type="number"
                    value={inputs.z}
                    onChange={(e) => onChangeInput("z", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Waste Block Flag
                  </label>
                  <select
                    value={inputs.waste_flag}
                    onChange={(e) => onChangeInput("waste_flag", parseInt(e.target.value))}
                    style={inputStyle}
                  >
                    <option value={0}>0 - Economically Viable Ore</option>
                    <option value={1}>1 - Waste / Overburden Block</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pillar 2: Historical Production & Economics */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 18,
                border: "1px solid #E2E8F0",
                borderTop: "3px solid #185FA5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <TrendingUp size={18} color="#185FA5" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  2. Historical Production & Economics
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Ore Value (₹/tonne)
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
                    Mining Cost (₹/tonne)
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
                    Processing Cost (₹/tonne)
                  </label>
                  <input
                    type="number"
                    value={inputs.processing_cost}
                    onChange={(e) => onChangeInput("processing_cost", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Weekly Extraction Target (t)
                  </label>
                  <input
                    type="number"
                    defaultValue={12000}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: 14, padding: 10, background: "#EFF6FF", borderRadius: 8, fontSize: 11.5, color: "#1E40AF" }}>
                📊 Historical production records feed LightGBM baseline trends to calibrate seasonality and yield ratios.
              </div>
            </div>

            {/* Pillar 3: Equipment Performance & Constraints */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 18,
                border: "1px solid #E2E8F0",
                borderTop: "3px solid #8B5CF6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Truck size={18} color="#8B5CF6" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  3. Equipment Performance & Constraints
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Fleet Availability (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
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
                    Drill & Blast Delay (hrs)
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
                    Haul Road Gradient Status
                  </label>
                  <select defaultValue="Good" style={inputStyle}>
                    <option value="Good">Optimal (1 in 16 Grade)</option>
                    <option value="Medium">Wet / Slick Gradient</option>
                    <option value="Poor">Restricted (Dewatering Active)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pillar 4: Satellite / Space Technology Inputs */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 18,
                border: "1px solid #E2E8F0",
                borderTop: "3px solid #0284C7",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Satellite size={18} color="#0284C7" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  4. Satellite & Space Technology Inputs
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Rainfall (mm/wk - GPM/TRMM)
                  </label>
                  <input
                    type="number"
                    value={inputs.rainfall_mm}
                    onChange={(e) => onChangeInput("rainfall_mm", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Soil Moisture Index (0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.soil_moisture}
                    onChange={(e) => onChangeInput("soil_moisture", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Vegetation Index NDVI (0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.ndvi}
                    onChange={(e) => onChangeInput("ndvi", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", display: "block", marginBottom: 3 }}>
                    Land Surface Temp (°C Landsat)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputs.land_temp_c}
                    onChange={(e) => onChangeInput("land_temp_c", parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Ready to score: <strong style={{ color: "#0F172A" }}>{inputs.region_name}</strong> • Block: <strong>{inputs.block_id}</strong>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #185FA5 0%, #0D9488 100%)",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(24,95,165,0.3)",
              }}
            >
              <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
              <span>{loading ? "Evaluating ML Pipeline..." : "Execute Multi-Pillar Inference"}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 30,
              border: "2px dashed #CBD5E1",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <UploadCloud size={40} color="#185FA5" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              Upload Multi-Pillar Mine or Exploration Dataset
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#64748B", maxWidth: 500 }}>
              Upload your CSV or Excel file containing borehole exploration grades, equipment logs, and satellite observations.
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <label
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#185FA5",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Browse CSV Files
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>

              <button
                onClick={handleDownloadTemplate}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Download size={14} />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {uploadSuccess && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, color: "#16A34A", fontSize: 13, fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>File parsed successfully! {csvPreview?.length} records ingested.</span>
              </div>
            )}
          </div>

          {/* Table Preview */}
          {csvPreview && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: 18,
                border: "1px solid #E2E8F0",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                Ingested Batch Data Preview ({csvPreview.length} Blocks)
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      {Object.keys(csvPreview[0]).map((k) => (
                        <th key={k} style={{ padding: "8px 10px", fontWeight: 600, color: "#475569" }}>
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 5).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        {Object.values(row).map((v, i) => (
                          <td key={i} style={{ padding: "8px 10px", color: "#334155" }}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: 7,
  border: "1px solid #CBD5E1",
  fontSize: 12.5,
  color: "#0F172A",
  background: "#F8FAFC",
  outline: "none",
};
