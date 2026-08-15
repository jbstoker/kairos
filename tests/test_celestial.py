import unittest
from datetime import datetime, timezone

import core.celestial as celestial
from core.celestial import KST_AVAILABLE
from core.meeus_algorithms import apparent_longitude, julian_day

# Gracefully skip the whole suite when the optional dependency is absent.
requires_skyfield = unittest.skipUnless(KST_AVAILABLE, "requires the 'skyfield' package")


@requires_skyfield
class TestSolarLongitude(unittest.TestCase):
    def test_range(self):
        lon = celestial.solar_longitude(datetime(2024, 8, 15, 12, tzinfo=timezone.utc))
        self.assertTrue(0 <= lon < 360)

    def test_cardinal_points(self):
        for y, m, d, expected in [(2024, 3, 20, 0), (2024, 6, 21, 90),
                                  (2024, 9, 22, 180), (2024, 12, 21, 270)]:
            lon = celestial.solar_longitude(datetime(y, m, d, 12, tzinfo=timezone.utc))
            self.assertAlmostEqual(lon, expected, delta=1.0, msg=f"{y}-{m}-{d}")

    def test_cross_checks_meeus(self):
        """Two independent engines must agree on the Sun's longitude.

        The precession-corrected Skyfield value and Meeus' apparent
        longitude agree to arcseconds, so the tolerance is tight.
        """
        for y, m, d in [(2024, 1, 15), (2024, 4, 10), (2024, 8, 15),
                        (2024, 11, 1), (2020, 6, 21), (2030, 6, 21)]:
            skyfield = celestial.solar_longitude(
                datetime(y, m, d, 12, tzinfo=timezone.utc))
            meeus = apparent_longitude(julian_day(y, m, d, 12.0))
            diff = abs(skyfield - meeus)
            diff = min(diff, 360 - diff)
            self.assertLess(diff, 0.05, f"{y}-{m}-{d}: {skyfield} vs {meeus}")


@requires_skyfield
class TestLunarPhase(unittest.TestCase):
    def test_ranges(self):
        fraction, age = celestial.lunar_phase_and_age(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc))
        self.assertTrue(0 <= fraction < 1)
        self.assertTrue(0 <= age <= 29.531)

    def test_new_moon(self):
        fraction, age = celestial.lunar_phase_and_age(
            datetime(2024, 4, 8, 18, 21, tzinfo=timezone.utc))
        self.assertAlmostEqual(fraction, 0.0, delta=0.01)
        self.assertLess(age, 0.5)

    def test_full_moon(self):
        fraction, age = celestial.lunar_phase_and_age(
            datetime(2024, 3, 25, 7, 0, tzinfo=timezone.utc))
        self.assertAlmostEqual(fraction, 0.5, delta=0.01)
        self.assertAlmostEqual(age, 14.8, delta=0.5)


@requires_skyfield
class TestSiderealTime(unittest.TestCase):
    def test_range(self):
        lst = celestial.local_sidereal_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 0.0)
        self.assertTrue(0 <= lst < 24)

    def test_j2000_gmst(self):
        lst = celestial.local_sidereal_time(
            datetime(2000, 1, 1, 12, tzinfo=timezone.utc), 0.0)
        self.assertAlmostEqual(lst, 18.6975, delta=0.01)

    def test_longitude_shift(self):
        base = celestial.local_sidereal_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 0.0)
        east = celestial.local_sidereal_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 15.0)
        self.assertAlmostEqual((east - base) % 24, 1.0, delta=0.01)

    def test_format(self):
        self.assertEqual(celestial.format_sidereal_time(4.62), "04h37m")


class TestSeasonFromSolarLongitude(unittest.TestCase):
    def test_four_seasons(self):
        self.assertEqual(celestial.season_from_solar_longitude(0), "Spring")
        self.assertEqual(celestial.season_from_solar_longitude(90), "Summer")
        self.assertEqual(celestial.season_from_solar_longitude(180), "Autumn")
        self.assertEqual(celestial.season_from_solar_longitude(270), "Winter")
        self.assertEqual(celestial.season_from_solar_longitude(350), "Winter")
        self.assertEqual(celestial.season_from_solar_longitude(45), "Spring")


