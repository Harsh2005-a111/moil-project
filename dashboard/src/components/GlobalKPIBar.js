import React from "react";
import {
  AlertOctagon,
  TrendingUp,
  Layers,
  Truck,
  CloudRain,
  IndianRupee,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

export default function GlobalKPIBar({
  selectedMine,
  inputs,
  prediction,
  trend,
}) {
  // Lease-scoped KPIs only — never treat orphan inputs / Balaghat fallbacks as an active selection.
  const isSelected = Boolean(selectedMine);
  const isBarren = isSelected && (
    (selectedMine && (selectedMine.waste_flag === 1 || selectedMine.type?.includes("Barren") || selectedMine.type?.includes("Sterilized"))) ||
    inputs?.is_barren === true ||
    inputs?.waste_flag === 1 ||
    (inputs?.ore_grade_pct === 0 && inputs?.tonnage === 0)
  );

  // 1. Shortfall Risk Status
  let currentRisk = "--";
  let riskColor = "#94A3B8";
  let riskBg = "#F1F5F9";
  let riskSubtitle = "Select a region to evaluate risk";

  if (isSelected) {
    if (isBarren) {
      currentRisk = "STERILIZED";
      riskColor = "#475569";
      riskBg = "#F1F5F9";
      riskSubtitle = "Sterilized Non-Mineralized Ground (UNFC 777)";
      } else {
        const rain = inputs?.rainfall_mm ?? selectedMine.inputs?.rainfall_mm;
        const equip = inputs?.equipment_availability_pct ?? selectedMine.inputs?.equipment_availability_pct;
        const downtime = inputs?.unscheduled_downtime_hours ?? selectedMine.inputs?.unscheduled_downtime_hours;
        const delay = inputs?.blast_cycle_delay_hours ?? selectedMine.inputs?.blast_cycle_delay_hours;

        if (prediction?.risk_level) {
          currentRisk = prediction.risk_level.toUpperCase();
        } else if (rain == null && equip == null) {
          currentRisk = "--";
          riskSubtitle = "Run evaluation to compute shortfall risk";
        } else {
          const rainVal = rain ?? 0;
          const equipVal = equip ?? 100;
          const downtimeVal = downtime ?? 0;
          const delayVal = delay ?? 0;

          if (rainVal > 60 || equipVal < 75 || downtimeVal > 5.0 || delayVal > 3.0) {
            currentRisk = "HIGH";
          } else if (rainVal > 40 || equipVal < 85 || downtimeVal > 3.5 || delayVal > 2.0) {
            currentRisk = "MEDIUM";
          } else {
            currentRisk = "LOW";
          }
        }

        if (currentRisk === "HIGH") {
          riskColor = "#DC2626";
          riskBg = "#FEF2F2";
          riskSubtitle = "Immediate intervention & reallocation required";
        } else if (currentRisk === "MEDIUM") {
          riskColor = "#D97706";
          riskBg = "#FFFBEB";
          riskSubtitle = "Early constraint mitigation active";
        } else if (currentRisk === "LOW") {
          riskColor = "#16A34A";
          riskBg = "#F0FDF4";
          riskSubtitle = "Production & haul schedules on track";
        }
      }
  }

  // 2. Weekly Output Gap
  let gapDisplay = "--";
  let targetDisplay = "--";
  let gapSubtitle = "Awaiting lease selection";
  let gapVal = 0;

  if (isSelected) {
    if (isBarren) {
      gapDisplay = "0 t";
      targetDisplay = "0 t Target";
      gapSubtitle = "Excluded from extraction quotas";
    } else {
      const lastTrend = trend && trend.length ? trend[trend.length - 1] : null;
      const baseTarget = inputs?.tonnage
        ? Math.round(inputs.tonnage / 48)
        : (lastTrend ? lastTrend.expected : null);

      if (baseTarget == null) {
        gapDisplay = "--";
        targetDisplay = "";
        gapSubtitle = "Run evaluation to compute output gap";
      } else {
        const rain = inputs?.rainfall_mm ?? selectedMine.inputs?.rainfall_mm ?? 0;
        const equip = inputs?.equipment_availability_pct ?? selectedMine.inputs?.equipment_availability_pct ?? 100;
        const downtime = inputs?.unscheduled_downtime_hours ?? selectedMine.inputs?.unscheduled_downtime_hours ?? 0;
        const delay = inputs?.blast_cycle_delay_hours ?? selectedMine.inputs?.blast_cycle_delay_hours ?? 0;

        const rainPenalty = rain > 50 ? Math.round((rain - 50) * 3.5) : 0;
        const equipPenalty = equip < 88 ? Math.round((88 - equip) * 7.0) : 0;
        const downtimePenalty = downtime > 3.0 ? Math.round((downtime - 3.0) * 18.0) : 0;
        const delayPenalty = delay > 1.5 ? Math.round((delay - 1.5) * 22.0) : 0;

        const totalPenalty = rainPenalty + equipPenalty + downtimePenalty + delayPenalty;
        const actualOutput = lastTrend?.actual != null
          ? lastTrend.actual
          : Math.max(0, baseTarget - totalPenalty);
        gapVal = Math.max(0, baseTarget - actualOutput);

        gapDisplay = `${gapVal} t`;
        targetDisplay = `/ ${baseTarget} t Target`;
        gapSubtitle = `Tracked Output: ${actualOutput.toLocaleString()} tonnes`;
      }
    }
  }

  // 3. Viable Reserves & LOM
  let reservesDisplay = "--";
  let gradeBadge = "--% Mn";
  let lomSubtitle = "Select a region to load reserves";

  if (isSelected) {
    if (isBarren) {
      reservesDisplay = "0 kt";
      gradeBadge = "0.0% Mn";
      lomSubtitle = "Non-mineralized country rock / alluvium";
    } else {
      const reservesKt = inputs?.tonnage
        ? Math.round(inputs.tonnage / 1000)
        : (selectedMine.predicted_reserves_kt ?? null);
      if (reservesKt === null) {
        reservesDisplay = "--";
        gradeBadge = "--% Mn";
        lomSubtitle = "Reserves pending evaluation";
      } else {
        const grade = inputs?.ore_grade_pct !== undefined ? inputs.ore_grade_pct : (selectedMine.avg_grade_pct ?? null);
        const annualCapacityMt = selectedMine.annual_capacity_mt || 0.35;
        const annualCapacityKt = annualCapacityMt * 1000;
        const lomYears = (reservesKt / Math.max(10, annualCapacityKt)).toFixed(1);

        reservesDisplay = `${Number(reservesKt).toLocaleString()} kt`;
        if (grade === null || grade === undefined) {
          gradeBadge = "--% Mn";
          lomSubtitle = `Life of Mine (LOM): ${lomYears} Yrs`;
        } else {
          const gradeCategory = grade >= 25.0 ? "Marketable" : grade >= 10.0 ? "Beneficiable (MR)" : "Waste";
          gradeBadge = `${grade}% Mn • ${gradeCategory}`;
          lomSubtitle = grade >= 25.0
            ? `Life of Mine (LOM): ${lomYears} Yrs (Direct Saleable Ore)`
            : grade >= 10.0
            ? `Beneficiable Ore (10-25% Mn - Mandatory Conservation per IBM MCDR 2017)`
            : `Mineral Waste / Overburden (<10% Mn Statutory Cutoff)`;
        }
      }
    }
  }

  // 4. Fleet Availability
  let fleetDisplay = "--";
  let fleetBadge = "--";
  let fleetSubtitle = "Awaiting equipment telemetry";

  if (isSelected) {
    if (isBarren) {
      fleetDisplay = "0.0%";
      fleetBadge = "Standby";
      fleetSubtitle = "No mining fleet assigned to this zone";
    } else {
      const equip = inputs?.equipment_availability_pct !== undefined
        ? inputs.equipment_availability_pct
        : (selectedMine.inputs?.equipment_availability_pct ?? null);
      if (equip === null) {
        fleetDisplay = "--";
        fleetBadge = "--";
        fleetSubtitle = "No fleet telemetry for this lease";
      } else {
        const fleetSize = selectedMine.fleet_size || 24;
        const activeHaulers = Math.round(fleetSize * (equip / 100.0));

        fleetDisplay = `${Number(equip).toFixed(1)}%`;
        fleetBadge = equip >= 88 ? "+2.1%" : "-3.4%";
        fleetSubtitle = `${activeHaulers} of ${fleetSize} Shovel-Dumpers active`;
      }
    }
  }

  // 5. Satellite Climate / Dewatering
  let climateDisplay = "--";
  let climateBadge = "--";
  let climateSubtitle = "No satellite weather linked";
  let isMonsoonWarning = false;

  if (isSelected) {
    const rain = inputs?.rainfall_mm !== undefined
      ? inputs.rainfall_mm
      : (selectedMine.inputs?.rainfall_mm ?? selectedMine.avg_rainfall_mm ?? null);
    if (rain === null) {
      climateDisplay = "--";
      climateBadge = "--";
      climateSubtitle = "No satellite weather linked";
    } else {
      isMonsoonWarning = rain > 50.0;

      climateDisplay = `${rain} mm`;
      climateBadge = rain > 50 ? "Monsoon Alert" : rain > 35 ? "Elevated Rain" : "Normal";
      climateSubtitle = rain > 50
        ? "Dewatering: 3,850 GPM (High Pit Inundation)"
        : rain > 35
        ? "Dewatering: 2,100 GPM (Active Monitoring)"
        : "Dewatering Pumps: 1,200 GPM (Nominal)";
    }
  }

  // 6. AI Value Protected / At Risk
  let valueDisplay = "₹ --";
  let valueSubtitle = "Calculated on active lease evaluation";

  if (isSelected) {
    if (isBarren) {
      valueDisplay = "₹ 0.0 L";
      valueSubtitle = "Zero capital exposure (Sterilized zone)";
    } else {
      const baseTon = inputs?.tonnage ? inputs.tonnage / 50.0 : 1400;
      const oreVal = inputs?.ore_value_per_tonne || 275.0;
      const weeklyValLakhs = (baseTon * oreVal) / 100000.0;

      if (currentRisk === "HIGH") {
        valueDisplay = `₹${(weeklyValLakhs * 0.15).toFixed(2)} L`;
        valueSubtitle = "Capital at risk from constraint bottlenecks";
      } else {
        valueDisplay = `₹${(weeklyValLakhs * 0.08).toFixed(2)} L / wk`;
        valueSubtitle = "Value protected via AI proactive dispatch";
      }
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
        gap: 12,
      }}
    >
      {/* KPI 1: Shortfall Risk */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: `4px solid ${riskColor}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Shortfall Risk Status
          </span>
          {isBarren ? <ShieldAlert size={16} color={riskColor} /> : <AlertOctagon size={16} color={riskColor} />}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: riskColor }}>
            {currentRisk}
          </span>
          {isSelected && !isBarren && (
            <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: riskBg, color: riskColor, fontWeight: 700 }}>
              Live
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {riskSubtitle}
        </div>
      </div>

      {/* KPI 2: Weekly Output Gap */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: isSelected && !isBarren ? "4px solid #185FA5" : "4px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Weekly Output Gap
          </span>
          <TrendingUp size={16} color={isSelected && !isBarren ? "#185FA5" : "#94A3B8"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: gapVal > 50 ? "#DC2626" : isSelected ? "#0F172A" : "#94A3B8" }}>
            {gapDisplay}
          </span>
          <span style={{ fontSize: 11.5, color: "#64748B" }}>
            {targetDisplay}
          </span>
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {gapSubtitle}
        </div>
      </div>

      {/* KPI 3: Viable Reserves & LOM */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: isSelected && !isBarren ? "4px solid #0D9488" : "4px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Viable Reserves & LOM
          </span>
          <Layers size={16} color={isSelected && !isBarren ? "#0D9488" : "#94A3B8"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: isSelected && !isBarren ? "#0D9488" : "#94A3B8" }}>
            {reservesDisplay}
          </span>
          {isSelected && (
            <span
              style={{
                fontSize: 10.5,
                padding: "2px 6px",
                borderRadius: 4,
                background: isBarren ? "#F1F5F9" : "#CCFBF1",
                color: isBarren ? "#475569" : "#0F766E",
                fontWeight: 700,
              }}
            >
              {gradeBadge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lomSubtitle}
        </div>
      </div>

      {/* KPI 4: Fleet Availability */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: isSelected && !isBarren ? "4px solid #8B5CF6" : "4px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Fleet Availability
          </span>
          <Truck size={16} color={isSelected && !isBarren ? "#8B5CF6" : "#94A3B8"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: isSelected && !isBarren ? "#6D28D9" : "#94A3B8" }}>
            {fleetDisplay}
          </span>
          {isSelected && !isBarren && (
            <span
              style={{
                fontSize: 10.5,
                color: fleetBadge.startsWith("+") ? "#16A34A" : "#DC2626",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArrowUpRight size={13} /> {fleetBadge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {fleetSubtitle}
        </div>
      </div>

      {/* KPI 5: Satellite Climate & Dewatering */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: isSelected ? (isMonsoonWarning ? "4px solid #DC2626" : "4px solid #0284C7") : "4px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Satellite Precipitation
          </span>
          <CloudRain size={16} color={isSelected ? (isMonsoonWarning ? "#DC2626" : "#0284C7") : "#94A3B8"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: isSelected ? (isMonsoonWarning ? "#DC2626" : "#0F172A") : "#94A3B8" }}>
            {climateDisplay}
          </span>
          {isSelected && (
            <span
              style={{
                fontSize: 10.5,
                padding: "2px 6px",
                borderRadius: 4,
                background: isMonsoonWarning ? "#FEF2F2" : "#E0F2FE",
                color: isMonsoonWarning ? "#DC2626" : "#0369A1",
                fontWeight: 700,
              }}
            >
              {climateBadge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {climateSubtitle}
        </div>
      </div>

      {/* KPI 6: Value Protected / At Stake */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 10,
          padding: "13px 15px",
          border: "1px solid #E2E8F0",
          borderLeft: isSelected && !isBarren ? "4px solid #059669" : "4px solid #CBD5E1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Operational Value
          </span>
          <IndianRupee size={16} color={isSelected && !isBarren ? "#059669" : "#94A3B8"} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: isSelected && !isBarren ? "#059669" : "#94A3B8" }}>
            {valueDisplay}
          </span>
        </div>
        <div style={{ fontSize: 11, color: isSelected ? "#64748B" : "#94A3B8", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {valueSubtitle}
        </div>
      </div>
    </div>
  );
}
