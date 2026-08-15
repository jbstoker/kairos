"""Direct implementation of solar algorithms from Jean Meeus,
"Astronomical Algorithms", 2nd ed. (1998) — no external libraries.

Kairos uses this as one of several independent ways to predict solar
noon, so predictions can be cross-referenced instead of trusted blindly.

Implemented:
  - Julian Day conversion        (Meeus ch. 7)
  - Equation of time             (Meeus ch. 28)
  - Apparent solar declination   (Meeus ch. 25)
  - Solar noon (meridian transit)
"""

import math
from datetime import datetime, timedelta

from core.utils import utc_to_local

# --------------------------------------------------------------------- #
# Julian Day
# --------------------------------------------------------------------- #
def julian_day(year, month, day, hour=0.0):
    """Julian Day for a Gregorian date. `hour` is decimal hours UT."""
    if month <= 2:
        year -= 1
        month += 12
    a = year // 100
    b = 2 - a + a // 4
    jd = (int(365.25 * (year + 4716)) + int(30.6001 * (month + 1))
          + day + b - 1524.5)
    return jd + hour / 24.0


def julian_centuries(jd):
    """Julian centuries since the J2000.0 epoch."""
    return (jd - 2451545.0) / 36525.0


def _norm_deg(x):
    return x % 360.0


# --------------------------------------------------------------------- #
# Sun position data (Meeus ch. 25)
# --------------------------------------------------------------------- #
def solar_terms(jd):
    """Return (L0, M, e, C, R, eps0) for the sun at a Julian Day.

    L0   geometric mean longitude of the sun (deg)
    M    mean anomaly (deg)
    e    eccentricity of Earth's orbit
    C    equation of the center (deg)
    R    Earth-Sun distance (AU)
    eps0 mean obliquity of the ecliptic (deg)
    """
    t = julian_centuries(jd)
    l0 = _norm_deg(280.46646 + 36000.76983 * t + 0.0003032 * t ** 2)
    m = _norm_deg(357.52911 + 35999.05029 * t - 0.0001537 * t ** 2)
    e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t ** 2
    c = ((1.914602 - 0.004817 * t - 0.000014 * t ** 2) * math.sin(math.radians(m))
         + (0.019993 - 0.000101 * t) * math.sin(math.radians(2 * m))
         + 0.000289 * math.sin(math.radians(3 * m)))
    v = m + c
    r = 1.000001018 * (1 - e ** 2) / (1 + e * math.cos(math.radians(v)))
    eps0 = 23.43929111 - 0.013004167 * t - 0.00000016389 * t ** 2 + 0.0000005036 * t ** 3
    return l0, m, e, c, r, eps0


# --------------------------------------------------------------------- #
# Equation of time (Meeus ch. 28)
# --------------------------------------------------------------------- #
def equation_of_time(jd):
    """Equation of time in minutes for a Julian Day.

    Positive means the apparent (sundial) sun is AHEAD of mean solar time,
    so solar noon occurs before 12:00 mean time.
    """
    t = julian_centuries(jd)
    l0, m, e, c, r, eps0 = solar_terms(jd)
    omega = _norm_deg(125.04 - 1934.136 * t)
    eps = eps0 + 0.00256 * math.cos(math.radians(omega))  # true obliquity
    y = math.tan(math.radians(eps) / 2) ** 2
    l0_r = math.radians(l0)
    m_r = math.radians(m)
    e_rad = (y * math.sin(2 * l0_r) - 2 * e * math.sin(m_r)
             + 4 * e * y * math.sin(m_r) * math.cos(2 * l0_r)
             - 0.5 * y * y * math.sin(4 * l0_r)
             - 1.25 * e * e * math.sin(2 * m_r))
    return math.degrees(e_rad) * 4.0


def equation_of_time_for_date(date, hour=12.0):
    """Equation of time (minutes) for a calendar date, at ~noon UT."""
    return equation_of_time(julian_day(date.year, date.month, date.day, hour))


# --------------------------------------------------------------------- #
# Apparent solar declination (Meeus ch. 25)
# --------------------------------------------------------------------- #
def apparent_declination(jd):
    """Apparent solar declination in degrees for a Julian Day."""
    t = julian_centuries(jd)
    l0, m, e, c, r, eps0 = solar_terms(jd)
    omega = _norm_deg(125.04 - 1934.136 * t)
    apparent_lon = l0 + c - 0.00569 - 0.00478 * math.sin(math.radians(omega))
    eps = eps0 + 0.00256 * math.cos(math.radians(omega))
    return math.degrees(math.asin(
        math.sin(math.radians(eps)) * math.sin(math.radians(apparent_lon))))


def apparent_longitude(jd):
    """Apparent solar longitude in degrees (0-360), equinox of date."""
    t = julian_centuries(jd)
    l0, m, e, c, r, eps0 = solar_terms(jd)
    omega = _norm_deg(125.04 - 1934.136 * t)
    apparent_lon = l0 + c - 0.00569 - 0.00478 * math.sin(math.radians(omega))
    return apparent_lon % 360.0


# --------------------------------------------------------------------- #
# Solar noon (meridian transit)
# --------------------------------------------------------------------- #
def solar_noon_utc(lon_deg, date):
    """Solar noon for a longitude, as a naive UTC datetime.

    The sun transits the meridian when apparent solar time is 12:00:

        UTC_noon = 12:00 - EoT - lon/15        (lon east positive)
    """
    noon_hours = 12.0 - lon_deg / 15.0 - equation_of_time_for_date(date) / 60.0
    # Refine once: EoT changes slightly with time of day.
    jd_refined = julian_day(date.year, date.month, date.day, noon_hours)
    noon_hours = 12.0 - lon_deg / 15.0 - equation_of_time(jd_refined) / 60.0
    day0 = datetime(date.year, date.month, date.day)  # naive UTC day
    return day0 + timedelta(hours=noon_hours)


def calculate_noon_meeus(lat, lon, date):
    """Solar noon as a naive local wall-clock datetime (Meeus method).

    Latitude is accepted for a uniform API but does not shift the meridian
    transit time.
    """
    return utc_to_local(solar_noon_utc(lon, date))
