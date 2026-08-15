"""Cross-referenced solar-noon engine.

Runs several independent calculation methods and returns their consensus
value, warning when they disagree. No single algorithm can mislead the
system unnoticed — if two methods disagree by more than 30 seconds, Kairos
says so instead of hiding it.
"""

import cmath
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from core.meeus_algorithms import calculate_noon_meeus
from core.suncalc_bridge import calculate_noon_suncalc
from core.skyfield_bridge import SKYFIELD_AVAILABLE, calculate_noon_skyfield

MINUTES_PER_DAY = 1440.0
AGREEMENT_LIMIT = timedelta(seconds=30)

METHODS = {
    "meeus": calculate_noon_meeus,
    "suncalc": calculate_noon_suncalc,
    "skyfield": calculate_noon_skyfield,
}


def default_methods():
    """All methods that can run in this environment."""
    methods = ["meeus", "suncalc"]
    if SKYFIELD_AVAILABLE:
        methods.append("skyfield")
    return methods


def _time_of_day_minutes(dt):
    return dt.hour * 60.0 + dt.minute + dt.second / 60.0 + dt.microsecond / 6e7


def _circular_mean_minutes(minutes):
    """Mean of times-of-day, treating them as points on a 24h circle.

    Avoids a spurious ~24h disagreement when a transit falls just after
    midnight and methods assign it to different calendar dates.
    """
    total = sum(cmath.exp(2j * math.pi * m / MINUTES_PER_DAY) for m in minutes)
    angle = cmath.phase(total) % (2 * math.pi)
    return angle / (2 * math.pi) * MINUTES_PER_DAY


def _circular_diff_minutes(a, b):
    d = abs(a - b) % MINUTES_PER_DAY
    return min(d, MINUTES_PER_DAY - d)


@dataclass
class SolarNoonResult:
    """The consensus outcome of the cross-reference engine."""

    value: datetime                 # consensus local wall-clock noon
    date: object                    # the date the prediction is for
    methods: list                   # methods that contributed
    max_diff: timedelta = timedelta(0)
    warnings: list = field(default_factory=list)

    def __str__(self):
        parts = [self.value.strftime("%H:%M:%S"),
                 f"({', '.join(self.methods)})"]
        if self.warnings:
            parts.append(" | " + "; ".join(self.warnings))
        return " ".join(parts)


def cross_reference_solar_noon(lat, lon, date=None, methods=None):
    """Predict solar noon for a location/date using multiple methods.

    Args:
        lat, lon: observer latitude/longitude in degrees (lon east positive).
        date: date to predict for (default: today).
        methods: method names to use (default: all available).

    Returns a SolarNoonResult, or None if every method failed.
    """
    if date is None:
        date = datetime.now().date()
    elif isinstance(date, datetime):
        date = date.date()

    if methods is None:
        methods = default_methods()

    results, names, warnings = [], [], []
    for name in methods:
        func = METHODS.get(name)
        if func is None:
            warnings.append(f"{name}: unknown method, skipped")
            continue
        try:
            results.append(func(lat, lon, date))
            names.append(name)
        except Exception as exc:  # noqa: BLE001 - one bad method must not kill all
            warnings.append(f"{name} failed: {exc}")

    if not results:
        return None

    # Circular mean of the time-of-day across all contributing methods.
    minutes = [_time_of_day_minutes(r) for r in results]
    consensus = datetime(date.year, date.month, date.day) \
        + timedelta(minutes=_circular_mean_minutes(minutes))

    # Largest pairwise circular disagreement.
    max_diff_min = max(_circular_diff_minutes(a, b)
                       for a in minutes for b in minutes)
    max_diff = timedelta(minutes=max_diff_min)
    if max_diff > AGREEMENT_LIMIT:
        warnings.append(
            f"algorithms disagree by {max_diff.total_seconds():.1f}s "
            f"({names})")
    if len(names) < 2:
        warnings.append("only one independent method available")

    return SolarNoonResult(
        value=consensus,
        date=date,
        methods=names,
        max_diff=max_diff,
        warnings=warnings,
    )

