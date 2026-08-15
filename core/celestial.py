"""Kairos Time (KST) — the celestial engine.

True astronomical positions via Skyfield and JPL ephemerides: solar
longitude, lunar phase, sidereal time, and star visibility. This is the
fully celestial layer of Kairos — no human epochs, no Gregorian calendar
at its center.

Requirements
------------
The engine needs the optional `skyfield` package (which pulls in numpy
and jplephem) and a JPL ephemeris file:

    pip install skyfield

The ephemeris is downloaded lazily on first use (a small ``de421.bsp``
~17 MB by default; set ``KAIROS_EPHEMERIS=de440.bsp`` for the full 100 MB
JPL DE440 file). Nothing here runs at import time, so the rest of Kairos
keeps working without Skyfield installed.
"""

import json
import math
import os
from datetime import datetime, timezone

try:  # optional dependency — checked eagerly, loaded lazily
    import skyfield  # noqa: F401
    KST_AVAILABLE = True
except ImportError:
    KST_AVAILABLE = False

# Mean synodic month (new moon to new moon) in days.
SYNODIC_MONTH_DAYS = 29.53058867

_EPHEMERIS = os.environ.get("KAIROS_EPHEMERIS", "de421.bsp")

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "data")
STAR_DATA_FILE = os.path.join(_DATA_DIR, "star_data.json")

# The 12 tropical zodiac signs, each spanning 30 degrees of ecliptic
# longitude (an approximation of a planet's constellation of residence).
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

_state = None  # lazily loaded skyfield handles


