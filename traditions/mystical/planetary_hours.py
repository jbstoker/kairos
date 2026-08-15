PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]


def planetary_hour(solar_time, day_of_week):
    """Simplified planetary hour: ~1.5h segments in the Chaldean order."""
    if solar_time is None:
        return None
    ruling = PLANETS[day_of_week % 7]
    hour_index = int(solar_time // 1.5) % 24
    planet = PLANETS[(PLANETS.index(ruling) + hour_index) % 7]
    return planet


def archetype_of_day(day_of_year, tradition="tartarian"):
    """13-day archetype wheel shared by the Tartarian and Mystical traditions."""
    wheel = ["Creator", "Healer", "Warrior", "Sage", "Lover", "Guardian",
             "Mystic", "Destroyer", "Fool", "Magician", "Empress", "Emperor", "Star"]
    return wheel[(day_of_year - 1) % 13]
