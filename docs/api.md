# Kairos API

Kairos is a small, importable Python library plus a zero-dependency web app.

## Quick example

```python
from core.timekeeper import Kairos

kairos = Kairos("tartarian")          # or "celtic", "chinese", "vedic", ...
kairos.observe_solar_noon()           # sunrise+sunset or equal-shadow midpoint
kairos.observe_moon_phase("🌕")       # what you saw tonight
kairos.observe_season_event("Summer") # what the land is doing

print(kairos.display())               # human-readable snapshot
snapshot = kairos.now()               # structured snapshot (dict)
```

## `core.anchor` — observation storage

Observations are stored as JSON in `data/observations.json`.

| Function | Description |
| --- | --- |
| `load_observations()` | Return the whole observation log. |
| `save_observation(category, value)` | Append `{timestamp, value}` to a category. |
| `get_last_observation(category)` | Return the newest entry or `None`. |

Categories: `solar_noon`, `moon_phase`, `season_event`, `sun_movement`.

## `core.solar` — solar time

| Function | Description |
| --- | --- |
| `estimate_day_length(lat, declination)` | Day length in hours. |
| `solar_noon_from_observation()` | `datetime` of last recorded noon. |
| `current_solar_time()` | Hours since solar noon (0..24) or `None`. |
| `format_solar_time(hours)` | `"HH:MM"` solar time. |

## `core.lunar` — moon phases

| Function | Description |
| --- | --- |
| `phase_from_emoji(emoji)` | 0..7 for 🌑..🌘, else `None`. |
| `moon_age_from_phase(index)` | Approximate age in days. |
| `moon_phase_name(index)` | "New Moon" ... "Waning Crescent". |
| `moon_emoji(index)` | Inverse of `phase_from_emoji`. |

## `core.season` — seasons

`SEASONS = ["Spring", "Summer", "Autumn", "Winter"]`, plus
`season_from_observations()`, `season_index()`, `season_for_month()`,
`season_for_doy()`.

## `core.timekeeper.Kairos` — the main class

| Method | Description |
| --- | --- |
| `Kairos(tradition="tartarian")` | Construct with any tradition JSON in `data/traditions/`. |
| `observe_solar_noon()` | Record the day's noon. |
| `observe_moon_phase(emoji)` | Record the moon phase. |
| `observe_season_event(event)` | Record a season event. |
| `calendar_date(day_of_year=None)` | Map a day-of-year to the tradition calendar. |
| `archetype(day_of_year=None)` | Today's tradition archetype. |
| `now()` | Full structured snapshot. |
| `display()` | Human-readable snapshot. |

### `now()` keys

```python
{
    "tradition": "tartarian",
    "solar_time": "14:23",          # or "No observation"
    "moon_phase": "Full Moon",
    "moon_age": 14.8,               # days, or None
    "season": "Flourish",           # mapped into the tradition's names
    "calendar": {
        "month": "Solaris", "month_index": 1, "day": 12,
        "day_of_year": 12, "weekday": "Star", "kind": "month",
    },
    "archetype": "Sage",
    "gregorian": "2026-08-15T10:00:00.000000",
}
```

## Traditions and modules

- `traditions.tartarian.calendar` — 13x28 calendar helpers
- `traditions.celtic.tree_months` / `.festivals`
- `traditions.chinese.solar_terms` / `.five_elements`
- `traditions.vedic.ritucharya` / `.nakshatra`
- `traditions.mesopotamian.zodiac`
- `traditions.mystical.planetary_hours` / `.elemental_cycles` / `.archetypes`
- `modules.food.*` — `food_for_moon`, `food_for_season`, `food_for_tradition`
- `modules.energy.*` — `mood_for_moon`, `festival_for_season`, `ritual_for_archetype`
- `modules.ritual.*` — `ritual_for_solar_time`, `ritual_for_weekday`, `ritual_for_season`

## `core.phytochemical_data` — the honest phytochemical inventory

| Function | Description |
| --- | --- |
| `load_phytochemical_data()` | The full inventory: `disclaimer`, `source`, `items`. |
| `get_disclaimer()` | The data disclaimer shown at the bottom of every inventory. |
| `get_source()` | The `{label, url}` source block (USDA FoodData Central). |
| `get_phytochemical_inventory(item_id)` | One item's compound list, or `None`. |
| `get_note(item_id)` | The stored per-item user note (empty when none). |
| `save_note(item_id, note)` | Save (or clear) a per-item user note. |