def _load_key_stars():
    """Read the heliacal-rising star catalog from data/star_data.json."""
    if os.path.exists(STAR_DATA_FILE):
        with open(STAR_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        stars = data.get("stars")
        if stars:
            return stars
    # Built-in fallback so the engine still works if the file is missing.
    return {
        "Sirius": {"ra_hours": 6.75, "dec_degrees": -16.7, "seasonal_meaning": "Nile flood, summer heat"},
        "Pleiades": {"ra_hours": 3.47, "dec_degrees": 24.1, "seasonal_meaning": "Autumn, harvest, mourning"},
        "Orion": {"ra_hours": 5.55, "dec_degrees": 7.4, "seasonal_meaning": "Winter, hunting, warrior"},
        "Arcturus": {"ra_hours": 14.15, "dec_degrees": 19.18, "seasonal_meaning": "Spring, planting, light"},
        "Vega": {"ra_hours": 18.61, "dec_degrees": 38.78, "seasonal_meaning": "Summer, music, star of the north"},
    }


KEY_STARS = _load_key_stars()


def _require():
    """Import skyfield and load the ephemeris, once (lazy)."""
    global _state
    if _state is not None:
        return _state
    try:
        from skyfield.api import Star, load, wgs84
        from skyfield import almanac
    except ImportError as exc:
        raise ImportError(
            "Kairos Time (KST) requires the 'skyfield' package. "
            "Run: pip install skyfield"
        ) from exc
    ts = load.timescale()
    eph = load(_EPHEMERIS)  # downloads the ephemeris on first use
    _state = {
        "Star": Star,
        "wgs84": wgs84,
        "almanac": almanac,
        "ts": ts,
        "eph": eph,
    }
    return _state


def _to_time(t):
    """Accept a Skyfield Time, an aware datetime, or naive-as-UTC datetime."""
    if hasattr(t, "utc"):  # already a skyfield Time object
        return t
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    return _require()["ts"].from_datetime(t)


def _utc_date(t):
    if hasattr(t, "utc_datetime"):
        return t.utc_datetime().date()
    if t.tzinfo is None:
        return t.date()
    return t.astimezone(timezone.utc).date()


# --------------------------------------------------------------------- #
# Core celestial values
# --------------------------------------------------------------------- #
_J2000 = 2451545.0


def solar_longitude(t):
    """Ecliptic longitude of the Sun in degrees (0-360), equinox of date.

    0° = vernal equinox, 90° = June solstice, 180° = autumn equinox,
    270° = December solstice (northern-hemisphere tropical frame).

    Skyfield's ``ecliptic_latlon()`` reports the longitude in the J2000
    ecliptic frame, which lags the equinox of date by the accumulated
    general precession (~0.34° in 2024). The standard IAU precession
    correction is applied so the values match the traditional tropical
    definition and cross-reference with the Meeus engine (arcseconds).
    """
    s = _require()
    t = _to_time(t)
    astro = s["eph"]["earth"].at(t).observe(s["eph"]["sun"]).apparent()
    _, lon, _ = astro.ecliptic_latlon()
    j2000_lon = lon.degrees % 360.0
    centuries = (t.tdb - _J2000) / 36525.0
    # IAU general precession in longitude (arcseconds), then to degrees.
    precession = (5028.796195 * centuries + 1.1054348 * centuries ** 2
                  + 0.00007964 * centuries ** 3) / 3600.0
    return (j2000_lon + precession) % 360.0


def lunar_phase_and_age(t):
    """Return (phase_fraction, age_in_days).

    phase_fraction: 0.0 = new moon, 0.5 = full moon, < 1.0.
    age_in_days: days since the last new moon (0 .. 29.53).
    """
    s = _require()
    t = _to_time(t)
    angle = s["almanac"].moon_phase(s["eph"], t).degrees % 360.0
    fraction = angle / 360.0
    age = fraction * SYNODIC_MONTH_DAYS
    return fraction, age


def local_sidereal_time(t, longitude_deg):
    """Local apparent sidereal time in hours (0-24) at a longitude."""
    s = _require()
    t = _to_time(t)
    return (t.gmst + longitude_deg / 15.0) % 24.0


def format_sidereal_time(hours):
    """Format sidereal hours as a short string, e.g. '04h37m'."""
    hh = int(hours) % 24
    mm = int((hours % 1) * 60)
    return f"{hh:02d}h{mm:02d}m"


def season_from_solar_longitude(sol_long):
    """Northern-hemisphere tropical seasons from solar longitude."""
    if 0 <= sol_long < 90:
        return "Spring"
    if 90 <= sol_long < 180:
        return "Summer"
    if 180 <= sol_long < 270:
        return "Autumn"
    return "Winter"


def heliacal_rising(star_name, t, latitude_deg, longitude_deg):
    """True if a key star is above the horizon at sunrise (pre-dawn).

    A heliacal rising is the first visible pre-dawn appearance of a star
    after it was hidden by the sun's glare. This simplified test asks:
    "at the moment of sunrise, is the star already above the horizon?"

    Returns None for an unknown star or when the sun never rises (polar
    day/night) on the given UTC day.
    """
    if star_name not in KEY_STARS:
        return None
    s = _require()
    t = _to_time(t)
    coords = KEY_STARS[star_name]
    star = s["Star"](ra_hours=coords["ra_hours"],
                     dec_degrees=coords["dec_degrees"])
    topo = s["wgs84"].latlon(latitude_deg, longitude_deg)

    # Find sunrise within the UTC calendar day of t.
    d = _utc_date(t)
    t0 = s["ts"].utc(d.year, d.month, d.day, 0)
    t1 = s["ts"].utc(d.year, d.month, d.day + 1, 0)
    f = s["almanac"].sunrise_sunset(s["eph"], topo)
    times, events = s["almanac"].find_discrete(t0, t1, f)
    rise_times = [tt for tt, ev in zip(times, events) if ev]
    if not rise_times:
        return None  # polar day/night: no sunrise to compare with

    observer = s["eph"]["earth"] + topo
    altitude = observer.at(rise_times[0]).observe(star).apparent().altaz()[0]
    return altitude.degrees > 0


def star_altitude_at_sunrise(star_name, t, latitude_deg, longitude_deg):
    """Altitude of a key star at sunrise (degrees), or None."""
    if star_name not in KEY_STARS:
        return None
    s = _require()
    t = _to_time(t)
    coords = KEY_STARS[star_name]
    star = s["Star"](ra_hours=coords["ra_hours"],
                     dec_degrees=coords["dec_degrees"])
    topo = s["wgs84"].latlon(latitude_deg, longitude_deg)
    d = _utc_date(t)
    t0 = s["ts"].utc(d.year, d.month, d.day, 0)
    t1 = s["ts"].utc(d.year, d.month, d.day + 1, 0)
    f = s["almanac"].sunrise_sunset(s["eph"], topo)
    times, events = s["almanac"].find_discrete(t0, t1, f)
    rise_times = [tt for tt, ev in zip(times, events) if ev]
    if not rise_times:
        return None
    observer = s["eph"]["earth"] + topo
    altitude = observer.at(rise_times[0]).observe(star).apparent().altaz()[0]
    return altitude.degrees


def dawn_stars(t, latitude_deg=0, longitude_deg=0):
    """Key stars above the horizon at today's sunrise, most prominent first.

    Returns a list of ``(name, altitude_degrees)`` tuples, sorted by
    altitude descending, or ``[]`` if no key star is up at dawn (or there
    is no sunrise — polar day/night). One sunrise computation is shared
    across all stars.
    """
    s = _require()
    t = _to_time(t)
    d = _utc_date(t)
    topo = s["wgs84"].latlon(latitude_deg, longitude_deg)
    sunrise_fn = s["almanac"].sunrise_sunset(s["eph"], topo)
    t0 = s["ts"].utc(d.year, d.month, d.day, 0)
    t1 = s["ts"].utc(d.year, d.month, d.day + 1, 0)
    times, events = s["almanac"].find_discrete(t0, t1, sunrise_fn)
    rise = [tt for tt, ev in zip(times, events) if ev]
    if not rise:
        return []
    observer = s["eph"]["earth"] + topo
    results = []
    for name, coords in KEY_STARS.items():
        star = s["Star"](ra_hours=coords["ra_hours"],
                         dec_degrees=coords["dec_degrees"])
        alt = float(observer.at(rise[0]).observe(star).apparent().altaz()[0].degrees)
        if alt > 0:
            results.append((name, alt))
    results.sort(key=lambda item: item[1], reverse=True)
    return results


def visible_star(t, latitude_deg=0, longitude_deg=0):
    """The most prominent key star above the horizon at dawn, else None.

    Note: this is a dawn-visibility check, not the stricter classical
    heliacal rising (which also requires the star to clear the twilight
    glow). Use ``dawn_stars()`` for the full list.
    """
    stars = dawn_stars(t, latitude_deg, longitude_deg)
    return stars[0][0] if stars else None


_NEXT_RISING_CACHE = {}
_NEXT_RISING_CACHE_MAX = 64  # bounded: a fresh scan is expensive, so cache per (lat, lon, date)


def next_heliacal_rising(t, latitude_deg=0, longitude_deg=0):
    """Which key star will next become visible at dawn.

    Returns ``(star_name, days_until)``: the key star — not currently
    visible — whose altitude at sunrise crosses above the horizon soonest,
    accurate to about a day. Returns ``(None, None)`` when no key star
    will rise within the next twelve months.

    The scan samples the dawn sky every 7 days and bisects each crossing
    to the nearest day. Results are cached per (latitude, longitude,
    date), since a fresh scan is a few hundred Skyfield calls.
    """
    from datetime import timedelta

    s = _require()
    t = _to_time(t)
    d0 = _utc_date(t)
    cache_key = (latitude_deg, longitude_deg, d0)
    if cache_key in _NEXT_RISING_CACHE:
        return _NEXT_RISING_CACHE[cache_key]

    topo = s["wgs84"].latlon(latitude_deg, longitude_deg)
    observer = s["eph"]["earth"] + topo
    sunrise_fn = s["almanac"].sunrise_sunset(s["eph"], topo)
    stars = {name: s["Star"](ra_hours=coords["ra_hours"],
                             dec_degrees=coords["dec_degrees"])
             for name, coords in KEY_STARS.items()}

    def altitudes_at_sunrise(day_offset):
        day = d0 + timedelta(days=day_offset)
        t0 = s["ts"].utc(day.year, day.month, day.day, 0)
        t1 = s["ts"].utc(day.year, day.month, day.day + 1, 0)
        times, events = s["almanac"].find_discrete(t0, t1, sunrise_fn)
        rise = [tt for tt, ev in zip(times, events) if ev]
        if not rise:
            return None  # polar day/night: no sunrise to compare with
        return {name: float(
                    observer.at(rise[0]).observe(star).apparent().altaz()[0].degrees)
                for name, star in stars.items()}

    today = altitudes_at_sunrise(0)
    if today is None:
        _NEXT_RISING_CACHE[cache_key] = (None, None)
        return None, None
    coming = [name for name in KEY_STARS
              if today[name] is not None and today[name] <= 0]

    step = 7
    result = None
    for offset in range(0, 378, step):
        alt = altitudes_at_sunrise(offset)
        if alt is None:
            continue
        for name in coming:
            if alt[name] > 0:
                # Bisect the crossing day between the samples.
                lo, hi = max(0, offset - step), offset
                while hi - lo > 1:
                    mid = (lo + hi) // 2
                    mid_alt = altitudes_at_sunrise(mid)
                    if mid_alt is not None and mid_alt[name] > 0:
                        hi = mid
                    else:
                        lo = mid
                if result is None or hi < result[1]:
                    result = (name, hi)
        if result is not None:
            break  # the soonest crossing has been found
    if len(_NEXT_RISING_CACHE) >= _NEXT_RISING_CACHE_MAX:
        _NEXT_RISING_CACHE.pop(next(iter(_NEXT_RISING_CACHE)))
    _NEXT_RISING_CACHE[cache_key] = result if result else (None, None)
    return _NEXT_RISING_CACHE[cache_key]


# --------------------------------------------------------------------- #
# Planets
# --------------------------------------------------------------------- #
PLANET_NAMES = ("mercury", "venus", "mars", "jupiter", "saturn")


def _zodiac_sign_from_ecliptic_lon(lon_deg):
    return ZODIAC_SIGNS[int(lon_deg // 30.0) % 12]


def planetary_position(planet_name, t):
    """Right ascension, declination, and approximate zodiac for a planet.

    Returns None for an unknown planet name. The zodiac sign is computed
    from the planet's ecliptic longitude (a ~1-degree approximation; the
    true IAU constellation needs boundary-catalog data).

    Small ephemerides such as de421.bsp contain full bodies only for the
    inner planets; for the outer planets the barycenter is used instead
    (angular difference well under 0.1 degrees).
    """
    key = str(planet_name).lower()
    if key not in PLANET_NAMES:
        return None
    s = _require()
    t = _to_time(t)
    try:
        body = s["eph"][key]
    except KeyError:
        body = s["eph"][f"{key} barycenter"]
    astro = s["eph"]["earth"].at(t).observe(body).apparent()
    ra, dec, _ = astro.radec()
    _, ecl_lon, _ = astro.ecliptic_latlon()
    return {
        "ra_hours": round(float(ra.hours), 4),
        "dec_degrees": round(float(dec.degrees), 4),
        "zodiac": _zodiac_sign_from_ecliptic_lon(float(ecl_lon.degrees) % 360.0),
        "ecliptic_longitude": round(float(ecl_lon.degrees) % 360.0, 2),
    }


# --------------------------------------------------------------------- #
# The complete KST snapshot
# --------------------------------------------------------------------- #
def get_kairos_time(t, latitude_deg=0, longitude_deg=0):
    """Return a complete KST dictionary for a time and location.

    `t` may be a skyfield Time, an aware datetime, or a naive datetime
    interpreted as UTC. `latitude_deg`/`longitude_deg` place the observer
    (longitude east positive).
    """
    if hasattr(t, "utc_iso"):
        ref = t.utc_iso()
    elif t.tzinfo is not None:
        ref = t.isoformat()
    else:
        ref = t.replace(tzinfo=timezone.utc).isoformat()

    sol_long = solar_longitude(t)
    lunar_phase, lunar_age = lunar_phase_and_age(t)
    sid_time = local_sidereal_time(t, longitude_deg)
    season = season_from_solar_longitude(sol_long)
    dawn = dawn_stars(t, latitude_deg, longitude_deg)
    star = dawn[0][0] if dawn else None
    dawn_names = [name for name, _ in dawn]
    next_star, next_star_days = next_heliacal_rising(t, latitude_deg, longitude_deg)
    planets = {name: pos for name, pos in
               ((name, planetary_position(name, t)) for name in PLANET_NAMES)
               if pos is not None}

    return {
        "solar_longitude": round(sol_long, 2),
        "lunar_phase": round(lunar_phase, 3),
        "lunar_age": round(lunar_age, 2),
        "sidereal_time": format_sidereal_time(sid_time),
        "sidereal_hours": round(sid_time, 3),
        "season": season,
        "season_event": season,
        "visible_star": star,
        "dawn_stars": dawn_names,
        "next_star": next_star,
        "next_star_days": next_star_days,
        "planets": planets,
        "gregorian_reference": ref,
    }
