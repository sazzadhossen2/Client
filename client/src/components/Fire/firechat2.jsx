import React, { useState, useEffect, useMemo } from 'react';

// Firebase Database URL
const FIREBASE_DATABASE_URL = "https://watertempok-default-rtdb.asia-southeast1.firebasedatabase.app";

// Function to update Firebase data
const updateFirebaseControl = async (controlData) => {
  try {
    const response = await fetch(`${FIREBASE_DATABASE_URL}/devices/hridoy_esp32/control.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(controlData),
    });
    
    if (response.ok) {
      console.log('Control updated successfully');
      return true;
    } else {
      console.error('Failed to update control');
      return false;
    }
  } catch (error) {
    console.error('Error updating control:', error);
    return false;
  }
};

export default function FirebaseWaterDashboards() {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [controlLoading, setControlLoading] = useState(false);

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
            retryCount = 0;
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
          
          retryTimeout = setTimeout(() => {
            fetchData();
          }, Math.pow(2, retryCount) * 1000);
          
          return false;
        } else {
          setError('Unable to connect to Firebase. Showing demo data.');
          setDeviceData(getDemoData());
          setLastUpdate(new Date());
          setLoading(false);
          return false;
        }
      }
    };

    const startPolling = () => {
      fetchData();
      fetchInterval = setInterval(() => {
        fetchData();
      }, 2000);
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

  // Demo data matching your exact structure
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
      force_off: true,
      force_on: false,
      reset_usage1: false,
      reset_usage2: false
    },
    telemetry: {
      bill_amount: 0,
      distance: { cm: 0.0343 },
      flow1: {
        lpm: 0,
        price_per_liter: 1.5,
        total_bill: 158.41998,
        total_liters: 105.61333
      },
      flow1_lpm: 0,
      flow2: {
        lpm: 0,
        price_per_liter: 2,
        total_bill: 888.63916,
        total_liters: 444.31958
      },
      flow2_lpm: 0,
      level: {
        cm: 119.9657,
        percent: 100
      },
      level_cm: -53.23215,
      pump: false,
      tank_percent: 0,
      temperature: {
        c: 33.1875,
        f: 91.7375
      },
      timestamp: Math.floor(Date.now() / 1000),
      total1_liters: 0,
      total2_liters: 0,
      turbidity: {
        ntu: 0,
        status: "CLEAR"
      },
      turbidity_ntu: 0
    }
  });

  // Control functions
  const handlePumpControl = async (action) => {
    setControlLoading(true);
    const currentControl = deviceData?.control || {};
    
    let newControl = { ...currentControl };
    
    if (action === 'start') {
      newControl.force_on = true;
      newControl.force_off = false;
    } else if (action === 'stop') {
      newControl.force_on = false;
      newControl.force_off = true;
    } else if (action === 'auto') {
      newControl.force_on = false;
      newControl.force_off = false;
    }
    
    const success = await updateFirebaseControl(newControl);
    if (success) {
      setDeviceData(prev => ({
        ...prev,
        control: newControl
      }));
    }
    
    setControlLoading(false);
  };

  const handleResetUsage = async (flowNumber) => {
    setControlLoading(true);
    const currentControl = deviceData?.control || {};
    
    const newControl = {
      ...currentControl,
      [`reset_usage${flowNumber}`]: true
    };
    
    const success = await updateFirebaseControl(newControl);
    if (success) {
      setDeviceData(prev => ({
        ...prev,
        control: newControl
      }));
    }
    
    setControlLoading(false);
  };

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

  return (
    <WaterDashboard 
      data={derivedData} 
      deviceData={deviceData} 
      lastUpdate={lastUpdate} 
      onPumpControl={handlePumpControl}
      onResetUsage={handleResetUsage}
      controlLoading={controlLoading}
    />
  );
}

function WaterDashboard({ data, deviceData, lastUpdate, onPumpControl, onResetUsage, controlLoading }) {
  const level = deviceData?.telemetry?.level?.percent || 0;
  const pumpRunning = deviceData?.telemetry?.pump;
  const forceOff = deviceData?.control?.force_off;
  const forceOn = deviceData?.control?.force_on;
  
  // Determine pump status
  const getPumpStatus = () => {
    if (forceOff) return { status: 'FORCE OFF', color: 'danger', running: false };
    if (forceOn) return { status: 'FORCE ON', color: 'success', running: true };
    if (pumpRunning) return { status: 'AUTO ON', color: 'primary', running: true };
    return { status: 'AUTO OFF', color: 'secondary', running: false };
  };
  
  const pumpStatus = getPumpStatus();

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
                Capacity 2000L • Live Data • Tank: {deviceData?.telemetry?.tank_percent || 0}%
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className={`badge ${pumpStatus.running ? 'text-bg-success' : 'text-bg-secondary'}`}>
              <i className="bi bi-broadcast me-1"></i>
              {pumpStatus.running ? 'PUMP ON' : 'PUMP OFF'}
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
                    {Math.round((level / 100) * 2000)} L
                  </span>
                  <span className="badge rounded-pill text-bg-info">
                    <i className="bi bi-thermometer me-1" />
                    {deviceData?.telemetry?.temperature?.c?.toFixed(1) || 0}°C
                  </span>
                  <span className="badge rounded-pill text-bg-warning">
                    <i className="bi bi-eye me-1" />
                    {deviceData?.telemetry?.turbidity?.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tank bottle with shimmer/bubbles */}
            <div className="col-12 col-md-8">
              <div className="text-center mb-3">
                <div className="fw-semibold fs-5">Main Water Tank</div>
                <small className="text-secondary">
                  Distance: {deviceData?.telemetry?.distance?.cm?.toFixed(4) || 0}cm • Updated {lastUpdate.toLocaleTimeString()}
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

        {/* Enhanced Pump Control */}
        <div
          className="mt-3 p-4 rounded-4 shadow-sm"
          style={{ background: "#EAF5FE", border: "1px solid #E3F0FB" }}
        >
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 64,
                    height: 64,
                    background: pumpStatus.running ? "#28a745" : "#6c757d",
                    border: `4px solid ${pumpStatus.running ? "#20c997" : "#adb5bd"}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
                    color: "white",
                  }}
                >
                  <i
                    className="bi bi-fan fs-4"
                    style={{
                      display: "inline-block",
                      animation: pumpStatus.running ? "spin 1.2s linear infinite" : "none",
                    }}
                  />
                </div>
                <div>
                  <div className="fw-bold fs-5">Pump Control</div>
                  <div className="mt-1">
                    <span
                      className={`badge rounded-pill text-bg-${pumpStatus.color}`}
                      style={{ fontSize: 14, padding: "8px 12px" }}
                    >
                      <i
                        className={`bi me-1 ${
                          pumpStatus.running ? "bi-check-circle" : "bi-x-circle"
                        }`}
                      />
                      {pumpStatus.status}
                    </span>
                    <span className="badge rounded-pill text-bg-light ms-2">
                      <i className="bi bi-clock me-1" />
                      Timestamp: {deviceData?.telemetry?.timestamp || 0}
                    </span>
                  </div>
                  <div className="mt-2">
                    <small className="text-secondary">
                      Actual Pump: <strong>{deviceData?.telemetry?.pump ? 'RUNNING' : 'STOPPED'}</strong> | 
                      Force ON: <strong>{deviceData?.control?.force_on ? 'YES' : 'NO'}</strong> | 
                      Force OFF: <strong>{deviceData?.control?.force_off ? 'YES' : 'NO'}</strong>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-md-4">
              <div className="d-flex flex-column gap-2">
                <button 
                  className="btn btn-success btn-sm fw-semibold"
                  onClick={() => onPumpControl('start')}
                  disabled={controlLoading || forceOn}
                >
                  {controlLoading ? <i className="bi bi-hourglass-split me-1"></i> : <i className="bi bi-play-fill me-1"></i>}
                  FORCE START
                </button>
                <button 
                  className="btn btn-danger btn-sm fw-semibold"
                  onClick={() => onPumpControl('stop')}
                  disabled={controlLoading || forceOff}
                >
                  {controlLoading ? <i className="bi bi-hourglass-split me-1"></i> : <i className="bi bi-stop-fill me-1"></i>}
                  FORCE STOP
                </button>
                <button 
                  className="btn btn-primary btn-sm fw-semibold"
                  onClick={() => onPumpControl('auto')}
                  disabled={controlLoading || (!forceOn && !forceOff)}
                >
                  {controlLoading ? <i className="bi bi-hourglass-split me-1"></i> : <i className="bi bi-magic me-1"></i>}
                  AUTO MODE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Telemetry Data */}
        <div className="mt-4">
          <div className="fw-bold fs-4">Complete Real-time Telemetry</div>
          
          {/* Flow Meters Section */}
          <div className="mt-3">
            <h5 className="text-primary mb-3">💧 Flow Meters & Billing</h5>
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="bg-white rounded-4 shadow-sm p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div className="rounded-3 bg-primary bg-opacity-10 p-2 me-3">
                        <i className="bi bi-droplet-fill text-primary fs-4"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">Flow Meter 1</h6>
                        <small className="text-secondary">Primary Water Line</small>
                      </div>
                    </div>
                    <button 
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => onResetUsage(1)}
                      disabled={controlLoading}
                    >
                      {controlLoading ? <i className="bi bi-hourglass-split"></i> : <i className="bi bi-arrow-counterclockwise"></i>}
                    </button>
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-secondary small">Total Liters</div>
                      <div className="fw-bold fs-5">{deviceData?.telemetry?.flow1?.total_liters?.toFixed(3) || 0}L</div>
                    </div>
                    <div className="col-6">
                      <div className="text-secondary small">Current LPM</div>
                      <div className="fw-bold fs-5">{deviceData?.telemetry?.flow1?.lpm || 0}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-secondary small">Price/Liter</div>
                      <div className="fw-bold">৳{deviceData?.telemetry?.flow1?.price_per_liter || 0}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-secondary small">Total Bill</div>
                      <div className="fw-bold text-success">৳{deviceData?.telemetry?.flow2?.total_bill?.toFixed(3) || 0}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-secondary small">Legacy Values</div>
                      <div className="d-flex gap-3">
                        <span>LPM: <strong>{deviceData?.telemetry?.flow2_lpm || 0}</strong></span>
                        <span>Total: <strong>{deviceData?.telemetry?.total2_liters || 0}L</strong></span>
                      </div>
                    </div>
                  </div>
                  {deviceData?.control?.reset_usage2 && (
                    <div className="alert alert-warning mt-2 mb-0 py-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Reset pending...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sensors Section */}
          <div className="mt-4">
            <h5 className="text-success mb-3">🔬 Sensor Readings</h5>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                  <i className="bi bi-thermometer-half text-danger fs-3 mb-2"></i>
                  <div className="text-secondary small">Temperature</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.temperature?.c || 0}°C</div>
                  <small className="text-secondary">{deviceData?.telemetry?.temperature?.f || 0}°F</small>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                  <i className="bi bi-rulers text-warning fs-3 mb-2"></i>
                  <div className="text-secondary small">Distance Sensor</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.distance?.cm?.toFixed(4) || 0}</div>
                  <small className="text-secondary">centimeters</small>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                  <i className="bi bi-eye text-info fs-3 mb-2"></i>
                  <div className="text-secondary small">Turbidity</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.turbidity?.ntu || 0}</div>
                  <small className={`badge ${deviceData?.telemetry?.turbidity?.status === 'CLEAR' ? 'text-bg-success' : 'text-bg-warning'}`}>
                    {deviceData?.telemetry?.turbidity?.status || 'UNKNOWN'}
                  </small>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 text-center">
                  <i className="bi bi-clock text-secondary fs-3 mb-2"></i>
                  <div className="text-secondary small">Timestamp</div>
                  <div className="fw-bold fs-5">{deviceData?.telemetry?.timestamp || 0}</div>
                  <small className="text-secondary">Unix time</small>
                </div>
              </div>
            </div>
          </div>

          {/* Water Level Details */}
          <div className="mt-4">
            <h5 className="text-info mb-3">📊 Water Level Details</h5>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="bg-white rounded-4 shadow-sm p-3">
                  <div className="text-secondary small">Level (CM)</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.level?.cm?.toFixed(2) || 0} cm</div>
                  <div className="progress mt-2" style={{height: '8px'}}>
                    <div className="progress-bar bg-info" style={{width: `${Math.max(0, Math.min(100, (deviceData?.telemetry?.level?.cm || 0) / 120 * 100))}%`}}></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="bg-white rounded-4 shadow-sm p-3">
                  <div className="text-secondary small">Level (%)</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.level?.percent || 0}%</div>
                  <div className="progress mt-2" style={{height: '8px'}}>
                    <div className="progress-bar bg-primary" style={{width: `${deviceData?.telemetry?.level?.percent || 0}%`}}></div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="bg-white rounded-4 shadow-sm p-3">
                  <div className="text-secondary small">Tank Percent</div>
                  <div className="fw-bold fs-4">{deviceData?.telemetry?.tank_percent || 0}%</div>
                  <div className="progress mt-2" style={{height: '8px'}}>
                    <div className="progress-bar bg-success" style={{width: `${deviceData?.telemetry?.tank_percent || 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="mt-4">
            <h5 className="text-warning mb-3">⚙️ System Configuration</h5>
            <div className="bg-white rounded-4 shadow-sm p-4">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="border rounded-3 p-3 text-center">
                    <div className="text-secondary small">High Level Alert</div>
                    <div className="fw-bold text-danger">{deviceData?.config?.high_level_percent || 0}%</div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="border rounded-3 p-3 text-center">
                    <div className="text-secondary small">Low Level Alert</div>
                    <div className="fw-bold text-warning">{deviceData?.config?.low_level_percent || 0}%</div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="border rounded-3 p-3 text-center">
                    <div className="text-secondary small">Tank Height</div>
                    <div className="fw-bold text-info">{deviceData?.config?.tank_height_cm || 0} cm</div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="border rounded-3 p-3 text-center">
                    <div className="text-secondary small">Base Price</div>
                    <div className="fw-bold text-success">৳{deviceData?.config?.price_per_liter || 0}</div>
                  </div>
                </div>
              </div>
              
              <div className="row g-3 mt-2">
                <div className="col-12 col-md-4">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <div className="text-secondary small">Flow 1 Pulses/L</div>
                    <div className="fw-bold">{deviceData?.config?.pulses_per_liter1 || 0}</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <div className="text-secondary small">Flow 2 Pulses/L</div>
                    <div className="fw-bold">{deviceData?.config?.pulses_per_liter2 || 0}</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <div className="text-secondary small">Total Bill Amount</div>
                    <div className="fw-bold text-success">৳{deviceData?.telemetry?.bill_amount?.toFixed(2) || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Status */}
          <div className="mt-4">
            <h5 className="text-danger mb-3">🎛️ Control Status</h5>
            <div className="bg-white rounded-4 shadow-sm p-4">
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                    <div>
                      <div className="text-secondary small">Force ON</div>
                      <div className="fw-bold">{deviceData?.control?.force_on ? 'ACTIVE' : 'INACTIVE'}</div>
                    </div>
                    <div className={`badge ${deviceData?.control?.force_on ? 'text-bg-success' : 'text-bg-secondary'} fs-6`}>
                      {deviceData?.control?.force_on ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                    <div>
                      <div className="text-secondary small">Force OFF</div>
                      <div className="fw-bold">{deviceData?.control?.force_off ? 'ACTIVE' : 'INACTIVE'}</div>
                    </div>
                    <div className={`badge ${deviceData?.control?.force_off ? 'text-bg-danger' : 'text-bg-secondary'} fs-6`}>
                      {deviceData?.control?.force_off ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                    <div>
                      <div className="text-secondary small">Reset Usage 1</div>
                      <div className="fw-bold">{deviceData?.control?.reset_usage1 ? 'PENDING' : 'READY'}</div>
                    </div>
                    <div className={`badge ${deviceData?.control?.reset_usage1 ? 'text-bg-warning' : 'text-bg-secondary'} fs-6`}>
                      {deviceData?.control?.reset_usage1 ? 'RESET' : 'NORMAL'}
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                    <div>
                      <div className="text-secondary small">Reset Usage 2</div>
                      <div className="fw-bold">{deviceData?.control?.reset_usage2 ? 'PENDING' : 'READY'}</div>
                    </div>
                    <div className={`badge ${deviceData?.control?.reset_usage2 ? 'text-bg-warning' : 'text-bg-secondary'} fs-6`}>
                      {deviceData?.control?.reset_usage2 ? 'RESET' : 'NORMAL'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legacy Values */}
          <div className="mt-4">
            <h5 className="text-secondary mb-3">📋 Additional Readings</h5>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <div className="bg-light rounded-4 p-3 text-center">
                  <div className="text-secondary small">Level CM (Legacy)</div>
                  <div className="fw-bold">{deviceData?.telemetry?.level_cm?.toFixed(2) || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-light rounded-4 p-3 text-center">
                  <div className="text-secondary small">Turbidity NTU (Legacy)</div>
                  <div className="fw-bold">{deviceData?.telemetry?.turbidity_ntu || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-light rounded-4 p-3 text-center">
                  <div className="text-secondary small">Config Price 1</div>
                  <div className="fw-bold">৳{deviceData?.config?.price_per_liter1 || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="bg-light rounded-4 p-3 text-center">
                  <div className="text-secondary small">Config Price 2</div>
                  <div className="fw-bold">৳{deviceData?.config?.price_per_liter2 || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>
    </>
  );
}
