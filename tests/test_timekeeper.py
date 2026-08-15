import os
import tempfile
import unittest

import core.anchor as anchor
from core.constants import (
    KAIROS_DAY_NAMES,
    KAIROS_MONTH_NAMES,
    KAIROS_SEASON_NAMES,
    kairos_date,
    kairos_day_name,
    kairos_season_name,
)
from core.timekeeper import Kairos, format_kst, format_year, load_tradition


class TestKairosConstants(unittest.TestCase):
    def test_seven_days(self):
        self.assertEqual(len(KAIROS_DAY_NAMES), 7)
        self.assertEqual(KAIROS_DAY_NAMES, ["Sundial", "Well", "Root", "Bloom",
                                            "Forge", "Harvest", "Star"])
        self.assertEqual(kairos_day_name(1), "Sundial")
        self.assertEqual(kairos_day_name(2), "Well")
        self.assertEqual(kairos_day_name(8), "Sundial")  # the week wraps on day 8

    def test_kairos_date(self):
        d = kairos_date(1)
        self.assertEqual((d["month"], d["day"], d["weekday"]), ("Root Moon", 1, "Sundial"))
        d = kairos_date(29)
        self.assertEqual(d["month"], "Sap Moon")
        d = kairos_date(365)
        self.assertEqual(d["month"], "Deep Day")
        self.assertTrue(d["year_day"])

    def test_kairos_season_names(self):
        self.assertEqual(kairos_season_name("Summer"), "Radiance")
        self.assertEqual(kairos_season_name("Autumn"), "Release")
        self.assertEqual(kairos_season_name("Unknown"), "Unknown")

    def test_rhythm_tradition_uses_the_canonical_names(self):
        data = load_tradition("rhythm")
        self.assertEqual(data["weekdays"], KAIROS_DAY_NAMES)
        self.assertEqual(data["month_names"], KAIROS_MONTH_NAMES)
        self.assertEqual(data["season_names"], list(KAIROS_SEASON_NAMES.values()))



class TestKSTDisplayFormat(unittest.TestCase):
    def test_format_year_example(self):
        # The spec's own example must match its arithmetic.
        self.assertEqual(format_year(4540002026.624), "4.54B / 2026.624")

    def test_format_year_variants(self):
        self.assertIn("B / ", format_year(4_540_002_026.624))
        self.assertIn("2026", format_year(4_540_002_026.624))

    def test_format_year_never_negative(self):
        # Regression: a year just below the 4.54e9 boundary must not print
        # a negative precision (e.g. "4.54B / -4453").
        for raw in (4540002026.624, 4539995546.619, 4540999999.0, 4541000000.0):
            out = format_year(raw)
            self.assertIn("B / ", out)
            self.assertNotIn("-", out.split("/")[1])

    def test_format_kst_example(self):
        line = format_kst({
            "solar_time": "14:32",
            "day_name": "Sundial",
            "month_name": "Bloom Moon",
            "day": 16,
            "season": "Radiance",
            "earth_age_year": 4540002026.624,
        })
        self.assertEqual(line, "14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624")

    def test_format_kst_without_day_name(self):
        # Backwards compatible: without a day name the old 4-part format stands.
        line = format_kst({"solar_time": "14:32", "month_name": "Solaris",
                           "day": 16, "season": "Summer", "earth_age_year": 4540002026.624})
        self.assertEqual(line, "14:32 · Solaris 16 · Summer · 4.54B / 2026.624")

    def test_kst_display_line(self):
        kairos = Kairos()
        try:
            line = kairos.kst_display_line(latitude_deg=51.5, longitude_deg=-0.1)
        except ImportError:
            self.skipTest("skyfield not installed")
        self.assertIn(" · ", line)
        self.assertIn("B / ", line)
        # The primary line leads with the canonical Kairos day name.
        self.assertTrue(any(day in line for day in KAIROS_DAY_NAMES), line)


