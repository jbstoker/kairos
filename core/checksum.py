"""Kairos precession checksum — the first celestial checksum.

The vernal equinox (the 0° point of the tropical zodiac) is not fixed
among the stars: precession makes it drift westward at ~50.3 arcseconds
per year, completing one "Great Year" every ~25,772 years.

This module answers one verifiable question about the Earth-age year
Kairos displays (e.g. 4,540,002,026.624):

    "Is the deep-time year in phase with the observed position of the
     vernal equinox?"

- ``calculate_precession_position`` — the equinox phase *implied* by the
  deep-time year (how far it has swept within the current Great Year).
- ``get_expected_precession_position`` — the phase *observed* today:
  the accumulated general precession since the J2000.0 anchor.
- ``precession_checksum`` — compares the two (circular difference)
  against a tolerance and reports "consistent" or "inconsistent".
- ``phase_aligned_year`` — the deep-time year, nearest to the current
  one, whose phase *would* match the observed equinox. This is the
  constructive output: if the checksum fails, this is the year to use.
"""

import math
import json
import os
from datetime import datetime

from core.utils import atomic_write_json

# --------------------------------------------------------------------- #
# Constants
# --------------------------------------------------------------------- #
# One full precessional ("Great" / Platonic) year, in tropical years.
PRECESSION_CYCLE_YEARS = 25772

# Precession rate derived from the cycle (≈ 50.29 arcseconds per year).
PRECESSION_RATE_DEG_PER_YEAR = 360.0 / PRECESSION_CYCLE_YEARS

# Reference epoch: the J2000.0 equinox sits at 0° by definition.
J2000_EPOCH = 2000.0

# ~4.54 billion years, the accepted age of the Earth (configurable).
EARTH_AGE_DEFAULT = 4_540_000_000

# Where the running checksum log lives.
_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "data")
CHECKSUMS_FILE = os.path.join(_DATA_DIR, "checksums.json")


# --------------------------------------------------------------------- #
# Core calculations
# --------------------------------------------------------------------- #
def current_earth_age_year():
    """The deep-time year right now: Earth age + Gregorian year + fraction."""
    now = datetime.now()
    fraction = (now.timetuple().tm_yday - 1) / 365.2422
    return EARTH_AGE_DEFAULT + now.year + fraction


def calculate_precession_position(earth_age_years):
    """Equinox phase (0-360°) implied by a deep-time year.

    The phase is where the vernal equinox would point within its current
    precessional cycle if it had been precessing for ``earth_age_years``.
    Computed as ``(earth_age_years mod CYCLE) / CYCLE * 360``.
    """
    phase_years = earth_age_years % PRECESSION_CYCLE_YEARS
    return (phase_years / PRECESSION_CYCLE_YEARS) * 360.0


def get_expected_precession_position():
    """Observed equinox phase (0-360°) relative to the J2000.0 anchor.

    The J2000.0 equinox defines 0°; the general precession accumulated
    since then is the equinox's current observed position (~0.37° in
    2026, growing ~50.29 arcseconds per year).
    """
    now = datetime.now()
    fraction = (now.timetuple().tm_yday - 1) / 365.2422
    years_since_j2000 = now.year + fraction - J2000_EPOCH
    drift = years_since_j2000 * PRECESSION_RATE_DEG_PER_YEAR
    return drift % 360.0


def _circular_difference(a, b):
    diff = abs(a - b) % 360.0
    return min(diff, 360.0 - diff)


# --------------------------------------------------------------------- #
# Checksum
# --------------------------------------------------------------------- #
def precession_checksum(earth_age_years=None, tolerance_deg=0.5):
    """Check a deep-time year against the observed vernal equinox.

    Returns a dict with the status, both positions, and the difference.
    """
    if earth_age_years is None:
        earth_age_years = current_earth_age_year()

    calculated = calculate_precession_position(earth_age_years)
    expected = get_expected_precession_position()
    diff = _circular_difference(calculated, expected)

    return {
        "status": "consistent" if diff <= tolerance_deg else "inconsistent",
        "calculated_position": round(calculated, 4),
        "expected_position": round(expected, 4),
        "difference_deg": round(diff, 4),
        "tolerance_deg": tolerance_deg,
    }


