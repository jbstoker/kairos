"""Tests for the dynamic seasonal layer (core/seasonal_data.py)."""

import os
import tempfile
import unittest

import core.seasonal_data as sd


class TestSeasonalData(unittest.TestCase):
    def setUp(self):
        self._orig = sd.SEASONAL_DATA_FILE
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        sd.SEASONAL_DATA_FILE = self.path

    def tearDown(self):
        sd.SEASONAL_DATA_FILE = self._orig
        if os.path.exists(self.path):
            os.remove(self.path)

    def _seed(self):
        sd.save_seasonal_data({
            "produce": {
                "tomato": {"name": "Tomato", "category": "fruit",
                           "seasons": ["Radiance"], "regions": ["temperate"],
                           "traditions": ["tartarian"], "image": "🍅"},
                "venison": {"name": "Venison", "category": "meat",
                            "seasons": ["Stillness"],
                            "regions": ["temperate", "forest"],
                            "traditions": ["global"]},
            },
            "festivals": {
                "solstice": {"name": "Solstice", "season": "Radiance",
                             "regions": ["global"], "traditions": ["global"]},
            },
        })

    def test_load_missing_returns_empty(self):
        self.assertEqual(sd.load_seasonal_data(), {"produce": {}, "festivals": {}})

    def test_get_by_kairos_season(self):
        self._seed()
        r = sd.get_items_for_season("Radiance")
        self.assertEqual([i["id"] for i in r["produce"]], ["tomato"])
        self.assertEqual([i["id"] for i in r["festivals"]], ["solstice"])
        self.assertTrue(all(i["kind"] == "produce" for i in r["produce"]))
        self.assertTrue(all(i["kind"] == "festival" for i in r["festivals"]))

    def test_tropical_season_resolved(self):
        self._seed()
        r = sd.get_items_for_season("Summer")
        self.assertEqual(r["season"], "Radiance")
        self.assertTrue(any(i["id"] == "tomato" for i in r["produce"]))

    def test_category_filter(self):
        self._seed()
        r = sd.get_items_for_season("Radiance", category="meat")
        self.assertEqual(r["produce"], [])

    def test_tradition_filter_is_inclusive_of_global(self):
        self._seed()
        # venison lists 'global' → matches any tradition.
        r = sd.get_items_for_season("Stillness", tradition="celtic")
        self.assertTrue(any(i["id"] == "venison" for i in r["produce"]))
        # tomato lists only 'tartarian' → excluded for 'celtic'.
        r = sd.get_items_for_season("Radiance", tradition="celtic")
        self.assertFalse(any(i["id"] == "tomato" for i in r["produce"]))

    def test_region_filter(self):
        self._seed()
        r = sd.get_items_for_season("Stillness", region="forest")
        self.assertTrue(any(i["id"] == "venison" for i in r["produce"]))
        r = sd.get_items_for_season("Stillness", region="arid")
        self.assertFalse(any(i["id"] == "venison" for i in r["produce"]))

    def test_add_item_persists(self):
        self._seed()
        item_id = sd.add_item({"name": "Nettle", "seasons": ["Emergence"]}, "produce")
        self.assertEqual(item_id, "nettle")
        data = sd.load_seasonal_data()
        self.assertIn("nettle", data["produce"])
        self.assertEqual(data["produce"]["nettle"]["name"], "Nettle")

    def test_add_festival(self):
        self._seed()
        item_id = sd.add_item({"name": "Winter Lights", "season": "Stillness"}, "festivals")
        self.assertEqual(item_id, "winter_lights")
        r = sd.get_items_for_season("Stillness")
        self.assertTrue(any(i["id"] == "winter_lights" for i in r["festivals"]))

    def test_add_item_kind_validation(self):
        with self.assertRaises(ValueError):
            sd.add_item({"name": "x"}, "bogus")

    def test_add_duplicate_name_gets_suffix(self):
        self._seed()
        self.assertEqual(sd.add_item({"name": "Tomato", "seasons": ["Radiance"]}, "produce"),
                         "tomato_2")

    def test_real_defaults_cover_all_seasons(self):
        # The shipped data file must load and cover all four Kairos seasons.
        orig = sd.SEASONAL_DATA_FILE
        repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sd.SEASONAL_DATA_FILE = os.path.join(repo, "data", "seasonal_data.json")
        try:
            for season in ("Emergence", "Radiance", "Release", "Stillness"):
                r = sd.get_items_for_season(season)
                self.assertTrue(r["produce"] or r["festivals"], season)
        finally:
            sd.SEASONAL_DATA_FILE = orig


if __name__ == "__main__":
    unittest.main()
