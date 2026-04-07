/**
 * EnergyGauge.jsx
 * Animated SVG ring gauge for displaying energy/power metrics.
 */

import React from "react";

export default function EnergyGauge({ value = 0, max = 100, color = "#22c55e", label = "", unit = "%" }) {
  const radius   = 54;
  const circumference = 2 * Math.PI * radius;
  const pct    = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Background track */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="10"
          />
          {/* Filled arc */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              transition: "stroke-dashoffset 1s ease",
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
          {/* Center text */}
          <text x="65" y="60" textAnchor="middle" fill="#f1f5f9" fontSize="18" fontWeight="800" fontFamily="Inter">
            {typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}
          </text>
          <text x="65" y="78" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter">
            {unit}
          </text>
        </svg>
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${color}10 0%, transparent 70%)`,
            animation: "pulse 3s ease-in-out infinite",
          }}
        />
      </div>
      {label && <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>}
    </div>
  );
}
