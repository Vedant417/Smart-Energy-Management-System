/**
 * SavingsChart.jsx
 * Bar chart comparing RL vs baseline energy cost.
 */

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
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
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: ₹{p.value?.toFixed(4)}
        </p>
      ))}
    </div>
  );
};

export default function SavingsChart({ savings = {} }) {
  const { baseline_cost = 0, actual_cost = 0, saved_inr = 0, savings_pct = 0 } = savings;

  const data = [
    { name: "Baseline\n(Always ON)", cost: parseFloat(baseline_cost.toFixed(4)), fill: "#ef4444" },
    { name: "AI\nOptimised",         cost: parseFloat(actual_cost.toFixed(4)),   fill: "#22c55e" },
    { name: "Savings",               cost: parseFloat(saved_inr.toFixed(4)),     fill: "#6366f1" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Summary badges */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <p className="text-xs text-red-400 font-semibold">Baseline</p>
          <p className="text-sm font-bold text-red-300">₹{baseline_cost.toFixed(3)}</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <p className="text-xs text-green-400 font-semibold">AI Cost</p>
          <p className="text-sm font-bold text-green-300">₹{actual_cost.toFixed(3)}</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <p className="text-xs text-indigo-400 font-semibold">Saved</p>
          <p className="text-sm font-bold text-indigo-300">{savings_pct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" name="Cost (₹)" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
