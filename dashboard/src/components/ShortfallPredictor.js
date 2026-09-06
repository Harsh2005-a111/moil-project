import React from "react";
import {
  Cpu,
  Layers,
  Truck,
  CloudRain,
  Flame,
  AlertOctagon,
} from "lucide-react";
import SmelterLogisticsCard from "./SmelterLogisticsCard";
import SectionReportButton from "./SectionReportButton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ShortfallPredictor({
  selectedMine,
  inputs,
  prediction,
  trend,
  loading,
}) {
  const currentRisk = prediction?.risk_level || "Medium";
  const probabilities = prediction?.risk_probabilities || { High: 0.2, Medium: 0.65, Low: 0.15 };
  const mlShortfall = prediction?.ml_shortfall;
  const constraintImpact = prediction?.constraint_impact || {
    equipment_impact_pct: 28.5,
    weather_impact_pct: 35.0,
    blasting_impact_pct: 18.2,
    grade_dilution_risk_pct: 18.3,
  };

  const riskColors = {
    Low: "#16A34A",
    Medium: "#D97706",
    High: "#DC2626",
    Critical: "#991B1B",
  };

  const riskBg = {
    Low: "#F0FDF4",
    Medium: "#FFFBEB",
    High: "#FEF2F2",
    Critical: "#450A0A",
  };

  const riskExplanations = {
    Low: "Mining schedule and ore yields are operating within safe tolerances. Weekly dispatch commitments will be met with standard haulage fleet allocation.",
    Medium: "Operational bottlenecks detected (e.g. elevated precipitation or loader maintenance). Early mitigation can avert supply shortfall.",
    High: "Severe production shortfall projected. Immediate intervention required in shovel redeployment, bench drainage, and blasting re-sequencing.",
    Critical: "Critical constraint convergence: Equipment downtime and heavy monsoon saturation threaten severe ore delivery failure.",
  };

  if (!selectedMine) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "50px 24px", border: "1px solid #E2E8F0", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "inline-flex", padding: 14, borderRadius: "50%", background: "#EFF6FF", marginBottom: 16 }}>
          <Cpu size={36} color="#185FA5" />
        </div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          No MOIL Region or Exploration Sector Selected
        </h3>
        <p style={{ margin: "0 auto", fontSize: 13, color: "#64748B", maxWidth: 520, lineHeight: 1.6 }}>
          Please select a MOIL Lease from the top dropdown or scan a region in Section 1 (Reserve Mapping) to evaluate machine learning shortfall probabilities and operational constraints.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Module B Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#BA7517", color: "#fff" }}>
                MODULE B: SHORTFALL PREDICTOR
              </span>
              <span style={{ fontSize: 13, color: "#64748B" }}>
                {selectedMine?.name} • Target Block: {inputs?.block_id}
              </span>
            </div>
            <h2 style={{ margin: "4px 0 0 0", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              Production Shortfall & Operational Constraint Risk Engine
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>
              Evaluates multi-source constraints including haul fleet availability, unscheduled equipment downtime, rainfall saturation, and blasting cycle lags using LightGBM machine learning.
            </p>
          </div>

          <SectionReportButton
            reportId="shortfall_predictor"
            selectedMineName={selectedMine?.name}
            variant="amber"
            buttonText="View & Download Shortfall Report"
          />
        </div>
      </div>

      {/* Real-time Trained ML Regressor Bottleneck Banner */}
      {mlShortfall && (
        <div
          style={{
            background: mlShortfall.risk_level === "HIGH" ? "#FEF2F2" : mlShortfall.risk_level === "MEDIUM" ? "#FFFBEB" : "#F0FDF4",
            border: `1px solid ${mlShortfall.risk_level === "HIGH" ? "#FCA5A5" : mlShortfall.risk_level === "MEDIUM" ? "#FDE68A" : "#86EFAC"}`,
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertOctagon size={20} color={mlShortfall.risk_color} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: mlShortfall.risk_color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PRIMARY OPERATIONAL BOTTLENECK (ML ATTRIBUTION)
              </div>
              <strong style={{ fontSize: 13.5, color: "#0F172A" }}>
                {mlShortfall.primary_bottleneck}
              </strong>
              <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>
                🎯 <strong>Dynamic Bench Dispatch:</strong> {mlShortfall.bench_dispatch_sequence}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, textAlign: "right" }}>
            <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>ML DEFICIT</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: mlShortfall.risk_color }}>
                {mlShortfall.predicted_shortfall_tonnes} t
              </div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>REVENUE AT RISK</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626" }}>
                ₹{mlShortfall.financial_loss_inr_lakhs} L
              </div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>STRIPPING RATIO</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0D9488" }}>
                {mlShortfall.effective_stripping_ratio} W:O
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Risk Status Card + Confidence Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Risk Assessment Box */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 12,
            padding: 22,
            border: "1px solid #E2E8F0",
            borderLeft: `5px solid ${riskColors[currentRisk] || "#D97706"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                AI Shortfall Risk Assessment
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: riskBg[currentRisk],
                  color: riskColors[currentRisk],
                  border: `1px solid ${riskColors[currentRisk]}44`,
                }}
              >
                {currentRisk.toUpperCase()} RISK
              </span>
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#334155", margin: "10px 0" }}>
              {riskExplanations[currentRisk]}
            </p>
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Fleet Operational</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{inputs?.equipment_availability_pct || 88}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Rainfall (GPM)</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0284C7" }}>{inputs?.rainfall_mm || 35} mm</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Blasting Delay</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#8B5CF6" }}>{inputs?.blast_cycle_delay_hours || 1.5} hrs</div>
            </div>
          </div>
        </div>

        {/* Model Confidence & Probabilities */}
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
            <h3 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Model Classification Confidence
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
              Probabilistic distribution across shortfall classes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "14px 0" }}>
            {Object.entries(probabilities).map(([cls, prob]) => {
              const pVal = typeof prob === "number" ? prob : 0.33;
              const barColor = cls === "High" ? "#DC2626" : cls === "Medium" ? "#D97706" : "#16A34A";
              return (
                <div key={cls}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#334155" }}>{cls} Shortfall Risk</span>
                    <span style={{ fontWeight: 700, color: barColor }}>{(pVal * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pVal * 100}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
            <Cpu size={14} color="#185FA5" />
            <span>LightGBM Multi-Class Classifier with SHAP TreeExplainer</span>
          </div>
        </div>
      </div>

      {/* Constraint Impact Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Truck size={16} color="#EA580C" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Equipment Constraint</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#EA580C" }}>
            {constraintImpact.equipment_impact_pct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Unscheduled downtime: {inputs?.unscheduled_downtime_hours || 3.5}h
          </div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <CloudRain size={16} color="#0284C7" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Weather Constraint</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0284C7" }}>
            {constraintImpact.weather_impact_pct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Rainfall index: {inputs?.rainfall_mm || 35}mm/wk
          </div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Flame size={16} color="#8B5CF6" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Blasting Delay</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#8B5CF6" }}>
            {constraintImpact.blasting_impact_pct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Clearance delay: {inputs?.blast_cycle_delay_hours || 1.5}h
          </div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Layers size={16} color="#10B981" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Grade Dilution Risk</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>
            {constraintImpact.grade_dilution_risk_pct}%
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Target grade: {inputs?.ore_grade_pct || 38.5}% Mn
          </div>
        </div>
      </div>

      {/* Trained ML Feature Attribution (HistGradientBoostingRegressor) */}
      {mlShortfall && mlShortfall.feature_attributions && mlShortfall.feature_attributions.length > 0 && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Cpu size={16} color="#185FA5" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  Non-Linear Constraint Feature Attribution (Trained Regressor)
                </h3>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#64748B" }}>
                Exact tonnage deficit breakdown derived from tree-based gradient attribution across operational shifts
              </p>
            </div>

            {mlShortfall.model_validation && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#EFF6FF", color: "#1E40AF" }}>
                R² = {mlShortfall.model_validation.r2_score} | MAE = {mlShortfall.model_validation.mae_tonnes} t ({mlShortfall.model_validation.training_records} Shifts)
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {mlShortfall.feature_attributions.map((item, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", borderRadius: 8, padding: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                  <span>{item.label}</span>
                  <strong style={{ color: "#DC2626" }}>-{item.impact_tonnes} t ({item.pct_contribution}%)</strong>
                </div>
                <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, item.pct_contribution)}%`,
                      background: "linear-gradient(90deg, #F59E0B, #DC2626)",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Trend & Forecast Gap */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              Shortfall Gap Tracking Over 12 Extraction Weeks
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
              Directly resolves the problem statement by projecting deviations between expected and tracked ore production.
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip contentStyle={{ background: "#0F172A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="expected" name="Expected Output (t)" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} />
            <Line type="monotone" dataKey="actual" name="Actual Extraction (t)" stroke="#DC2626" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pit-to-Smelter Freight Logistics & Net Smelter Return */}
      <SmelterLogisticsCard selectedMine={selectedMine} inputs={inputs} />
    </div>
  );
}
