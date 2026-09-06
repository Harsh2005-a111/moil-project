import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  CloudRain,
  Truck,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
import SectionReportButton from "./SectionReportButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function ScenarioSimulator({ selectedMine, inputs }) {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [rainSurge, setRainSurge] = useState(40);
  const [equipmentDrop, setEquipmentDrop] = useState(25);
  const [blastingDelay, setBlastingDelay] = useState(3.5);
  const [gradeVariation, setGradeVariation] = useState(10);
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region_name: selectedMine?.name || "Balaghat Mine",
        base_tonnage: 14000.0,
        rainfall_intensity_pct: parseFloat(rainSurge),
        equipment_failure_pct: parseFloat(equipmentDrop),
        blasting_delay_hours: parseFloat(blastingDelay),
        grade_variation_pct: parseFloat(gradeVariation),
      }),
    })
      .then((r) => r.json())
      .then(setSimResults)
      .catch((err) => console.error("Simulation error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedMine) {
      runSimulation();
    }
  }, [rainSurge, equipmentDrop, blastingDelay, gradeVariation, selectedMine]);

  const resetSliders = () => {
    setRainSurge(0);
    setEquipmentDrop(0);
    setBlastingDelay(1.0);
    setGradeVariation(0);
  };

  if (!selectedMine) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "50px 24px", border: "1px solid #E2E8F0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "inline-flex", padding: 14, borderRadius: "50%", background: "#EFF6FF", marginBottom: 16 }}>
          <RotateCcw size={36} color="#185FA5" />
        </div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          No MOIL Region Selected
        </h3>
        <p style={{ margin: "0 auto", fontSize: 13, color: "#64748B", maxWidth: 520, lineHeight: 1.6 }}>
          Select a MOIL Lease from the top dropdown to run interactive what-if constraint stress testing across monsoon surges, equipment failure, and blasting delays.
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Target Quota", tonnes: simResults?.base_target_tonnes || 14000, fill: "#94A3B8" },
    { name: "Unmitigated Yield", tonnes: simResults?.unmitigated_output_tonnes || 9800, fill: "#DC2626" },
    { name: "AI Recovered", tonnes: (simResults?.unmitigated_output_tonnes || 9800) + (simResults?.prescriptive_recovery_plan?.total_recoverable_tonnes || 2800), fill: "#16A34A" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sandbox Header */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#D85A30", color: "#fff" }}>
                WHAT-IF SIMULATOR
              </span>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                {selectedMine?.name} • Stress Testing Sandbox
              </span>
            </div>
            <h2 style={{ margin: "4px 0 0 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              MOIL Operational Constraint Simulation & Stress Testing
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
              Simulate extreme weather events, shovel fleet breakdowns, or blasting delays in real time to quantify production losses and test AI prescriptive recovery strategies.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={resetSliders}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#334155",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Constraints</span>
            </button>

            <SectionReportButton
              reportId="scenario_simulator"
              selectedMineName={selectedMine?.name}
              variant="amber"
              buttonText="Simulator Report"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Simulation Impact on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 16 }}>
        {/* Sliders Panel */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              Simulation Constraint Controls
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
              Drag sliders to induce operational stress scenarios.
            </p>
          </div>

          {/* Slider 1: Monsoon Rainfall */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                <CloudRain size={16} color="#0284C7" />
                Monsoon Precipitation Surge
              </span>
              <strong style={{ color: "#0284C7" }}>+{rainSurge}% mm/wk</strong>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={rainSurge}
              onChange={(e) => setRainSurge(e.target.value)}
              style={{ width: "100%", accentColor: "#0284C7", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94A3B8" }}>
              <span>Dry Baseline</span>
              <span>Heavy Monsoon (+150%)</span>
            </div>
          </div>

          {/* Slider 2: Equipment Drop */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                <Truck size={16} color="#EA580C" />
                Excavator / Shovel Fleet Outage
              </span>
              <strong style={{ color: "#EA580C" }}>-{equipmentDrop}% Availability</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={equipmentDrop}
              onChange={(e) => setEquipmentDrop(e.target.value)}
              style={{ width: "100%", accentColor: "#EA580C", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94A3B8" }}>
              <span>100% Fleet Ready</span>
              <span>Severe Breakdown (-60%)</span>
            </div>
          </div>

          {/* Slider 3: Blasting Delay */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={16} color="#8B5CF6" />
                Drill & Blast Safety Clearance Lag
              </span>
              <strong style={{ color: "#8B5CF6" }}>+{blastingDelay} hrs</strong>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={blastingDelay}
              onChange={(e) => setBlastingDelay(e.target.value)}
              style={{ width: "100%", accentColor: "#8B5CF6", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94A3B8" }}>
              <span>0h (Standard Cycle)</span>
              <span>12h Clearance Lag</span>
            </div>
          </div>

          {/* Slider 4: Grade Fluctuation */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={16} color="#10B981" />
                Sub-surface Grade Dilution
              </span>
              <strong style={{ color: "#10B981" }}>-{gradeVariation}% Mn</strong>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={gradeVariation}
              onChange={(e) => setGradeVariation(e.target.value)}
              style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94A3B8" }}>
              <span>Assayed Grade</span>
              <span>-25% Wall Rock Dilution</span>
            </div>
          </div>
        </div>

        {/* Simulation Output Dashboard */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Simulated Output & Shortfall Impact
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background:
                    simResults?.simulated_risk_level === "Critical"
                      ? "#FEF2F2"
                      : simResults?.simulated_risk_level === "High"
                      ? "#FFF1F2"
                      : "#F0FDF4",
                  color:
                    simResults?.simulated_risk_level === "Critical"
                      ? "#991B1B"
                      : simResults?.simulated_risk_level === "High"
                      ? "#DC2626"
                      : "#16A34A",
                }}
              >
                {simResults?.simulated_risk_level?.toUpperCase() || "EVALUATING"} RISK
              </span>
            </div>

            {/* Metric KPI cards inside simulator */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "14px 0" }}>
              <div style={{ padding: 10, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, color: "#64748B" }}>Base Target</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                  {simResults?.base_target_tonnes || 14000} t
                </div>
              </div>

              <div style={{ padding: 10, background: "#FEF2F2", borderRadius: 8, border: "1px solid #FCA5A5" }}>
                <div style={{ fontSize: 11, color: "#991B1B" }}>Unmitigated Shortfall</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#DC2626" }}>
                  {simResults?.shortfall_tonnes || 4200} t
                </div>
              </div>

              <div style={{ padding: 10, background: "#F0FDF4", borderRadius: 8, border: "1px solid #86EFAC" }}>
                <div style={{ fontSize: 11, color: "#166534" }}>AI Recoverable</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#16A34A" }}>
                  +{simResults?.prescriptive_recovery_plan?.total_recoverable_tonnes || 2856} t
                </div>
              </div>
            </div>

            {/* Comparison Bar Chart */}
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip formatter={(v) => `${v} Tonnes`} />
                <Bar dataKey="tonnes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Recovery Plan */}
          <div style={{ marginTop: 12, padding: 12, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="#185FA5" />
              <span>AI Automated Mitigation Strategy:</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11.5, color: "#475569" }}>
              <div>• Fleet Re-dispatch: <strong>+{simResults?.prescriptive_recovery_plan?.dynamic_fleet_redispatch_tonnes || 1285} t</strong></div>
              <div>• Stockpile Blending: <strong>+{simResults?.prescriptive_recovery_plan?.stockpile_blending_recovery_tonnes || 1000} t</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