Data lives in `data/phytochemical_data.json` and is bundled into the PWA by
`tools/sync_phytochemical.py`. Every numeric value is an approximation from
public food-composition references — the disclaimer says so, plainly, and is
rendered (ℹ️, small and low-contrast) at the bottom of each inventory in the
seasonal produce detail modal.

### Web endpoints

- `GET /api/phytochemical` — the full inventory (disclaimer, source, items).
- `GET /api/phytochemical/<item_id>` — one item's inventory (404 when unknown).
- `GET /api/phytochemical/<item_id>/note` — the stored user note.
- `POST /api/phytochemical/<item_id>/note` — `{"note": "…"}` to save or clear a user note.

## Cross-referenced solar-noon engine

Kairos can predict solar noon locally and check its own work:

- `core.meeus_algorithms` — Meeus' formulas (Julian Day, equation of time,
  declination, meridian transit), no libraries required.
- `core.suncalc_bridge` — a Python port of SunCalc's solar-position
  formulas; independent of the Meeus implementation.
- `core.skyfield_bridge` — optional third method (needs `pip install
  skyfield`); skipped gracefully when absent.
- `core.cross_reference.cross_reference_solar_noon(lat, lon, date)` — runs
  every available method and returns a `SolarNoonResult` with the circular
  mean of their times, the largest pairwise disagreement, and warnings.
- `core.observation_correction.correct_solar_noon(predicted)` — lets a
  recent solar-noon observation override the prediction.

### Using the engine

```python
from core.timekeeper import Kairos

kairos = Kairos(lat=51.5, lon=-0.1)   # enable cross-referenced noon
snapshot = kairos.now()
print(snapshot["solar_noon"], snapshot["solar_noon_method"])
# e.g. 2026-08-15T13:04:26+00:00  cross-referenced (meeus, suncalc)

from core.cross_reference import cross_reference_solar_noon
result = cross_reference_solar_noon(51.5, -0.1)
print(result)          # 13:04:21 (meeus, suncalc)
print(result.warnings) # []  — a non-empty list means methods disagreed
```

The prediction is only ever a suggestion: a recorded solar noon (the
shortest-shadow observation) always takes precedence over the formula.

## Kairos Time (KST) — the celestial engine

KST is the fully celestial layer of Kairos: no human epochs, just the sky.

- `core/celestial` — solar longitude (equinox of date), lunar phase and
  age, local sidereal time, heliacal star visibility, and planetary
  positions via Skyfield + JPL ephemerides.
- `data/star_data.json` — the heliacal-rising star catalog (Sirius,
  Pleiades, Orion, Arcturus, Vega) with seasonal meanings.
- `Kairos.kst_now(latitude_deg, longitude_deg)` — full KST snapshot merged
  with your observations (`moon_emoji`, `observed_season`).

### Setup

```bash
pip install skyfield          # numpy + jplephem come along
```

The first KST call downloads a small JPL ephemeris (de421.bsp, ~17 MB) into
Skyfield's data directory. Set `KAIROS_EPHEMERIS=de440.bsp` for the full
100 MB DE440 file.

### Values

| Field | Meaning |
| --- | --- |
| `solar_longitude` | Sun's ecliptic longitude, 0° = vernal equinox, 90° = June solstice (equinox of date; cross-checked against Meeus to arcseconds) |
| `lunar_phase` | 0.0 = new moon … 0.5 = full moon |
| `lunar_age` | Days since the last new moon (0–29.53) |
| `sidereal_time` | Local sidereal time as `HHhMMm` |
| `season` / `season_event` | Tropical season from solar longitude |
| `visible_star` | Most prominent key star above the horizon at dawn, or `null` |
| `dawn_stars` | All key stars up at dawn, most prominent first |
| `next_star` / `next_star_days` | Which key star is next approaching dawn visibility, and the estimated days until it rises (`null` when none) |
| `planets` | Dictionary of naked-eye planet positions: `{mercury, venus, mars, jupiter, saturn}` → `{ra_hours, dec_degrees, zodiac, ecliptic_longitude}` |
| `gregorian_reference` | The UTC instant the snapshot describes (footnote, not center) |

### Verifiability

The Skyfield-based solar longitude and the independent Meeus engine
(`core/meeus_algorithms.apparent_longitude`) agree to ~0.005° across the
whole range of dates, and `tests/test_celestial.py` enforces this.

### Kairos names & the primary display

- `core/constants` — the canonical Kairos day, month, and season names
  (Sundial…Star, Root Moon…Star Moon, Emergence…Stillness), plus
  `kairos_day_name()`, `kairos_date()`, `kairos_season_name()`.
