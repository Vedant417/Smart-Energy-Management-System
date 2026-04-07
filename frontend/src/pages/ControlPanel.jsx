/**
 * ControlPanel.jsx
 * Manual appliance control + AI recommendations per room.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Brain, Zap, RefreshCw, ChevronDown, ChevronUp,
  Thermometer, Users, Wind, Lightbulb, AirVent,
  CheckCircle2, XCircle, SlidersHorizontal
} from "lucide-react";
import ApplianceToggle from "../components/ApplianceToggle";
import {
  getState, predictAction, controlAppliance,
  updateEnvironment, simulateStep
} from "../api/energyApi";

// ─── Occupancy selector ──────────────────────────────────────────────────────
function OccupancyControl({ roomId, current, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Users size={14} className="text-slate-400" />
      <span className="text-xs text-slate-400">Occupants:</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(roomId, n)}
            className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
            style={{
              background: current === n ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.06)",
              color: current === n ? "#fff" : "#64748b",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AC Setpoint slider ───────────────────────────────────────────────────────
function ACSetpoint({ roomId, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">AC Setpoint</span>
        <span className="text-blue-400 font-bold">{Math.round(value)}°C</span>
      </div>
      <input
        type="range" min="16" max="30" step="1"
        value={value}
        onChange={e => onChange(roomId, parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>16°C</span><span>30°C</span>
      </div>
    </div>
  );
}

// ─── AI Recommendation badge ─────────────────────────────────────────────────
function AIRecommendation({ action }) {
  if (!action) return null;
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg text-xs"
      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
    >
      <Brain size={12} className="text-green-400 flex-shrink-0" />
      <span className="text-green-300 font-medium">{action.description}</span>
    </div>
  );
}

// ─── Room Control Block ───────────────────────────────────────────────────────
function RoomControlBlock({ room, aiAction, onApplyAI, onRefresh }) {
  const [expanded, setExpanded] = useState(true);

  const handleAppliance = async (appliance, value) => {
    await controlAppliance(room.id, appliance, value);
    onRefresh();
  };
  const handleOccupancy = async (roomId, n) => {
    await updateEnvironment(roomId, { occupants: n });
    onRefresh();
  };
  const handleACSetpoint = async (roomId, val) => {
    await controlAppliance(roomId, "ac", val);
    onRefresh();
  };

  const isOccupied = room.occupants > 0;

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Room header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            {room.id}
          </div>
          <div>
            <p className="font-bold text-white">Room {room.id}</p>
            <p className="text-xs text-slate-400">
              {room.room_temp.toFixed(1)}°C • {room.power_watts}W •{" "}
              <span className={isOccupied ? "text-green-400" : "text-slate-500"}>
                {isOccupied ? `${room.occupants} person${room.occupants > 1 ? "s" : ""}` : "Empty"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiAction && (
            <span className="badge-on text-xs px-2 py-0.5 rounded-full">AI Req</span>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
          {/* AI recommendation */}
          {aiAction && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Recommendation</p>
              <AIRecommendation action={aiAction} />
              <button
                onClick={() => onApplyAI(room.id, aiAction)}
                className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 0 15px rgba(34,197,94,0.25)" }}
              >
                Apply AI Recommendation
              </button>
            </div>
          )}

          {/* AC */}
          <div className="space-y-3 p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AirVent size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-white">Air Conditioning</span>
                <span className={`text-xs px-2 py-0 rounded-full ${room.ac_on ? "badge-on" : "badge-off"}`}>
                  {room.ac_on ? "ON" : "OFF"}
                </span>
              </div>
              <ApplianceToggle isOn={room.ac_on} onChange={v => handleAppliance("ac", v)} />
            </div>
            {room.ac_on && (
              <ACSetpoint roomId={room.id} value={room.ac_setpoint} onChange={handleACSetpoint} />
            )}
          </div>

          {/* Lights + Fan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl space-y-2" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.1)" }}>
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className={room.lights_on ? "text-yellow-400" : "text-slate-500"} />
                <span className="text-xs font-semibold text-white">Lights</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${room.lights_on ? "text-yellow-400" : "text-slate-500"}`}>{room.lights_on ? "ON • 40W" : "OFF"}</span>
                <ApplianceToggle isOn={room.lights_on} onChange={v => handleAppliance("lights", v)} />
              </div>
            </div>
            <div className="p-3 rounded-xl space-y-2" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.1)" }}>
              <div className="flex items-center gap-2">
                <Wind size={14} className={room.fan_on ? "text-cyan-400" : "text-slate-500"} />
                <span className="text-xs font-semibold text-white">Fan</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${room.fan_on ? "text-cyan-400" : "text-slate-500"}`}>{room.fan_on ? "ON • 75W" : "OFF"}</span>
                <ApplianceToggle isOn={room.fan_on} onChange={v => handleAppliance("fan", v)} />
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <OccupancyControl roomId={room.id} current={room.occupants} onChange={handleOccupancy} />
        </div>
      )}
    </div>
  );
}

// ─── Control Panel Page ───────────────────────────────────────────────────────
export default function ControlPanel() {
  const [state,      setState]      = useState(null);
  const [aiActions,  setAIActions]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [applying,   setApplying]   = useState(false);
  const [mode,       setMode]       = useState("manual"); // "manual" | "ai"

  const fetchState = useCallback(async () => {
    try {
      const s = await getState();
      setState(s);
    } catch {}
  }, []);

  const fetchAI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await predictAction();
      setAIActions(res.actions ?? []);
    } catch (e) {
      console.error("AI predict error:", e.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const applyAllAI = async () => {
    setApplying(true);
    try {
      await simulateStep(true);
      await fetchState();
      await fetchAI();
    } finally {
      setApplying(false);
    }
  };

  const applyRoomAI = async (roomId, action) => {
    // Execute one simulation step with AI action
    await simulateStep(true);
    await fetchState();
  };

  const getAIAction = (roomId) => aiActions.find(a => a.room_id === roomId) ?? null;

  if (!state) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-green-500/30 border-t-green-500 animate-spin mx-auto" />
        <p className="text-slate-400">Connecting…</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control Panel</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manual override & AI recommendations per room</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAI}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
            }}
          >
            <Brain size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Thinking…" : "Get AI Advice"}
          </button>
          <button
            onClick={applyAllAI}
            disabled={applying || aiActions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: applying || !aiActions.length ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#22c55e,#16a34a)",
              boxShadow: "0 0 20px rgba(34,197,94,0.25)",
            }}
          >
            <CheckCircle2 size={16} />
            {applying ? "Applying…" : "Apply All AI"}
          </button>
          <button onClick={fetchState} className="p-2 rounded-xl text-slate-400 hover:text-white" style={{ background: "rgba(255,255,255,0.04)" }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="glass-card p-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-green-400" />
          <span className="text-xs text-slate-400">Total Power:</span>
          <span className="text-sm font-bold text-white">{state.total_power_watts}W</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-blue-400" />
          <span className="text-xs text-slate-400">Time:</span>
          <span className="text-sm font-bold text-white">
            {Math.floor(state.time_of_day)}:{String(Math.round((state.time_of_day % 1) * 60)).padStart(2, "0")}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-indigo-400" />
          <span className="text-xs text-slate-400">Rooms controlled:</span>
          <span className="text-sm font-bold text-white">{state.rooms?.length}</span>
        </div>
        {aiActions.length > 0 && (
          <>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-green-400" />
              <span className="text-xs text-green-400 font-semibold">{aiActions.length} AI recommendations ready</span>
            </div>
          </>
        )}
      </div>

      {/* Room control blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.rooms?.map(room => (
          <RoomControlBlock
            key={room.id}
            room={room}
            aiAction={getAIAction(room.id)}
            onApplyAI={applyRoomAI}
            onRefresh={fetchState}
          />
        ))}
      </div>
    </div>
  );
}
