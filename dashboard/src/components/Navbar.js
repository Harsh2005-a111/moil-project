import React, { useState } from "react";
import {
  RefreshCw,
  Satellite,
  Cpu,
  MapPin,
  PlusCircle,
  AlertCircle,
} from "lucide-react";

export default function Navbar({
  activeSection,
  mines,
  selectedMine,
  onSelectMine,
  onAddCustomRegion,
  onRefresh,
  loading,
  apiOnline,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customState, setCustomState] = useState("Madhya Pradesh");
  const [customGrade, setCustomGrade] = useState("41.0");

  const sectionTitles = {
    kpis: { title: "Executive Dashboard", tag: "Strictly KPIs & National Overview" },
    ingestion: { title: "Data Ingestion & Multi-Source Input Hub", tag: "Geology • Production • Fleet • Space/Satellite" },
    reserves: { title: "Manganese Reserve Mapping", tag: "Module A • Surface & Sub-surface 3D Spatial Grid" },
    shortfall: { title: "Production Shortfall & Operational Risk Predictor", tag: "Module B • Constraint ML Analysis" },
    actions: { title: "AI Prescriptive Recommendations & Scheduling", tag: "Module C • SHAP XAI Mitigation Playbooks" },
    simulator: { title: "What-If Scenario Sandbox", tag: "Constraint Simulation & Stress Testing" },
    dossier: { title: "SIH Project Dossier & Export Center", tag: "Documentation • Architecture • Business Impact" },
  };

  const currentMeta = sectionTitles[activeSection] || { title: "MOIL Intelligence Portal", tag: "Smart Mining" };

  const handleCreateRegion = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newMine = {
      mine_id: `Custom-${Date.now().toString().slice(-4)}`,
      name: customName.trim(),
      state: customState,
      district: "Exploration Zone",
      lat: 21.50,
      lon: 79.50,
      lease_area_ha: 150.0,
      annual_capacity_mt: 0.20,
      primary_rock: "Braunite / Quartzite",
      avg_grade_pct: parseFloat(customGrade) || 40.0,
      avg_rainfall_mm: 90.0,
      fleet_size: 15,
      type: "Custom Lease",
      inputs: {
        block_id: `BLK-${customName.slice(0, 3).toUpperCase()}-01`,
        x: 200,
        y: 300,
        z: 70,
        rock_type: "Magnetite",
        ore_grade_pct: parseFloat(customGrade) || 40.0,
        tonnage: 120000,
        ore_value_per_tonne: 270,
        mining_cost: 45,
        processing_cost: 30,
        waste_flag: 0,
        equipment_availability_pct: 88,
        unscheduled_downtime_hours: 3.0,
        blast_cycle_delay_hours: 1.5,
        rainfall_mm: 35,
        soil_moisture: 0.25,
        ndvi: 0.42,
        land_temp_c: 32.0,
      }
    };
    onAddCustomRegion(newMine);
    setShowAddModal(false);
    setCustomName("");
  };

  return (
    <header
      style={{
        height: 68,
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Title & Tagline */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            {currentMeta.title}
          </h2>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#F1F5F9",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            {currentMeta.tag}
          </span>
        </div>
      </div>

      {/* Controls & Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Mine / Region Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={16} color="#185FA5" />
          <select
            value={selectedMine?.mine_id || ""}
            onChange={(e) => {
              const m = mines.find((x) => x.mine_id === e.target.value);
              if (m) onSelectMine(m);
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: "#F8FAFC",
              color: "#0F172A",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {mines.map((m) => (
              <option key={m.mine_id} value={m.mine_id}>
                {m.name} ({m.state})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            title="Add Custom Lease / Exploration Block"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px dashed #94A3B8",
              background: "#F8FAFC",
              color: "#334155",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <PlusCircle size={14} color="#0D9488" />
            <span>New Region</span>
          </button>
        </div>

        {/* Satellite Sync Badge */}
        <div
          title="Satellite Sentinel-2 & GPM Data Sync Active"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 20,
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <Satellite size={13} color="#059669" />
          <span>Space Data Synced</span>
        </div>

        {/* API Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 20,
            background: apiOnline ? "#EFF6FF" : "#FEF2F2",
            border: `1px solid ${apiOnline ? "#BFDBFE" : "#FECACA"}`,
            color: apiOnline ? "#1E40AF" : "#991B1B",
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          {apiOnline ? <Cpu size={13} color="#2563EB" /> : <AlertCircle size={13} color="#DC2626" />}
          <span>{apiOnline ? "FastAPI Online" : "API Offline"}</span>
        </div>

        {/* Re-calculate / Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: "#185FA5",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 1px 3px rgba(24,95,165,0.3)",
          }}
        >
          <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
          <span>{loading ? "Scoring..." : "Run Evaluation"}</span>
        </button>
      </div>

      {/* Add Custom Region Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: 24,
              width: 420,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
              Add Custom Mining Lease / Exploration Zone
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 0, marginBottom: 16 }}>
              Define any region or sub-block to evaluate manganese reserve prospects and shortfall risks.
            </p>

            <form onSubmit={handleCreateRegion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                  Lease / Region Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bharweli North Extension"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    State / Region
                  </label>
                  <select
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  >
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>
                    Expected Mn Grade %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#475569",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#185FA5",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save & Ingest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
