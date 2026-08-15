import unittest

from core.lunar import moon_age_from_phase, moon_emoji, moon_phase_name, phase_from_emoji


class TestLunar(unittest.TestCase):
    def test_emoji_phases(self):
        self.assertEqual(phase_from_emoji("🌑"), 0)
        self.assertEqual(phase_from_emoji("🌕"), 4)
        self.assertIsNone(phase_from_emoji("x"))

    def test_phase_names(self):
        self.assertEqual(moon_phase_name(0), "New Moon")
        self.assertEqual(moon_phase_name(4), "Full Moon")
        self.assertIsNone(moon_phase_name(8))
        self.assertIsNone(moon_phase_name(-1))

    def test_moon_age(self):
        self.assertAlmostEqual(moon_age_from_phase(0), 0.0, places=3)
        self.assertAlmostEqual(moon_age_from_phase(4), 14.8, places=1)
        self.assertAlmostEqual(moon_age_from_phase(7), 25.8, places=1)
        self.assertIsNone(moon_age_from_phase(None))

    def test_emoji_round_trip(self):
        for idx in range(8):
            self.assertEqual(phase_from_emoji(moon_emoji(idx)), idx)


if __name__ == "__main__":
    unittest.main()
