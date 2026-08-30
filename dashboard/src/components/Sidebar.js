import React, { useState } from "react";
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Pickaxe,
} from "lucide-react";

export default function Sidebar({
  activeSection,
  onSelectSection,
  isPinned,
  onTogglePin,
  isHovered: controlledHovered,
  onHoverChange,
}) {
  const [localHovered, setLocalHovered] = useState(false);

  const isHovered = controlledHovered !== undefined ? controlledHovered : localHovered;
  const isExpanded = isPinned || isHovered;

  const handleMouseEnter = () => {
    setLocalHovered(true);
    if (onHoverChange) onHoverChange(true);
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    if (onHoverChange) onHoverChange(false);
  };

  const navItems = [
    {
      id: "kpis",
      label: "Executive Dashboard",
      subtitle: "Strictly Key Performance Indicators",
      icon: LayoutDashboard,
      badge: "KPIs",
      badgeColor: "#185FA5",
    },
    {
      id: "reserves",
      label: "Reserve & Ingestion Hub",
      subtitle: "Satellite Prospector & SIH Inputs",
      icon: Map,
      badge: "Module A + Ingest",
      badgeColor: "#1D9E75",
    },
    {
      id: "shortfall",
      label: "Shortfall Risk (Mod B)",
      subtitle: "Constraint ML Predictor",
      icon: AlertTriangle,
      badge: "Module B",
      badgeColor: "#BA7517",
    },
    {
      id: "actions",
      label: "Prescriptive AI (Mod C)",
      subtitle: "SHAP Mitigation Playbooks",
      icon: Sparkles,
      badge: "Module C",
      badgeColor: "#7F77DD",
    },
    {
      id: "simulator",
      label: "What-If Simulator",
      subtitle: "Scenario Sandbox & Stress Testing",
      icon: Sliders,
      badge: "Sandbox",
      badgeColor: "#D97706",
    },
  ];

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: isExpanded ? 270 : 76,
        background: "#0B132B",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowX: "hidden",
        userSelect: "none",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 68,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          gap: 12,
        }}
      >
        <div
          style={{
            minWidth: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #185FA5 0%, #0D9488 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(24,95,165,0.4)",
          }}
        >
          <Pickaxe size={22} color="#fff" />
        </div>

        {isExpanded && (
          <div style={{ flex: 1, minWidth: 0, opacity: 1, transition: "opacity 0.2s" }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.2, whiteSpace: "nowrap" }}>
              MOIL Smart Mining
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
              SIH Global Hackathon
            </div>
          </div>
        )}

        {isExpanded && (
          <button
            onClick={onTogglePin}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isPinned ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id || (item.id === "reserves" && activeSection === "ingestion");
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive
                  ? "linear-gradient(90deg, rgba(24,95,165,0.25) 0%, rgba(13,148,136,0.18) 100%)"
                  : "transparent",
                color: isActive ? "#38BDF8" : "#94A3B8",
                borderLeft: isActive ? "3px solid #38BDF8" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              <div
                style={{
                  minWidth: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? "#38BDF8" : "#94A3B8",
                }}
              >
                <Icon size={20} />
              </div>

              {isExpanded && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#FFFFFF" : "#E2E8F0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.subtitle}
                  </div>
                </div>
              )}

              {isExpanded && item.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: `${item.badgeColor}22`,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeColor}44`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Status Pill */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B981",
            }}
          />
          {isExpanded && (
            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
              <strong style={{ color: "#E2E8F0" }}>AI ML Engines Ready</strong>
              <div style={{ fontSize: 10, color: "#64748B" }}>LightGBM + Satellite XAI</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
