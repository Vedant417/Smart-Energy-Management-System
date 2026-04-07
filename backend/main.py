"""
main.py
-------
FastAPI backend for the Smart Energy Management System.

Starts a simulated EnergyEnv and exposes REST endpoints for the
React frontend to consume.  The RL model is loaded on startup
(training is triggered automatically if no saved model is found).
"""

import asyncio
import json
import time
import threading
import numpy as np
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Local imports
from backend.environment import EnergyEnv, ELECTRICITY_RATE, STEP_HOURS
from backend.rl_model import (
    train_model,
    load_model,
    predict_action,
    get_training_progress,
    MODEL_PATH,
    LOG_DIR,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title       = "Smart Energy Management System API",
    description = "RL-powered energy optimisation for hostel buildings",
    version     = "1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],  # React dev server
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ---------------------------------------------------------------------------
# Global singletons
# ---------------------------------------------------------------------------

N_ROOMS = 4
env     = EnergyEnv(n_rooms=N_ROOMS)
model   = None  # loaded after startup

_training_running = False  # guard to prevent concurrent training

# Energy history for analytics  (timestep → dict)
energy_history: list[Dict[str, Any]] = []
baseline_history: list[float] = []   # baseline without RL (always-on policy)

# ---------------------------------------------------------------------------
# Startup: load or train model
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    global model
    zip_path = Path(str(MODEL_PATH) + ".zip")
    if zip_path.exists():
        print("[API] Loading saved RL model …")
        model = load_model(n_rooms=N_ROOMS)
    else:
        print("[API] No saved model — launching background training …")
        thread = threading.Thread(target=_background_train, daemon=True)
        thread.start()


def _background_train():
    global model, _training_running
    _training_running = True
    try:
        model = train_model(total_timesteps=100_000, n_rooms=N_ROOMS)
    finally:
        _training_running = False

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class UpdateEnvRequest(BaseModel):
    room_id:   int              # 1-indexed
    occupants: Optional[int]   = None
    outdoor_temp: Optional[float] = None

class ControlApplianceRequest(BaseModel):
    room_id:   int             # 1-indexed
    appliance: str             # "ac" | "lights" | "fan"
    value:     Any             # bool for on/off, float for ac_setpoint

class SimulateStepRequest(BaseModel):
    use_ai: bool = True        # True → RL action, False → no-op

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _record_history():
    """Append current energy state to history log."""
    state = env.get_state_dict()
    entry = {
        "step":         state["step"],
        "time_of_day":  state["time_of_day"],
        "energy_kwh":   state["total_energy_kwh"],
        "power_watts":  state["total_power_watts"],
        "cost_inr":     state["current_cost_inr"],
        "daily_cost":   state["daily_cost_inr"],
        "timestamp":    time.time(),
    }
    energy_history.append(entry)

    # Baseline: assume all appliances always on
    baseline_watts = (1500 + 40 + 75) * N_ROOMS
    baseline_kwh   = baseline_watts * STEP_HOURS / 1000.0
    baseline_cost  = baseline_kwh * ELECTRICITY_RATE
    baseline_history.append(baseline_cost)

    # Keep last 672 steps (7 days × 96 steps/day)
    if len(energy_history) > 672:
        energy_history.pop(0)
        baseline_history.pop(0)


def _compute_savings() -> Dict[str, float]:
    if not energy_history:
        return {"savings_pct": 0.0, "saved_inr": 0.0, "baseline_cost": 0.0, "actual_cost": 0.0}

    actual_cost   = sum(e["cost_inr"]  for e in energy_history)
    baseline_cost = sum(baseline_history)
    saved         = baseline_cost - actual_cost
    pct           = (saved / baseline_cost * 100) if baseline_cost > 0 else 0.0

    return {
        "savings_pct":    round(pct, 2),
        "saved_inr":      round(saved, 2),
        "baseline_cost":  round(baseline_cost, 2),
        "actual_cost":    round(actual_cost, 2),
    }

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status":           "ok",
        "model_loaded":     model is not None,
        "training_running": _training_running,
    }


@app.get("/get-state")
def get_state():
    """Return the full current environment state."""
    return env.get_state_dict()


