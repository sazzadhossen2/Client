// AlarmsAndAlerts.jsx
import { useEffect, useMemo, useState } from "react";

export default function AlarmsAndAlerts() {
  const [tab, setTab] = useState("alarms"); // 'alarms' | 'system'

  // ---------- Alarms state (persisted) ----------
  const initialAlarms = [
    {
      id: "a1",
      emoji: "🎅",
      time: "07:00 AM",
      title: "Morning Reminder",
      days: ["Mon", "Wed", "Fri"],
      enabled: true,
    },
    {
      id: "a2",
      emoji: "💧",
      time: "01:00 PM",
      title: "Lunch Break",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      enabled: true,
    },
    {
      id: "a3",
      emoji: "🌙",
      time: "09:00 PM",
      title: "Night Routine",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      enabled: false,
    },
  ];

  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem("alarms@waterapp");
    return saved ? JSON.parse(saved) : initialAlarms;
  });

  useEffect(() => {
    localStorage.setItem("alarms@waterapp", JSON.stringify(alarms));
  }, [alarms]);

  const toggleAlarm = (id) =>
    setAlarms((list) =>
      list.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );

  // ---------- System status + alerts ----------
  const [motorOn, setMotorOn] = useState(true);
  const [level, setLevel] = useState(65); // %
  const systemOk = true;

  const [alerts, setAlerts] = useState([
    {
      id: "r1",
      kind: "normal",
      title: "Water motor turned ON",
      time: "10:30 AM",
      read: false,
    },
    {
      id: "r2",
      kind: "urgent",
      title: "Water level below 20%",
      time: "Yesterday",
      read: false,
    },
    {
      id: "r3",
      kind: "warn",
      title: "Water motor automatically turned OFF",
      time: "Yesterday",
      read: true,
    },
    {
      id: "r4",
      kind: "urgent",
      title: "Water overflow detected!",
      time: "Mar 15",
      read: true,
    },
  ]);

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  );

  const markRead = (id, read = true) =>
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, read } : a)));

  // ---------- UI ----------
  return (
    <div className="container py-3" style={{ background: "#faf5ff" }}>
      {/* Segmented tabs */}
      <div className="d-flex p-2 bg-white rounded-4 shadow-sm mb-3">
        <div className="btn-group w-100" role="group" aria-label="Tabs">
          <button
            type="button"
            className={`btn fw-semibold rounded-4 ${
              tab === "alarms" ? "btn-info text-white" : "btn-light"
            }`}
            onClick={() => setTab("alarms")}
          >
            Alarms
          </button>
          <button
            type="button"
            className={`btn fw-semibold rounded-4 ${
              tab === "system" ? "btn-info text-white" : "btn-light"
            }`}
            onClick={() => setTab("system")}
          >
            System Alerts{" "}
            {unreadCount > 0 && (
              <span className="badge text-bg-danger ms-1">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      {tab === "alarms" ? (
        <AlarmsTab alarms={alarms} onToggle={toggleAlarm} />
      ) : (
        <SystemAlertsTab
          motorOn={motorOn}
          level={level}
          systemOk={systemOk}
          setMotorOn={setMotorOn}
          setLevel={setLevel}
          alerts={alerts}
          markRead={markRead}
        />
      )}
    </div>
  );
}

/* -------------------- Alarms Tab -------------------- */
function AlarmsTab({ alarms, onToggle }) {
  return (
    <>
      {/* Intro card */}
      <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
        <div className="d-flex align-items-center">
          <div className="rounded-4 d-flex align-items-center justify-content-center me-3 bg-light-subtle border p-3">
            <span className="fs-4">💧</span>
          </div>
          <div>
            <div className="fw-semibold">Daily Water Reminders</div>
            <div className="text-secondary">
              Stay hydrated with scheduled notifications
            </div>
          </div>
        </div>
      </div>

      <h5 className="mb-3">Your Alarms</h5>

      <div className="d-grid gap-3">
        {alarms.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-4 shadow-sm p-3 d-flex align-items-center justify-content-between"
          >
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fs-4">{a.emoji}</span>
                <span className="fw-bold fs-4">{a.time}</span>
              </div>
              <div className="text-secondary mt-1">{a.title}</div>
              <div className="small text-secondary">
                {a.days.join(", ")}
              </div>
            </div>

            <div className="text-end">
              <div className="form-check form-switch fs-4 m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`sw-${a.id}`}
                  checked={a.enabled}
                  onChange={() => onToggle(a.id)}
                />
              </div>
              <div className="mt-2 small">
                {a.enabled ? (
                  <span className="badge text-bg-primary">On</span>
                ) : (
                  <span className="badge text-bg-secondary">Off</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* -------------------- System Alerts Tab -------------------- */
function SystemAlertsTab({
  motorOn,
  level,
  systemOk,
  setMotorOn,
  setLevel,
  alerts,
  markRead,
}) {
  return (
    <>
      {/* Status panel */}
      <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
        <div className="row g-3 text-center">
          <div className="col-4">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3">
              <span className="fs-4">🛠️</span>
            </div>
            <div className="mt-2 text-secondary">Motor</div>
            <div className="fw-bold">{motorOn ? "ON" : "OFF"}</div>
            <div className="form-check form-switch d-flex justify-content-center mt-1">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={motorOn}
                onChange={() => setMotorOn((v) => !v)}
              />
            </div>
          </div>

          <div className="col-4">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3">
              <span className="fs-4">🎅</span>
            </div>
            <div className="mt-2 text-secondary">Water Level</div>
            <div className="fw-bold">{level}%</div>
            <input
              type="range"
              className="form-range mt-1"
              min="0"
              max="100"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="col-4">
            <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-3">
              <span className="fs-4">🛰️</span>
            </div>
            <div className="mt-2 text-secondary">System</div>
            <div className={`fw-bold ${systemOk ? "text-success" : "text-danger"}`}>
              {systemOk ? "OK" : "Issue"}
            </div>
          </div>
        </div>

        {/* Progress bar mirrors water level */}
        <div className="progress mt-3" role="progressbar" aria-valuenow={level} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar bg-info" style={{ width: `${level}%` }} />
        </div>
      </div>

      <h5 className="mb-3">Recent Alerts</h5>
      <div className="d-grid gap-3">
        {alerts.map((a) => {
          const tone =
            a.kind === "urgent" ? "danger" : a.kind === "warn" ? "warning" : "light";
          const border = a.kind === "urgent" ? "border-danger" : a.kind === "warn" ? "border-warning" : "border-0";

          return (
            <div
              key={a.id}
              className={`bg-white rounded-4 shadow-sm p-3 border ${border}`}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className={`fw-semibold ${a.kind === "urgent" ? "text-danger" : ""}`}>
                    {a.title}
                  </div>
                  <div className="small text-secondary">{a.time}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {a.kind !== "normal" && (
                    <span className={`badge text-bg-${tone} text-uppercase`}>{
                      a.kind === "urgent" ? "Urgent" : "Warning"
                    }</span>
                  )}
                  {a.read ? (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => markRead(a.id, false)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => markRead(a.id, true)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
