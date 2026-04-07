/**
 * Dashboard.jsx
 * Main dashboard: live metrics, room overview, recent history chart.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Thermometer, Zap, DollarSign, Users, Wind,
  Brain, RefreshCw, Play, Pause, AlertTriangle, Clock,
  TrendingUp, Activity
} from "lucide-react";
import EnergyGauge from "../components/EnergyGauge";
import CostCard from "../components/CostCard";
import RoomCard from "../components/RoomCard";
import { EnergyAreaChart } from "../components/charts/EnergyChart";
import { getState, getStats, simulateStep, checkHealth } from "../api/energyApi";

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, unit, color, sub }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4 animate-slide-up">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">
          {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
        </p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Training Banner ──────────────────────────────────────────────────────────
function TrainingBanner({ progress }) {
  if (!progress || progress.status === "done") return null;
  const pct = progress.timestep ? Math.round((progress.timestep / 100000) * 100) : 0;
  return (
    <div
      className="mb-6 p-4 rounded-2xl flex items-center gap-4 animate-pulse-slow"
      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
    >
      <Brain size={20} className="text-indigo-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-300">RL Agent Training in Progress…</p>
        <p className="text-xs text-slate-400 mt-0.5">{progress.timestep?.toLocaleString() ?? 0} / 100,000 timesteps — AI will activate after training</p>
        <div className="h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
          />
        </div>
      </div>
      <span className="text-sm font-bold text-indigo-300">{pct}%</span>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard({ setNotifications }) {
  const [state,    setState]    = useState(null);
  const [stats,    setStats]    = useState(null);
  const [health,   setHealth]   = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [useAI,    setUseAI]    = useState(true);
  const [lastStep, setLastStep] = useState(null);
  const simRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, st, h] = await Promise.all([getState(), getStats(), checkHealth()]);
      setState(s);
      setStats(st);
      setHealth(h);

      // Notifications
      const alerts = [];
      if (st.current?.total_power_watts > 4000) alerts.push("⚡ High energy usage detected!");
      if (s.rooms?.some(r => r.occupants === 0 && r.ac_on)) alerts.push("💡 AC running in empty room");
      setNotifications(alerts);
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  }, [setNotifications]);

  // Initial load
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Simulation loop
  useEffect(() => {
    if (simRunning) {
      simRef.current = setInterval(async () => {
        try {
          const res = await simulateStep(useAI);
          setLastStep(res);
          await fetchAll();
        } catch (e) { console.error(e); }
      }, 2000);
    } else {
      clearInterval(simRef.current);
    }
    return () => clearInterval(simRef.current);
  }, [simRunning, useAI, fetchAll]);

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-green-500/30 border-t-green-500 animate-spin mx-auto" />
          <p className="text-slate-400">Connecting to backend…</p>
          <p className="text-xs text-slate-600">Make sure FastAPI is running on port 8000</p>
        </div>
      </div>
    );
  }

  const savings = stats?.savings ?? {};
  const totalPower = state.total_power_watts ?? 0;
  const avgTemp = state.rooms
    ? (state.rooms.reduce((s, r) => s + r.room_temp, 0) / state.rooms.length)
    : 0;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Training banner */}
      <TrainingBanner progress={stats?.training} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Energy Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time AI-powered energy management •{" "}
            <span className={health?.model_loaded ? "text-green-400" : "text-orange-400"}>
              {health?.model_loaded ? "RL Model Active" : "Training Model…"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Brain size={14} className={useAI ? "text-green-400" : "text-slate-500"} />
            <span className="text-xs text-slate-300">AI</span>
            <div
              className={`toggle-track ${useAI ? "toggle-on" : "toggle-off"}`}
              onClick={() => setUseAI(!useAI)}
              style={{ width: 36, height: 20 }}
            >
              <div className="toggle-thumb" style={{ width: 14, height: 14, top: 3, left: 3 }} />
            </div>
          </div>

          {/* Sim control */}
          <button
            onClick={() => setSimRunning(!simRunning)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: simRunning
                ? "rgba(239,68,68,0.15)"
                : "linear-gradient(135deg,#22c55e,#16a34a)",
              color: simRunning ? "#f87171" : "#fff",
              border: simRunning ? "1px solid rgba(239,68,68,0.3)" : "none",
              boxShadow: simRunning ? "none" : "0 0 20px rgba(34,197,94,0.3)",
            }}
          >
            {simRunning ? <Pause size={16} /> : <Play size={16} />}
            {simRunning ? "Pause" : "Simulate"}
          </button>

          <button onClick={fetchAll} className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.04)" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Thermometer} label="Avg Room Temp"   value={avgTemp.toFixed(1)}       unit="°C"  color="#6366f1" sub={`Outdoor: ${state.outdoor_temp}°C`} />
        <MetricCard icon={Zap}         label="Total Power"     value={totalPower.toFixed(0)}     unit="W"   color="#22c55e" sub={`${(totalPower/1000).toFixed(2)} kW`} />
        <MetricCard icon={Activity}    label="Energy (total)"  value={state.total_energy_kwh}    unit="kWh" color="#f97316" sub={`${state.step} steps logged`} />
        <MetricCard icon={Clock}       label="Time of Day"     value={`${Math.floor(state.time_of_day)}:${String(Math.round((state.time_of_day%1)*60)).padStart(2,"0")}`} unit="" color="#eab308" sub="Simulated clock" />
      </div>

      {/* Gauges + Cost Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex items-center justify-around col-span-1 lg:col-span-2">
          <EnergyGauge
            value={totalPower}
            max={6460}
            color="#22c55e"
            label="Total Power"
            unit="W"
          />
          <EnergyGauge
            value={avgTemp}
            max={45}
            color={avgTemp > 26 ? "#ef4444" : avgTemp < 20 ? "#6366f1" : "#22c55e"}
            label="Avg Temperature"
            unit="°C"
          />
          <EnergyGauge
            value={savings.savings_pct ?? 0}
            max={100}
            color="#6366f1"
            label="AI Savings"
            unit="%"
          />
        </div>
        <CostCard
          dailyCost={state.daily_cost_inr ?? 0}
          savedINR={savings.saved_inr ?? 0}
          savingsPct={savings.savings_pct ?? 0}
          baselineCost={savings.baseline_cost ?? 0}
        />
      </div>

      {/* Last AI action */}
      {lastStep?.actions?.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-green-400" />
            <p className="text-sm font-semibold text-green-400">Last AI Actions</p>
            <span className="badge-on text-xs px-2 py-0 rounded-full ml-auto">Reward: {lastStep.reward?.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {lastStep.actions.map(a => (
              <div key={a.room_id} className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-slate-400">Room {a.room_id}:</span>{" "}
                <span className="text-white font-medium">{a.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-title">Energy Consumption</p>
            <p className="section-subtitle">Last {stats?.history?.length ?? 0} timesteps (each = 15 min)</p>
          </div>
          <TrendingUp size={18} className="text-green-400" />
        </div>
        <div style={{ height: 220 }}>
          <EnergyAreaChart data={stats?.history ?? []} />
        </div>
      </div>

      {/* Room Cards */}
      <div>
        <p className="section-title mb-4">Room Status</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {state.rooms?.map(room => (
            <RoomCard key={room.id} room={room} onUpdate={fetchAll} />
          ))}
        </div>
      </div>
    </div>
  );
}