@app.post("/predict-action")
def predict_action_endpoint():
    """
    Ask the RL model for the best action given the current state.
    Returns per-room action recommendations.
    """
    if model is None:
        progress = get_training_progress()
        raise HTTPException(
            status_code=503,
            detail={
                "message":  "Model is still training",
                "progress": progress,
            },
        )
    result = predict_action(model, env)
    return result


@app.post("/update-environment")
def update_environment(req: UpdateEnvRequest):
    """
    Manually update environment parameters (occupancy, outdoor temp).
    """
    if not (1 <= req.room_id <= N_ROOMS):
        raise HTTPException(status_code=400, detail=f"room_id must be 1–{N_ROOMS}")

    room = env.rooms[req.room_id - 1]

    if req.occupants is not None:
        room["occupants"] = max(0, min(10, req.occupants))

    if req.outdoor_temp is not None:
        env.outdoor_temp = max(15.0, min(45.0, req.outdoor_temp))

    return {"message": "Environment updated", "state": env.get_state_dict()}


@app.post("/control-appliance")
def control_appliance(req: ControlApplianceRequest):
    """
    Manually toggle an appliance in a specific room.

    appliance: "ac" | "lights" | "fan"
    value:     bool (on/off) or float (ac_setpoint)
    """
    if not (1 <= req.room_id <= N_ROOMS):
        raise HTTPException(status_code=400, detail=f"room_id must be 1–{N_ROOMS}")

    room = env.rooms[req.room_id - 1]

    if req.appliance == "ac":
        if isinstance(req.value, bool):
            room["ac_on"] = req.value
        elif isinstance(req.value, (int, float)):
            room["ac_setpoint"] = max(16.0, min(30.0, float(req.value)))
        else:
            raise HTTPException(status_code=400, detail="Invalid value for AC")

    elif req.appliance == "lights":
        room["lights_on"] = bool(req.value)

    elif req.appliance == "fan":
        room["fan_on"] = bool(req.value)

    else:
        raise HTTPException(status_code=400, detail="appliance must be 'ac', 'lights', or 'fan'")

    return {"message": f"Room {req.room_id} {req.appliance} updated", "room": env.get_state_dict()["rooms"][req.room_id - 1]}


@app.post("/simulate-step")
def simulate_step(req: SimulateStepRequest):
    """
    Advance the simulation by one 15-minute timestep.

    If use_ai=True and model is loaded, applies the RL action.
    Otherwise applies no-op action (all zeros).
    """
    if req.use_ai and model is not None:
        action_result = predict_action(model, env)
        actions = np.array(action_result["raw_action"], dtype=int)
    else:
        actions = np.zeros(N_ROOMS, dtype=int)

    obs, reward, terminated, truncated, info = env.step(actions)
    _record_history()

    if terminated or truncated:
        env.reset()

    return {
        "reward":  round(float(reward), 4),
        "info":    info,
        "state":   env.get_state_dict(),
        "actions": action_result["actions"] if req.use_ai and model else [],
        "reset":   terminated or truncated,
    }


@app.get("/stats")
def get_stats():
    """
    Return energy usage statistics and cost savings.
    """
    state    = env.get_state_dict()
    savings  = _compute_savings()
    progress = get_training_progress()

    # Last 48 entries (12 hours) for sparkline
    recent = energy_history[-48:]

    return {
        "current":         state,
        "savings":         savings,
        "training":        progress,
        "history":         recent,
        "total_steps":     env.step_count,
        "total_energy_kwh":round(sum(e["energy_kwh"] for e in energy_history), 3),
        "total_cost_inr":  round(sum(e["cost_inr"]   for e in energy_history), 2),
    }


@app.post("/train-model")
def trigger_training(background_tasks: BackgroundTasks):
    """Trigger model (re)training in the background."""
    global _training_running
    if _training_running:
        return {"message": "Training already in progress"}

    background_tasks.add_task(_background_train)
    return {"message": "Training started in background"}


@app.get("/training-progress")
def training_progress():
    """Poll training progress (called by frontend during training)."""
    return get_training_progress()
