ELEMENTS = ["Light", "Shadow", "Stone", "Wind", "Void"]

# Each element governs which part of a five-day cycle.
CYCLE_NOTES = {
    "Light": "clarity, beginnings, vision",
    "Shadow": "stillness, depth, rest",
    "Stone": "structure, patience, form",
    "Wind": "movement, change, voice",
    "Void": "release, space, mystery",
}


def element_of_day(day_of_year):
    return ELEMENTS[(day_of_year - 1) % len(ELEMENTS)]


def element_of_month(month_index):
    return ELEMENTS[(month_index - 1) % len(ELEMENTS)]


def note(element):
    return CYCLE_NOTES.get(element, "")
