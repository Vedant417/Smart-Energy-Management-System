"""
rl_model.py
-----------
PPO (Proximal Policy Optimization) training, saving, and inference
for the Smart Energy Management System.

Uses stable-baselines3 PPO with a custom Gymnasium environment.
"""

import os
import json
import time
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import (
    BaseCallback,
    EvalCallback,
    CheckpointCallback,
)
from stable_baselines3.common.monitor import Monitor

from backend.environment import EnergyEnv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT_DIR   = Path(__file__).resolve().parent.parent
MODEL_DIR  = ROOT_DIR / "models"
LOG_DIR    = ROOT_DIR / "logs"
MODEL_PATH = MODEL_DIR / "energy_ppo"

MODEL_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Training progress callback
# ---------------------------------------------------------------------------

class TrainingProgressCallback(BaseCallback):
    """Logs training progress to a JSON file for the frontend to consume."""

    def __init__(self, log_path: Path, verbose: int = 0):
        super().__init__(verbose)
        self.log_path = log_path
        self.episode_rewards: list[float] = []
        self._episode_reward = 0.0

    def _on_step(self) -> bool:
        # Accumulate reward
        for r in self.locals.get("rewards", []):
            self._episode_reward += float(r)

        # Check for episode end
        dones = self.locals.get("dones", [])
        for done in dones:
            if done:
                self.episode_rewards.append(self._episode_reward)
                self._episode_reward = 0.0

        # Write progress every 1000 steps
        if self.n_calls % 1000 == 0:
            progress = {
                "timestep":    self.n_calls,
                "n_episodes":  len(self.episode_rewards),
                "mean_reward": float(np.mean(self.episode_rewards[-50:])) if self.episode_rewards else 0.0,
                "status":      "training",
            }
            with open(self.log_path, "w") as f:
                json.dump(progress, f)

        return True

    def _on_training_end(self):
        progress = {
            "timestep":    self.n_calls,
            "n_episodes":  len(self.episode_rewards),
            "mean_reward": float(np.mean(self.episode_rewards[-50:])) if self.episode_rewards else 0.0,
            "status":      "done",
        }
        with open(self.log_path, "w") as f:
            json.dump(progress, f)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def train_model(
    total_timesteps: int = 100_000,
    n_rooms: int = 4,
    n_envs: int = 4,
    verbose: int = 1,
) -> PPO:
    """
    Train PPO on the EnergyEnv.

    Args:
        total_timesteps: Total environment steps to train for.
        n_rooms:         Number of rooms in each parallel environment.
        n_envs:          Number of parallel environments.
        verbose:         SB3 verbosity level (0=silent, 1=info).

    Returns:
        Trained PPO model.
    """
    print(f"[RL] Starting PPO training for {total_timesteps:,} timesteps …")
    t0 = time.time()

    # Create vectorised environments
    def make_env():
        env = EnergyEnv(n_rooms=n_rooms)
        env = Monitor(env)
        return env

    vec_env = make_vec_env(make_env, n_envs=n_envs)

    # PPO hyperparameters (tuned for this environment)
    model = PPO(
        policy           = "MlpPolicy",
        env              = vec_env,
        learning_rate    = 3e-4,
        n_steps          = 512,
        batch_size       = 64,
        n_epochs         = 10,
        gamma            = 0.99,
        gae_lambda       = 0.95,
        clip_range       = 0.2,
        ent_coef         = 0.01,       # encourage exploration
        vf_coef          = 0.5,
        max_grad_norm    = 0.5,
        verbose          = verbose,
        tensorboard_log  = str(LOG_DIR / "tensorboard"),
        policy_kwargs    = dict(net_arch=dict(pi=[256, 256], vf=[256, 256])),   # deeper network
    )

    # Callbacks
    progress_cb = TrainingProgressCallback(log_path=LOG_DIR / "training_progress.json")
    checkpoint_cb = CheckpointCallback(
        save_freq  = 25_000,
        save_path  = str(MODEL_DIR),
        name_prefix= "energy_ppo_ckpt",
    )

    model.learn(
        total_timesteps    = total_timesteps,
        callback           = [progress_cb, checkpoint_cb],
        progress_bar       = True,
    )

    # Save final model
    model.save(str(MODEL_PATH))
    elapsed = time.time() - t0
    print(f"[RL] Training complete in {elapsed:.1f}s — model saved to {MODEL_PATH}.zip")
    return model


def load_model(n_rooms: int = 4) -> Optional[PPO]:
    """Load the saved PPO model. Returns None if no model found."""
    zip_path = Path(str(MODEL_PATH) + ".zip")
    if not zip_path.exists():
        print(f"[RL] No saved model at {zip_path}")
        return None

    env = EnergyEnv(n_rooms=n_rooms)
    model = PPO.load(str(MODEL_PATH), env=env)
    print(f"[RL] Model loaded from {MODEL_PATH}.zip")
    return model


def predict_action(
    model: PPO,
    env: EnergyEnv,
) -> Dict[str, Any]:
    """
    Run one inference step.

    Returns a dict with action indices, descriptions, and metadata.
    """
    obs = env._get_obs()
    action, _states = model.predict(obs, deterministic=True)
    action = np.asarray(action, dtype=int)

    ACTION_DESCRIPTIONS = {
        0:  "No change",
        1:  "Toggle AC",
        2:  "Increase AC temp (+1°C)",
        3:  "Decrease AC temp (−1°C)",
        4:  "Toggle lights",
        5:  "Toggle fan",
        6:  "Increase AC temp (+2°C)",
        7:  "Decrease AC temp (−2°C)",
        8:  "Turn all appliances OFF",
        9:  "Turn AC + fan ON (comfort mode)",
        10: "Toggle lights + fan",
        11: "Set AC to 24°C (preset)",
    }

    room_actions = []
    for i, act in enumerate(action):
        room_actions.append({
            "room_id":     i + 1,
            "action_id":   int(act),
            "description": ACTION_DESCRIPTIONS.get(int(act), "Unknown"),
        })

    return {
        "actions":   room_actions,
        "raw_action": action.tolist(),
    }


def get_training_progress() -> Dict[str, Any]:
    """Read training progress log (written by callback)."""
    log_file = LOG_DIR / "training_progress.json"
    if not log_file.exists():
        return {"status": "not_started", "timestep": 0, "mean_reward": 0.0}
    with open(log_file) as f:
        return json.load(f)
