ELEMENTS = ["Fire", "Water", "Earth", "Air", "Ether"]

GLYPHS = {
    "Fire": "△",
    "Water": "▽",
    "Earth": "□",
    "Air": "◇",
    "Ether": "○",
}


def element_for_month(month_index):
    """Cycle the five elements through the 13 months."""
    return ELEMENTS[(month_index - 1) % len(ELEMENTS)]


def glyph(element):
    return GLYPHS.get(element, "?")
