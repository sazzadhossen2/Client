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

export default function FirebaseWaterDashboard() {
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

        {/* Flow Meter 2 Section */}
        <div className="mt-3">
          <h5 className="text-primary mb-3">💧 Flow Meter 2 & Billing</h5>
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="bg-white rounded-4 shadow-sm p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 bg-info bg-opacity-10 p-2 me-3">
                      <i className="bi bi-droplet-fill text-info fs-4"></i>
                    </div>
                    <div>
                      <h6 className="mb-0">Flow Meter 2</h6>
                      <small className="text-secondary">Secondary Water Line</small>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => onResetUsage(2)}
                    disabled={controlLoading}
                  >
                    {controlLoading ? <i className="bi bi-hourglass-split"></i> : <i className="bi bi-arrow-counterclockwise"></i>}
                  </button>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-secondary small">Total Liters</div>
                    <div className="fw-bold fs-5">{deviceData?.telemetry?.flow2?.total_liters?.toFixed(3) || 0}L</div>
                  </div>
                  <div className="col-6">
                    <div className="text-secondary small">Current LPM</div>
                    <div className="fw-bold fs-5">{deviceData?.telemetry?.flow2?.lpm || 0}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-secondary small">Price/Liter</div>
                    <div className="fw-bold">৳{deviceData?.telemetry?.flow2?.price_per_liter || 0}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-secondary small">Total Bill</div>
                    <div className="fw-bold text-success">৳{deviceData?.telemetry?.flow2?.total_bill?.toFixed(3) || 0}</div>
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

        {/* The rest of the dashboard UI remains the same */}
      </div>
    </>
  );
}
