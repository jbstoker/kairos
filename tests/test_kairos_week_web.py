"""Frisian 13-day week: year boundaries, leap year, and served UI."""
import json
import os
import shutil
import subprocess
import unittest

from web.server import app

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@unittest.skipUnless(shutil.which('node'), 'requires node')
class TestKairosWeek(unittest.TestCase):
    def test_cycle_and_intercalation(self):
        script = """
const w = require('./web/static/js/kairos_week.js');
const at = (year, month, day) => w.getKairosWeekDisplay(new Date(year, month - 1, day));
const allDays = Array.from({length: 364}, (_, i) => at(2026, 1, i + 1));
process.stdout.write(JSON.stringify({
  names: w.KAIROS_WEEK.DAY_NAMES, symbols: w.KAIROS_WEEK.DAY_SYMBOLS,
  domains: w.KAIROS_WEEK.DAY_DOMAINS, allDays,
  first: at(2026, 1, 1), thirteenth: at(2026, 1, 13),
  next: at(2026, 1, 14), last: at(2026, 12, 30),
  deep: at(2026, 12, 31), leapLast: at(2024, 12, 29),
  leapDeep1: at(2024, 12, 30), leapDeep2: at(2024, 12, 31),
  reset: at(2025, 1, 1)
}));
"""
        result = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True,
                                text=True, encoding='utf-8')
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        names = ['Tiw', 'Wodan', 'Thuner', 'Fro', 'Njord', 'Balder', 'Bragi',
                 'Heimdall', 'Hoder', 'Vidar', 'Vali', 'Ull', 'Forseti']
        self.assertEqual(data['names'], names)
        self.assertEqual(data['symbols'], ['⚖️', '👁️', '⚡', '🌾', '🌊', '☀️', '🎵',
                                           '🛡️', '🌑', '🤫', '🎯', '❄️', '🕊️'])
        self.assertEqual(data['domains'], [
            'Justice, law, heroic glory', 'Wisdom, war, poetry',
            'Strength, protection', 'Fertility, peace, harvest',
            'Sea, wealth, seafaring', 'Light, beauty, rebirth',
            'Poetry, music, eloquence', 'Guardianship, foresight',
            'Darkness, winter, silence', 'Resilience, silence',
            'Vengeance, precision', 'Winter, skiing, archery',
            'Justice, reconciliation'
        ])
        for i, day in enumerate(data['allDays']):
            self.assertEqual(day['dayName'], names[i % 13])
            self.assertEqual(day['dayIndex'], i % 13 + 1)
            self.assertEqual(day['weekNumber'], i // 13 + 1)
            self.assertEqual(day['dayDomain'], data['domains'][i % 13])
        self.assertEqual((data['first']['dayName'], data['first']['weekNumber']), ('Tiw', 1))
        self.assertEqual(data['first']['display'], '⚖️ Tiw · Week 1/28')
        self.assertEqual(data['thirteenth']['dayName'], 'Forseti')
        self.assertEqual((data['next']['dayName'], data['next']['weekNumber']), ('Tiw', 2))
        self.assertEqual((data['last']['dayName'], data['last']['weekNumber']), ('Forseti', 28))
        self.assertEqual((data['leapLast']['dayName'], data['leapLast']['weekNumber']), ('Forseti', 28))
        for key in ('deep', 'leapDeep1', 'leapDeep2'):
            self.assertEqual(data[key]['dayName'], 'The Closing')
            self.assertIsNone(data[key]['weekNumber'])
            self.assertEqual(data[key]['dayDomain'], '')
        self.assertEqual(data['reset']['dayName'], 'Tiw')

    def test_served_and_wired(self):
        app.config['TESTING'] = True
        client = app.test_client()
        self.assertEqual(client.get('/static/js/kairos_week.js').status_code, 200)
        html = client.get('/').get_data(as_text=True)
        for marker in ('id="week-system"', 'id="kairos-week-display"', 'id="week-day-domain"',
                       'id="civil-week-display"', 'static/js/kairos_week.js'):
            self.assertIn(marker, html)
        self.assertLess(html.index('static/js/kairos_week.js'), html.index('src="kst_display.js"'))