/**
 * CostCard.jsx
 * Displays current cost estimate with savings badge.
 */

import React from "react";
import { TrendingDown, IndianRupee } from "lucide-react";

export default function CostCard({ dailyCost = 0, savedINR = 0, savingsPct = 0, baselineCost = 0 }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="metric-label">Estimated Daily Cost</p>
          <div className="flex items-end gap-1 mt-1">
            <span className="metric-value gradient-text">₹{dailyCost.toFixed(2)}</span>
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <IndianRupee size={22} className="text-green-400" />
        </div>
      </div>

      {/* Savings section */}
      <div className="border-t border-white/5 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Without AI (baseline)</span>
          <span className="text-slate-300 font-semibold">₹{baselineCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">With AI Optimisation</span>
          <span className="text-green-400 font-semibold">₹{dailyCost.toFixed(2)}</span>
        </div>
        <div className="h-px bg-white/5 my-2" />
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-green-400" />
          <span className="text-green-400 text-sm font-bold">You saved ₹{savedINR.toFixed(2)}</span>
          <span className="ml-auto badge-on text-xs px-2 py-0.5 rounded-full font-semibold">
            -{savingsPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.max(0, 100 - savingsPct)}%`,
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
            }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Cost efficiency: {savingsPct.toFixed(1)}% saved vs always-on baseline
        </p>
      </div>
    </div>
  );
}
