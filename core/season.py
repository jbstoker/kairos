from datetime import datetime, timedelta
from core.anchor import load_observations

SEASONS = ["Spring", "Summer", "Autumn", "Winter"]


def season_from_observations():
    """Most recently observed season event (e.g. 'Spring')."""
    events = load_observations().get("season_event", [])
    if not events:
        return None
    last = events[-1]
    return last.get("value")


def season_index(season):
    try:
        return SEASONS.index(season)
    except ValueError:
        return None


def season_for_month(month):
    """Approximate northern-hemisphere season for a Gregorian month (1-12)."""
    return SEASONS[((month + 9) % 12) // 3]


def season_for_doy(day_of_year):
    """Approximate season for a Gregorian day-of-year (1..366)."""
    jan1 = datetime(datetime.now().year, 1, 1)
    date = jan1 + timedelta(days=day_of_year - 1)
    return season_for_month(date.month)
