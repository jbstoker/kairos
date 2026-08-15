"""Python port of the SunCalc solar algorithms.

SunCalc by Vladimir Agafonkin (https://github.com/mourner/suncalc, MIT)
is a compact, widely used implementation that is independent of Meeus'
formulas. Kairos uses it as a second source when cross-referencing
solar-noon predictions.
"""

import math
from datetime import datetime, timedelta, timezone

from core.utils import utc_to_local

J1970 = 2440588.0    # Julian day of Unix epoch
J2000 = 2451545.0    # Julian day of the J2000.0 epoch
RAD = math.pi / 180.0

# Mean obliquity of the ecliptic used by SunCalc.
_EPSILON = 23.4397


def to_julian(dt):
    """Convert a datetime to a Julian day (via Unix timestamp)."""
    return dt.timestamp() / 86400.0 - 0.5 + J1970


def from_julian(j):
    """Convert a Julian day to a UTC datetime."""
    return datetime.fromtimestamp((j + 0.5 - J1970) * 86400.0, tz=timezone.utc)


def to_days(dt):
    """Days since J2000.0."""
    return to_julian(dt) - J2000


def _solar_mean_anomaly(days):
    return RAD * (357.5291 + 0.98560028 * days)


def _ecliptic_longitude(mean_anomaly):
    center = RAD * (1.9148 * math.sin(mean_anomaly)
                    + 0.02 * math.sin(2 * mean_anomaly)
                    + 0.0003 * math.sin(3 * mean_anomaly))
    perihelion = RAD * 102.9372
    return mean_anomaly + center + perihelion + math.pi


def _right_ascension(lon, lat):
    e = RAD * _EPSILON
    return math.atan2(math.sin(lon) * math.cos(e) - math.tan(lat) * math.sin(e),
                      math.cos(lon))


def _declination(lon, lat):
    e = RAD * _EPSILON
    return math.asin(math.sin(lat) * math.cos(e)
                     + math.cos(lat) * math.sin(e) * math.sin(lon))


def _sun_coords(days):
    m = _solar_mean_anomaly(days)
    lon = _ecliptic_longitude(m)
    return {"declination": _declination(lon, 0.0),
            "right_ascension": _right_ascension(lon, 0.0)}


def _sidereal_time(days, lw):
    return RAD * (280.16 + 360.9856235 * days) - lw


def _altitude(h, phi, dec):
    return math.asin(math.sin(phi) * math.sin(dec)
                     + math.cos(phi) * math.cos(dec) * math.cos(h))


def _azimuth(h, phi, dec):
    return math.atan2(math.sin(h),
                      math.cos(h) * math.sin(phi) - math.tan(dec) * math.cos(phi))


def sun_position(dt, lat, lon):
    """Altitude and azimuth of the sun (degrees) for a datetime.

    `dt` should be timezone-aware UTC, or naive interpreted as UTC.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    lw = RAD * -lon
    phi = RAD * lat
    d = to_days(dt)
    coords = _sun_coords(d)
    h = _sidereal_time(d, lw) - coords["right_ascension"]
    altitude = math.degrees(_altitude(h, phi, coords["declination"]))
    azimuth = math.degrees(_azimuth(h, phi, coords["declination"]))
    return {"altitude": altitude, "azimuth": azimuth}


def solar_noon_utc(lon_deg, date):
    """Solar noon for a longitude, as a naive UTC datetime (SunCalc).

    Finds the moment the sun's hour angle crosses zero within the UTC
    calendar day `date`, using SunCalc's own solar-position formulas.
    This is robust to any observer timezone, which the classic
    julianCycle-based transit shortcut is not.
    """
    lw = RAD * -lon_deg
    day_start = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)

    def hour_angle(t):
        d = to_days(t)
        coords = _sun_coords(d)
        ha = _sidereal_time(d, lw) - coords["right_ascension"]
        # Normalize to (-pi, pi] so the transit crossing is detectable.
        ha = (ha + math.pi) % (2 * math.pi) - math.pi
        return ha

    prev_ha = None
    prev_t = None
    best = (None, None)  # (min |hour angle|, time)
    for minute in range(0, 24 * 60 + 1, 2):
        t = day_start + timedelta(minutes=minute)
        ha = hour_angle(t)
        if best[0] is None or abs(ha) < best[0]:
            best = (abs(ha), t)
        if prev_ha is not None and prev_ha < 0 <= ha:
            # Linear interpolation of the zero crossing between the two
            # bracketing samples, plus one Newton refinement step.
            frac = prev_ha / (prev_ha - ha)
            crossing = prev_t + timedelta(minutes=frac * 2)
            h_now = hour_angle(crossing)
            rate = (ha - prev_ha) / 120.0  # radians per second
            crossing -= timedelta(seconds=h_now / rate)
            return crossing.replace(tzinfo=None)
        prev_ha, prev_t = ha, t

    # Extremely longitudes near the dateline can place the transit at the
    # very start of the UTC day; the closest sample is then the answer.
    return best[1].replace(tzinfo=None)


def calculate_noon_suncalc(lat, lon, date):
    """Solar noon as a naive local wall-clock datetime (SunCalc method)."""
    return utc_to_local(solar_noon_utc(lon, date))

