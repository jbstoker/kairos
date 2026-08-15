import os
import tempfile
import unittest

import core.anchor as anchor
import core.season as season


class TestSeason(unittest.TestCase):
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

    def test_no_observations(self):
        self.assertIsNone(season.season_from_observations())

    def test_last_event_wins(self):
        anchor.save_observation("season_event", "Spring")
        anchor.save_observation("season_event", "Autumn")
        self.assertEqual(season.season_from_observations(), "Autumn")

    def test_season_index(self):
        self.assertEqual(season.season_index("Spring"), 0)
        self.assertIsNone(season.season_index("Blob"))

    def test_season_for_month(self):
        self.assertEqual(season.season_for_month(1), "Winter")
        self.assertEqual(season.season_for_month(4), "Spring")
        self.assertEqual(season.season_for_month(7), "Summer")
        self.assertEqual(season.season_for_month(10), "Autumn")
        self.assertEqual(season.season_for_month(12), "Winter")


if __name__ == "__main__":
    unittest.main()
