# The four Celtic cross-quarter festivals: (name, Gregorian month, day).
FESTIVALS = [
    ("Samhain", 11, 1),
    ("Imbolc", 2, 1),
    ("Bealtaine", 5, 1),
    ("Lughnasadh", 8, 1),
]


def festival_for_date(month, day):
    for name, m, d in FESTIVALS:
        if m == month and d == day:
            return name
    return None


def festivals():
    return [name for name, _, _ in FESTIVALS]
