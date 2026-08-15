import unittest

from core.utils import month_day_from_doy, tradition_season
from modules.energy.archetype import ritual_for_archetype
from modules.food.mystical import food_for_moon
from modules.food.seasonal import food_for_season
from modules.food.traditional import food_for_tradition
from traditions.tartarian.calendar import MONTHS_13, tartarian_date
from traditions.mystical.planetary_hours import PLANETS, archetype_of_day, planetary_hour


class TestTartarian(unittest.TestCase):
    def test_13_months_of_28(self):
        self.assertEqual(len(MONTHS_13), 13)
        d = tartarian_date(28)
        self.assertEqual(d["month"], "Solaris")
        self.assertEqual(d["day"], 28)
        d = tartarian_date(29)
        self.assertEqual(d["month"], "Lunaris")
        d = tartarian_date(365)
        self.assertEqual(d["month"], "Tartarus Day")

    def test_weekday(self):
        d = tartarian_date(1)
        self.assertEqual(d["weekday"], "Sun")
        d = tartarian_date(2)
        self.assertEqual(d["weekday"], "Moon")
        # Day 8 completes the week and starts a new one on Sun.
        d = tartarian_date(8)
        self.assertEqual(d["weekday"], "Sun")


class TestCalendarHelpers(unittest.TestCase):
    def test_13_month_day_mapping(self):
        m, d, kind = month_day_from_doy(1, 13)
        self.assertEqual((m, d, kind), (0, 1, "month"))
        m, d, kind = month_day_from_doy(364, 13)
        self.assertEqual((m, d), (12, 28))
        m, d, kind = month_day_from_doy(365, 13)
        self.assertEqual(kind, "year_day")

    def test_12_month_day_mapping(self):
        m, d, kind = month_day_from_doy(365, 12)
        self.assertEqual((m, d, kind), (11, 30, "month"))
        m, d, _ = month_day_from_doy(1, 12)
        self.assertEqual((m, d), (0, 1))

    def test_tradition_season_mapping(self):
        trad = {"season_names": ["Emerge", "Flourish", "Harvest", "Stillness"]}
        self.assertEqual(tradition_season(trad, "Summer", 200), "Flourish")
        trad6 = {"season_names": ["Vasanta", "Grishma", "Varsha", "Sharad", "Hemanta", "Shishira"]}
        self.assertIn(tradition_season(trad6, "Summer", 60), trad6["season_names"])


class TestMystical(unittest.TestCase):
    def test_planetary_hour(self):
        self.assertEqual(len(PLANETS), 7)
        for doy in range(7):
            self.assertIn(planetary_hour(3.0, doy), PLANETS)
        self.assertIsNone(planetary_hour(None, 0))

    def test_archetype_of_day(self):
        self.assertEqual(archetype_of_day(1), "Creator")
        self.assertEqual(archetype_of_day(2), "Healer")
        # 13 x 28 = 364, so day 365 closes the same 13-day wheel as day 1.
        self.assertEqual(archetype_of_day(365), archetype_of_day(1))


class TestModules(unittest.TestCase):
    def test_food_for_moon(self):
        self.assertIn("sprouts", food_for_moon("New Moon"))
        self.assertEqual(food_for_moon("Bogus"), ["eat what you see"])

    def test_food_for_season(self):
        self.assertIn("tomatoes", food_for_season("Summer"))
        self.assertIn("eat what is local", food_for_season("Blob"))

    def test_food_for_tradition(self):
        self.assertIn("hearth bread", food_for_tradition("tartarian"))
        self.assertIn("rice congee", food_for_tradition("chinese"))

    def test_ritual_for_archetype(self):
        self.assertEqual(ritual_for_archetype("Creator"), "make something with your hands")
        self.assertIsInstance(ritual_for_archetype("Unknown"), str)


class TestChineseTradition(unittest.TestCase):
    def test_24_terms(self):
        from traditions.chinese.solar_terms import TERMS, term_for_date
        self.assertEqual(len(TERMS), 24)
        self.assertIn("夏至", term_for_date(6, 21))
        self.assertIn("冬至", term_for_date(12, 22))
        # Year-boundary: Jan 10 is Xiaohan, late Dec is still Dongzhi.
        self.assertIn("小寒", term_for_date(1, 10))
        self.assertIn("冬至", term_for_date(12, 25))
        self.assertIn("立春", term_for_date(2, 4))

    def test_five_elements(self):
        from traditions.chinese.five_elements import controls, element_for_year, generates
        self.assertEqual(element_for_year(2024), "Wood")
        self.assertEqual(element_for_year(2025), "Wood")
        self.assertEqual(generates("Wood"), "Fire")
        self.assertEqual(controls("Water"), "Fire")

    def test_digit_named_shims_importable(self):
        # Module files starting with a digit cannot use `import` syntax,
        # but must remain reachable through importlib (compat shims).
        import importlib
        terms = importlib.import_module("traditions.chinese.24_terms")
        elements = importlib.import_module("traditions.chinese.5_elements")
        self.assertIn("TERMS", dir(terms))
        self.assertIn("ELEMENTS", dir(elements))


class TestCelticTradition(unittest.TestCase):
    def test_tree_months(self):
        from traditions.celtic.tree_months import TREE_MONTHS, tree_month
        self.assertEqual(len(TREE_MONTHS), 13)
        m = tree_month(0)
        self.assertEqual(m["tree"], "Birch")
        self.assertIsNone(tree_month(99))

    def test_festivals(self):
        from traditions.celtic.festivals import festival_for_date
        self.assertEqual(festival_for_date(11, 1), "Samhain")
        self.assertEqual(festival_for_date(5, 1), "Bealtaine")
        self.assertIsNone(festival_for_date(3, 15))


class TestVedicTradition(unittest.TestCase):
    def test_ritucharya(self):
        from traditions.vedic.ritucharya import ritu_for_month
        self.assertEqual(ritu_for_month(4), "Vasanta")
        self.assertEqual(ritu_for_month(7), "Varsha")
        self.assertIsNone(ritu_for_month(99))

    def test_nakshatra(self):
        from traditions.vedic.nakshatra import NAKSHATRAS, nakshatra_for_moon_age
        self.assertEqual(len(NAKSHATRAS), 27)
        self.assertEqual(nakshatra_for_moon_age(0)[0], "Ashwini")
        self.assertIsNone(nakshatra_for_moon_age(None))


class TestMesopotamianTradition(unittest.TestCase):
    def test_zodiac(self):
        from traditions.mesopotamian.zodiac import zodiac_sign
        self.assertEqual(zodiac_sign(8, 15), "Leo")
        self.assertEqual(zodiac_sign(1, 5), "Capricorn")
        self.assertEqual(zodiac_sign(3, 1), "Pisces")
        self.assertEqual(zodiac_sign(2, 15), "Aquarius")
        self.assertEqual(zodiac_sign(4, 1), "Aries")


if __name__ == "__main__":
    unittest.main()
