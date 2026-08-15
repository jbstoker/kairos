"""Daily rituals — anchored to solar time."""

DAILY_RITUALS = [
    (4, "greet the sun"),
    (8, "begin the work"),
    (12, "mark the shadow"),
    (17, "honor the afternoon"),
    (20, "thank the day"),
    (22, "observe the night"),
]


def ritual_for_solar_time(solar_hours):
    """Return the ritual for the current solar hour (0-24)."""
    if solar_hours is None:
        return "observe the sky"
    for hour, ritual in DAILY_RITUALS:
        if solar_hours < hour:
            return ritual
    return "observe the sky"
