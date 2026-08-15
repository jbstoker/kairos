import json
import os
from datetime import datetime

from core.utils import atomic_write_json

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBS_FILE = os.path.join(PROJECT_ROOT, "data", "observations.json")

CATEGORIES = ["solar_noon", "moon_phase", "season_event", "sun_movement"]


def load_observations():
    if not os.path.exists(OBS_FILE):
        return {cat: [] for cat in CATEGORIES}
    with open(OBS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    for cat in CATEGORIES:
        data.setdefault(cat, [])
    return data


def save_observation(category, value):
    obs = load_observations()
    obs.setdefault(category, []).append({
        "timestamp": datetime.now().isoformat(),
        "value": value
    })
    atomic_write_json(OBS_FILE, obs)


def get_last_observation(category):
    obs = load_observations()
    if obs.get(category):
        return obs[category][-1]
    return None

