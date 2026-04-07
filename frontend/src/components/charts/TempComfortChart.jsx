/**
 * TempComfortChart.jsx
 * Scatter + area chart: Room temperature vs comfort zone over time.
 */

import React from "react";
import {
  ComposedChart, Area, Line, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ReferenceLine, ResponsiveContainer, Legend
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "rgba(15,23,42,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 14px",
    }}>
      <p className="text-xs text-slate-400 mb-1">Step {d?.step}</p>
      <p className="text-sm font-semibold text-blue-400">Room: {d?.roomTemp?.toFixed(1)}°C</p>
      <p className="text-sm font-semibold text-orange-400">Outdoor: {d?.outdoorTemp?.toFixed(1)}°C</p>
    </div>
  );
};

export default function TempComfortChart({ history = [], currentState = null }) {
  // Build chart data from history or generate sample from currentState
  let data = [];
  if (history.length > 0) {
    data = history.slice(-40).map((h, i) => ({
      step:        h.step ?? i,
      roomTemp:    h.room_temp ?? 24,
      outdoorTemp: h.outdoor_temp ?? 30,
    }));
  } else if (currentState?.rooms) {
    // Static single-point preview
    const avgRoom = currentState.rooms.reduce((s, r) => s + r.room_temp, 0) / currentState.rooms.length;
    data = [{ step: 0, roomTemp: avgRoom, outdoorTemp: currentState.outdoor_temp }];
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="comfortZone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.15}/>
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.03}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="step" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[15, 40]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="°" />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />

        {/* Comfort zone band 20-26°C */}
        <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Min 20°C", fill: "#22c55e", fontSize: 10 }} />
        <ReferenceLine y={26} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Max 26°C", fill: "#22c55e", fontSize: 10 }} />

        {/* Room temperature */}
        <Line type="monotone" dataKey="roomTemp"    name="Room Temp"    stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="outdoorTemp" name="Outdoor Temp" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 4" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
