"""Shared helpers for Kairos."""

import json
import os
import threading
from datetime import datetime, timezone

# Kairos-neutral week, shared by all traditions (starts on day 1 of the year).
DEFAULT_WEEKDAYS = ["Sun", "Moon", "Fire", "Water", "Earth", "Air", "Star"]

# Serializes same-process JSON writes; atomic os.replace protects cross-process.
_JSON_WRITE_LOCK = threading.Lock()


def day_of_year(dt=None):
    """Gregorian day-of-year (1..365/366) for a date (default: now)."""
    dt = dt or datetime.now()
    return dt.timetuple().tm_yday


def utc_to_local(utc_dt):
    """Convert a naive UTC datetime to a naive local wall-clock datetime."""
    if utc_dt.tzinfo is None:
        utc_dt = utc_dt.replace(tzinfo=timezone.utc)
    return utc_dt.astimezone().replace(tzinfo=None)


def atomic_write_json(path, data):
    """Write JSON atomically: temp file + fsync + rename.

    Readers (including other processes) always see either the old or the
    new complete file, never a partially written one. Same-process writers
    are serialized by a lock.
    """
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    tmp = f"{path}.tmp"
    with _JSON_WRITE_LOCK:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)



def month_day_from_doy(day_of_year, months=13):
    """Convert a day-of-year into (month_index, day, kind).

    Supports the Kairos 13-month solar calendar (13 x 28 days + a year day)
    and a 12-month approximation (5 x 31 + 7 x 30 = 365 days).

    Returns:
        (month_index, day, "month")  for a normal day
        (None, day, "year_day")      for the out-of-cycle year day
    """
    if months == 13:
        if day_of_year > 364:
            return None, day_of_year - 364, "year_day"
        month = (day_of_year - 1) // 28
        day = (day_of_year - 1) % 28 + 1
        return month, day, "month"

    # 12-month solar approximation
    if day_of_year <= 155:
        month = (day_of_year - 1) // 31
        day = (day_of_year - 1) % 31 + 1
    elif day_of_year <= 365:
        month = 5 + (day_of_year - 156) // 30
        day = (day_of_year - 156) % 30 + 1
    else:  # leap day appended to the final month
        return 11, 31, "month"
    return month, day, "month"


def tradition_season(trad_data, observed_season, day_of_year):
    """Map an observed Gregorian season onto a tradition's season names."""
    from core.season import SEASONS

    season_names = trad_data.get("season_names", [])
    if not season_names:
        return observed_season

    if len(season_names) == 4 and observed_season in SEASONS:
        return season_names[SEASONS.index(observed_season)]

    # Generic equal-segment mapping by day of year.
    index = min((day_of_year - 1) * len(season_names) // 365, len(season_names) - 1)
    return season_names[index]
