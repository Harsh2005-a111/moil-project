import React, { useState, useEffect } from "react";
import { Train, Navigation, ShieldCheck } from "lucide-react";

export default function SmelterLogisticsCard({
  selectedMine,
  inputs,
  API_BASE = "http://127.0.0.1:8000",
}) {
  const [logisticsData, setLogisticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedMine) {
      setLogisticsData(null);
      return;
    }

    const lat = selectedMine.lat || 21.80;
    const lon = selectedMine.lon || 80.15;
    const grade = inputs?.ore_grade_pct || selectedMine.avg_grade_pct || 38.5;
    const tonnage = inputs?.tonnage ? Math.round(inputs.tonnage / 48) : 2500;
    const miningCost = inputs?.mining_cost || 1200.0;
    const procCost = inputs?.processing_cost || 650.0;

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
