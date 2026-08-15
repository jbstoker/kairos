ARCHETYPES = [
    "Seeker", "Guardian", "Shifter", "Sage", "Lover", "Warrior", "Mystic",
    "Creator", "Destroyer", "Fool", "Empress", "Emperor", "Star",
]


def archetype(day_of_year):
    return ARCHETYPES[(day_of_year - 1) % len(ARCHETYPES)]
