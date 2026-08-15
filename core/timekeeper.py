"""Kairos timekeeper — tradition-aware natural time.

The Kairos class is the main entry point. It records your own
observations (solar noon, moon phase, season events) and renders
the current Kairos time through any supported tradition.
"""

import json
import os
import sys
from datetime import datetime, timezone

# When run directly (`python core/timekeeper.py`), put the project root on
# sys.path so the `core.*` imports resolve regardless of working directory.
if not __package__:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.anchor import load_observations, save_observation
from core.constants import KAIROS_SEASON_NAMES, kairos_date, kairos_day_name, kairos_season_name
from core.cross_reference import cross_reference_solar_noon
from core.lunar import moon_age_from_phase, moon_phase_name, phase_from_emoji
from core.observation_correction import correct_solar_noon
from core.season import season_from_observations
from core.solar import format_solar_time, solar_noon_from_observation
from core.utils import DEFAULT_WEEKDAYS, day_of_year, month_day_from_doy, tradition_season
from traditions.mystical.planetary_hours import archetype_of_day

DEFAULT_TRADITION = "tartarian"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRADITIONS_DIR = os.path.join(PROJECT_ROOT, "data", "traditions")

VALID_SEASONS = ["Spring", "Summer", "Autumn", "Winter"]
MOON_EMOJIS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]

# The Earth is ~4.54 billion years old; the Kairos "Earth-Age year" appends
# the current Gregorian year+fraction to that figure (configurable).
EARTH_AGE_YEARS = 4_540_000_000


def format_year(raw_year):
    """Split an Earth-Age year into scale + precision, e.g. '4.54B / 2026.624'.

    The scale is the Earth's age in billions (2 decimals, floored so the
    precision is never negative); the precision is how far we are into the
    current year of that era.
    """
    scale_billions = raw_year / 1_000_000_000
    scale_value = int(scale_billions * 100) / 100 * 1_000_000_000  # floored base
    scale = f"{scale_value / 1_000_000_000:.2f}B"
    precision = raw_year - scale_value
    return f"{scale} / {precision:.3f}"


def format_kst(kst_data):
    """One-line human-readable Kairos Time string.

    >>> format_kst({"solar_time": "14:32", "day_name": "Sundial",
    ...             "month_name": "Bloom Moon", "day": 16, "season": "Radiance",
    ...             "earth_age_year": 4540002026.624})
    '14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624'
    """
    time_str = kst_data.get("solar_time", "--:--")
    month_name = kst_data.get("month_name", "Solaris")
    day = kst_data.get("day", 1)
    season = kst_data.get("season", "Summer")
    year_str = format_year(kst_data.get("earth_age_year", EARTH_AGE_YEARS))
    day_name = kst_data.get("day_name")
    parts = [time_str]
    if day_name:
        parts.append(day_name)
    parts.extend([f"{month_name} {day}", season, year_str])
    return " · ".join(parts)


