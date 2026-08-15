"""Weekly rituals — one focus for each Kairos weekday."""

WEEKLY_RITUALS = {
    "Sun": "rest, plan the week",
    "Moon": "intend, set the tone",
    "Fire": "act, build, create",
    "Water": "feel, flow, listen",
    "Earth": "ground, tend, plant",
    "Air": "learn, speak, teach",
    "Star": "review, release, dream",
}


def ritual_for_weekday(weekday):
    return WEEKLY_RITUALS.get(weekday, "observe, breathe, be")