- `Kairos.kst_display_line(lat, lon)` — the primary one-line display:
  `14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624`
  (local solar time). The web PWA renders the same line with wall-clock
  time.

### Serving the web app with KST

```bash
python web/server.py          # http://127.0.0.1:8000
```

The server serves the PWA and exposes `/api/kst?lat=51.5&lon=-0.1`. The
PWA itself (`web/kst_display.js`) renders a seasonal color wheel, a
rotating sun indicator at the solar longitude, the lunar phase, sidereal
time, and the visible star.

The PWA works **two ways**:

- **With the server running** — every 10 s it fetches `/api/kst` from the
  Python + Skyfield engine (full snapshot: planets, next heliacal rising,
  next star).
- **Fully offline** — if no backend is reachable, it computes solar
  longitude, lunar age, sidereal time, season, and a real dawn-visibility
  check of the key stars **in the browser** with the locally vendored
  SunCalc library (`web/lib/suncalc.js`, which carries a small Kairos
  `getSolarLongitude` extension). The user's stored observations (moon
  emoji, season event) override the calculations, exactly like the core
  engine, and the observation buttons re-calibrate the display
  immediately.

Location for the offline mode comes from browser geolocation if granted,
else `localStorage['kairos_location']`, else 52°N 5°E.

## Radial distance factors

The server exposes the raw eccentric radial factors used by the spatial
matrix (and available for other layers):

- `core/astronomy.py` — `CelestialRadialMetrics`: `get_sun_distance_factor`
  (~0.983–1.017) and `get_moon_distance_factor` (~0.94–1.06).
- `GET /api/radial?ts=…` — streams `{timestamp, gregorian, sun_radial,
  moon_radial}`. The front-end matrix mirrors these formulas client-side
  (web/static/js/astronomy_engine.js), so it runs fully statically on
  GitHub Pages and offline.

## Concentric observation matrix (sky dome: altitude + azimuth)

The #kstDisplay master spatial panel maps the REAL Sun/Moon altitude and
azimuth on the true celestial axis (facing south) — Midnight at the bottom
(az 0° / north), Sunrise LEFT / east (az 90°), Noon at the top (az 180° /
south), Sunset RIGHT / west (az 270°) — with a minimalist Gregorian clock
pinned at the centre. Altitude is the distance from the horizon rings
(alt 0°: sun rx 165 / ry 162, moon rx 285 / ry 270) to the zenith at the
centre (alt 90°); below the horizon the bead moves beyond its ring
(underground). Without a location, the engine falls back to the dial
(altitude 0, azimuth = local day fraction × 360).

- `web/static/js/astronomy_engine.js` — `CelestialMetrics` (shared client
  math): `getSunPositionDeg` / `getMoonPositionDeg` (real altitude + north
  azimuth via the vendored SunCalc and the live observer location from
  `kairos_location` / `KAIROS_LONGITUDE` / `KAIROS_LATITUDE`, default 52°N
  5°E), the dial fallback (local clock × 360°, identical to the solar-time
  engine, plus lunar elongation), and the lunar-node detector.
- `web/static/js/canvas_renderer.js` — `updatePlanetaryCanvas(sunAltitudeDeg,
  sunAzimuthDeg, moonAltitudeDeg, moonAzimuthDeg, moonNodeAngle,
  targetGregorianTime)`: altitude/azimuth bead placement on a SHARED horizon
  radius (the outer ring), so bodies sharing a sky position overlap — plus
  natural eclipse detection with tolerances covering partial eclipses too
  (≤ ~1.7° azimuth, ~5° altitude, ~19° from a lunar node); on an eclipse the
  beads glow (sun `#ff6b35`, moon `#8b0000`) and the `#eclipse-status` line
  lights up. The 2026-08-12 Wergea partial eclipse is pinned by a regression
  test.
- The SVG matrix carries a **sky-dome grid + circular degree wheel**: four
  altitude rings (r 60/120/180/240), subtle compass lines, and 0–360° tick
  marks every 30° with N/E/S/W cardinals on the corrected axis — `S`/`180°`
  top, `E`/`90°` left, `N`/`0°` bottom, `W`/`270°` right (the white
  crosshairs are gone).
- `web/static/css/mobile.css` + `web/static/js/mobile.js` — the mobile
  optimisation layer (`@media (max-width: 600px)`): larger, brighter text,
  full-width container, SVG matrix capped at `min(100%, 70vh)`, larger touch
  targets (action buttons, moon emoji grid, chips, tab bar) and delegated
  double-tap-zoom prevention. Selectors target the consolidated `#kstDisplay`
  layout.
