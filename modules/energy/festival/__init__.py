"""Festival module — seasonal celebrations to keep."""

SEASON_FESTIVALS = {
    "Spring": ["rebirth rituals", "seed blessings", "equinox gatherings"],
    "Summer": ["solstice fires", "long-day feasts", "honoring the sun"],
    "Autumn": ["harvest festivals", "ancestor remembrance", "gratitude feasts"],
    "Winter": ["light ceremonies", "solstice vigils", "new year fires"],
}


def festival_for_season(season):
    return SEASON_FESTIVALS.get(season, ["observe the season"])
