/**
 * App.jsx
 * Root component — sets up routing and animated background.
 */

import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar    from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import Analytics from "./pages/Analytics";

// Animated background orbs
function AnimatedBackground() {
  return (
    <div className="animated-bg">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
    </div>
  );
}

export default function App() {
  const [notifications, setNotifications] = useState([]);

  return (
    <BrowserRouter>
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen">
        <Navbar notifications={notifications} />
        <main className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/"          element={<Dashboard setNotifications={setNotifications} />} />
            <Route path="/control"   element={<ControlPanel />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
