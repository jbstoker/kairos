"""Sunrise clock boundaries, half pulse arithmetic, missing events and web wiring."""
import json
import os
import shutil
import subprocess
import unittest

from web.server import app


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@unittest.skipUnless(shutil.which('node'), 'requires node')
class TestObservationalClock(unittest.TestCase):
    def test_transits_and_pulses(self):
        script = """
global.SunCalc = require('./web/lib/suncalc.js');
const k = require('./web/static/js/observational_time.js');
const date = new Date('2026-06-21T12:00:00Z');
const midday = k.getKairosObservationalTime(date, 53.1503, 5.8389);
const read = ms => k.getKairosObservationalTime(new Date(ms), 53.1503, 5.8389);
const sr = midday.sunrise.getTime(), ss = midday.sunset.getTime();
const ns = midday.nextSunrise.getTime();
const beforeSunrise = read(sr - 1000), atSunrise = read(sr);
const beforeSunset = read(ss - 1000), atSunset = read(ss);
const beforeNext = read(ns - 1000), atNext = read(ns);
process.stdout.write(JSON.stringify({
  sunrise: atSunrise.display, sunriseHalf: atSunrise.half,
  sunset: atSunset.display, sunsetHalf: atSunset.half,
  next: atNext.display, nextHalf: atNext.half,
  beforeSunrise: beforeSunrise && beforeSunrise.half,
  beforeSunset: beforeSunset && beforeSunset.half,
  beforeNext: beforeNext && beforeNext.half,
  lightSeconds: (ss-sr)/1000, darkSeconds: (ns-ss)/1000,
  lightPulse: atSunrise.pulseLength, darkPulse: atSunset.pulseLength,
  pulsesPerHalf: k.PULSES_PER_HALF
}));
"""
        proc = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True,
                              text=True, encoding='utf-8')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        self.assertEqual(out['pulsesPerHalf'], 2548)
        self.assertEqual((out['sunrise'], out['sunriseHalf']), ('01:01:01', 'light'))
        self.assertEqual((out['sunset'], out['sunsetHalf']), ('01:01:01', 'dark'))
        self.assertEqual((out['next'], out['nextHalf']), ('01:01:01', 'light'))
        self.assertEqual(out['beforeSunrise'], 'dark')
        self.assertEqual(out['beforeSunset'], 'light')
        self.assertEqual(out['beforeNext'], 'dark')
        self.assertAlmostEqual(out['lightPulse'] * 2548, out['lightSeconds'], places=5)
        self.assertAlmostEqual(out['darkPulse'] * 2548, out['darkSeconds'], places=5)
        self.assertGreater(out['lightPulse'], out['darkPulse'])

    def test_polar_unavailable_and_integration(self):
        script = """
global.SunCalc = require('./web/lib/suncalc.js');
const k = require('./web/static/js/observational_time.js');
process.stdout.write(JSON.stringify({polar: k.getKairosObservationalTime(
    new Date('2026-06-21T12:00:00Z'), 89, 0),
    invalid: k.getKairosObservationalTime(new Date(NaN), 52, 5)}));
"""
        proc = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True,
                              text=True, encoding='utf-8')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(proc.stdout), {'polar': None, 'invalid': None})
        app.config['TESTING'] = True
        client = app.test_client()
        self.assertEqual(client.get('/static/js/observational_time.js').status_code, 200)
        html = client.get('/').get_data(as_text=True)
        for marker in ('id="kairos-half"', 'id="kairos-time"',
                       'id="kairos-stride"', 'id="kairos-pulse-length"'):
            self.assertIn(marker, html)
        self.assertLess(html.index('src="static/js/observational_time.js"'),
                        html.index('src="kst_display.js"'))

    def test_utc_midnight_and_local_dst_are_not_clock_boundaries(self):
        script = """
global.SunCalc = require('./web/lib/suncalc.js');
const k = require('./web/static/js/observational_time.js');
const around = dates => dates.map(s => {
  const t = k.getKairosObservationalTime(new Date(s), 40.7128, -74.006);
  return t && {half:t.half, start:t.start.getTime(), end:t.end.getTime(), pulse:t.pulseLength};
});
process.stdout.write(JSON.stringify({
  midnight: around(['2026-06-21T23:59:59Z','2026-06-22T00:00:01Z']),
  dst: around(['2026-03-08T06:59:59Z','2026-03-08T07:00:01Z'])
}));
"""
        proc = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True,
                              text=True, encoding='utf-8')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        for pair in out.values():
            self.assertIsNotNone(pair[0])
            self.assertEqual(pair[0]['start'], pair[1]['start'])
            self.assertEqual(pair[0]['end'], pair[1]['end'])
            self.assertAlmostEqual(pair[0]['pulse'], pair[1]['pulse'])

    def test_location_predictions_yield_to_matching_observations(self):
        script = """
global.SunCalc = require('./web/lib/suncalc.js');
const k = require('./web/static/js/observational_time.js');
const at = new Date('2026-06-21T12:00:00Z');
const base = k.getKairosObservationalTime(at, 53.1503, 5.8389);
const rise = new Date(base.sunrise.getTime() + 120000);
const set = new Date(base.sunset.getTime() - 180000);
const observations = [
  {kind:'sunrise', timestamp:rise.toISOString(), lat:53.1503, lon:5.8389},
  {kind:'sunset', timestamp:set.toISOString(), lat:53.1503, lon:5.8389}
];
const partial = k.getKairosObservationalTime(at, 53.1503, 5.8389, observations.slice(0, 1));
const complete = k.getKairosObservationalTime(at, 53.1503, 5.8389, observations);
const other = k.getKairosObservationalTime(at, 53.1503, 5.8389,
  observations.map(x => ({...x, lon:0})));
const invalid = k.getKairosObservationalTime(at, 53.1503, 5.8389,
  [{kind:'sunrise', timestamp:'invalid', lat:53.1503, lon:5.8389}]);
process.stdout.write(JSON.stringify({
  base: [base.sunrise.getTime(),base.sunset.getTime(),base.sunriseObserved,base.sunsetObserved],
  partial: [partial.sunrise.getTime(),partial.sunset.getTime(),partial.sunriseObserved,partial.sunsetObserved],
  complete: [complete.sunrise.getTime(),complete.sunset.getTime(),complete.sunriseObserved,complete.sunsetObserved],
  other: [other.sunrise.getTime(),other.sunset.getTime()],
  invalid: [invalid.sunrise.getTime(),invalid.sunset.getTime()],
  rise:rise.getTime(),set:set.getTime(),
  pulse:complete.pulseLength
}));
"""
        proc = subprocess.run(['node', '-e', script], cwd=ROOT, capture_output=True,
                              text=True, encoding='utf-8')
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        self.assertEqual(out['base'][2:], [False, False])
        self.assertEqual(out['partial'], [out['rise'], out['base'][1], True, False])
        self.assertEqual(out['complete'], [out['rise'], out['set'], True, True])
        self.assertEqual(out['other'], out['base'][:2])
        self.assertEqual(out['invalid'], out['base'][:2])
        self.assertNotEqual(out['pulse'], 0)