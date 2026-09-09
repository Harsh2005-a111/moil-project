import React, { useState, useEffect } from "react";
import { Train, Navigation, ShieldCheck } from "lucide-react";
import SectionReportButton from "./SectionReportButton";
import { API_BASE as DEFAULT_API_BASE, numberOr } from "../config";

export default function SmelterLogisticsCard({
  selectedMine,
  inputs,
  API_BASE = DEFAULT_API_BASE,
}) {
  const [logisticsData, setLogisticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMine) {
      setLogisticsData(null);
      return;
    }

    const lat = numberOr(selectedMine.lat, 21.80);
    const lon = numberOr(selectedMine.lon, 80.15);
    const grade = numberOr(inputs?.ore_grade_pct, numberOr(selectedMine.avg_grade_pct, 38.5));
    const tonnage = inputs?.tonnage !== undefined && inputs?.tonnage !== null
      ? Math.round(numberOr(inputs.tonnage, 0) / 48)
      : 2500;
    const miningCost = numberOr(inputs?.mining_cost, 1200.0);
    const procCost = numberOr(inputs?.processing_cost, 650.0);

    setLoading(true);
    fetch(`${API_BASE}/api/logistics/smelter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mine_lat: lat,
        mine_lon: lon,
        ore_grade_pct: grade,
        ore_tonnage: tonnage,
        mining_cost_per_t: miningCost,
        beneficiation_cost_per_t: procCost,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success") {
          setLogisticsData(res.data);
        }
      })
      .catch((err) => console.error("Error fetching smelter logistics:", err))
      .finally(() => setLoading(false));
  }, [selectedMine, inputs, API_BASE]);

  if (!selectedMine) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0", textAlign: "center", color: "#64748B" }}>
        <Train size={28} color="#94A3B8" style={{ margin: "0 auto 8px auto", display: "block" }} />
        <strong style={{ fontSize: 13, color: "#334155" }}>Smelter Logistics & Net Smelter Return (NSR)</strong>
        <p style={{ fontSize: 12, margin: "4px 0 0 0" }}>Select a mine lease above to calculate freight routes to central Indian ferro-manganese plants.</p>
      </div>
    );
  }

  const isTerrainBarren = Boolean(
    selectedMine?.waste_flag === 1 ||
    selectedMine?.type?.includes("Barren") ||
    selectedMine?.type?.includes("Sterilized") ||
    selectedMine?.name?.toLowerCase().includes("connaught") ||
    inputs?.is_barren ||
    inputs?.waste_flag === 1 ||
    (inputs?.tonnage === 0 && inputs?.ore_grade_pct === 0)
  );

  if (isTerrainBarren) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 20,
          border: "1px solid #E2E8F0",
          borderTop: "3px solid #64748B",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Train size={20} color="#64748B" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1E293B" }}>
                Pit-to-Smelter Logistics: Inactive (Non-Extraction Terrain)
              </h3>
              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "#E2E8F0", color: "#475569" }}>
                EXEMPT
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748B" }}>
              No commercial manganese ore is procured or dispatched from this barren/urban sector. Freight routes and rake tariff schedules are inactive.
            </p>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "6px 12px", borderRadius: 6, border: "1px solid #A7F3D0" }}>
          ✓ Freight Exposure: ₹0.00
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0", borderTop: "3px solid #0D9488" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Train size={18} color="#0D9488" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
              Pit-to-Smelter Freight Logistics & Net Smelter Return (NSR)
            </h3>
          </div>
          <p style={{ margin: "3px 0 0 0", fontSize: 11.5, color: "#64748B" }}>
            Automated Indian Railways (SECR/CR/ECoR) rake tariff optimization & net realization model
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {logisticsData?.optimal_smelter && (
            <div style={{ background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} color="#059669" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>Optimal Rail Dispatch Route</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#047857" }}>
                  {logisticsData.optimal_smelter} — ₹{logisticsData.optimal_nsr_per_t}/t NSR
                </div>
              </div>
            </div>
          )}

          <SectionReportButton
            reportId="smelter_logistics"
            selectedMineName={selectedMine?.name}
            variant="emerald"
            buttonText="Logistics Report"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#64748B" }}>Computing freight tariffs and rail distances...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {logisticsData?.routes?.map((route, idx) => (
            <div
              key={idx}
              style={{
                background: route.is_optimal_route ? "#F0FDF4" : "#F8FAFC",
                border: route.is_optimal_route ? "2px solid #10B981" : "1px solid #E2E8F0",
                borderRadius: 10,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              {route.is_optimal_route && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 12,
                    background: "#10B981",
                    color: "#FFFFFF",
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 12,
                    letterSpacing: "0.04em",
                  }}
                >
                  RECOMMENDED DISPATCH
                </span>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Navigation size={13} color={route.is_optimal_route ? "#059669" : "#64748B"} />
                  <strong style={{ fontSize: 12, color: "#0F172A", lineHeight: 1.3 }}>
                    {route.plant_name}
                  </strong>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 8 }}>
                  Rail Head: <strong>{route.rail_head}</strong> ({route.distance_km} km)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, marginBottom: 8 }}>
                  <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 9.5, color: "#64748B" }}>Freight / tonne</div>
                    <strong style={{ color: "#D97706" }}>₹{route.freight_cost_per_tonne}</strong>
                  </div>
                  <div style={{ background: "#FFFFFF", padding: "6px 8px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 9.5, color: "#64748B" }}>Net NSR / tonne</div>
                    <strong style={{ color: route.net_smelter_return_per_t > 0 ? "#059669" : "#DC2626" }}>
                      ₹{route.net_smelter_return_per_t}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                <span style={{ color: "#475569" }}>Net Weekly Margin:</span>
                <strong style={{ color: route.total_net_margin_lakhs > 0 ? "#047857" : "#DC2626", fontSize: 12 }}>
                  ₹{route.total_net_margin_lakhs} Lakhs
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
