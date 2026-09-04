import math
from datetime import datetime
from core.anchor import get_last_observation


def estimate_day_length(lat_deg, declination_deg):
    """Day length in hours for a given latitude and solar declination."""
    lat = math.radians(lat_deg)
    dec = math.radians(declination_deg)
    cos_ha = -math.tan(lat) * math.tan(dec)
    cos_ha = max(-1, min(1, cos_ha))
    ha = math.acos(cos_ha)
    return 2 * math.degrees(ha) / 15


def solar_noon_from_observation():
    obs = get_last_observation("solar_noon")
    if obs:
        return datetime.fromisoformat(obs["timestamp"])
    return None


def current_solar_time():
    """True solar time in hours (0..24) — 12.0 is solar noon.

    Matches the web convention (web/static/js/solar_time.js):
    hours = 12 + (now - solar noon).

    Returns None when no solar noon has ever been observed.
    """
    noon = solar_noon_from_observation()
    if not noon:
        return None
    now = datetime.now()
    diff = now - noon
    hours = 12 + diff.total_seconds() / 3600
    return hours % 24


def format_solar_time(hours):
    """Format fractional hours as HH:MM solar time."""
    if hours is None:
        return "No observation"
    hours %= 24
    hh = int(hours)
    mm = int((hours % 1) * 60)
    return f"{hh:02d}:{mm:02d}"
