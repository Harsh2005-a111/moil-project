import React, { useEffect, useId, useRef, useState } from "react";

/** Exact System Architecture flowchart from the project README.md */
export const README_ARCHITECTURE_MERMAID = `flowchart TD
    subgraph Stream1 ["Stream 1: Multi-Sensor Planetary Earth Observation"]
        S2["Copernicus Sentinel-2 L2A<br/>B4 Red | B8 NIR | B11 SWIR-1 | B12 SWIR-2"] --> SPECTRAL["Diagnostic Mn Spectral<br/>Absorption Index"]
        EMAG["NOAA EMAG2v3<br/>Crustal Magnetic Anomaly nT"] --> GEOPHYS["Geophysical Anomaly<br/>Integrator"]
        SRTM["NASA SRTM v3<br/>Digital Elevation Model m"] --> GEOPHYS
        SPECTRAL --> SENSOR_FUSION["Multi-Sensor<br/>Planetary Matrix"]
        GEOPHYS --> SENSOR_FUSION
    end

    subgraph Stream2 ["Stream 2: Macro Tectonic Cratonic Domain Priors"]
        COORDS["Target Coordinates<br/>Lat / Lon"] --> CRATON_ENGINE{"Tectonic Domain<br/>Resolver"}
        CRATON_ENGINE -->|"Karnataka"| DHARWAR["Dharwar Craton"]
        CRATON_ENGINE -->|"MP / MH"| CITZ["CITZ / Sausar Belt"]
        CRATON_ENGINE -->|"Odisha / JH"| SINGHBHUM["Singhbhum Craton"]
        CRATON_ENGINE -->|"AP / Odisha"| EGMB["Eastern Ghats Mobile Belt"]
        CRATON_ENGINE -->|"RJ / GJ"| ARAVALLI["Aravalli-Delhi Fold Belt"]
        CRATON_ENGINE -->|"JH / WB"| NSMB["North Singhbhum Mobile Belt"]
        CRATON_ENGINE -->|"Metropolitan"| URBAN["Urban / Alluvium<br/>Exclusion Zone"]
    end

    subgraph Stream3 ["Stream 3: 150-Tree Ensemble Variance Engine"]
        SENSOR_FUSION --> RF["150 Regularized Random<br/>Forest Estimators"]
        DHARWAR --> RF
        CITZ --> RF
        SINGHBHUM --> RF
        RF --> STATS["Mean mu | StdDev sigma<br/>SE = sigma / sqrt 150"]
        STATS --> CI["95% CI: mu +/- 1.96 SE"]
    end

    subgraph Stream4 ["Stream 4: IBM 3-Tier Grade Classification"]
        CI --> IBM_GRADE{"IBM / GSI<br/>Grade Estimator"}
        IBM_GRADE -->|"25%+ Mn"| TIER1["Tier 1: Marketable<br/>Saleable Ore"]
        IBM_GRADE -->|"10-25% Mn"| TIER2["Tier 2: Beneficiable<br/>MR Ore"]
        IBM_GRADE -->|"Below 10% Mn"| TIER3["Tier 3: Mineral Waste<br/>Overburden"]
    end

    subgraph Stream5 ["Stream 5: Operations, Shortfall & Logistics"]
        TELEMETRY["Mine Shift Telemetry"] --> LIGHTGBM["LightGBM Risk Classifier"]
        LIGHTGBM --> SHAP["SHAP TreeExplainer<br/>Prescriptive SOPs"]
        LIGHTGBM --> NSR["Pit-to-Smelter<br/>NSR Optimizer"]
    end

    subgraph Dashboard ["Command-Center Dashboard"]
        CI --> UI_GAUGE["Uncertainty Gauge<br/>and Provenance Badges"]
        TIER1 --> UI_BADGE["IBM Grade<br/>Classification Banner"]
        TIER2 --> UI_BADGE
        TIER3 --> UI_BADGE
        SHAP --> UI_SOP["Corrective Action SOPs"]
        NSR --> UI_LOGIS["Freight Route Optimizer"]
        URBAN --> UI_LOCKOUT["Non-Mining Exclusion Card"]
        UI_BADGE --> PDF["IBM Statutory PDF Dossier"]
    end`;

export default function ArchitectureDiagram() {
  const hostRef = useRef(null);
  const reactId = useId().replace(/:/g, "");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        setLoading(true);
        setError(null);
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default?.default || mermaidModule.default || mermaidModule;
        if (!mermaid?.initialize || !mermaid?.render) {
          throw new Error("Mermaid renderer unavailable");
        }
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            primaryColor: "#E0F2FE",
            primaryTextColor: "#0B2545",
            primaryBorderColor: "#185FA5",
            lineColor: "#475569",
            secondaryColor: "#ECFDF5",
            tertiaryColor: "#F8FAFC",
            fontFamily: "Segoe UI, Trebuchet MS, sans-serif",
          },
          flowchart: {
            curve: "basis",
            padding: 12,
            htmlLabels: true,
          },
        });

        const renderId = `moil-arch-${reactId}`;
        const { svg } = await mermaid.render(renderId, README_ARCHITECTURE_MERMAID);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          const svgEl = hostRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.style.width = "100%";
            svgEl.style.height = "auto";
            svgEl.style.maxWidth = "100%";
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Could not render architecture diagram.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [reactId]);

  return (
    <section
      aria-labelledby="architecture-diagram-title"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: "20px 22px 24px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#185FA5",
            marginBottom: 6,
          }}
        >
          README · System Architecture
        </div>
        <h3
          id="architecture-diagram-title"
          style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#0F172A" }}
        >
          System Architecture & Planetary Data Fusion
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B", maxWidth: 820, lineHeight: 1.55 }}>
          The same five-stream architecture published in the GitHub README — multi-sensor Earth observation,
          tectonic domain priors, ensemble variance, IBM grade classification, and operations/logistics —
          feeding the MineSight AI command-center dashboard.
        </p>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          background:
            "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 40%, #F0FDFA 100%)",
          padding: "16px 12px",
          minHeight: 220,
        }}
      >
        {loading && (
          <div style={{ color: "#64748B", fontSize: 13, padding: "28px 12px", textAlign: "center" }}>
            Rendering architecture diagram…
          </div>
        )}
        {error && (
          <div style={{ color: "#B91C1C", fontSize: 13, padding: "20px 12px" }}>
            {error}
          </div>
        )}
        <div
          ref={hostRef}
          style={{ display: loading || error ? "none" : "block", width: "100%" }}
        />
      </div>
    </section>
  );
}
