/**
 * Analytics.jsx
 * Data analytics page: energy trends, cost savings, temp vs comfort.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart3, TrendingDown, Zap, RefreshCw,
  Brain, Award, Clock, IndianRupee
} from "lucide-react";
import { EnergyAreaChart, CostLineChart } from "../components/charts/EnergyChart";
import SavingsChart from "../components/charts/SavingsChart";
import TempComfortChart from "../components/charts/TempComfortChart";
import { getStats, getState } from "../api/energyApi";

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, unit, color, trend }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${trend >= 0 ? "badge-on" : "badge-warn"}`}
          >
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="metric-label mt-3">{label}</p>
      <p className="text-2xl font-extrabold text-white mt-1">
        {value}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [stats,   setStats]   = useState(null);
  const [state,   setState_]  = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([getStats(), getState()]);
      setStats(s);
      setState_(st);
    } catch (e) {
      console.error("Analytics fetch error:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const savings  = stats?.savings  ?? {};
  const training = stats?.training ?? {};
  const history  = stats?.history  ?? [];

  const totalEnergy = stats?.total_energy_kwh ?? 0;
  const totalCost   = stats?.total_cost_inr   ?? 0;
  const totalSteps  = stats?.total_steps      ?? 0;
  const simHours    = ((totalSteps * 0.25) / 1).toFixed(1); // each step = 15 min

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Comprehensive energy data, savings analysis & AI performance
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Zap}          label="Total Energy"       value={totalEnergy.toFixed(3)} unit="kWh" color="#22c55e" />
        <StatTile icon={IndianRupee}  label="Total Cost"         value={`₹${totalCost.toFixed(2)}`} unit=""   color="#f97316" />
        <StatTile icon={TrendingDown} label="Cost Savings"       value={savings.savings_pct?.toFixed(1) ?? 0} unit="%" color="#6366f1" trend={savings.savings_pct} />
        <StatTile icon={Clock}        label="Sim Time Elapsed"   value={simHours} unit="hours" color="#eab308" />
      </div>

      {/* Training status card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={18} className="text-green-400" />
          <div>
            <p className="text-sm font-bold text-white">RL Agent Status</p>
            <p className="text-xs text-slate-400">PPO · MLP Policy [256, 256] · Gymnasium EnergyEnv</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${training.status === "done" ? "bg-green-400" : "bg-orange-400 animate-pulse"}`} />
            <span className={`text-xs font-semibold ${training.status === "done" ? "text-green-400" : "text-orange-400"}`}>
              {training.status === "done" ? "Trained & Active" : training.status === "training" ? "Training…" : "Not started"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-xs text-slate-400">Timesteps</p>
            <p className="text-lg font-bold text-white">{training.timestep?.toLocaleString() ?? "—"}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-xs text-slate-400">Episodes</p>
            <p className="text-lg font-bold text-white">{training.n_episodes ?? "—"}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-xs text-slate-400">Mean Reward</p>
            <p className="text-lg font-bold text-white">{training.mean_reward?.toFixed(2) ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy area chart */}
        <div className="glass-card p-5">
          <p className="section-title">Energy & Power Consumption</p>
          <p className="section-subtitle mb-4">kWh and watts over recent timesteps</p>
          <div style={{ height: 220 }}>
            <EnergyAreaChart data={history} />
          </div>
        </div>

        {/* Cost line chart */}
        <div className="glass-card p-5">
          <p className="section-title">Cost Over Time</p>
          <p className="section-subtitle mb-4">₹ per 15-minute step</p>
          <div style={{ height: 220 }}>
            <CostLineChart data={history} />
          </div>
        </div>
      </div>

      {/* Savings bar + Temp comfort charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <p className="section-title">RL vs Baseline Savings</p>
          <p className="section-subtitle mb-4">AI vs always-on policy cost comparison</p>
          <div style={{ height: 260 }}>
            <SavingsChart savings={savings} />
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="section-title">Temperature vs Comfort Zone</p>
          <p className="section-subtitle mb-4">Green band = comfort range (20–26°C)</p>
          <div style={{ height: 260 }}>
            <TempComfortChart history={[]} currentState={state} />
          </div>
        </div>
      </div>

      {/* Award section */}
      {savings.savings_pct > 10 && (
        <div
          className="glass-card p-5 flex items-center gap-4"
          style={{ border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.05)" }}
        >
          <Award size={32} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-300">🎉 Excellent AI Performance!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              The RL agent has saved ₹{savings.saved_inr?.toFixed(2)} ({savings.savings_pct?.toFixed(1)}%) 
              over the always-on baseline. The agent has learned effective energy optimisation strategies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
