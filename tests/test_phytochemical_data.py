"""Tests for the honest phytochemical inventory (core/phytochemical_data.py).

Pins the data disclaimer from the addendum, the USDA source link, the item
coverage vs. the shipped seasonal produce, the compound shape, user-note
round-tripping, and the browser bundle (`web/phytochemical_defaults.js`)
staying in sync with `data/phytochemical_data.json`.
"""

import json
import os
import tempfile
import unittest

import core.phytochemical_data as pd

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REQUIRED_DISCLAIMER = (
    "Data in this inventory is sourced from the USDA FoodData Central database "
    "and other public phytochemical references. It is provided as a reference, "
    "not as an absolute truth. All databases contain errors, omissions, and "
    "variations due to natural factors (soil, climate, cultivar, harvest time, "
    "storage, etc.). The values shown are approximations, not lab-verified "
    "measurements for your specific plant. Use this data as a guide, not as "
    "a prescription."
)


def _real_data():
    with open(os.path.join(REPO_ROOT, "data", "phytochemical_data.json"),
              "r", encoding="utf-8") as f:
        return json.load(f)


class TestPhytochemicalData(unittest.TestCase):
    def setUp(self):
        self._orig_file = pd.PHYTOCHEMICAL_DATA_FILE
        self._orig_notes = pd.NOTES_FILE
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        pd.PHYTOCHEMICAL_DATA_FILE = self.path
        fd2, self.notes_path = tempfile.mkstemp(suffix=".json")
        os.close(fd2)
        os.remove(self.notes_path)
        pd.NOTES_FILE = self.notes_path

    def tearDown(self):
        pd.PHYTOCHEMICAL_DATA_FILE = self._orig_file
        pd.NOTES_FILE = self._orig_notes
        for p in (self.path, self.notes_path):
            if os.path.exists(p):
                os.remove(p)

    def _seed(self):
        pd.atomic_write_json(self.path, {
            "disclaimer": "tiny test disclaimer",
            "source": {"label": "USDA FoodData Central", "url": "https://fdc.nal.usda.gov/"},
            "items": {"tomato": {"name": "Tomato", "compounds": [
                {"name": "Lycopene", "value": 2.6, "unit": "mg/100 g"}]}},
        })

    # ---- Loader ------------------------------------------------------------

    def test_load_missing_returns_empty(self):
        data = pd.load_phytochemical_data()
        self.assertEqual(data["items"], {})
        self.assertEqual(pd.get_disclaimer(), "")
        self.assertEqual(pd.get_source(), {})

    def test_get_inventory_unknown_returns_none(self):
        self._seed()
        self.assertIsNone(pd.get_phytochemical_inventory("nope"))
        self.assertIsNotNone(pd.get_phytochemical_inventory("tomato"))

    # ---- The addendum's disclaimer & source --------------------------------

    def test_real_file_disclaimer_matches_addendum(self):
        data = _real_data()
        self.assertEqual(data["disclaimer"], REQUIRED_DISCLAIMER)
        # Loader check against the shipped file (setUp patched a temp path).
        orig = pd.PHYTOCHEMICAL_DATA_FILE
        pd.PHYTOCHEMICAL_DATA_FILE = os.path.join(REPO_ROOT, "data", "phytochemical_data.json")
        try:
            self.assertEqual(pd.get_disclaimer(), REQUIRED_DISCLAIMER)
        finally:
            pd.PHYTOCHEMICAL_DATA_FILE = orig

    def test_real_file_source_link(self):
        source = _real_data()["source"]
        self.assertEqual(source["label"], "USDA FoodData Central (fdc.nal.usda.gov)")
        self.assertTrue(source["url"].startswith("https://"))

    def test_real_file_values_flagged_approximate(self):
        data = _real_data()
        self.assertTrue(data["values_are_approximate"])
        self.assertTrue(pd.load_phytochemical_data()["values_are_approximate"])

    # ---- Coverage & shape of the shipped data ------------------------------

    def test_real_file_covers_seasonal_produce(self):
        data = _real_data()
        items = data["items"]
        with open(os.path.join(REPO_ROOT, "data", "seasonal_data.json"),
                  "r", encoding="utf-8") as f:
            seasonal = json.load(f)
        for item_id, item in seasonal["produce"].items():
            with self.subTest(item=item_id):
                self.assertIn(item_id, items, f"{item_id} missing from inventory")
                entry = items[item_id]
                if item.get("category") == "meat":
                    # Honest empty list + note instead of fabricated numbers.
                    self.assertEqual(entry["compounds"], [])
                    self.assertTrue(entry["note"])
                else:
                    self.assertTrue(entry["compounds"],
                                    f"plant item {item_id} has no compounds")

    def test_real_file_compound_shape(self):
        for item_id, entry in _real_data()["items"].items():
            with self.subTest(item=item_id):
                self.assertTrue(entry["name"])
                self.assertIsInstance(entry["compounds"], list)
                for c in entry["compounds"]:
                    self.assertTrue(c["name"])
                    self.assertTrue(c["value"] is None or isinstance(c["value"], (int, float)))
                    if c["value"] is not None:
                        self.assertTrue(c.get("unit"))
                        self.assertIsInstance(c.get("unit"), str)

    # ---- User notes --------------------------------------------------------

    def test_notes_round_trip(self):
        self._seed()
        self.assertEqual(pd.get_note("tomato"), "")
        saved = pd.save_note("tomato", "Matches my local variety.")
        self.assertEqual(saved, "Matches my local variety.")
        self.assertEqual(pd.get_note("tomato"), "Matches my local variety.")
        # An empty note clears the stored one.
        self.assertEqual(pd.save_note("tomato", ""), "")
        self.assertEqual(pd.get_note("tomato"), "")

    def test_notes_persist_to_disk(self):
        self._seed()
        pd.save_note("tomato", "Different in my region.")
        with open(self.notes_path, "r", encoding="utf-8") as f:
            stored = json.load(f)
        self.assertEqual(stored["tomato"], "Different in my region.")

    # ---- Browser bundle stays in sync --------------------------------------

    def test_generated_defaults_in_sync(self):
        with open(os.path.join(REPO_ROOT, "web", "phytochemical_defaults.js"),
                  "r", encoding="utf-8") as f:
            js = f.read()
        payload = js.split("window.PHYTOCHEMICAL_DEFAULTS = ", 1)[1]
        payload = payload.rsplit(";", 1)[0]
        bundled = json.loads(payload)
        self.assertEqual(bundled, _real_data())


if __name__ == "__main__":
    unittest.main()
