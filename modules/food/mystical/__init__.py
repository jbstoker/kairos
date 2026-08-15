"""Mystical eating — foods aligned with the moon's phase."""

MOON_PHASE_FOODS = {
    "New Moon": ["fast", "light soups", "sprouts"],
    "Waxing Crescent": ["growing greens", "milk", "eggs"],
    "First Quarter": ["leafy greens", "fresh vegetables", "rice"],
    "Waxing Gibbous": ["cooked grains", "root vegetables", "broths"],
    "Full Moon": ["fruits", "nuts", "fermented foods"],
    "Waning Gibbous": ["soups", "sourdough", "pressed salads"],
    "Last Quarter": ["simple meals", "cleansing broths", "light proteins"],
    "Waning Crescent": ["root veg", "grains", "meat"]
}


def food_for_moon(phase_name):
    return MOON_PHASE_FOODS.get(phase_name, ["eat what you see"])
