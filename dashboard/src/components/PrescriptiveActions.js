import React, { useState } from "react";
import {
  CheckCircle2,
  Calendar,
  Truck,
  Layers,
  Flame,
} from "lucide-react";

export default function PrescriptiveActions({
  selectedMine,
  inputs,
  prediction,
}) {
  const recommendations = prediction?.recommendations || [];
  const [completedActions, setCompletedActions] = useState({});

  const toggleAction = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const featureLabels = {
    "Ore_Grade_(%)": "Ore Grade (% Mn)",
    "Tonnage": "Block Volume / Tonnage",
    "Ore_Value_(¥/tonne)": "Ore Benchmark Value",
    "Mining_Cost_(¥)": "Mining Unit Cost",
    "Processing_Cost_(¥)": "Mineral Processing Cost",
    "Waste_Flag": "Waste / Overburden Dominance",
    "Rock_Type": "Rock Toughness / Lithology",
    "Rainfall": "Satellite Monsoon Precipitation",
    "Equipment_Downtime": "Shovel & Haul Fleet Breakdown",
    "Blasting_Delay": "Drill & Blast Clearance Lag",
    "Z": "Depth Elevation Pressure",
    "X": "Lateral Easting Boundary",
    "Y": "Lateral Northing Boundary",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Module C Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#7F77DD", color: "#fff" }}>
            MODULE C: PRESCRIPTIVE AI
          </span>
          <span style={{ fontSize: 13, color: "#64748B" }}>
            {selectedMine?.name} • Actionable Optimization Playbooks
          </span>
        </div>
        <h2 style={{ margin: "4px 0 0 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          Explainable AI (SHAP) Driver Attribution & Corrective Action Engine
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
          Translates machine learning shortfall drivers into concrete operational commands: dynamic schedule adjustments, blasting parameter tuning, and fleet re-allocation to ensure continuous ore availability.
        </p>
      </div>

      {/* SHAP Ranked Root Cause Drivers */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
            SHAP-Ranked Factor Contributions (Root Cause Ranking)
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
            Identifies which operational or environmental factors have the strongest mathematical pull on this week's prediction.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {recommendations.map((r, i) => {
            const isIncreasing = r.direction === "increasing";
            const label = featureLabels[r.driver] || r.driver.replace(/_/g, " ");
            const isDone = !!completedActions[i];

            return (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  background: isDone ? "#F0FDF4" : "#FFFFFF",
                  borderLeft: `4px solid ${isIncreasing ? "#DC2626" : "#16A34A"}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                      RANK #{i + 1} DRIVER
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: isIncreasing ? "#FEF2F2" : "#F0FDF4",
                        color: isIncreasing ? "#DC2626" : "#16A34A",
                      }}
                    >
                      {isIncreasing ? "Pushes Risk UP" : "Reduces Risk"}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                    {label}
                  </div>

                  <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "6px 0 12px 0" }}>
                    {r.action}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    SHAP Impact: <strong style={{ color: "#0F172A" }}>{r.shap_value}</strong>
                  </div>

                  <button
                    onClick={() => toggleAction(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: isDone ? "1px solid #16A34A" : "1px solid #CBD5E1",
                      background: isDone ? "#DCFCE7" : "#F8FAFC",
                      color: isDone ? "#15803D" : "#334155",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={13} color={isDone ? "#16A34A" : "#94A3B8"} />
                    <span>{isDone ? "Action Scheduled" : "Mark for Action"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Playbooks: Scheduling, Blasting, Fleet, Blending */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Playbook 1: Dynamic Mine Rescheduling */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 18,
            border: "1px solid #E2E8F0",
            borderTop: "3px solid #185FA5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Calendar size={18} color="#185FA5" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Playbook 1: Dynamic Mine Rescheduling
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "0 0 10px 0" }}>
            Re-sequence active extraction bench: Prioritize Sub-block <strong>BLK-701A (43.2% Mn)</strong> over waste-heavy blocks to insulate weekly yield against grade dilution.
          </p>
          <div style={{ padding: 10, background: "#EFF6FF", borderRadius: 8, fontSize: 12, color: "#1E40AF" }}>
            ⚡ <strong>Expected Recovery:</strong> +420 Tonnes / week | Projected Risk drops from High to Low.
          </div>
        </div>

        {/* Playbook 2: Blasting & Fragmentation Optimization */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 18,
            border: "1px solid #E2E8F0",
            borderTop: "3px solid #D85A30",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Flame size={18} color="#D85A30" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Playbook 2: Blasting Pattern & Powder Factor
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "0 0 10px 0" }}>
            For <strong>{inputs?.rock_type || "Magnetite"}</strong> hard rock formation: Adjust specific powder factor to <strong>0.44 kg/t</strong> and burden/spacing to <strong>3.2m x 3.8m</strong> to minimize flyrock clearance delays.
          </p>
          <div style={{ padding: 10, background: "#FFF7ED", borderRadius: 8, fontSize: 12, color: "#9A3412" }}>
            ⏱️ <strong>Downtime Saved:</strong> -2.5 hours blasting lag | Eliminates shovel loading queue bottleneck.
          </div>
        </div>

        {/* Playbook 3: Fleet Re-Dispatch Matrix */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 18,
            border: "1px solid #E2E8F0",
            borderTop: "3px solid #8B5CF6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Truck size={18} color="#8B5CF6" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Playbook 3: Shovel-Dumper Fleet Re-Allocation
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "0 0 10px 0" }}>
            Re-route <strong>3 Komatsu 35T Dumpers</strong> from overburden haulage route #2 to primary high-grade crusher dump to maintain full processing throughput.
          </p>
          <div style={{ padding: 10, background: "#F5F3FF", borderRadius: 8, fontSize: 12, color: "#6D28D9" }}>
            🚜 <strong>Haul Efficiency:</strong> +18.4% cycle speed | 0 crusher idle minutes.
          </div>
        </div>

        {/* Playbook 4: Stockpile Blending Recipe */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 18,
            border: "1px solid #E2E8F0",
            borderTop: "3px solid #0D9488",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Layers size={18} color="#0D9488" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Playbook 4: Precision Stockpile Blending Formula
            </h3>
          </div>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, margin: "0 0 10px 0" }}>
            Customer Spec Guarantee: Blend <strong>65% High Grade (44% Mn)</strong> + <strong>35% Medium Grade (36% Mn)</strong> at railway siding silo to deliver <strong>41.2% Mn</strong> dispatch.
          </p>
          <div style={{ padding: 10, background: "#F0FDFA", borderRadius: 8, fontSize: 12, color: "#0F766E" }}>
            💰 <strong>Penalty Avoidance:</strong> 100% contract grade adherence | Zero penalty risk.
          </div>
        </div>
      </div>
    </div>
  );
}
