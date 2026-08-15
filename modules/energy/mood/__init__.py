"""Mood module — the emotional weather of each moon phase."""

MOON_MOODS = {
    "New Moon": ["quiet", "introspective", "seeding"],
    "Waxing Crescent": ["hopeful", "curious", "growing"],
    "First Quarter": ["driven", "decisive", "active"],
    "Waxing Gibbous": ["refining", "focused", "productive"],
    "Full Moon": ["luminous", "expressive", "expansive"],
    "Waning Gibbous": ["reflective", "grateful", "sharing"],
    "Last Quarter": ["releasing", "honest", "clearing"],
    "Waning Crescent": ["resting", "dreaming", "surrendering"],
}


def mood_for_moon(phase_name):
    return MOON_MOODS.get(phase_name, ["observe", "breathe"])