@requires_skyfield
class TestStars(unittest.TestCase):
    def test_heliacal_rising_unknown_star(self):
        self.assertIsNone(celestial.heliacal_rising(
            "Nope", datetime(2024, 8, 15, tzinfo=timezone.utc), 51.5, -0.1))

    def test_heliacal_rising_returns_bool(self):
        result = celestial.heliacal_rising(
            "Sirius", datetime(2024, 8, 15, tzinfo=timezone.utc), 51.5, -0.1)
        self.assertIn(result, (True, False, None))

    def test_key_stars_catalog(self):
        self.assertIn("Sirius", celestial.KEY_STARS)
        self.assertIn("Vega", celestial.KEY_STARS)
        for coords in celestial.KEY_STARS.values():
            self.assertIn("ra_hours", coords)
            self.assertIn("dec_degrees", coords)

    def test_altitude_at_sunrise_realistic(self):
        alt = celestial.star_altitude_at_sunrise(
            "Vega", datetime(2024, 8, 15, tzinfo=timezone.utc), 51.5, -0.1)
        self.assertIsNotNone(alt)
        self.assertTrue(-5 <= alt <= 90)


@requires_skyfield
class TestPlanets(unittest.TestCase):
    def test_known_planet(self):
        pos = celestial.planetary_position(
            "mars", datetime(2024, 8, 15, tzinfo=timezone.utc))
        self.assertIsNotNone(pos)
        self.assertTrue(0 <= pos["ra_hours"] < 24)
        self.assertTrue(-90 <= pos["dec_degrees"] <= 90)
        self.assertIn(pos["zodiac"], celestial.ZODIAC_SIGNS)

    def test_unknown_planet(self):
        self.assertIsNone(celestial.planetary_position(
            "pluto", datetime(2024, 8, 15, tzinfo=timezone.utc)))


@requires_skyfield
class TestKairosTimeSnapshot(unittest.TestCase):
    def test_snapshot_keys(self):
        kst = celestial.get_kairos_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 51.5, -0.1)
        for key in ("solar_longitude", "lunar_phase", "lunar_age", "sidereal_time",
                    "season", "season_event", "visible_star", "dawn_stars",
                    "next_star", "next_star_days", "planets", "gregorian_reference"):
            self.assertIn(key, kst)
        self.assertAlmostEqual(kst["solar_longitude"], 142.3, delta=1.0)
        self.assertIn("2024-08-15", kst["gregorian_reference"])
        for planet in ("mercury", "venus", "mars", "jupiter", "saturn"):
            self.assertIn(planet, kst["planets"])
            self.assertIn("zodiac", kst["planets"][planet])

    def test_dawn_stars_consistent_with_visible(self):
        kst = celestial.get_kairos_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 51.5, -0.1)
        self.assertIsInstance(kst["dawn_stars"], list)
        if kst["dawn_stars"]:
            self.assertEqual(kst["visible_star"], kst["dawn_stars"][0])
        else:
            self.assertIsNone(kst["visible_star"])

    def test_visible_star_is_none_or_real_star(self):
        """When no key star is rising, the value must be None — never a fake default."""
        kst = celestial.get_kairos_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 51.5, -0.1)
        self.assertTrue(kst["visible_star"] is None
                        or kst["visible_star"] in celestial.KEY_STARS)

    def test_next_star_is_real_or_none(self):
        kst = celestial.get_kairos_time(
            datetime(2024, 8, 15, 12, tzinfo=timezone.utc), 51.5, -0.1)
        if kst["next_star"] is not None:
            self.assertIn(kst["next_star"], celestial.KEY_STARS)
            self.assertGreaterEqual(kst["next_star_days"], 0)
            self.assertLess(kst["next_star_days"], 400)

    def test_next_heliacal_rising_direct(self):
        name, days = celestial.next_heliacal_rising(
            datetime(2024, 8, 15, tzinfo=timezone.utc), 51.5, -0.1)
        if name is not None:
            self.assertIn(name, celestial.KEY_STARS)
            self.assertGreaterEqual(days, 0)
        # A mid-December date: Sirius is famously in its rising season.
        name, days = celestial.next_heliacal_rising(
            datetime(2024, 12, 15, tzinfo=timezone.utc), -20.0, 149.0)
        if name is not None:
            self.assertIn(name, celestial.KEY_STARS)

    def test_accepts_naive_datetime_as_utc(self):
        kst = celestial.get_kairos_time(datetime(2024, 8, 15, 12))
        self.assertIn("2024-08-15T12:00:00", kst["gregorian_reference"])

    def test_season_event_matches_season(self):
        kst = celestial.get_kairos_time(datetime(2024, 12, 21, 12, tzinfo=timezone.utc))
        self.assertEqual(kst["season"], "Winter")
        self.assertEqual(kst["season_event"], "Winter")


if __name__ == "__main__":
    unittest.main()
