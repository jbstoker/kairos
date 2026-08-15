# The twelve zodiac signs with approximate sun-entry dates (month, day).
ZODIAC = [
    ("Aries", 3, 21), ("Taurus", 4, 20), ("Gemini", 5, 21),
    ("Cancer", 6, 21), ("Leo", 7, 23), ("Virgo", 8, 23),
    ("Libra", 9, 23), ("Scorpio", 10, 23), ("Sagittarius", 11, 22),
    ("Capricorn", 12, 22), ("Aquarius", 1, 20), ("Pisces", 2, 19),
]


def zodiac_sign(month, day):
    """Return the zodiac sign for a Gregorian month/day.

    The zodiac cycle starts at Aries (~Mar 21). Dates before Aries
    (Jan 1 - Mar 20) belong to the previous cycle's closing signs
    (Aquarius / Pisces), so the date is shifted forward by a year
    for comparison.
    """
    if (month, day) < (3, 21):
        month += 12
    sign = ZODIAC[0][0]
    for name, m, d in ZODIAC:
        # Aquarius/Pisces open the calendar year but close the zodiac cycle.
        compared_month = m + 12 if m < 3 else m
        if (month, day) >= (compared_month, d):
            sign = name
    return sign


def zodiac_for_doy(day_of_year):
    """Map a day-of-year onto the zodiac (approximate)."""
    from datetime import date

    jan1 = date(date.today().year, 1, 1)
    d = jan1.fromordinal(jan1.toordinal() + day_of_year - 1)
    return zodiac_sign(d.month, d.day)
