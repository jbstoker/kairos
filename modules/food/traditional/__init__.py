"""Traditional eating — dishes tied to each Kairos tradition."""

TRADITIONAL_FOODS = {
    "tartarian": ["hearth bread", "mead", "root stew"],
    "celtic": ["porridge", "soda bread", "heather ale"],
    "chinese": ["rice congee", "dim sum", "tea"],
    "vedic": ["kitchari", "ghee", "lentil dal"],
    "mesopotamian": ["barley bread", "date cakes", "beer"],
    "mystical": ["moon cakes", "elixir tea", "starfruit"],
}


def food_for_tradition(tradition):
    return TRADITIONAL_FOODS.get(tradition, TRADITIONAL_FOODS["tartarian"])
