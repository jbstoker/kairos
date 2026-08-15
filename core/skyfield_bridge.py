"""Optional Skyfield bridge — a third, independent solar-noon method.

Skyfield is a heavyweight but very accurate astronomy library. Kairos
never requires it: the Meeus and SunCalc methods are always available.
When Skyfield IS installed, it joins the cross-referencing consensus.

    pip install skyfield

Note: the first call downloads the small DE421 ephemeris (~17 MB) into
Skyfield's data directory.
"""

from datetime import datetime, timedelta, timezone

from core.utils import utc_to_local

try:
    from skyfield.api import load, wgs84
    SKYFIELD_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    SKYFIELD_AVAILABLE = False


def calculate_noon_skyfield(lat, lon, date):
    """Solar noon as a naive local wall-clock datetime, via Skyfield.

    Finds the moment the sun's hour angle crosses zero within the UTC
    calendar day `date` — i.e. meridian transit — scanning at 5-minute
    resolution and interpolating.
    """
    if not SKYFIELD_AVAILABLE:
        raise RuntimeError("Skyfield is not installed. Run: pip install skyfield")

    ts = load.timescale()
    eph = load("de421.bsp")
    earth = eph["earth"]
    sun = eph["sun"]
    observer = wgs84.latlon(lat, lon)
    day_start = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)

    def hour_angle(t):
        astrometric = (earth + observer).at(t).observe(sun).apparent()
        _, h, _ = astrometric.hadec()
        return h.degrees  # -180..180

    prev_ha = None
    prev_utc = None
    for minute in range(0, 24 * 60 + 1, 5):
        utc_dt = day_start + timedelta(minutes=minute)
        ha = hour_angle(ts.from_datetime(utc_dt))
        if prev_ha is not None and prev_ha < 0 <= ha:
            # Linear interpolation of the zero crossing between samples.
            frac = prev_ha / (prev_ha - ha)
            noon_utc = prev_utc + timedelta(minutes=frac * 5)
            return utc_to_local(noon_utc)
        prev_ha, prev_utc = ha, utc_dt
    raise RuntimeError("Could not find meridian transit for the given location")
