ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"]

# 相生 (generation cycle): each element feeds the next.
GENERATES = {
    "Wood": "Fire", "Fire": "Earth", "Earth": "Metal",
    "Metal": "Water", "Water": "Wood",
}

# 相克 (control cycle): each element restrains another.
CONTROLS = {
    "Wood": "Earth", "Earth": "Water", "Water": "Fire",
    "Fire": "Metal", "Metal": "Wood",
}


def element_for_year(year):
    """Year element from the heavenly-stem cycle (each element spans 2 years)."""
    return ELEMENTS[((year - 4) % 10) // 2]


def element_for_month(month_index):
    return ELEMENTS[(month_index - 1) % len(ELEMENTS)]


def generates(element):
    return GENERATES.get(element)


def controls(element):
    return CONTROLS.get(element)