def phase_aligned_year(earth_age_years=None):
    """The deep-time year (nearest to ``earth_age_years``) whose
    precessional phase matches the observed equinox today."""
    if earth_age_years is None:
        earth_age_years = current_earth_age_year()
    expected = get_expected_precession_position()
    phase_years = expected / PRECESSION_RATE_DEG_PER_YEAR
    cycles = earth_age_years // PRECESSION_CYCLE_YEARS
    return cycles * PRECESSION_CYCLE_YEARS + phase_years


# --------------------------------------------------------------------- #
# Continuous consistency tracking (the "self-check" fold of Kairos)
# --------------------------------------------------------------------- #
def load_checksum_log():
    if not os.path.exists(CHECKSUMS_FILE):
        return []
    try:
        with open(CHECKSUMS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (ValueError, OSError):
        return []


def track_checksum(earth_age_years=None, max_entries=2000):
    """Append the current checksum result to the running log.

    This is the continuous-checking half of the project: every call
    records the relationship between the Earth-age year and the observed
    equinox, so drift in the epoch, the format, or the math becomes
    visible as a trend instead of a silent change.
    """
    if earth_age_years is None:
        earth_age_years = current_earth_age_year()
    result = precession_checksum(earth_age_years)
    entry = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "earth_age_year": round(earth_age_years, 3),
        "status": result["status"],
        "difference_deg": result["difference_deg"],
        "calculated_position": result["calculated_position"],
        "expected_position": result["expected_position"],
        "tolerance_deg": result["tolerance_deg"],
    }
    log = load_checksum_log()
    log.append(entry)
    if len(log) > max_entries:
        log = log[-max_entries:]
    atomic_write_json(CHECKSUMS_FILE, log)
    return entry


def checksum_trend(limit=None):
    """Summarise the tracked checksum history.

    Returns ``{count, consistent_fraction, worst_difference, stable,
    spread_deg, entries}``. ``stable`` means the measured phase difference
    has not drifted (spread below 0.01°) — the relationship between the
    deep-time year and the equinox is holding constant.
    """
    log = load_checksum_log()
    if limit is not None:
        log = log[-limit:]
    if not log:
        return {"count": 0, "consistent_fraction": None, "worst_difference": None,
                "stable": None, "spread_deg": None, "entries": []}
    diffs = [entry["difference_deg"] for entry in log]
    consistent = sum(1 for entry in log if entry["status"] == "consistent")
    spread = max(diffs) - min(diffs)
    return {
        "count": len(log),
        "consistent_fraction": round(consistent / len(log), 3),
        "worst_difference": round(max(diffs), 4),
        "stable": spread < 0.01,
        "spread_deg": round(spread, 6),
        "entries": log,
    }


# --------------------------------------------------------------------- #
# Human-readable report
# --------------------------------------------------------------------- #
def checksum_report(earth_age_years=None, lang="en"):
    """A human-readable summary of the precession checksum.

    The absolute offset between a round-number deep-time epoch and the
    precession cycle is expected; what matters is that it *stays constant*
    over time. When tracking data exists, the report therefore includes the
    observed trend. ``lang`` selects the interface language (see core/i18n.py).
    """
    from core.i18n import translator

    t = translator(lang)
    if earth_age_years is None:
        earth_age_years = current_earth_age_year()

    result = precession_checksum(earth_age_years)
    if result["status"] == "consistent":
        icon, text = "✓", t("cli.checksum.consistent")
    else:
        icon, text = "⚠️", t("cli.checksum.inconsistent")

    lines = [
        t("cli.checksum.header", icon=icon, text=text),
        "   " + t("cli.checksum.calculated",
                  value=result["calculated_position"]),
        "   " + t("cli.checksum.observed",
                  value=result["expected_position"]),
        "   " + t("cli.checksum.difference",
                  value=result["difference_deg"],
                  tolerance=result["tolerance_deg"]),
    ]
    if result["status"] == "inconsistent":
        aligned = phase_aligned_year(earth_age_years)
        offset = earth_age_years - aligned
        lines.append("   " + t("cli.checksum.phase_offset",
                              offset=f"{offset:+,.0f}"))

    trend = checksum_trend()
    if trend["count"]:
        stable = (t("cli.checksum.stable") if trend["stable"]
                  else t("cli.checksum.drifting"))
        lines.append("   " + t("cli.checksum.trend",
                              stable=stable, count=trend["count"],
                              spread=trend["spread_deg"]))
    else:
        lines.append("   " + t("cli.checksum.trend_none"))
    return "\n".join(lines)

