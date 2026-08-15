import os
import tempfile
import unittest

import core.anchor as anchor


class TestAnchor(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        self._orig_file = anchor.OBS_FILE
        anchor.OBS_FILE = self.path

    def tearDown(self):
        anchor.OBS_FILE = self._orig_file
        if os.path.exists(self.path):
            os.remove(self.path)

    def test_load_missing_returns_empty(self):
        data = anchor.load_observations()
        self.assertIn("solar_noon", data)
        self.assertEqual(data["solar_noon"], [])

    def test_save_and_get_last(self):
        anchor.save_observation("moon_phase", "🌕")
        anchor.save_observation("moon_phase", "🌗")
        last = anchor.get_last_observation("moon_phase")
        self.assertEqual(last["value"], "🌗")
        data = anchor.load_observations()
        self.assertEqual(len(data["moon_phase"]), 2)

    def test_save_creates_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "nested", "obs.json")
            old = anchor.OBS_FILE
            anchor.OBS_FILE = path
            try:
                anchor.save_observation("season_event", "Spring")
                self.assertTrue(os.path.exists(path))
            finally:
                anchor.OBS_FILE = old

    def test_save_observation_with_custom_time(self):
        from datetime import datetime

        when = datetime(2026, 8, 15, 13, 41, 9)
        anchor.save_observation("solar_noon", "observed", when=when)
        last = anchor.get_last_observation("solar_noon")
        self.assertEqual(last["timestamp"], "2026-08-15T13:41:09")
        self.assertEqual(last["value"], "observed")


if __name__ == "__main__":
    unittest.main()
