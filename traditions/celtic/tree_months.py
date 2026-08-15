# (Ogham letter, tree, quality) for each of the 13 Celtic tree months.
TREE_MONTHS = [
    ("Beth", "Birch", "new beginnings"),
    ("Luis", "Rowan", "protection"),
    ("Fearn", "Alder", "resilience"),
    ("Saille", "Willow", "intuition"),
    ("Nion", "Ash", "connection"),
    ("Uath", "Hawthorn", "purification"),
    ("Duir", "Oak", "strength"),
    ("Tinne", "Holly", "courage"),
    ("Coll", "Hazel", "wisdom"),
    ("Muin", "Vine", "celebration"),
    ("Gort", "Ivy", "growth"),
    ("Ngetal", "Reed", "music"),
    ("Ruis", "Elder", "transformation"),
]


def tree_month(month_index):
    if month_index is None or not (0 <= month_index < len(TREE_MONTHS)):
        return None
    letter, tree, quality = TREE_MONTHS[month_index]
    return {"letter": letter, "tree": tree, "quality": quality}
