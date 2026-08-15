"""Tests for core/i18n.py — translations, key parity, and CLI integration.

Adding a language means adding a ``TRANSLATIONS[code]`` block with the exact
same keys as ``en``; ``test_all_languages_share_the_english_key_set`` enforces
that parity so a missing key fails CI instead of silently showing English.
"""

import unittest

from core.checksum import checksum_report
from core.i18n import (
    LANG_NAMES,
    LANGUAGES,
    TRANSLATIONS,
    normalize_lang,
    tr_name,
    translator,
)
from core.timekeeper import Kairos, format_kst


class TestI18nCatalog(unittest.TestCase):
    def test_supported_languages(self):
        self.assertEqual(LANGUAGES, ["en", "nl", "fy", "de", "fr", "es", "zh"])
        self.assertEqual(LANG_NAMES["en"], "English")
        self.assertEqual(LANG_NAMES["fy"], "Frysk")

    def test_all_languages_share_the_english_key_set(self):
        en = set(TRANSLATIONS["en"])
        for lang in LANGUAGES:
            keys = set(TRANSLATIONS[lang])
            self.assertEqual(keys, en, f"{lang!r} keys differ from English")

    def test_no_empty_or_identity_values(self):
        for lang in LANGUAGES:
            for key, value in TRANSLATIONS[lang].items():
                self.assertTrue(str(value).strip(), f"{lang}:{key} is empty")
                self.assertNotEqual(value, key, f"{lang}:{key} equals its key")

    def test_interpolation(self):
        t = translator("en")
        self.assertEqual(t("cli.moon_phase_recorded", name="Full Moon"),
                         "Moon phase recorded: Full Moon")

    def test_fallback_to_english(self):
        t = translator("pt")  # unsupported language falls back to English
        self.assertEqual(t("cli.display.noon"), "Noon")
        self.assertEqual(t("does.not.exist"), "does.not.exist")

    def test_normalize_lang(self):
        self.assertEqual(normalize_lang("nl-NL"), "nl")
        self.assertEqual(normalize_lang("fy"), "fy")
        self.assertEqual(normalize_lang("de_DE"), "de")
        self.assertEqual(normalize_lang("nederlands"), "nl")
        self.assertEqual(normalize_lang(None), "en")
        self.assertEqual(normalize_lang("pt"), "en")

    def test_tr_name_fallback_keeps_proper_nouns(self):
        t = translator("nl")
        self.assertEqual(tr_name(t, "day.", "Sundial"), "Zonnewijzer")
        self.assertEqual(tr_name(t, "month.", "Solaris"), "Solaris")
        self.assertEqual(tr_name(t, "season.", "Radiance"), "Straling")


class TestCliIntegration(unittest.TestCase):
    def test_kairos_display_translated_labels(self):
        text = Kairos(lang="nl").display()
        self.assertIn("Zonnetijd", text)   # Solar time
        self.assertIn("Middag", text)      # Noon
        self.assertIn("Gregoriaans", text) # Gregorian

    def test_kairos_display_defaults_to_english(self):
        text = Kairos().display()
        self.assertIn("Solar time", text)

    def test_observe_messages_translated(self):
        kairos = Kairos(lang="de")
        self.assertIn("Mondphase aufgezeichnet", kairos.observe_moon_phase("🌕"))
        self.assertIn("Ungültiges Emoji", kairos.observe_moon_phase("x"))
        kairos_zh = Kairos(lang="zh")
        self.assertIn("月相已记录", kairos_zh.observe_moon_phase("🌕"))

    def test_format_kst_translated_names(self):
        line = format_kst({
            "solar_time": "14:32", "day_name": "Sundial",
            "month_name": "Harvest Moon", "day": 3, "season": "Radiance",
            "earth_age_year": 4540002026.624,
        }, lang="nl")
        self.assertIn("Zonnewijzer", line)  # Sundial
        self.assertIn("Oogstmaan", line)    # Harvest Moon
        self.assertIn("Straling", line)     # Radiance

    def test_checksum_report_translated(self):
        report = checksum_report(lang="nl")
        self.assertIn("Precessie-checksum", report)

    def test_rhythm_tradition_calendar_translated(self):
        kairos = Kairos("rhythm", lang="nl")
        cal = kairos.calendar_date(1)
        self.assertEqual(cal["month"], "Wortelmaan")   # Root Moon
        self.assertEqual(cal["weekday"], "Zonnewijzer")  # Sundial


if __name__ == "__main__":
    unittest.main()
