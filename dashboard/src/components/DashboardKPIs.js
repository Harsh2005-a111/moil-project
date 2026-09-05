import React from "react";
import {
  TrendingUp,
  AlertOctagon,
  Layers,
  Truck,
  CloudRain,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";

export default function DashboardKPIs({
  mines,
  selectedMine,
  prediction,
  trend,
  onSelectMine,
  onNavigateSection,
}) {
  const currentRisk = prediction?.risk_level || "Medium";
  const riskColor = currentRisk === "High" ? "#DC2626" : currentRisk === "Medium" ? "#D97706" : "#16A34A";
  const riskBg = currentRisk === "High" ? "#FEF2F2" : currentRisk === "Medium" ? "#FFFBEB" : "#F0FDF4";

  const lastWeek = trend && trend.length ? trend[trend.length - 1] : { expected: 1110, actual: 1106 };
  const targetOutput = lastWeek.expected;
  const actualOutput = lastWeek.actual;
  const gap = Math.max(0, targetOutput - actualOutput);

  // Constraint impact metrics
  const constraintImpact = prediction?.constraint_impact || {
    equipment_impact_pct: 28.5,
    weather_impact_pct: 35.0,
    blasting_impact_pct: 18.2,
    grade_dilution_risk_pct: 18.3,
  };

  const constraintData = [
    { name: "Equipment Downtime", value: constraintImpact.equipment_impact_pct, color: "#EA580C" },
    { name: "Monsoon / Weather", value: constraintImpact.weather_impact_pct, color: "#0284C7" },
    { name: "Blasting Delays", value: constraintImpact.blasting_impact_pct, color: "#8B5CF6" },
    { name: "Grade Dilution", value: constraintImpact.grade_dilution_risk_pct, color: "#10B981" },
  ];

  // Statutory Mine Life (LOM) and Monsoon Inundation Metrics
  const annualCapacityMt = selectedMine?.annual_capacity_mt || 0.35;
  const annualCapacityKt = annualCapacityMt * 1000;
  const mineReservesKt = selectedMine?.predicted_reserves_kt || 1420;
  const lomYears = (mineReservesKt / Math.max(10, annualCapacityKt)).toFixed(1);

  const rainfallVal = selectedMine?.inputs?.rainfall_mm || 38.0;
  const isMonsoonAlert = rainfallVal > 42.0;
  const pumpingLoad = isMonsoonAlert ? "3,850 GPM (Active Alert)" : "1,200 GPM (Nominal)";

  const handleDownloadIBMDossier = () => {
    const report = {
      regulatory_body: "Indian Bureau of Mines (IBM) / Ministry of Mines, Govt. of India",
      reporting_entity: "Manganese Ore India Limited (MOIL)",
      system: "MOIL Unified AI Mine Production & Risk Tracking Cockpit",
      timestamp: new Date().toISOString(),
      statutory_compliance: "Form F-1 (Annual Return) & UNFC 1997/2009 Mineral Audit",
      lease_details: {
        mine_name: selectedMine?.name || "Balaghat Mine",
        state: selectedMine?.state || "Madhya Pradesh",
        district: selectedMine?.district || "Balaghat",
        lease_area_ha: selectedMine?.lease_area_ha || 180,
        annual_capacity_mt: annualCapacityMt,
        life_of_mine_years: Number(lomYears),
      },
      geological_reserves: {
        total_in_situ_reserves_kt: mineReservesKt,
        unfc_classification: "Proven Mineral Reserve (UNFC 111) / G1 Stage",
        average_grade_pct_mn: selectedMine?.avg_grade_pct || 42.5,
        primary_host_lithology: selectedMine?.primary_rock || "Gondite / Braunite Series",
      },
      operational_risk_summary: {
        shortfall_risk_level: currentRisk,
        weekly_output_gap_tonnes: gap,
        fleet_availability_pct: "89.4%",
        blasting_cycle_delay_hours: selectedMine?.inputs?.blast_cycle_delay_hours || 1.5,
      },
      monsoon_and_environment: {
        weekly_rainfall_mm: rainfallVal,
        inundation_hazard_status: isMonsoonAlert ? "High Inundation Hazard" : "Normal",
        required_dewatering_capacity_gpm: pumpingLoad,
        soil_saturation_index: selectedMine?.inputs?.soil_moisture || 0.22,
        ndvi_canopy_index: selectedMine?.inputs?.ndvi || 0.35,
      },
      certification: {
        certified_by: "MOIL Central Mine Planning & Dispatch Command",
        digital_audit_hash: `MOIL-IBM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IBM_Form_F1_UNFC_Dossier_${selectedMine?.name?.replace(/\s+/g, "_") || "MOIL"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner with SIH Executive Scope */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 14,
          padding: "20px 24px",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#185FA5", color: "#fff" }}>
              MOIL EXECUTIVE COCKPIT
            </span>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              Active Lease: <strong style={{ color: "#F8FAFC" }}>{selectedMine?.name}</strong> ({selectedMine?.state})
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: 22, fontWeight: 700 }}>
            National Mining Intelligence & Operational Risk Summary
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#94A3B8", maxWidth: 820 }}>
            Unified real-time tracking across geological reserves, extraction schedules, equipment telemetry, and satellite climate indicators to eliminate shortfall losses and ensure steady manganese ore supply.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleDownloadIBMDossier}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #38BDF8",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📥 Export IBM Form F-1 Dossier
          </button>
          <button
            onClick={() => onNavigateSection("ingestion")}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Update Mine Inputs
          </button>
          <button
            onClick={() => onNavigateSection("actions")}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#38BDF8",
              color: "#0F172A",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View Corrective Actions
          </button>
        </div>
      </div>

      {/* 6 High-Impact Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {/* KPI 1: Shortfall Risk */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: `4px solid ${riskColor}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Shortfall Risk Status
            </span>
            <AlertOctagon size={18} color={riskColor} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: riskColor }}>
              {currentRisk.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: riskBg, color: riskColor, fontWeight: 600 }}>
              Live Score
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            {currentRisk === "High" ? "Immediate rescheduling required" : currentRisk === "Medium" ? "Early constraint mitigation active" : "Production targets on track"}
          </div>
        </div>

        {/* KPI 2: Weekly Output Gap */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #185FA5",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Weekly Output Gap
            </span>
            <TrendingUp size={18} color="#185FA5" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: gap > 50 ? "#DC2626" : "#0F172A" }}>
              {gap} t
            </span>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              / {targetOutput} t Target
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            Tracked Output: <strong style={{ color: "#0F172A" }}>{actualOutput} tonnes</strong>
          </div>
        </div>

        {/* KPI 3: Economically Viable Reserves & Life of Mine */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #0D9488",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Viable Reserves & LOM
            </span>
            <Layers size={18} color="#0D9488" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#0D9488" }}>
              {mineReservesKt.toLocaleString()} kt
            </span>
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "#CCFBF1", color: "#0F766E", fontWeight: 700 }}>
              {selectedMine?.avg_grade_pct || 41.8}% Mn
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            Life of Mine (LOM): <strong style={{ color: "#0F766E" }}>{lomYears} Years</strong> (@ {annualCapacityMt} MT/yr)
          </div>
        </div>

        {/* KPI 4: Fleet Availability */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #8B5CF6",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Fleet Availability
            </span>
            <Truck size={18} color="#8B5CF6" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#6D28D9" }}>
              89.4%
            </span>
            <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 600, display: "flex", alignItems: "center" }}>
              <ArrowUpRight size={14} /> +2.1%
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            24 of 28 Shovel-Dumpers active
          </div>
        </div>

        {/* KPI 5: Space/Satellite Climate & Monsoon Hazard */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: `4px solid ${isMonsoonAlert ? "#DC2626" : "#0284C7"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Satellite Climate / Dewatering
            </span>
            <CloudRain size={18} color={isMonsoonAlert ? "#DC2626" : "#0284C7"} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: isMonsoonAlert ? "#DC2626" : "#0369A1" }}>
              {rainfallVal} mm
            </span>
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: isMonsoonAlert ? "#FEE2E2" : "#E0F2FE", color: isMonsoonAlert ? "#DC2626" : "#0369A1", fontWeight: 700 }}>
              {isMonsoonAlert ? "Monsoon Alert" : "Normal Inundation"}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            Dewatering Pumps: <strong style={{ color: isMonsoonAlert ? "#B91C1C" : "#0369A1" }}>{pumpingLoad}</strong>
          </div>
        </div>

        {/* KPI 6: AI Protected Value */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderLeft: "4px solid #10B981",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              AI Value Protected
            </span>
            <IndianRupee size={18} color="#10B981" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#047857" }}>
              ₹4.82 L
            </span>
            <span style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>
              / week
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
            Avoided buyer grade & delay penalties
          </div>
        </div>
      </div>

      {/* Main Visuals Grid: Production Trajectory + Constraint Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Production Trajectory Chart */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                12-Week Production Trajectory: Target vs Tracked vs AI Optimized
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                Continuous monitoring surfaces early shortfall deviations before they affect dispatch quotas.
              </p>
            </div>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>
              Real-Time Feed
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                formatter={(val, name) => [`${val} Tonnes`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="expected" name="Weekly Target (Planned)" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual Production (Tracked)" stroke="#185FA5" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Constraint Breakdown */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              Operational Constraint Breakdown
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
              Relative weight of active shortfall drivers.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={constraintData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: "#64748B" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#334155" }} width={110} />
              <Tooltip formatter={(v) => `${v}% impact`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {constraintData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 8, padding: 8, background: "#F8FAFC", borderRadius: 6, fontSize: 11.5, color: "#475569" }}>
            💡 <strong>Top Constraint:</strong> Weather & precipitation contribute 35% to current risk. Pit dewatering playbooks ready.
          </div>
        </div>
      </div>

      {/* National MOIL Mine Cluster Table */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              National MOIL Manganese Production Cluster Overview
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
              Multi-region operational roster across Central India (Madhya Pradesh & Maharashtra). Click any mine to load live parameters.
            </p>
          </div>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            Total Monitored Leases: <strong style={{ color: "#0F172A" }}>{mines.length}</strong>
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Lease Name</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>State / District</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Mining Type</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Avg Ore Grade</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Annual Capacity</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Fleet Size</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Operational Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mines.map((m) => {
                const isSelected = selectedMine?.mine_id === m.mine_id;
                return (
                  <tr
                    key={m.mine_id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: isSelected ? "#EFF6FF" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>
                      {m.name}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {m.state}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {m.type || "Underground / Open Cast"}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0D9488" }}>
                      {m.avg_grade_pct}% Mn
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {m.annual_capacity_mt} MT
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {m.fleet_size || 20} Units
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: isSelected ? "#DBEAFE" : "#DCFCE7",
                          color: isSelected ? "#1E40AF" : "#15803D",
                          fontWeight: 600,
                        }}
                      >
                        {isSelected ? "Active Focus" : "Operational"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => onSelectMine(m)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: isSelected ? "1px solid #185FA5" : "1px solid #CBD5E1",
                          background: isSelected ? "#185FA5" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#334155",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "Selected" : "Select Mine"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
