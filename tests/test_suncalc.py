import unittest
from datetime import date, datetime, timezone

from core.meeus_algorithms import solar_noon_utc as meeus_noon
from core.suncalc_bridge import calculate_noon_suncalc, solar_noon_utc, sun_position


class TestSunPosition(unittest.TestCase):
    def test_summer_noon_high_altitude(self):
        # NYC, local solar noon mid-August (16:00 UTC), altitude ~55-65 deg.
        pos = sun_position(datetime(2024, 8, 15, 16, 0, tzinfo=timezone.utc),
                           40.71, -74.01)
        self.assertGreater(pos["altitude"], 50)
        self.assertLess(pos["altitude"], 80)

    def test_night_altitude_low(self):
        # Midnight UTC = ~20:00 local EDT; sun below the horizon in summer? No —
        # NYC mid-August sunset is ~20:00 EDT, so altitude is near 0/-few.
        pos = sun_position(datetime(2024, 8, 15, 0, 0, tzinfo=timezone.utc),
                           40.71, -74.01)
        self.assertLess(pos["altitude"], 10)


class TestSolarNoon(unittest.TestCase):
    def test_agrees_with_meeus(self):
        for lon in (0.0, 15.0, -75.0, 105.0):
            d = date(2024, 8, 15)
            m = meeus_noon(lon, d)
            s = solar_noon_utc(lon, d)
            self.assertEqual(s.date(), d, f"lon={lon}")
            self.assertLess(abs((s - m).total_seconds()), 120, f"lon={lon}")

    def test_returns_same_utc_day(self):
        s = solar_noon_utc(-75.0, date(2024, 8, 15))
        self.assertEqual(s.date().isoformat(), "2024-08-15")

    def test_calculate_returns_local(self):
        # Returns a naive local wall-clock datetime (timezone of the machine).
        # The wall-clock time differs from UTC by the system's own UTC offset
        # on that date — asserted as an invariant so the test also passes on
        # machines whose timezone is UTC (e.g. CI runners).
        local = calculate_noon_suncalc(40.71, -74.01, date(2024, 8, 15))
        utc = solar_noon_utc(-74.01, date(2024, 8, 15))
        expected_offset = datetime(
            2024, 8, 15, 12, tzinfo=timezone.utc).astimezone().utcoffset()
        self.assertEqual((local - utc).total_seconds(),
                         expected_offset.total_seconds())


if __name__ == "__main__":
    unittest.main()
