// src/components/WaterAnalytics.jsx
import {useMemo, useState} from "react";
import {
  Chart as ChartJS,
  LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend,
  ArcElement, BarElement
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend,
  ArcElement, BarElement
);

export default function WaterAnalytics() {
  const [period, setPeriod] = useState("daily"); // 'daily' | 'weekly' | 'monthly'

  // ---------- Demo data per tab ----------
  const datasets = {
    daily: {
      titleDate: "August 15, 2025",
      x: ["0:00","1:00","3:00","5:00","7:00","9:00","11:00","13:00","15:00","17:00","19:00","21:00","23:00"],
      y: [62,38,18,55,22,70,24,58,16,52,66,78,60],
      kpis: { total: 1357, avg: 57, peak: 93 },
      savedPct: 12,
      savedText: "You saved 84L this week compared to last week!",
      compare: { you: 48, neighbor: 72, city: 65 }
    },
    weekly: {
      titleDate: "Week of Aug 10–16, 2025",
      x: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      y: [320, 280, 350, 300, 370, 410, 330],
      kpis: { total: 2360, avg: 337, peak: 410 },
      savedPct: 8,
      savedText: "Down 8% vs. previous week. Nice!",
      compare: { you: 335, neighbor: 360, city: 345 }
    },
    monthly: {
      titleDate: "August 2025",
      x: ["W1","W2","W3","W4","W5"],
      y: [980, 1120, 1040, 1200, 1080],
      kpis: { total: 5420, avg: 1084, peak: 1200 },
      savedPct: 15,
      savedText: "Great! 15% less than last month.",
      compare: { you: 1080, neighbor: 1220, city: 1150 }
    },
  };

  const d = datasets[period];

  // ---------- Charts ----------
  const lineData = useMemo(() => ({
    labels: d.x,
    datasets: [{
      label: "Liters",
      data: d.y,
      fill: true,
      borderColor: "#32A6E9",
      backgroundColor: (ctx) => {
        const {ctx: c} = ctx.chart;
        const g = c.createLinearGradient(0, 0, 0, 220);
        g.addColorStop(0, "rgba(50,166,233,0.35)");
        g.addColorStop(1, "rgba(50,166,233,0.08)");
        return g;
      },
      pointBackgroundColor: "#fff",
      pointBorderColor: "#32A6E9",
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.35
    }]
  }), [period]);

  const lineOpts = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display:false }, tooltip: { mode:"index", intersect:false } },
    interaction: { mode:"nearest", intersect:false },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => `${v}L` },
        grid: { color: "rgba(0,0,0,0.06)" }
      },
      x: { grid: { display:false } }
    }
  }), []);

  // Doughnut “savings” gauge
  const doughnutData = useMemo(() => {
    const pct = Math.max(0, Math.min(100, d.savedPct));
    return {
      labels: ["Saved", "Remaining"],
      datasets: [{
        data: [pct, 100-pct],
        backgroundColor: ["#1FBF77", "#E9F2F7"],
        borderWidth: 0,
        cutout: "70%"
      }]
    };
  }, [period]);

  const doughnutOpts = {
    plugins: { legend: { display:false }, tooltip: { enabled:false } },
    rotation: -90 * (Math.PI/180),
    circumference: 360 * (Math.PI/180)
  };

  // Bar comparison
  const barData = useMemo(() => ({
    labels: ["You","Neighbor","City Avg"],
    datasets: [{
      label: "Liters",
      data: [d.compare.you, d.compare.neighbor, d.compare.city],
      backgroundColor: ["#27B2E8","#FFA127","#9BA1A6"],
      borderRadius: 8,
      barThickness: 42
    }]
  }), [period]);

  const barOpts = {
    plugins: { legend: { display:false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => `${v}L` },
        grid: { color: "rgba(0,0,0,0.06)" }
      },
      x: { grid: { display:false } }
    }
  };

  // ---------- UI ----------
  return (
    <div className="container py-3" style={{background:"#faf5ff"}}>
      {/* Tabs */}
      <div className="d-flex gap-2 p-2 bg-white rounded-4 shadow-sm mb-3">
        {["daily","weekly","monthly"].map(key => (
          <button
            key={key}
            className={`btn fw-semibold rounded-4 px-4 ${period===key ? "btn-primary" : "btn-light"}`}
            onClick={() => setPeriod(key)}
          >
            {key[0].toUpperCase()+key.slice(1)}
          </button>
        ))}
      </div>

      {/* Water Consumption card */}
      <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
        <h4 className="mb-1">Water Consumption</h4>
        <div className="text-secondary mb-3">{d.titleDate}</div>
        <div className="px-1">
          <Line data={lineData} options={lineOpts} height={140} />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="bg-white rounded-4 shadow-sm p-3 h-100">
            <div className="text-secondary">Total Usage</div>
            <div className="display-6 fw-bold">{d.kpis.total}L</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bg-white rounded-4 shadow-sm p-3 h-100">
            <div className="text-secondary">Avg. {period === "daily" ? "Hourly" : period === "weekly" ? "Daily" : "Weekly"}</div>
            <div className="display-6 fw-bold">{d.kpis.avg}L</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bg-white rounded-4 shadow-sm p-3 h-100">
            <div className="text-secondary">Peak Usage</div>
            <div className="display-6 fw-bold">{d.kpis.peak}L</div>
          </div>
        </div>
      </div>

      {/* Savings card */}
      <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <h4 className="mb-0">Water Savings</h4>
          <span className="badge text-bg-success fs-6">{d.savedPct}%</span>
        </div>

        <div className="row g-3 align-items-center mt-1">
          <div className="col-12 col-md-8">
            <p className="mb-3 text-secondary">{d.savedText}</p>
            <button className="btn btn-info text-white fw-semibold">View Tips</button>
          </div>
          <div className="col-12 col-md-4">
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* Usage comparison */}
      <div className="bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
        <h4 className="mb-3">Usage Comparison</h4>
        <Bar data={barData} options={barOpts} height={120} />
        <div className="d-flex justify-content-between text-secondary small mt-2">
          <span>0L</span>
          <span>{Math.max(...barData.datasets[0].data)}L</span>
        </div>
      </div>
    </div>
  );
}
