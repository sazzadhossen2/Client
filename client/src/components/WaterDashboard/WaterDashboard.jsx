

import { useMemo } from "react";

export default function WaterDashboard() {
  // ---- demo/live values ----
  const level = 75;                 // %
  const pumpRunning = true;
  const lastRefill = "2 hours ago";
  const capacityLiters = 2000;

  // ring math
  const r = 48;
  const C = 2 * Math.PI * r;
  const targetOffset = C * (1 - level / 100);

  const tankFillStyle = useMemo(
    () => ({
      height: `${level}%`,
      background:
        "linear-gradient(180deg, rgba(0,162,232,.95) 0%, rgba(0,162,232,.75) 100%)",
      boxShadow: "inset 0 6px 12px rgba(255,255,255,.55)",
      borderRadius: "0 0 18px 18px",
      transition: "height .6s ease",
    }),
    [level]
  );

  return (
    <>
      {/* inline animations (no external css) */}
      <style>{`
        @keyframes ringSweep {
          from { stroke-dashoffset: ${C}; }
          to   { stroke-dashoffset: ${targetOffset}; }
        }
        @keyframes waterBob {
          0% { transform: translateY(0px); }
          50%{ transform: translateY(-3px); }
          100%{ transform: translateY(0px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-20%); opacity:.18 }
          100%{ transform: translateX(120%); opacity:.18 }
        }
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity:.9; }
          100%{ transform: translateY(-120px) scale(1.2); opacity:0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 18px 48px rgba(0,0,0,.08); }
          50%{ box-shadow: 0 22px 60px rgba(0,0,0,.12); }
          100%{ box-shadow: 0 18px 48px rgba(0,0,0,.08); }
        }
        @keyframes alertPulse {
          0% { transform: scale(1); }
          50%{ transform: scale(1.12); }
          100%{ transform: scale(1); }
        }
        .tile-animate { transition: transform .25s ease; animation: pulseGlow 2.4s ease-in-out infinite; }
        .tile-animate:hover { transform: translateY(-4px); }
      `}</style>

      <div className="container py-3">
        {/* Header */}
        <div
          className="rounded-4 p-3 d-flex align-items-center justify-content-between shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(28,163,236,.10), rgba(122,197,255,.16))",
            border: "1px solid #E5F1FB",
          }}
        >
          <div className="d-flex align-items-center">
            <div
              className="rounded-3 me-3 d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38, background: "#E8F6FF" }}
            >
              <i className="bi bi-droplet-half fs-5 text-primary" />
            </div>
            <div>
              <div className="fw-semibold">Water Level Tracker</div>
              <small className="text-secondary">
                Capacity {capacityLiters.toLocaleString()}L
              </small>
            </div>
          </div>
          {/* <div className="d-flex gap-2">
            <button className="btn btn-light border">
              <i className="bi bi-bell" />
            </button>
            <button className="btn btn-light border">
              <i className="bi bi-gear" />
            </button>
          </div> */}
        </div>

        {/* Level + Tank */}
        <div
          className="mt-3 p-4 rounded-4 shadow-sm"
          style={{ background: "#EAF5FE", border: "1px solid #E3F0FB" }}
        >
          <div className="row g-4 align-items-center">
            {/* Animated ring */}
            <div className="col-12 col-md-4">
              <div className="d-flex flex-column align-items-center">
                <svg width="150" height="150" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1CA3EC" />
                      <stop offset="100%" stopColor="#65C7F7" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    stroke="#E9F3FB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    stroke="url(#ringGrad)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={C}
                    strokeDashoffset={targetOffset}
                    style={{ animation: `ringSweep 1.1s ease forwards` }}
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="700"
                    fill="#1CA3EC"
                  >
                    {level}%
                  </text>
                </svg>
                <small className="text-secondary mt-1">Current level</small>
                <div className="d-flex gap-2 mt-3">
                  <span className="badge rounded-pill text-bg-primary">
                    <i className="bi bi-droplet me-1" />
                    {(capacityLiters * (level / 100)).toFixed(0)} L
                  </span>
                  <span className="badge rounded-pill text-bg-info">
                    <i className="bi bi-lightning-charge me-1" />
                    Auto
                  </span>
                </div>
              </div>
            </div>

            {/* Tank bottle with shimmer/bubbles */}
            <div className="col-12 col-md-8">
              <div className="text-center mb-3">
                <div className="fw-semibold fs-5">Main Water Tank</div>
                <small className="text-secondary">Last updated just now</small>
              </div>

              <div className="d-flex justify-content-center">
                <div
                  className="position-relative d-flex align-items-end"
                  style={{
                    width: 190,
                    height: 260,
                    borderRadius: 26,
                    border: "3px solid #d6e6f5",
                    background:
                      "linear-gradient(180deg,#FDFEFF 0%, #F6FBFF 100%)",
                    boxShadow:
                      "inset 0 10px 30px rgba(0,0,0,.05), 0 12px 30px rgba(0,0,0,.05)",
                    overflow: "hidden",
                    animation: "waterBob 3.5s ease-in-out infinite",
                  }}
                >
                  {/* shimmer sweep */}
                  <div
                    className="position-absolute top-0 h-100"
                    style={{
                      width: 90,
                      left: "-20%",
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,.0), rgba(255,255,255,.6), rgba(255,255,255,0))",
                      filter: "blur(2px)",
                      animation: "shimmer 2.8s ease-in-out infinite",
                    }}
                  />

                  {/* water column */}
                  <div className="w-100" style={tankFillStyle} />

                  {/* wave cap */}
                  <div
                    className="position-absolute start-0 w-100"
                    style={{
                      bottom: `calc(${level}% - 8px)`,
                      height: 16,
                      background: "#BFE8FF",
                      opacity: 0.65,
                      borderRadius: "50%",
                      filter: "blur(4px)",
                      animation: "waterBob 3.5s ease-in-out infinite",
                    }}
                  />

                  {/* bubbles */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="position-absolute rounded-circle"
                      style={{
                        width: 6 + (i % 3) * 3,
                        height: 6 + (i % 3) * 3,
                        left: 22 + (i * 20) % 150,
                        bottom: 24,
                        background: "rgba(255,255,255,.9)",
                        animation: `bubble ${2 + (i % 4) * 0.6}s linear ${i *
                          0.25}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* progress rail */}
              <div className="mt-4 mx-auto" style={{ maxWidth: 440 }}>
                <div
                  className="rounded-pill bg-white"
                  style={{
                    height: 12,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)",
                  }}
                >
                  <div
                    className="rounded-pill"
                    style={{
                      height: 12,
                      width: `${level}%`,
                      background:
                        "linear-gradient(90deg, #19A7E0 0%, #65C7F7 100%)",
                      transition: "width .6s ease",
                    }}
                  />
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-secondary">Empty</small>
                  <small className="text-secondary">Full</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pump status */}
        <div
          className="mt-3 p-4 rounded-4 shadow-sm d-flex align-items-center justify-content-between"
          style={{ background: "#EAF5FE", border: "1px solid #E3F0FB" }}
        >
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: 64,
                height: 64,
                background: "#314754",
                border: "4px solid #7FA6B5",
                boxShadow: "0 8px 24px rgba(0,0,0,.08)",
                color: "#FF9F1C",
              }}
            >
              <i
                className="bi bi-fan fs-4"
                style={{
                  display: "inline-block",
                  animation: pumpRunning ? "spin 1.2s linear infinite" : "none",
                }}
              />
            </div>
            <div>
              <div className="fw-bold fs-5">Pump Status</div>
              <div className="mt-1">
                <span
                  className={`badge rounded-pill ${
                    pumpRunning ? "text-bg-success" : "text-bg-danger"
                  }`}
                  style={{ fontSize: 14, padding: "8px 12px" }}
                >
                  <i
                    className={`bi me-1 ${
                      pumpRunning ? "bi-check-circle" : "bi-x-circle"
                    }`}
                  />
                  {pumpRunning ? "Running" : "Stopped"}
                </span>
                <span className="badge rounded-pill text-bg-light ms-2">
                  <i className="bi bi-clock me-1" />
                  Last refill: {lastRefill}
                </span>
              </div>
            </div>
          </div>

          {/* alert badge */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 30,
              height: 30,
              border: "2px solid #E38C8C",
              color: "#D46363",
              fontWeight: 700,
              animation: "alertPulse 2.2s ease-in-out infinite",
            }}
            title="Alerts"
          >
            !
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4">
          <div className="fw-bold fs-4">Quick Actions</div>
          <div className="d-flex flex-wrap gap-3 mt-3">
            <ActionTile
              icon="bi-magic"
              title="Auto Mode"
              subtitle="Smart control"
              tint="#86E1FF"
              onClick={() => alert("Auto Mode")}
            />
            <ActionTile
              icon="bi-water"
              title="Refill Now"
              subtitle="Start pump"
              tint="#FFD58A"
              onClick={() => alert("Refill Now")}
            />
            <ActionTile
              icon="bi-sliders2"
              title="Settings"
              subtitle="Thresholds"
              tint="#E4C5FF"
              onClick={() => alert("Settings")}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-4">
          <div className="fw-bold fs-4">Recent Activity</div>
          <div className="mt-3 d-grid gap-3">
            <ActivityItem
              icon="bi-lightning-charge"
              time="10:30 AM"
              text="Pump started automatically"
            />
            <ActivityItem
              icon="bi-graph-up-arrow"
              time="10:25 AM"
              text="Water level reached 80%"
            />
            <ActivityItem
              icon="bi-exclamation-triangle"
              time="9:45 AM"
              text="Low level alert (20%)"
              accent="#F59E0B"
            />
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>
    </>
  );
}

/* ---------- Pieces ---------- */

function ActionTile({ icon, title, subtitle, tint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn bg-white rounded-4 px-4 py-3 shadow-sm text-start tile-animate"
      style={{
        minWidth: 190,
        border: `1px solid ${hexToRgba(tint, 0.6)}`,
        boxShadow: `0 18px 48px ${hexToRgba(tint, 0.35)}`,
      }}
    >
      <div className="d-flex align-items-center">
        <div
          className="rounded-4 me-3 d-flex align-items-center justify-content-center"
          style={{
            width: 44,
            height: 44,
            border: `2px dashed ${hexToRgba(tint, 0.9)}`,
            color: hexToRgba(tint, 0.9),
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
        <div>
          <div className="fw-semibold" style={{ color: "#2D3A4A" }}>
            {title}
          </div>
          <small className="text-secondary">{subtitle}</small>
        </div>
      </div>
    </button>
  );
}

function ActivityItem({ icon = "bi-dot", time, text, accent = "#1CA3EC" }) {
  return (
    <div className="bg-white rounded-4 p-3 shadow-sm">
      <div className="d-flex align-items-start">
        <div
          className="rounded-3 me-3 d-flex align-items-center justify-content-center"
          style={{
            width: 36,
            height: 36,
            background: hexToRgba(accent, 0.1),
            color: accent,
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
        <div className="flex-grow-1">
          <div className="text-secondary">{time}</div>
          <div className="fw-semibold mt-1">{text}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helper ---------- */
function hexToRgba(hex, a = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}



