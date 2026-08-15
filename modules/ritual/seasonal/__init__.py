"""Seasonal rituals — one practice per season."""

SEASON_RITUALS = {
    "Spring": ["plant something", "clean a corner", "write a new beginning"],
    "Summer": ["keep a fire", "swim or bathe outdoors", "celebrate abundance"],
    "Autumn": ["harvest and store", "thank the land", "light a lantern"],
    "Winter": ["tend a flame", "sleep more", "make something warm"],
}


def ritual_for_season(season):
    return SEASON_RITUALS.get(season, ["observe the season"])