- `web/static/js/solar_time.js` — the solar-time engine (FINAL PRIMARY
  DISPLAY FORMAT): `getSolarDegrees()` (fraction of day × 360°),
  `degreesToKairosTime(deg)`, `getKairosTimeDisplay()` → `"12:00 (180.0°)"`
  and `getGregorianTime()`. `kst_display.js` uses it for the primary line:
  `"12:00 (180.0°) · ⛲Well · Harvest Moon 9 · ☀️Radiance · 4.54B / 2026.635"` —
  time is a *position*.
- `web/static/js/unified_display.js` — the FINAL UNIFIED HEADER layer: the
  tradition-aware primary line — `window.updateDisplay(kairosString, tradition)`
  merges with app.js's own `updateDisplay()` (both call styles preserved) and
  rebuilds `#kstDisplayLine` with the selected tradition's real calendar date
  (Gregorian stays only in the matrix centre clock; the tradition itself is
  set in the Configure tab's `#traditionSelect`).
- `web/templates/concentric_view.html` — the canonical SVG fragment;
  the identical markup is injected into `web/index.html` inside the panel.
- Fully client-side: no backend required, so it runs on GitHub Pages and
  offline, in lockstep with the observation-driven app.

## Unified kstDisplay panel (consolidated dashboard)

The plain `.display` card and the scattered KST layers (one-line, Gregorian
line, tradition line, seasonal wheel, metric rows) were removed and
consolidated into a single `#kstDisplay` dashboard panel:

- **Primary line** — the Kairos one-line with the solar position
  (`HH:MM (DDD.D°) · day · month · season · year`), rebuilt tradition-aware
  by `unified_display.js` (the tradition is set in the Configure tab).
- **The Integrated Sky-Dome Observation Matrix** — the Sun/Moon altitude +
  azimuth on the circular degree wheel, with the Gregorian anchor clock
  pinned at its centre.
- **Consolidated metadata grid** — solar longitude, lunar age, active
  planets, and celestial season.
- `web/static/js/app_controller.js` — `updateUnifiedDisplayPanel
  (selectedDateTimeState)` binds the panel to the current real-time (or an
  optionally selected date), re-routing the observation/tradition layers
  straight into the unified nodes and triggering the sky-dome canvas redraw.

## Precession checksum

The first celestial checksum — a verifiable relationship between the
deep-time year and the sky.

- `core/checksum.calculate_precession_position(earth_age_years)` — the
  vernal equinox phase (0-360°) implied by a deep-time year, computed as
  `(earth_age_years mod 25772) / 25772 × 360`.
- `core/checksum.get_expected_precession_position()` — the *observed*
  equinox phase: general precession accumulated since J2000.0
  (~50.29″/yr; ~0.37° in 2026).
- `core/checksum.precession_checksum(earth_age_years, tolerance_deg)` —
  circular difference → `"consistent"` / `"inconsistent"`.
- `core/checksum.phase_aligned_year()` — the deep-time year whose phase
  would match the observed equinox (the constructive fix suggestion).
- `core/checksum.checksum_report()` — human-readable summary.

CLI: `python core/timekeeper.py --checksum`
API: `GET /api/checksum`

The default deep-time year (4.54e9 + current year) reports
`inconsistent` by ~90.5° (~6,480 years): the round "4.54 billion" figure
is an epoch from radiometric dating, not a number chosen to be
phase-locked to the 25,772-year precession cycle. The checksum documents
that offset instead of pretending the two are aligned.

### Continuous self-check (tracking)

The second fold of the project: *continuously* verify the Earth-age year
and the display format, and notice if they drift.

- `core/checksum.track_checksum()` — appends each check to
  `data/checksums.json` (atomic write). `/api/checksum` does this on every
  call.
- `core/checksum.checksum_trend()` — returns `{count, consistent_fraction,
  worst_difference, stable, spread_deg}`. `stable` means the phase
  difference has not drifted (spread < 0.01°): the deep-time year, the
  format, and the math are holding constant. A drifting trend means
  something changed and needs attention.

The absolute offset is expected to stay put; **stability over time is the
checksum's real signal.**

## CLI

```
python core/timekeeper.py --tradition vedic --moon 🌕 --season Summer
python core/timekeeper.py --lat 51.5 --lon -0.1     # cross-referenced noon
```

## Web app

The PWA in `web/` is fully client-side: observations live in
`localStorage` and nothing ever leaves your device. Serve it with
`python -m http.server 8000 --directory web` or open `web/index.html`.
