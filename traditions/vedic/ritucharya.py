# The six Vedic seasons (ritus): (name, english, dietary notes).
RTUS = [
    ("Vasanta", "spring", ["light foods", "bitter", "cleansing"]),
    ("Grishma", "summer", ["cooling", "sweet", "hydration"]),
    ("Varsha", "monsoon", ["warming", "sour", "easily digestible"]),
    ("Sharad", "autumn", ["bitter", "light", "astringent"]),
    ("Hemanta", "early winter", ["rich", "sweet", "warming"]),
    ("Shishira", "late winter", ["oily", "warming", "nourishing"]),
]

# Approximate Gregorian month ranges per ritu.
RITU_MONTHS = [
    ("Vasanta", [3, 4]),
    ("Grishma", [5, 6]),
    ("Varsha", [7, 8]),
    ("Sharad", [9, 10]),
    ("Hemanta", [11, 12]),
    ("Shishira", [1, 2]),
]


def ritu_for_month(month):
    for name, months in RITU_MONTHS:
        if month in months:
            return name
    return None


def dietary_notes(ritu):
    for name, _, notes in RTUS:
        if name == ritu:
            return notes
    return []