class TestTimekeeper(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        self._orig = anchor.OBS_FILE
        anchor.OBS_FILE = self.path

    def tearDown(self):
        anchor.OBS_FILE = self._orig
        if os.path.exists(self.path):
            os.remove(self.path)

    def test_load_tradition(self):
        data = load_tradition("tartarian")
        self.assertEqual(data["months"], 13)

    def test_load_tradition_all(self):
        for name in ["tartarian", "rhythm", "celtic", "chinese", "vedic", "mesopotamian", "mystical"]:
            data = load_tradition(name)
            self.assertIn("name", data)
            self.assertGreaterEqual(len(data["month_names"]), 12)

    def test_rhythm_observed_names(self):
        """The README philosophy names must match the Rhythm tradition."""
        data = load_tradition("rhythm")
        self.assertEqual(data["month_names"][0], "Root Moon")
        self.assertEqual(data["month_names"][-1], "Star Moon")
        self.assertEqual(data["season_names"], ["Emergence", "Radiance", "Release", "Stillness"])
        self.assertEqual(data["weekdays"][0], "Sundial")
        self.assertEqual(data["year_day"], "Deep Day")

    def test_rhythm_calendar_and_weekday(self):
        kairos = Kairos("rhythm")
        cal = kairos.calendar_date(1)
        self.assertEqual(cal["month"], "Root Moon")
        self.assertEqual(cal["weekday"], "Sundial")
        cal = kairos.calendar_date(29)
        self.assertEqual(cal["month"], "Sap Moon")
        cal = kairos.calendar_date(365)
        self.assertEqual(cal["month"], "Deep Day")
        # Weekday cycle follows the observed seven.
        self.assertEqual(kairos.calendar_date(8)["weekday"], "Sundial")

    def test_unknown_tradition(self):
        with self.assertRaises(ValueError):
            load_tradition("atlantis")

    def test_observe_and_now(self):
        kairos = Kairos("tartarian")
        kairos.observe_moon_phase("🌕")
        kairos.observe_season_event("Summer")
        now = kairos.now()
        self.assertEqual(now["moon_phase"], "Full Moon")
        self.assertEqual(now["season"], "Flourish")  # Summer -> Tartarian season 2
        self.assertEqual(now["tradition"], "tartarian")
        self.assertIn("archetype", now)
        self.assertIn("calendar", now)
        self.assertIn("gregorian", now)

    def test_invalid_observations(self):
        kairos = Kairos()
        self.assertIn("Invalid emoji", kairos.observe_moon_phase("x"))
        self.assertIn("Invalid season", kairos.observe_season_event("Blob"))

    def test_calendar_date_mapping(self):
        kairos = Kairos("tartarian")
        cal = kairos.calendar_date(1)
        self.assertEqual(cal["month"], "Solaris")
        self.assertEqual(cal["day"], 1)
        cal = kairos.calendar_date(29)
        self.assertEqual(cal["month"], "Lunaris")
        cal = kairos.calendar_date(365)
        self.assertEqual(cal["month"], "Tartarus Day")
        self.assertEqual(cal["kind"], "year_day")

    def test_twelve_month_mapping(self):
        kairos = Kairos("vedic")
        cal = kairos.calendar_date(1)
        self.assertEqual(cal["month"], "Chaitra")
        cal = kairos.calendar_date(365)
        self.assertEqual(cal["day"], 30)
        self.assertEqual(cal["month_index"], 12)

    def test_no_lat_lon_no_prediction(self):
        kairos = Kairos()
        now = kairos.now()
        self.assertIsNone(now["solar_noon"])
        self.assertIsNone(now["solar_noon_method"])

    def test_lat_lon_cross_referenced_noon(self):
        kairos = Kairos("tartarian", lat=40.71, lon=-74.01)
        now = kairos.now()
        self.assertIsNotNone(now["solar_noon"])
        self.assertIn("cross-referenced", now["solar_noon_method"])
        self.assertIn("meeus", now["solar_noon_method"])
        self.assertNotEqual(now["solar_time"], "No observation")

    def test_kst_now(self):
        kairos = Kairos()
        try:
            kst = kairos.kst_now(latitude_deg=51.5, longitude_deg=-0.1)
        except ImportError:
            self.skipTest("skyfield not installed")
        for key in ("solar_longitude", "lunar_phase", "lunar_age", "sidereal_time",
                    "season", "visible_star", "moon_emoji", "observed_season"):
            self.assertIn(key, kst)
        self.assertTrue(0 <= kst["solar_longitude"] < 360)

    def test_display(self):
        kairos = Kairos()
        text = kairos.display()
        self.assertIn("Kairos", text)
        self.assertIn("Solar time", text)


class TestParseLocalTime(unittest.TestCase):
    def test_hhmm_and_hhmmss(self):
        from datetime import datetime

        from core.timekeeper import parse_local_time

        when = parse_local_time("13:41")
        self.assertEqual((when.hour, when.minute, when.second), (13, 41, 0))
        self.assertEqual(when.date(), datetime.now().date())
        when2 = parse_local_time("06:16:37")
        self.assertEqual((when2.hour, when2.minute, when2.second), (6, 16, 37))

    def test_invalid_times_raise(self):
        from core.timekeeper import parse_local_time

        for bad in ("25:00", "13", "abc", "13:99", "13:41:61", "9:5:6:7", ""):
            with self.assertRaises(ValueError):
                parse_local_time(bad)

    def test_observe_solar_noon_at_specific_time(self):
        import os
        import tempfile

        import core.anchor as anchor
        from datetime import datetime

        from core.timekeeper import Kairos, parse_local_time

        fd, path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(path)
        old = anchor.OBS_FILE
        anchor.OBS_FILE = path
        try:
            kairos = Kairos()
            when = parse_local_time("13:41:09")
            self.assertEqual(kairos.observe_solar_noon(when),
                             "Solar noon recorded.")
            last = anchor.get_last_observation("solar_noon")
            self.assertEqual(datetime.fromisoformat(last["timestamp"]), when)
        finally:
            anchor.OBS_FILE = old
            if os.path.exists(path):
                os.remove(path)


if __name__ == "__main__":
    unittest.main()
