"""Canonical Kairos constants — the observed day, month, and season names.

These are the names of Kairos Time itself: the primary display, the
"way of seeing time" the README describes. Traditions may define their
own calendar names on top of the same 13 x 28 + 1 structure (see
data/traditions/rhythm.json, which uses exactly these names).
"""

# The seven observed days of the Kairos week (day 1 of the year = Sundial).
KAIROS_DAY_NAMES = [
    "Sundial",
    "Well",
    "Root",
    "Bloom",
    "Forge",
    "Harvest",
    "Star",
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
KAIROS_YEAR_DAY = "Deep Day"


def kairos_day_name(day_of_year):
    """The Kairos day name for a 1-based day-of-year (day 1 = Sundial)."""
    return KAIROS_DAY_NAMES[(day_of_year - 1) % 7]


def kairos_date(day_of_year):
    """The Kairos date for a 1-based day-of-year.

    Returns ``{"month", "day", "weekday", "year_day"}``.
    """
    if day_of_year > 364:
        return {
            "month": KAIROS_YEAR_DAY,
            "day": day_of_year - 364,
            "weekday": kairos_day_name(day_of_year),
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
