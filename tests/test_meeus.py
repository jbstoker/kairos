import unittest
from datetime import date

from core.meeus_algorithms import (
    apparent_declination,
    equation_of_time_for_date,
    julian_day,
    solar_noon_utc,
)


class TestJulianDay(unittest.TestCase):
    def test_j2000_epoch(self):
        self.assertAlmostEqual(julian_day(2000, 1, 1, 12.0), 2451545.0, places=6)

    def test_unix_epoch(self):
        self.assertAlmostEqual(julian_day(1970, 1, 1, 0.0), 2440587.5, places=6)

    def test_jan_2024(self):
        self.assertAlmostEqual(julian_day(2024, 1, 1, 0.0), 2460310.5, places=6)


class TestEquationOfTime(unittest.TestCase):
    def test_february_minimum(self):
        self.assertAlmostEqual(equation_of_time_for_date(date(2024, 2, 11)),
                               -14.2, delta=1.5)

    def test_november_maximum(self):
        self.assertAlmostEqual(equation_of_time_for_date(date(2024, 11, 3)),
                               16.4, delta=1.5)

    def test_april_crossing_zero(self):
        self.assertAlmostEqual(equation_of_time_for_date(date(2024, 4, 15)),
                               0.0, delta=1.0)

    def test_may_local_maximum(self):
        self.assertAlmostEqual(equation_of_time_for_date(date(2024, 5, 14)),
                               3.7, delta=1.0)


class TestDeclination(unittest.TestCase):
    def test_summer_solstice(self):
        self.assertAlmostEqual(apparent_declination(julian_day(2024, 6, 21, 12.0)),
                               23.44, delta=0.2)

    def test_winter_solstice(self):
        self.assertAlmostEqual(apparent_declination(julian_day(2024, 12, 21, 12.0)),
                               -23.44, delta=0.2)

    def test_march_equinox(self):
        self.assertAlmostEqual(apparent_declination(julian_day(2024, 3, 20, 12.0)),
                               0.0, delta=0.3)


class TestSolarNoon(unittest.TestCase):
    def test_greenwich_near_noon(self):
        noon = solar_noon_utc(0.0, date(2024, 8, 15))
        self.assertEqual(noon.date().isoformat(), "2024-08-15")
        minutes = noon.hour * 60 + noon.minute
        self.assertTrue(715 <= minutes <= 745, f"noon {noon}")

    def test_longitude_shift(self):
        d = date(2024, 8, 15)
        east = solar_noon_utc(15.0, d)   # 1h earlier
        west = solar_noon_utc(-75.0, d)  # 5h later
        self.assertAlmostEqual((east - solar_noon_utc(0.0, d)).total_seconds(),
                               -3600.0, delta=60)
        self.assertAlmostEqual((west - solar_noon_utc(0.0, d)).total_seconds(),
                               5 * 3600.0, delta=60)

    def test_solar_noon_within_utc_day(self):
        for lon in (0.0, 15.0, -75.0, 105.0):
            noon = solar_noon_utc(lon, date(2024, 8, 15))
            self.assertEqual(noon.date().isoformat(), "2024-08-15", f"lon={lon}")


if __name__ == "__main__":
    unittest.main()
