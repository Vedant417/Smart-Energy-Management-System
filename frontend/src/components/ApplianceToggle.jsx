/**
 * ApplianceToggle.jsx
 * Stylish on/off toggle for appliances with animated thumb.
 */

import React from "react";

export default function ApplianceToggle({ isOn, onChange, disabled = false }) {
  return (
    <div
      className={`toggle-track ${isOn ? "toggle-on" : "toggle-off"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && onChange(!isOn)}
      role="switch"
      aria-checked={isOn}
      tabIndex={0}
      onKeyDown={e => e.key === " " && !disabled && onChange(!isOn)}
    >
      <div className="toggle-thumb" />
    </div>
  );
}
