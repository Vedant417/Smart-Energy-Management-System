/**
 * energyApi.js
 * Axios wrapper for all backend API calls.
 * Backend runs on http://localhost:8000
 */

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 10000,
});

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () => API.get("/health").then(r => r.data);

// ── State ──────────────────────────────────────────────────────────────────
export const getState = () => API.get("/get-state").then(r => r.data);

// ── RL Prediction ──────────────────────────────────────────────────────────
export const predictAction = () => API.post("/predict-action").then(r => r.data);

// ── Update Environment (occupancy, outdoor temp) ───────────────────────────
export const updateEnvironment = (roomId, updates) =>
  API.post("/update-environment", { room_id: roomId, ...updates }).then(r => r.data);

// ── Manual Appliance Control ───────────────────────────────────────────────
export const controlAppliance = (roomId, appliance, value) =>
  API.post("/control-appliance", { room_id: roomId, appliance, value }).then(r => r.data);

// ── Simulate Step ──────────────────────────────────────────────────────────
export const simulateStep = (useAi = true) =>
  API.post("/simulate-step", { use_ai: useAi }).then(r => r.data);

// ── Stats ──────────────────────────────────────────────────────────────────
export const getStats = () => API.get("/stats").then(r => r.data);

// ── Training ───────────────────────────────────────────────────────────────
export const triggerTraining = () => API.post("/train-model").then(r => r.data);
export const getTrainingProgress = () => API.get("/training-progress").then(r => r.data);

export default API;
