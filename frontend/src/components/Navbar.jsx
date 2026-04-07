/**
 * Navbar.jsx
 * Collapsible sidebar navigation with dark/light mode toggle.
 */

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  SlidersHorizontal,
  BarChart3,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/",         icon: LayoutDashboard,    label: "Dashboard" },
  { to: "/control",  icon: SlidersHorizontal,  label: "Control Panel" },
  { to: "/analytics",icon: BarChart3,           label: "Analytics" },
];

export default function Navbar({ notifications = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{
        background: "rgba(15,23,42,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 0 20px rgba(34,197,94,0.4)" }}
        >
          <Zap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">EnergyAI</p>
            <p className="text-xs text-slate-400 truncate">Smart Management</p>
          </div>
        )}
      </div>

      {/* AI Status Badge */}
      {!collapsed && (
        <div className="mx-4 mt-4 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-green-400" />
            <span className="text-xs font-semibold text-green-400">RL Agent Active</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Notifications Badge */}
      {!collapsed && notifications.length > 0 && (
        <div className="mx-4 mb-4">
          <div
            className="p-3 rounded-xl cursor-pointer"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-orange-400" />
              <span className="text-xs font-semibold text-orange-400">
                {notifications.length} Alert{notifications.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">{notifications[0]}</p>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center w-full py-4 border-t border-white/5 text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