def load_tradition(tradition):
    """Load a tradition definition from data/traditions/<tradition>.json."""
    path = os.path.join(TRADITIONS_DIR, f"{tradition}.json")
    if not os.path.exists(path):
        raise ValueError(f"Unknown tradition: {tradition!r}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class Kairos:
    def __init__(self, tradition=DEFAULT_TRADITION, lat=None, lon=None):
        self.tradition = tradition
        self.lat = lat
        self.lon = lon
        self.obs = load_observations()
        self.trad_data = load_tradition(tradition)

    # ------------------------------------------------------------------ #
    # Observations
    # ------------------------------------------------------------------ #
    def observe_solar_noon(self):
        save_observation("solar_noon", "observed")
        return "Solar noon recorded."

    def observe_moon_phase(self, emoji):
        idx = phase_from_emoji(emoji)
        if idx is None:
            return "Invalid emoji. Use 🌑🌒🌓🌔🌕🌖🌗🌘"
        save_observation("moon_phase", emoji)
        return f"Moon phase recorded: {moon_phase_name(idx)}"

    def observe_season_event(self, event):
        if event not in VALID_SEASONS:
            return f"Invalid season. Use one of: {', '.join(VALID_SEASONS)}"
        save_observation("season_event", event)
        return f"Season event recorded: {event}"

    # ------------------------------------------------------------------ #
    # Tradition-aware calendar
    # ------------------------------------------------------------------ #
    def calendar_date(self, day_of_year=None):
        """Map a day-of-year into this tradition's month/day/year-day."""
        if day_of_year is None:
            day_of_year = day_of_year()
        months = self.trad_data.get("months", 13)
        month_index, day, kind = month_day_from_doy(day_of_year, months)
        if kind == "year_day":
            month_name = self.trad_data.get("year_day", "Year Day")
            month_number = months
        else:
            month_name = self.trad_data["month_names"][month_index]
            month_number = month_index + 1
        weekdays = self.trad_data.get("weekdays", DEFAULT_WEEKDAYS)
        return {
            "month": month_name,
            "month_index": month_number,
            "day": day,
            "day_of_year": day_of_year,
            "weekday": weekdays[(day_of_year - 1) % 7],
            "kind": kind,
        }

    def archetype(self, day_of_year=None):
        """The tradition archetype governing a day (13-day wheel by default)."""
        if day_of_year is None:
            day_of_year = day_of_year()
        archetypes = self.trad_data.get("archetypes")
        if archetypes:
            return archetypes[(day_of_year - 1) % len(archetypes)]
        return archetype_of_day(day_of_year)

    # ------------------------------------------------------------------ #
    # Solar time (observation-first, cross-referenced prediction)
    # ------------------------------------------------------------------ #
    def _solar_time_and_noon(self):
        """Return (solar_hours, noon_dt, method).

        - With lat/lon, predict solar noon via the cross-reference engine
          and let recent observations correct it.
        - Without lat/lon, fall back to the last recorded solar noon.
        """
        observed = solar_noon_from_observation()

        if self.lat is None or self.lon is None:
            if observed is None:
                return None, None, None
            diff = datetime.now() - observed
            return (diff.total_seconds() / 3600.0) % 24, observed, "observation"

        result = cross_reference_solar_noon(self.lat, self.lon)
        if result is not None:
            predicted = correct_solar_noon(result.value)
            diff = datetime.now() - predicted
            method = f"cross-referenced ({', '.join(result.methods)})"
            return (diff.total_seconds() / 3600.0) % 24, predicted, method

        if observed is None:
            return None, None, None
        diff = datetime.now() - observed
        return (diff.total_seconds() / 3600.0) % 24, observed, "observation"

    # ------------------------------------------------------------------ #
    # Now
    # ------------------------------------------------------------------ #
    def now(self):
        """A full snapshot of the current Kairos moment."""
        # Reload so observations made since construction are honored.
        self.obs = load_observations()

        solar_hours, solar_noon_dt, solar_noon_method = self._solar_time_and_noon()
        moon_emoji = "🌑"
        moon_observations = self.obs.get("moon_phase") or []
        if moon_observations:
            moon_emoji = moon_observations[-1].get("value", "🌑")
        moon_idx = phase_from_emoji(moon_emoji)
        season = season_from_observations() or "Unknown"
        now = datetime.now()
        doy = now.timetuple().tm_yday

        cal = self.calendar_date(doy)
        trad_season = tradition_season(self.trad_data, season, doy)

        return {
            "tradition": self.tradition,
            "solar_time": format_solar_time(solar_hours),
            "solar_noon": solar_noon_dt.isoformat(timespec="seconds") if solar_noon_dt else None,
            "solar_noon_method": solar_noon_method,
            "moon_phase": moon_phase_name(moon_idx) if moon_idx is not None else "Unknown",
            "moon_age": round(moon_age_from_phase(moon_idx), 1) if moon_idx is not None else None,
            "season": trad_season,
            "calendar": cal,
            "archetype": self.archetype(doy),
            "gregorian": now.isoformat(),
        }

    def kst_now(self, latitude_deg=0, longitude_deg=0):
        """Kairos Time (KST) — fully celestial, no human epochs.

        Requires the optional `skyfield` package and a JPL ephemeris file
        (downloaded on first use). See core/celestial.py. Raises
        ImportError when skyfield is not installed.
        """
        from core.celestial import KST_AVAILABLE, get_kairos_time

        if not KST_AVAILABLE:
            raise ImportError(
                "Kairos Time (KST) requires the 'skyfield' package. "
                "Run: pip install skyfield"
            )

        self.obs = load_observations()
        t = datetime.now(timezone.utc)
        kst = get_kairos_time(t, latitude_deg, longitude_deg)

        # Merge with user observations (if available).
        moon_observations = self.obs.get("moon_phase") or []
        if moon_observations:
            moon_emoji = moon_observations[-1].get("value", "🌑")
        else:
            moon_emoji = "🌑"
        kst["day_name"] = kairos_day_name(t.timetuple().tm_yday)
        kst["moon_emoji"] = moon_emoji
        kst["observed_season"] = season_from_observations() or kst["season"]
        return kst

    def kst_display_line(self, latitude_deg=0, longitude_deg=0):
        """The one-line primary Kairos Time display.

        e.g. '14:32 · Root · Harvest Moon 3 · Radiance · 4.54B / 2026.624'

        Uses the canonical Kairos day/month/season names (core/constants.py);
        the time shown is local solar time. The web app renders the same
        line with wall-clock time, per its display spec.
        """
        kst = self.kst_now(latitude_deg, longitude_deg)
        now = datetime.now(timezone.utc)
        doy = now.timetuple().tm_yday
        kd = kairos_date(doy)
        solar_hours, _, _ = self._solar_time_and_noon()
        kst["solar_time"] = format_solar_time(solar_hours) if solar_hours is not None else "--:--"
        kst["month_name"] = kd["month"]
        kst["day"] = kd["day"]
        kst["day_name"] = kd["weekday"]
        kst["season"] = kairos_season_name(kst["season"])
        kst["earth_age_year"] = EARTH_AGE_YEARS + now.year + (doy - 1) / 365.2422
        return format_kst(kst)

    def display(self):
        """A human-readable rendering of the current Kairos moment."""
        data = self.now()
        if data["moon_age"] is not None:
            moon = f"{data['moon_phase']} (age {data['moon_age']}d)"
        else:
            moon = data["moon_phase"]
        cal = data["calendar"]
        if data["solar_noon_method"]:
            noon = f"{data['solar_noon']} [{data['solar_noon_method']}]"
        else:
            noon = "unset — record your shortest shadow"
        return "\n".join([
            f"Kairos — {data['tradition']}",
            f"  Solar time : {data['solar_time']}",
            f"  Noon       : {noon}",
            f"  Moon       : {moon}",
            f"  Season     : {data['season']}",
            f"  Date       : {cal['month']} {cal['day']} ({cal['weekday']}), day {cal['day_of_year']}",
            f"  Archetype  : {data['archetype']}",
            f"  Gregorian  : {data['gregorian']}",
        ])


def main():
    import argparse

    parser = argparse.ArgumentParser(
        prog="kairos", description="Kairos — natural time system"
    )
    parser.add_argument("--tradition", default=DEFAULT_TRADITION,
                        help="tradition to render (tartarian, celtic, chinese, vedic, mesopotamian, mystical)")
    parser.add_argument("--lat", type=float, help="your latitude in degrees (enables cross-referenced noon)")
    parser.add_argument("--lon", type=float, help="your longitude in degrees, east positive")
    parser.add_argument("--observe-noon", action="store_true", help="record today's solar noon")
    parser.add_argument("--moon", metavar="EMOJI", help="record moon phase, e.g. --moon 🌕")
    parser.add_argument("--season", metavar="SEASON", help="record a season event: Spring/Summer/Autumn/Winter")
    parser.add_argument("--kst", action="store_true",
                        help="show Kairos Time (celestial engine) — needs skyfield")
    parser.add_argument("--checksum", action="store_true",
                        help="run the precession checksum on the Earth-age year")
    args = parser.parse_args()

    kairos = Kairos(args.tradition, lat=args.lat, lon=args.lon)
    if args.observe_noon:
        print(kairos.observe_solar_noon())
    if args.moon:
        print(kairos.observe_moon_phase(args.moon))
    if args.season:
        print(kairos.observe_season_event(args.season))
    print()
    if args.checksum:
        from core.checksum import checksum_report, current_earth_age_year
        print(checksum_report(current_earth_age_year()))
        print()
    if args.kst:
        try:
            kst = kairos.kst_now(latitude_deg=args.lat or 0.0,
                                 longitude_deg=args.lon or 0.0)
        except ImportError as exc:
            print(f"KST unavailable: {exc}")
        else:
            print("Kairos Time (KST) — celestial")
            print(f"  {kairos.kst_display_line(latitude_deg=args.lat or 0.0, longitude_deg=args.lon or 0.0)}")
            for key, value in kst.items():
                print(f"  {key}: {value}")
            print()
    print(kairos.display())


if __name__ == "__main__":
    main()
