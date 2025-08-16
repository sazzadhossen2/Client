import React, { useState, useEffect, useMemo } from 'react';

// Firebase Database URL
const FIREBASE_DATABASE_URL = "https://watertempok-default-rtdb.asia-southeast1.firebasedatabase.app";

export default function FirebaseWaterDashboard() {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    let fetchInterval = null;
    let retryTimeout = null;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchData = async () => {
      try {
        const response = await fetch(`${FIREBASE_DATABASE_URL}/devices/hridoy_esp32.json`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            setDeviceData(data);
            setLastUpdate(new Date());
            setError(null);
            setLoading(false);
            retryCount = 0; // Reset retry count on successful fetch
            return true;
          } else {
            throw new Error('No data received from Firebase');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.warn('Fetch attempt failed:', err.message);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setError(`Connection attempt ${retryCount}/${maxRetries} failed. Retrying...`);
          
          // Retry with exponential backoff
          retryTimeout = setTimeout(() => {
            fetchData();
          }, Math.pow(2, retryCount) * 1000);
          
          return false;
        } else {
          // Max retries reached, switch to demo mode
          setError('Unable to connect to Firebase. Showing demo data.');
          setDeviceData(getDemoData());
          setLastUpdate(new Date());
          setLoading(false);
          return false;
        }
      }
    };

    const startPolling = () => {
      // Initial fetch
      fetchData();
      
      // Set up polling every 3 seconds
      fetchInterval = setInterval(() => {
        fetchData();
      }, 3000);
    };

    startPolling();

    return () => {
      if (fetchInterval) {
        clearInterval(fetchInterval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  // Demo data fallback
  const getDemoData = () => ({
    config: {
      high_level_percent: 85,
      low_level_percent: 25,
      price_per_liter: 1.5,
      price_per_liter1: 1.5,
      price_per_liter2: 2,
      pulses_per_liter1: 450,
      pulses_per_liter2: 460,
      tank_height_cm: 120
    },
    control: {
      force_off: false,
      force_on: false,
      reset_usage1: false,
      reset_usage2: false
    },
    telemetry: {
      bill_amount: 1047.06,
      distance: { cm: 24.2 },
      flow1: {
        lpm: 0,
        price_per_liter: 1.5,
        total_bill: 158.42,
        total_liters: 105.61
      },
      flow2: {
        lpm: 0,
        price_per_liter: 2,
        total_bill: 888.64,
        total_liters: 444.32
      },
      level: {
        cm: 95.8,
        percent: 75
      },
      pump: true,
      temperature: {
        c: 28.5,
        f: 83.3
      },
      timestamp: Math.floor(Date.now() / 1000),
      turbidity: {
        ntu: 12,
        status: "CLEAR"
      }
    }
  });

  // Calculate derived values
  const derivedData = useMemo(() => {
    if (!deviceData) return null;

    const { telemetry, config } = deviceData;
    const level = Math.max(0, Math.min(100, telemetry?.level?.percent || 0));
    const pumpRunning = telemetry?.pump || false;
    const temperature = telemetry?.temperature?.c || 0;
    const turbidity = telemetry?.turbidity?.status || 'UNKNOWN';
    const totalFlow1 = telemetry?.flow1?.total_liters || 0;
    const totalFlow2 = telemetry?.flow2?.total_liters || 0;
    const totalBill = (telemetry?.flow1?.total_bill || 0) + (telemetry?.flow2?.total_bill || 0);
    
    // Calculate time since last update
    const timeDiff = Math.floor((Date.now() - (telemetry?.timestamp * 1000)) / 60000);
    const lastRefill = timeDiff < 60 ? `${timeDiff} minutes ago` : `${Math.floor(timeDiff/60)} hours ago`;

    return {
      level,
      pumpRunning,
      temperature,
      turbidity,
      totalFlow1,
      totalFlow2,
      totalBill,
      lastRefill,
      capacityLiters: 2000,
      currentLiters: Math.round((level / 100) * 2000)
    };
  }, [deviceData]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Connecting to Firebase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (!derivedData) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          No device data available
        </div>
      </div>
    );
  }

  return <WaterDashboard data={derivedData} deviceData={deviceData} lastUpdate={lastUpdate} />;
}

function WaterDashboard({ data, deviceData, lastUpdate }) {
  const { level, pumpRunning, lastRefill, capacityLiters, currentLiters, temperature, turbidity, totalBill } = data;

  // Ring math for circular progress
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
      {/* Inline animations */}
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
                Capacity {capacityLiters.toLocaleString()}L • Live Data
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className={`badge ${pumpRunning ? 'text-bg-success' : 'text-bg-secondary'}`}>
              <i className="bi bi-broadcast me-1"></i>
              {pumpRunning ? 'ONLINE' : 'OFFLINE'}
            </div>
            <small className="text-secondary">
              {lastUpdate.toLocaleTimeString()}
            </small>
          </div>
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
                    {currentLiters} L
                  </span>
                  <span className="badge rounded-pill text-bg-info">
                    <i className="bi bi-thermometer me-1" />
                    {temperature}°C
                  </span>
                </div>
              </div>
            </div>

            {/* Tank bottle with shimmer/bubbles */}
            <div className="col-12 col-md-8">
              <div className="text-center mb-3">
                <div className="fw-semibold fs-5">Main Water Tank</div>
                <small className="text-secondary">
                  Quality: {turbidity} • Last updated {lastUpdate.toLocaleTimeString()}
                </small>
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

          {/* Connection status */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: 40,
              height: 40,
              background: level < 20 ? "#E38C8C" : "#4CAF50",
              color: "white",
              fontWeight: 700,
              animation: level < 20 ? "alertPulse 2.2s ease-in-out infinite" : "none",
            }}
            title={level < 20 ? "Low Water Alert" : "Normal Level"}
          >
            {level < 20 ? '!' : '✓'}
          </div>
        </div>

        {/* Real-time Data Cards */}
        <div className="mt-4">
          <div className="fw-bold fs-4">Real-time Data</div>
          <div className="row g-3 mt-2">
            <div className="col-12 col-md-3">
              <div className="bg-white rounded-4 shadow-sm p-3">
                <div className="text-secondary">Flow 1 Total</div>
                <div className="fw-bold fs-5">{deviceData?.telemetry?.flow1?.total_liters?.toFixed(1) || 0}L</div>
                <small className="text-info">৳{deviceData?.telemetry?.flow1?.total_bill?.toFixed(2) || 0}</small>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="bg-white rounded-4 shadow-sm p-3">
                <div className="text-secondary">Flow 2 Total</div>
                <div className="fw-bold fs-5">{deviceData?.telemetry?.flow2?.total_liters?.toFixed(1) || 0}L</div>
                <small className="text-info">৳{deviceData?.telemetry?.flow2?.total_bill?.toFixed(2) || 0}</small>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="bg-white rounded-4 shadow-sm p-3">
                <div className="text-secondary">Total Bill</div>
                <div className="fw-bold fs-5 text-success">৳{totalBill.toFixed(2)}</div>
                <small className="text-secondary">Combined flows</small>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="bg-white rounded-4 shadow-sm p-3">
                <div className="text-secondary">Distance</div>
                <div className="fw-bold fs-5">{deviceData?.telemetry?.distance?.cm?.toFixed(2) || 0}cm</div>
                <small className="text-secondary">Sensor reading</small>
              </div>
            </div>
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
              onClick={() => alert("Auto Mode - Firebase integration needed")}
            />
            <ActionTile
              icon="bi-water"
              title="Force On"
              subtitle="Start pump"
              tint="#FFD58A"
              onClick={() => alert("Force On - Firebase write needed")}
            />
            <ActionTile
              icon="bi-pause"
              title="Force Off"
              subtitle="Stop pump"
              tint="#FFB3B3"
              onClick={() => alert("Force Off - Firebase write needed")}
            />
            <ActionTile
              icon="bi-arrow-clockwise"
              title="Reset Usage"
              subtitle="Clear meters"
              tint="#E4C5FF"
              onClick={() => alert("Reset Usage - Firebase write needed")}
            />
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>
    </>
  );
}

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

function hexToRgba(hex, a = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}