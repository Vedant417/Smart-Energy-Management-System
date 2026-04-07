"""
environment.py
--------------
Custom Gymnasium environment for Smart Energy Management System.

Simulates a hostel building with multiple rooms, each containing:
- AC unit (on/off + temperature setpoint)
- Lights (on/off)
- Fan (on/off)

The RL agent learns to control appliances to minimize energy cost
while keeping occupants comfortable.
"""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Optional, Dict, Any


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Energy consumption in watts for each appliance
POWER_AC_ON   = 1500   # W per AC unit
POWER_LIGHT   = 40     # W per light bulb
POWER_FAN     = 75     # W per fan

ELECTRICITY_RATE = 8.0  # ₹ per kWh

# Comfort temperature range (°C)
COMFORT_TEMP_MIN = 20.0
COMFORT_TEMP_MAX = 26.0
AC_TEMP_MIN      = 16.0
AC_TEMP_MAX      = 30.0

# Simulation step = 15 minutes (0.25 hours)
STEP_HOURS = 0.25


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

class EnergyEnv(gym.Env):
    """
    Multi-room hostel energy management environment.

    Observation (per room, flattened):
        [0] outdoor_temp        float  [15, 45] °C
        [1] room_temp           float  [15, 45] °C
        [2] occupants           int    [0, 10]
        [3] time_of_day         float  [0, 24)  hours
        [4] energy_consumption  float  [0, ∞)   watts (current step)
        [5] ac_on               bool   {0, 1}
        [6] ac_setpoint         float  [16, 30] °C
        [7] lights_on           bool   {0, 1}
        [8] fan_on              bool   {0, 1}

    Action (Discrete, per room):
        0  — No-op
        1  — Toggle AC on/off
        2  — AC temp +1°C
        3  — AC temp −1°C
        4  — Toggle lights on/off
        5  — Toggle fan on/off
        6  — AC temp +2°C (aggressive cool)
        7  — AC temp −2°C (aggressive warm)
        8  — Turn all off
        9  — Turn AC + fan on (auto-comfort mode)
        10 — Toggle lights + fan together
        11 — Set AC to 24°C (comfort preset)
    """

    metadata = {"render_modes": ["human"]}

    def __init__(self, n_rooms: int = 4, render_mode: Optional[str] = None):
        super().__init__()
        self.n_rooms = n_rooms
        self.render_mode = render_mode

        # Observation space: 9 features × n_rooms
        obs_dim = 9 * n_rooms
        self.observation_space = spaces.Box(
            low  = np.array([15, 15, 0, 0, 0, 0, 16, 0, 0] * n_rooms, dtype=np.float32),
            high = np.array([45, 45,10,24,5000,1,30, 1, 1] * n_rooms, dtype=np.float32),
            dtype=np.float32,
        )

        # Action space: one discrete action per room
        self.action_space = spaces.MultiDiscrete([12] * n_rooms)

        # Internal state
        self._reset_state()

        # Logging
        self.energy_log: list[float] = []   # kWh per step
        self.cost_log:   list[float] = []   # ₹ per step
        self.step_count: int = 0

    # ------------------------------------------------------------------
    # Gym API
    # ------------------------------------------------------------------

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        super().reset(seed=seed)
        self._reset_state()
        self.energy_log = []
        self.cost_log   = []
        self.step_count = 0
        return self._get_obs(), {}

    def step(self, action):
        """Advance the simulation by one 15-minute timestep."""
        action = np.asarray(action, dtype=int)

        # Apply actions to each room
        for room_idx in range(self.n_rooms):
            self._apply_action(room_idx, int(action[room_idx]))

        # Update physics / environment
        self._update_physics()

        # Calculate reward
        reward, info = self._compute_reward()

        # Advance time
        self.time_of_day = (self.time_of_day + STEP_HOURS) % 24
        self.step_count += 1

        obs = self._get_obs()
        terminated = False
        truncated  = self.step_count >= 96 * 7  # one week of 15-min steps

        return obs, reward, terminated, truncated, info

    def render(self):
        if self.render_mode == "human":
            print(self._state_summary())

    def close(self):
        pass

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _reset_state(self):
        """Initialise random room states."""
        rng = self.np_random if hasattr(self, "np_random") else np.random.default_rng()

        self.time_of_day  = float(rng.integers(0, 24))
        self.outdoor_temp = float(rng.uniform(25, 38))

        self.rooms: list[dict] = []
        for _ in range(self.n_rooms):
            self.rooms.append({
                "room_temp":  float(rng.uniform(24, 35)),
                "occupants":  int(rng.integers(0, 6)),
                "ac_on":      False,
                "ac_setpoint":float(rng.uniform(22, 26)),
                "lights_on":  bool(rng.integers(0, 2)),
                "fan_on":     bool(rng.integers(0, 2)),
            })

    def _apply_action(self, room_idx: int, action: int):
        """Apply a discrete action to a specific room."""
        r = self.rooms[room_idx]

        if action == 0:
            pass  # No-op

        elif action == 1:
            r["ac_on"] = not r["ac_on"]

        elif action == 2:
            r["ac_setpoint"] = _clamp(r["ac_setpoint"] + 1, AC_TEMP_MIN, AC_TEMP_MAX)

        elif action == 3:
            r["ac_setpoint"] = _clamp(r["ac_setpoint"] - 1, AC_TEMP_MIN, AC_TEMP_MAX)

        elif action == 4:
            r["lights_on"] = not r["lights_on"]

        elif action == 5:
            r["fan_on"] = not r["fan_on"]

        elif action == 6:
            r["ac_setpoint"] = _clamp(r["ac_setpoint"] + 2, AC_TEMP_MIN, AC_TEMP_MAX)

        elif action == 7:
            r["ac_setpoint"] = _clamp(r["ac_setpoint"] - 2, AC_TEMP_MIN, AC_TEMP_MAX)

        elif action == 8:
            r["ac_on"] = False
            r["lights_on"] = False
            r["fan_on"] = False

        elif action == 9:
            r["ac_on"] = True
            r["fan_on"] = True
            r["ac_setpoint"] = 24.0

        elif action == 10:
            r["lights_on"] = not r["lights_on"]
            r["fan_on"]    = not r["fan_on"]

        elif action == 11:
            r["ac_setpoint"] = 24.0
            r["ac_on"] = True

    def _update_physics(self):
        """Simple thermal model: room temp drifts toward outdoor / AC setpoint."""
        self.outdoor_temp += float(np.random.normal(0, 0.1))
        self.outdoor_temp  = _clamp(self.outdoor_temp, 15, 45)

        # Update occupants periodically
        if self.step_count % 4 == 0:  # every hour
            for r in self.rooms:
                delta = int(np.random.randint(-2, 3))
                r["occupants"] = _clamp(r["occupants"] + delta, 0, 10)
                # Lights auto-on when occupied (human behaviour)
                if r["occupants"] == 0:
                    r["lights_on"] = False

        for r in self.rooms:
            alpha = 0.05  # thermal coupling coefficient
            target = r["ac_setpoint"] if r["ac_on"] else self.outdoor_temp
            # Fan speeds up convergence slightly
            fan_boost = 1.2 if r["fan_on"] else 1.0
            r["room_temp"] += alpha * fan_boost * (target - r["room_temp"])
            r["room_temp"] += float(np.random.normal(0, 0.05))
            r["room_temp"]  = _clamp(r["room_temp"], 15, 45)

    def _power_watts(self, room: dict) -> float:
        """Return total power draw (W) for a room."""
        p = 0.0
        if room["ac_on"]:
            p += POWER_AC_ON
        if room["lights_on"]:
            p += POWER_LIGHT
        if room["fan_on"]:
            p += POWER_FAN
        return p

    def _compute_reward(self) -> tuple[float, dict]:
        """
        Reward design:
         - Negative for energy cost
         - Positive for keeping occupied rooms in comfort range
         - Penalty for occupied rooms outside comfort range
         - Small penalty for unnecessary appliances in empty rooms
        """
        total_cost    = 0.0
        comfort_bonus = 0.0
        discomfort_penalty = 0.0
        energy_total  = 0.0

        for r in self.rooms:
            watts  = self._power_watts(r)
            kwh    = watts * STEP_HOURS / 1000.0
            cost   = kwh * ELECTRICITY_RATE
            total_cost  += cost
            energy_total += watts

            occupied = r["occupants"] > 0

            if occupied:
                temp = r["room_temp"]
                if COMFORT_TEMP_MIN <= temp <= COMFORT_TEMP_MAX:
                    comfort_bonus += 2.0
                else:
                    gap = min(abs(temp - COMFORT_TEMP_MIN), abs(temp - COMFORT_TEMP_MAX))
                    discomfort_penalty += gap * 0.5
            else:
                # Penalise running AC in empty room
                if r["ac_on"]:
                    discomfort_penalty += 1.0

        # Energy cost: weighted negatively
        energy_penalty = total_cost * 10.0

        reward = comfort_bonus - energy_penalty - discomfort_penalty

        # Log
        kwh_total = energy_total * STEP_HOURS / 1000.0
        self.energy_log.append(kwh_total)
        self.cost_log.append(total_cost)

        info = {
            "energy_kwh":        kwh_total,
            "cost_inr":          total_cost,
            "comfort_bonus":     comfort_bonus,
            "discomfort_penalty":discomfort_penalty,
        }
        return float(reward), info

    def _get_obs(self) -> np.ndarray:
        """Flatten state into observation vector."""
        obs = []
        for r in self.rooms:
            watts = self._power_watts(r)
            obs.extend([
                self.outdoor_temp,
                r["room_temp"],
                float(r["occupants"]),
                self.time_of_day,
                watts,
                float(r["ac_on"]),
                r["ac_setpoint"],
                float(r["lights_on"]),
                float(r["fan_on"]),
            ])
        return np.array(obs, dtype=np.float32)

    # ------------------------------------------------------------------
    # Public state extraction (for API)
    # ------------------------------------------------------------------

    def get_state_dict(self) -> Dict[str, Any]:
        """Return human-readable state dict for the API."""
        total_watts = sum(self._power_watts(r) for r in self.rooms)
        total_cost  = sum(self.cost_log[-1:]) if self.cost_log else 0.0
        daily_cost  = sum(self.cost_log[-96:]) * ELECTRICITY_RATE if self.cost_log else 0.0

        return {
            "time_of_day":       round(self.time_of_day, 2),
            "outdoor_temp":      round(self.outdoor_temp, 1),
            "total_power_watts": round(total_watts, 1),
            "total_energy_kwh":  round(sum(self.energy_log), 3),
            "current_cost_inr":  round(total_cost, 4),
            "daily_cost_inr":    round(daily_cost, 2),
            "step":              self.step_count,
            "rooms": [
                {
                    "id":          i + 1,
                    "room_temp":   round(r["room_temp"], 1),
                    "occupants":   r["occupants"],
                    "ac_on":       r["ac_on"],
                    "ac_setpoint": round(r["ac_setpoint"], 1),
                    "lights_on":   r["lights_on"],
                    "fan_on":      r["fan_on"],
                    "power_watts": round(self._power_watts(r), 1),
                }
                for i, r in enumerate(self.rooms)
            ],
        }

    def _state_summary(self) -> str:
        s = self.get_state_dict()
        lines = [f"Time: {s['time_of_day']:.1f}h | Outdoor: {s['outdoor_temp']}°C | Power: {s['total_power_watts']}W"]
        for room in s["rooms"]:
            lines.append(
                f"  Room {room['id']}: {room['room_temp']}°C | occ={room['occupants']}"
                f" | AC={'ON' if room['ac_on'] else 'off'}@{room['ac_setpoint']}°C"
                f" | Light={'ON' if room['lights_on'] else 'off'}"
                f" | Fan={'ON' if room['fan_on'] else 'off'}"
                f" | {room['power_watts']}W"
            )
        return "\n".join(lines)
