/**
 * EnergyChart.jsx
 * Line chart showing energy/cost over the last N timesteps.
 */

import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,23,42,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
    }}>
      <p className="text-xs text-slate-400 mb-1">Step {label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

export function EnergyAreaChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-500 text-sm">Collecting data…</p>
    </div>
  );

  const chartData = data.map((d, i) => ({
    step:        d.step ?? i,
    "Energy kWh": parseFloat(d.energy_kwh?.toFixed(4) ?? 0),
    "Power W":    parseFloat(d.power_watts?.toFixed(1) ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="step" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        <Area type="monotone" dataKey="Energy kWh" stroke="#22c55e" strokeWidth={2} fill="url(#energyGrad)" dot={false} />
        <Area type="monotone" dataKey="Power W"    stroke="#6366f1" strokeWidth={2} fill="url(#powerGrad)"  dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CostLineChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-500 text-sm">Collecting data…</p>
    </div>
  );

  const chartData = data.map((d, i) => ({
    step:         d.step ?? i,
    "Cost ₹":     parseFloat(d.cost_inr?.toFixed(4) ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="step" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="Cost ₹" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
