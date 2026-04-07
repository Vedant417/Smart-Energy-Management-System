/**
 * RoomCard.jsx
 * Displays the status of a single room with its appliances.
 */

import React from "react";
import { Thermometer, Users, Wind, Lightbulb, AirVent, Zap } from "lucide-react";
import ApplianceToggle from "./ApplianceToggle";
import { controlAppliance } from "../api/energyApi";

function TempBar({ temp, min = 15, max = 45 }) {
  const pct = ((temp - min) / (max - min)) * 100;
  const color =
    temp < 20 ? "#6366f1" :
    temp <= 26 ? "#22c55e" :
    temp <= 32 ? "#f97316" : "#ef4444";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Room Temp</span>
        <span className="font-bold" style={{ color }}>{temp.toFixed(1)}°C</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function RoomCard({ room, onUpdate }) {
  const { id, room_temp, occupants, ac_on, ac_setpoint, lights_on, fan_on, power_watts } = room;

  const toggle = async (appliance, value) => {
    try {
      await controlAppliance(id, appliance, value);
      onUpdate();
    } catch (e) {
      console.error("Control error:", e);
    }
  };

  const isOccupied = occupants > 0;
  const comfortOk  = room_temp >= 20 && room_temp <= 26;

  return (
    <div className="glass-card p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            {id}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Room {id}</p>
            <p className="text-xs text-slate-400">{power_watts}W active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isOccupied ? "badge-on" : "badge-off"}`}>
            {isOccupied ? `${occupants} occ.` : "Empty"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${comfortOk ? "badge-on" : "badge-warn"}`}>
            {comfortOk ? "Comfortable" : "Uncomfortable"}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <TempBar temp={room_temp} />

      {/* Appliances */}
      <div className="space-y-3 pt-1 border-t border-white/5">
        {/* AC */}
        <div className="flex items-center gap-3">
          <AirVent size={16} className={ac_on ? "text-blue-400" : "text-slate-500"} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-300">Air Conditioning</p>
            <p className="text-xs text-slate-500">Setpoint: {ac_setpoint.toFixed(0)}°C</p>
          </div>
          <ApplianceToggle isOn={ac_on} onChange={v => toggle("ac", v)} />
        </div>

        {/* Lights */}
        <div className="flex items-center gap-3">
          <Lightbulb size={16} className={lights_on ? "text-yellow-400" : "text-slate-500"} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-300">Lights</p>
            <p className="text-xs text-slate-500">40W</p>
          </div>
          <ApplianceToggle isOn={lights_on} onChange={v => toggle("lights", v)} />
        </div>

        {/* Fan */}
        <div className="flex items-center gap-3">
          <Wind size={16} className={fan_on ? "text-cyan-400" : "text-slate-500"} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-300">Fan</p>
            <p className="text-xs text-slate-500">75W</p>
          </div>
          <ApplianceToggle isOn={fan_on} onChange={v => toggle("fan", v)} />
        </div>
      </div>

      {/* Power indicator */}
      <div className="flex items-center gap-2 pt-1">
        <Zap size={12} className="text-green-400" />
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min((power_watts / 1615) * 100, 100)}%`,
              background: power_watts > 1000 ? "#ef4444" : power_watts > 500 ? "#f97316" : "#22c55e",
              transition: "width 0.8s ease",
            }}
          />
        </div>
        <span className="text-xs text-slate-400">{power_watts}W</span>
      </div>
    </div>
  );
}
