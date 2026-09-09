import React, { useEffect, useState } from "react";
import logo from "../assets/minesight-logo.png";
import "./LandingPage.css";

export default function LandingPage({ onEnterDashboard }) {
  const [flipReady, setFlipReady] = useState(false);

  useEffect(() => {
    // Kick off the back→front flip on every open/refresh.
    const frame = requestAnimationFrame(() => setFlipReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-atmosphere" aria-hidden="true" />

      <main className="landing-content">
        <header className="landing-brand">
          <h1 className="landing-title">
            <span className="landing-title-main">MineSight</span>{" "}
            <span className="landing-title-ai">AI</span>
          </h1>
          <p className="landing-tagline">
            Smarter Insights<span className="landing-dot">•</span>
            Stronger Reserves<span className="landing-dot">•</span>
            Steady Production
          </p>
        </header>

        <div className="landing-logo-stage" aria-label="MineSight AI logo animation">
          <div className={`landing-logo-flip${flipReady ? " is-flipping" : ""}`}>
            <div className="landing-logo-face landing-logo-back" aria-hidden="true">
              <div className="landing-logo-back-disk">
                <span className="landing-logo-back-mark">MS</span>
              </div>
            </div>
            <div className="landing-logo-face landing-logo-front">
              <img
                src={logo}
                alt="MineSight AI logo"
                className="landing-logo-image"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-cta"
            onClick={onEnterDashboard}
          >
            Enter Dashboard
          </button>
          <p className="landing-hint">India manganese mine intelligence portal</p>
        </div>
      </main>
    </div>
  );
}
