MONTHS_13 = [
    "Solaris", "Lunaris", "Floralis", "Aquarius", "Arboris",
    "Luminis", "Solaris II", "Ventus", "Telluris", "Ignis",
    "Caelestis", "Oceanus", "Terra Nova"
]

DAY_NAMES = ["Sun", "Moon", "Fire", "Water", "Earth", "Air", "Star"]

DAYS_PER_MONTH = 28
YEAR_DAYS = 365


def tartarian_date(day_of_year, leap=False):
    """Map a day-of-year onto the Tartarian 13-month calendar."""
    if day_of_year > 364:
        return {"month": "Tartarus Day", "day": day_of_year - 364}
    month_index = (day_of_year - 1) // 28
    day_in_month = (day_of_year - 1) % 28 + 1
    return {
        "month": MONTHS_13[month_index],
        "month_index": month_index + 1,
        "day": day_in_month,
        "weekday": DAY_NAMES[(day_of_year - 1) % 7]
    }
