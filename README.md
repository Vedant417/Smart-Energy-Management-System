# Group Students Name

1. Vedant Vyas 23BAI11349
2. Anjali Kushwaha 23BAI10634

# GitHub Link

https://github.com/Vedant417/Smart-Energy-Management-System

# 🔋 Smart Energy Management System using Reinforcement Learning
A full-stack AI-powered simulation system that uses **Reinforcement Learning (PPO)** to optimize electricity consumption in a building/hostel environment while maintaining user comfort.

The system intelligently controls appliances like **Air Conditioners (AC), Lights, and Fans** across multiple rooms, learning to balance cost reduction with thermal satisfaction.

---

## 🎯 Project Objective
Develop an intelligent agent that:
1.  **Reduces Electricity Costs**: Minimizes usage when rooms are empty or during peak hours.
2.  **Maintains Comfort**: Ensures temperatures stay within the "Ideal Comfort Zone" (20°C - 26°C) for occupants.
3.  **Real-Time Adaptation**: Dynamically responds to changing outdoor temperatures and occupancy levels.

---

## 🧠 Core AI (Reinforcement Learning)

### Custom Gymnasium Environment
The system runs on a custom-built **Gymnasium** environment (`EnergyEnv`) that simulates thermal physics:
*   **State Space**: Outdoor temperature, indoor temperature, occupancy count, time of day, active power draw, and appliance states.
*   **Action Space**: Multi-Discrete (12 actions per room) including AC toggles, temperature adjustments, and "Eco-mode" presets.
*   **Reward Function**: 
    *   `+ Bonus` for keeping occupied rooms in the comfort range.
    *   `- Penalty` for high electricity expenditure (INR).
    *   `- Penalty` for discomfort or running appliances in empty rooms.

### RL Algorithm
*   **Algorithm**: PPO (Proximal Policy Optimization) via **Stable-Baselines3**.
*   **Architecture**: MLP Policy with two hidden layers of 256 nodes.
*   **Training**: 100,000+ timesteps with automated checkpoint saving.

---

## ⚙️ Backend Features (FastAPI)
The backend serves as the bridge between the RL model and the live dashboard:
*   **Real-Time Simulation**: 15-minute time-stepping logic.
*   **REST API Endpoints**:
    *   `/get-state`: Returns live telemetry for all rooms.
    *   `/predict-action`: Queries the RL agent for the next optimal decision.
    *   `/update-environment`: Allows manual overrides of occupancy and weather.
    *   `/stats`: Computes cost savings vs. a non-AI baseline.
*   **Automated Training**: Background thread to train the model on first launch if no model exists.

---

## 🌐 Frontend (Modern UI)
Built with **React 18** and **Tailwind CSS**, featuring a premium dark-mode aesthetic:

### 1. Dashboard
*   **Live Metrics**: Gauges for total power, average temperature, and AI savings percentage.
*   **Room Overview**: Card-based layout showing live status of every room.
*   **Timeline Chart**: Real-time energy consumption trends.

### 2. Control Panel
*   **Manual Overrides**: Toggle appliances and adjust AC setpoints.
*   **AI Recommendations**: View what the RL agent suggests before applying it.
*   **Occupancy Control**: Simulate different room densities to see how the AI reacts.

### 3. Analytics Page
*   **Performance Comparison**: RL Agent vs. Baseline (Always-On) cost analysis.
*   **Comfort Analysis**: Temperature vs. Comfort Zone distribution map.
*   **KPI Tiles**: Total energy (kWh), total cost (INR), and efficiency gains.

---

## 📊 Visualizations
Using **Recharts** for high-performance data rendering:
*   **Energy Area Chart**: Overlapping power and energy usage.
*   **Savings Bar Chart**: Side-by-side comparison of AI vs. traditional management.
*   **Comfort Zone Reference**: Visualizing thermal stability within target bands.

---

## 🧩 Project Structure
```text
Smart Energy Management System/
├── backend/
│   ├── main.py          (FastAPI App & Endpoints)
│   ├── environment.py   (Custom Gymnasium RL Environment)
│   ├── rl_model.py      (PPO Training & Inference Logic)
│   └── __init__.py
├── frontend/
│   ├── src/
│   │   ├── components/  (Navbar, RoomCard, EnergyGauge, Charts)
│   │   ├── pages/       (Dashboard, ControlPanel, Analytics)
│   │   ├── api/         (Axios API Wrapper)
│   │   └── App.jsx
│   ├── tailwind.config.js
│   └── index.html
├── models/              (Saved PPO models)
├── logs/                (Training logs and JSON history)
├── requirements.txt     (Python dependencies)
└── README.md
```

---

## 🛠 Technologies Used
*   **Backend**: Python, FastAPI, Uvicorn, Gymnasium, Stable-Baselines3, PyTorch, NumPy.
*   **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Axios.

---

## 🚀 Installation & Setup

### 1. Backend Setup
```bash
# Install dependencies (Python 3.10 - 3.13)
pip install -r requirements.txt

# Run server
python -m uvicorn backend.main:app --reload --port 8000
```
*The model will automatically start training for 100k steps on the first run.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Accessible at http://localhost:5173*

---

## 💡 Key Highlights
*   **Portfolio Ready**: Professional UI with glassmorphism and animated backgrounds.
*   **Realistic Physics**: Mimics thermal drift and occupant behavior.
*   **Measurable Impact**: Real-time calculation of ROI and savings.
