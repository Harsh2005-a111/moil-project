import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import DashboardKPIs from "./components/DashboardKPIs";
import ReserveIngestionHub from "./components/ReserveIngestionHub";
import ShortfallPredictor from "./components/ShortfallPredictor";
import PrescriptiveActions from "./components/PrescriptiveActions";
import ScenarioSimulator from "./components/ScenarioSimulator";
import { MOIL_MINES } from "./data/moilData";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function App() {
  const [activeSection, setActiveSection] = useState("kpis");
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;
  const [mines, setMines] = useState(MOIL_MINES);
  const [selectedMine, setSelectedMine] = useState(MOIL_MINES[0]);
  const [inputs, setInputs] = useState(MOIL_MINES[0].inputs);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [trend, setTrend] = useState([]);

  // Fetch live mines & custom saved regions on initial mount
  useEffect(() => {
    // 1. Load any locally stored custom regions
    let localCustom = [];
    try {
      localCustom = JSON.parse(localStorage.getItem("MOIL_CUSTOM_REGIONS") || "[]");
    } catch (e) {
      console.warn("Could not read local regions:", e);
    }

    Promise.all([
      fetch(`${API_BASE}/api/mines`).then((r) => (r.ok ? r.json() : { mines: [] })).catch(() => ({ mines: [] })),
      fetch(`${API_BASE}/api/regions`).then((r) => (r.ok ? r.json() : { regions: [] })).catch(() => ({ regions: [] })),
    ])
      .then(([minesData, regionsData]) => {
        let baseMines = MOIL_MINES;
        if (minesData.mines && minesData.mines.length > 0) {
          baseMines = minesData.mines.map((apiMine) => {
            const match = MOIL_MINES.find((m) => m.mine_id === apiMine.mine_id);
            return {
              ...match,
              ...apiMine,
              inputs: match?.inputs || {
                block_id: `BLK-${apiMine.name.slice(0, 3).toUpperCase()}-01`,
                x: 180,
                y: 320,
                z: 80,
                rock_type: "Magnetite",
                ore_grade_pct: apiMine.avg_grade_pct || 41.0,
                tonnage: 125000,
                ore_value_per_tonne: 275,
                mining_cost: 46,
                processing_cost: 30,
                waste_flag: 0,
                equipment_availability_pct: 88,
                unscheduled_downtime_hours: 3.5,
                blast_cycle_delay_hours: 1.5,
                rainfall_mm: apiMine.avg_rainfall_mm ? apiMine.avg_rainfall_mm / 3.0 : 38.0,
                soil_moisture: 0.28,
                ndvi: 0.35,
                land_temp_c: 33.5,
              },
            };
          });
        }

        // Format backend custom regions
        const apiCustom = (regionsData.regions || []).map((r) => ({
          mine_id: `SAT-${(r.region_name || "Zone").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4)}`,
          name: r.region_name,
          state: "Custom / Satellite Prospect",
          district: "Exploration Zone",
          lat: r.latitude || 21.80,
          lon: r.longitude || 80.15,
          lease_area_ha: Math.round((r.estimated_reserves_kt || 1000) * 0.18),
          annual_capacity_mt: Number(((r.estimated_reserves_kt || 1000) / 4000.0).toFixed(2)),
          primary_rock: r.host_lithology || "Braunite",
          avg_grade_pct: r.estimated_grade_pct || 40.0,
          avg_rainfall_mm: (r.rainfall_mm_weekly || 35.0) * 3.0,
          fleet_size: 16,
          type: "Custom Lease",
          predicted_reserves_kt: r.estimated_reserves_kt || 1200,
          inputs: {
            block_id: `BLK-${r.region_name.slice(0, 3).toUpperCase()}-01`,
            x: 180,
            y: 320,
            z: r.elevation_m || 75,
            rock_type: r.host_lithology?.includes("Braunite") ? "Braunite" : "Magnetite",
            ore_grade_pct: r.estimated_grade_pct || 40.0,
            tonnage: (r.estimated_reserves_kt || 1200) * 1000.0,
            ore_value_per_tonne: 280.0,
            mining_cost: 45.0,
            processing_cost: 29.0,
            waste_flag: 0,
            equipment_availability_pct: 88.0,
            unscheduled_downtime_hours: 3.5,
            blast_cycle_delay_hours: 1.5,
            rainfall_mm: r.rainfall_mm_weekly || 38.0,
            soil_moisture: r.soil_moisture || 0.28,
            ndvi: r.ndvi || 0.35,
            land_temp_c: r.land_surface_temp_c || 33.5,
          },
        }));

        // Merge and deduplicate by region name
        const combinedCustom = [...apiCustom, ...localCustom];
        const uniqueCustom = [];
        const seenNames = new Set(baseMines.map((m) => m.name.toLowerCase()));

        for (const c of combinedCustom) {
          if (!seenNames.has(c.name.toLowerCase())) {
            seenNames.add(c.name.toLowerCase());
            uniqueCustom.push(c);
          }
        }

        const fullRoster = [...uniqueCustom, ...baseMines];
        setMines(fullRoster);
        setSelectedMine(fullRoster[0]);
        setInputs(fullRoster[0].inputs);
        setApiOnline(true);
      })
      .catch((err) => {
        console.error("Error initializing roster:", err);
        setApiOnline(false);
      });
  }, []);

  // Run ML Prediction whenever selectedMine or inputs change
  useEffect(() => {
    runEvaluation();
  }, [selectedMine]);

  const runEvaluation = () => {
    if (!inputs) return;
    setLoading(true);

    const payload = {
      region_name: selectedMine?.name || "Balaghat Mine",
      block_id: inputs.block_id || "BLK-01",
      x: parseFloat(inputs.x) || 150.0,
      y: parseFloat(inputs.y) || 320.0,
      z: parseFloat(inputs.z) || 85.0,
      rock_type: inputs.rock_type || "Magnetite",
      ore_grade_pct: parseFloat(inputs.ore_grade_pct) || 38.5,
      tonnage: parseFloat(inputs.tonnage) || 120000.0,
      ore_value_per_tonne: parseFloat(inputs.ore_value_per_tonne) || 260.0,
      mining_cost: parseFloat(inputs.mining_cost) || 45.0,
      processing_cost: parseFloat(inputs.processing_cost) || 28.0,
      waste_flag: parseInt(inputs.waste_flag) || 0,
      equipment_availability_pct: parseFloat(inputs.equipment_availability_pct) || 88.0,
      unscheduled_downtime_hours: parseFloat(inputs.unscheduled_downtime_hours) || 3.5,
      blast_cycle_delay_hours: parseFloat(inputs.blast_cycle_delay_hours) || 1.5,
      rainfall_mm: parseFloat(inputs.rainfall_mm) || 38.0,
      soil_moisture: parseFloat(inputs.soil_moisture) || 0.28,
      ndvi: parseFloat(inputs.ndvi) || 0.35,
      land_temp_c: parseFloat(inputs.land_temp_c) || 33.5,
    };

    fetch(`${API_BASE}/api/predict/shortfall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setPrediction(data);
        setApiOnline(true);
      })
      .catch((err) => {
        console.error("Predict shortfall error:", err);
        setApiOnline(false);
      })
      .finally(() => setLoading(false));

    // Update 12-week baseline trend
    const baseTarget = 1100 + (Math.abs(hashString(selectedMine?.name || "Balaghat")) % 400);
    const weeklyTrend = Array.from({ length: 12 }, (_, i) => {
      const target = baseTarget + i * 15;
      const penalty = (inputs.rainfall_mm > 60 ? 120 : 40) + (inputs.equipment_availability_pct < 80 ? 110 : 20);
      const actual = Math.round(target - penalty * (0.4 + Math.sin(i + 1) * 0.3));
      return {
        week: `W${i + 1}`,
        expected: target,
        actual: Math.max(0, actual),
      };
    });
    setTrend(weeklyTrend);
  };

  const handleSelectMine = (mine) => {
    setSelectedMine(mine);
    if (mine.inputs) {
      setInputs(mine.inputs);
    }
  };

  const handleAddCustomRegion = (newMine) => {
    setMines((prev) => {
      const filtered = prev.filter((m) => m.name.toLowerCase() !== newMine.name.toLowerCase());
      const updated = [newMine, ...filtered];
      try {
        localStorage.setItem("MOIL_CUSTOM_REGIONS", JSON.stringify(updated.filter((m) => m.type === "Custom Lease" || m.type === "Satellite Prospect")));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
      return updated;
    });
    setSelectedMine(newMine);
    if (newMine.inputs) {
      setInputs(newMine.inputs);
    }
    setActiveSection("reserves");
  };

  const handleChangeInput = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLoadPreset = (presetData) => {
    setInputs(presetData);
    const match = mines.find((m) => m.name === presetData.region_name);
    if (match) setSelectedMine(match);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Expandable / Collapsible Left Vertical Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isPinned={isSidebarPinned}
        onTogglePin={() => setIsSidebarPinned(!isSidebarPinned)}
        isHovered={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      {/* Main Content Layout with smooth margin offset so content shifts on hover */}
      <div
        style={{
          flex: 1,
          marginLeft: isSidebarExpanded ? 270 : 76,
          transition: "margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top Navbar */}
        <Navbar
          activeSection={activeSection}
          mines={mines}
          selectedMine={selectedMine}
          onSelectMine={handleSelectMine}
          onAddCustomRegion={handleAddCustomRegion}
          onRefresh={runEvaluation}
          loading={loading}
          apiOnline={apiOnline}
        />

        {/* Section Viewport Router */}
        <main style={{ padding: "24px 28px", flex: 1 }}>
          {activeSection === "kpis" && (
            <DashboardKPIs
              mines={mines}
              selectedMine={selectedMine}
              prediction={prediction}
              trend={trend}
              onSelectMine={handleSelectMine}
              onNavigateSection={setActiveSection}
            />
          )}

          {(activeSection === "reserves" || activeSection === "ingestion") && (
            <ReserveIngestionHub
              mines={mines}
              selectedMine={selectedMine}
              inputs={inputs}
              onChangeInput={handleChangeInput}
              onSubmitEvaluation={runEvaluation}
              onLoadPreset={handleLoadPreset}
              onAddNewRegion={handleAddCustomRegion}
              loading={loading}
            />
          )}

          {activeSection === "shortfall" && (
            <ShortfallPredictor
              selectedMine={selectedMine}
              inputs={inputs}
              prediction={prediction}
              trend={trend}
              loading={loading}
            />
          )}

          {activeSection === "actions" && (
            <PrescriptiveActions
              selectedMine={selectedMine}
              inputs={inputs}
              prediction={prediction}
            />
          )}

          {activeSection === "simulator" && (
            <ScenarioSimulator
              selectedMine={selectedMine}
              inputs={inputs}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}