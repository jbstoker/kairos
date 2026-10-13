"""Canonical Kairos constants — the observed day, month, and season names.

These are the names of Kairos Time itself: the primary display, the
"way of seeing time" the README describes. Traditions may define their
own calendar names on top of the same 13 x 28 + 1 structure (see
data/traditions/rhythm.json, which uses exactly these names).
"""

# Constructed 13-day Kairos week, inspired by Tzolk'in day signs (not the
# historical 260-day Tzolk'in). The 364 in-cycle days form 28 full weeks.
KAIROS_DAY_NAMES = [
    "Imix", "Ik", "Akbal", "Kan", "Chicchan", "Cimi", "Manik",
    "Lamat", "Muluc", "Oc", "Chuen", "Eb", "Ben",
]

# The thirteen observed months (13 x 28 days, plus one year day).
KAIROS_MONTH_NAMES = [
    "Root Moon",
    "Sap Moon",
    "Green Moon",
    "Bloom Moon",
    "Grain Moon",
    "Light Moon",
    "Thirst Moon",
    "Fruit Moon",
    "Harvest Moon",
    "Wine Moon",
    "Leaf Moon",
    "Frost Moon",
    "Star Moon",
]

# The observed seasons, keyed by the tropical season.
KAIROS_SEASON_NAMES = {
    "Spring": "Emergence",
    "Summer": "Radiance",
    "Autumn": "Release",
    "Winter": "Stillness",
}

# The one out-of-cycle day of the 13 x 28 + 1 year.
KAIROS_YEAR_DAY = "The Closing"


def kairos_day_name(day_of_year):
    """Name for days 1–364; The Closing (and leap intercalation) has no week."""
    if not 1 <= day_of_year <= 364:
        return None
    return KAIROS_DAY_NAMES[(day_of_year - 1) % 13]


def kairos_date(day_of_year):
    """The Kairos date for a 1-based day-of-year.

    Returns ``{"month", "day", "weekday", "year_day"}``.
    """
    if day_of_year > 364:
        return {
            "month": KAIROS_YEAR_DAY,
            "day": day_of_year - 364,
            "weekday": None,
            "year_day": True,
        }
    month = (day_of_year - 1) // 28
    return {
        "month": KAIROS_MONTH_NAMES[month],
        "day": (day_of_year - 1) % 28 + 1,
        "weekday": kairos_day_name(day_of_year),
        "year_day": False,
    }


def kairos_season_name(season):
    """Map a tropical season (Spring/Summer/Autumn/Winter) to its Kairos name."""
    return KAIROS_SEASON_NAMES.get(season, season)
