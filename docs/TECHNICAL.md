# Kairos — Technical Reference

> This is the technical reference for Kairos — the full documentation that
> used to live in the root README: installation, quickstart, the calendar
> and traditions, CLI, hardware, the celestial engine, the precession
> checksum, the web app, data formats, API reference, mathematics,
> extending Kairos, and the FAQ. The root README is now a visual
> introduction; this file keeps the depth.

**Time you observe, not time you obey.**

[![CI](https://github.com/jbstoker/kairos/actions/workflows/ci.yml/badge.svg)](https://github.com/jbstoker/kairos/actions)
[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)

Kairos is an open-source, offline-first, observation-based time system. It
works without GPS, internet, or precomputed tables, and it anchors itself
to what you can actually see: the sun, the moon, the stars, and the
seasons. It is a companion to conventional calendars, not a replacement
for them — a different way to *feel* time.

## Overview

Kairos rests on two commitments, and everything else follows from them:

1. **The sky is the clock.** Solar longitude, lunar age, sidereal time,
   the dawn stars, and the positions of the planets are computed locally
   from astronomy's own formulas — no ephemeris service, no network clock,
   no external authority. Your own observations (the shortest shadow, the
   shape of the moon) are the final authority over any calculation.
2. **The deep time is checked.** The Earth-Age year (`4.54B / 2026.624`)
   is continuously validated against the observed precession of the
   equinox. If the epoch, the display format, or the math ever drift, a
   tracked checksum notices and reports it — Kairos does not silently
   correct; it notifies.

The system is organised in three layers:

- **`core/`** — the engines: observation storage, solar/lunar/seasonal
  math, the Meeus and SunCalc algorithms, the Skyfield-based celestial
  engine, cross-referencing, and the precession checksum.
- **`traditions/` + `modules/`** — seven calendars to read the same sky
  through, and optional food / energy / ritual layers.
- **`web/` + `hardware/`** — an offline-first progressive web app and
  firmware for physical Kairos clocks.

## Table of Contents

- [The Rhythm of Kairos](#the-rhythm-of-kairos)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [The Kairos calendar](#the-kairos-calendar)
- [Traditions](#traditions)
- [Modules](#modules)
- [CLI](#cli)
- [Hardware](#hardware)
- [The celestial engine (KST)](#the-celestial-engine-kst)
- [Precession checksum & self-check](#precession-checksum--self-check)
- [The web app](#the-web-app)
- [Data & file formats](#data--file-formats)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [The mathematics of Kairos](#the-mathematics-of-kairos)
- [Extending Kairos](#extending-kairos)
- [Project structure](#project-structure)
- [FAQ](#faq)
- [Wikipedia](#wikipedia)
- [Tests](#tests)
- [License](#license)

## Features

- **Observation-first time** — record solar noon, the moon's phase, and
  season events; they override any calculation.
- **Cross-referenced solar noon** — three independent methods (Meeus,
  SunCalc, optional Skyfield) agree before Kairos trusts a prediction.
- **Seven traditions** — Rhythm (the observed calendar), Tartarian,
  Celtic, Chinese, Vedic, Mesopotamian, and Mystical.
- **Celestial engine (KST)** — solar longitude, lunar age, sidereal time,
  dawn stars, heliacal-rising hints, and planet positions.
- **Sky-dome observation matrix** — the web app places the Sun and Moon by
  their real altitude/azimuth on a circular degree wheel (0–360° every 30°,
  N/E/S/W cardinals, altitude rings) and detects solar eclipses — including
  partial ones — when the bodies share azimuth + altitude near a lunar node
  (the 2026-08-12 Wergea partial eclipse is pinned by a regression test).
- **Solar-position display** — the primary line reads `HH:MM (DDD.D°)`:
  **true solar time** (12:00 = solar noon) with the Sun's real azimuth as
  the degree — the number and the sky-dome bead always agree.
- **Manual observer location** — no GPS? Set your coordinates in the
  ⚙️ Configure tab (`kairos_location` in localStorage).
- **Continuous self-check** — a tracked precession checksum with a trend
  that reports drift instead of hiding it.
- **Offline-first PWA** — runs with no server at all (SunCalc in the
  browser), installable, fully local.
- **Mobile-first UI** — collapsible energy/seasonal cards, a bottom tab
  bar, and large touch targets.
- **Honest data** — the phytochemical inventory ships with its own data
  disclaimer: approximate public values, a clickable USDA FoodData Central
  source link, and per-item user notes.
- **Hardware clocks** — Raspberry Pi Pico and ESP32 firmware.
- **GPLv3** — free to use, modify, and share; derivatives must stay open.

## Philosophy

- No dependency on satellites or cloud services
- Usable by anyone, anywhere, of any age
- Modular: use time, food, and energy modules as you wish
- Transparent: all calculations are verifiable and open
- Observation over authority — the sky you see is the final word

## The Rhythm of Kairos

Kairos is not a calendar. It is a *way of seeing time*.

Most calendars are inherited — built by empires, adjusted by popes, patched
by politicians. They are useful tools, but they are not *true*. They drift.
They correct. They forget.

Kairos does not drift. It does not correct. It simply *observes*.

---

### The Day — A Turning, Not a Number

The seven days of the Kairos week are not named for gods or planets. They
are named for what you can *feel* in the turning of the light:

| Day | Meaning |
|-----|---------|
| **Sundial** | Clarity, action, visibility — the sun is high, the world is awake. |
| **Well** | Reflection, rest, depth — the light softens, and we turn inward. |
| **Root** | Grounding, patience, endurance — the earth holds us steady. |
| **Bloom** | Growth, connection, emergence — the first flower opens. |
| **Forge** | Creation, transformation, will — the hammer strikes the anvil. |
| **Harvest** | Completion, gratitude, closure — the crop is gathered. |
| **Star** | Vision, dream, renewal — the stars are out, and the world is vast. |

These are not prescribed. They are *observed*.
A child can look outside and say, *"This feels like a Bloom day."*
That is the rhythm we trust.

### The Months — Observed, Not Invented

The thirteen months of Kairos are named for what is *happening* in the
living world:

| Month | Meaning |
|-------|---------|
| **Root Moon** | The earth breathes, roots deepen. |
| **Sap Moon** | Life stirs beneath the bark. |
| **Green Moon** | The first green shoots emerge. |
| **Bloom Moon** | Flowers open, bees return. |
| **Grain Moon** | Seeds are sown, intention is planted. |
| **Light Moon** | The sun is at its peak, light is fullest. |
| **Thirst Moon** | The dry heat, the longing for rain. |
| **Fruit Moon** | The first fruits ripen, abundance begins. |
| **Harvest Moon** | The full gathering of crops. |
| **Wine Moon** | The pressing of grapes, transformation. |
| **Leaf Moon** | Leaves turn and fall, release. |
| **Frost Moon** | The first frost, remembrance. |
| **Star Moon** | The clearest nights, the deepest sky. |

These are not arbitrary. They are *observable*.
You can see the sap, the bloom, the frost, the stars.
Every place has its own version, but the rhythm is the same.

### The Seasons — Qualities of Time

The four seasons are not abstract labels. They are *qualities* of the
turning year:

| Season | Kairos Name | Meaning |
|--------|-------------|---------|
| Spring | **Emergence** | Life breaks through, light returns. |
| Summer | **Radiance** | Light is fullest, energy peaks. |
| Autumn | **Release** | The letting go, the turning inward. |
| Winter | **Stillness** | The deep rest, the root. |

These are *felt* — not taught.
They are the same for all who watch the sky.

### The Year — The Deep Anchor

The year in Kairos is not the year of kings or religions.
It is the **Earth-Age year** — the unbroken count from the beginning of our
world:

```text
4.54B / 2026.624
```

This number is precise — and it is humble.
It is based on the best current science, but it is configurable, because
science evolves.
A continuous checksum validates it against the sky. If the Earth-age
drifts, Kairos does not drift — it notifies.

This is the anchor.
Everything else — the day, the month, the season — is the rhythm that
flows from it.

### Why This Matters

> "Time is not a line. It is a spiral — and we are standing on it."

Kairos is not a replacement for other calendars. It is a companion.
It offers a different way to feel time — one that is:

- **Observable** — you can see it in the sky, the soil, the stars.
- **Verifiable** — you can check it against your own eyes.
- **Humble** — it does not claim to be the final word.
- **Open** — you can adjust it, rename it, make it your own.

We are not building a monument.
We are building a mirror.

> "Kairos does not measure time. It invites you to observe it."

> **Implementation note** — the observed names above are the canonical
> Kairos constants (`core/constants.py`) and drive the **primary display**
> (`14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624`).
> They are also the **Rhythm** tradition in the app (select it in the
> tradition menu). The default bundled tradition is Tartarian
> (Solaris… / Sun, Moon, Fire…), which follows the same 13 × 28 + 1
> calendar. The Earth-Age year and its continuous checksum are live:
> `python core/timekeeper.py --checksum` and `GET /api/checksum`.

## Installation

Requirements: **Python 3.11+**. The core runs on the standard library
alone; Skyfield (for the celestial KST engine) is optional.

```bash
# 1. clone the repository
git clone git@github.com:jbstoker/kairos.git
cd kairos

# 2. (recommended) create a virtual environment
python -m venv .venv
.venv\Scripts\activate            # Windows
source .venv/bin/activate         # macOS / Linux

# 3. install the base requirements
pip install -r requirements.txt

# 4. optional — power the celestial KST engine
pip install skyfield              # first KST call downloads a ~17 MB ephemeris
```

What you get and what needs it:

| Dependency | Needed for |
| --- | --- |
| standard library | everything except the celestial engine |
| `pytest` | the test suite |
| `flask` | the optional web server |
| `skyfield` (+ `numpy`, `jplephem`) | the KST celestial engine, planet positions |

> **Honesty note:** the pure-math engines (Meeus, SunCalc) need nothing
> and fully satisfy the constitution's "no tables" rule. The KST layer
> downloads a JPL ephemeris file *once* (a local table), then works fully
> offline. Kairos never phones home.

## Quickstart
1. Install Python 3.11+
2. `pip install -r requirements.txt`
3. Run `python core/timekeeper.py`
4. Open `web/index.html` in your browser (or serve it)

## The Kairos calendar

Kairos Time has its own observed calendar, defined in `core/constants.py`:

- **13 months of 28 days** plus one year day — 13 × 28 + 1 = 365 days.
- **Seven observed days** — the week turns with the light:

  `Sundial · Well · Root · Bloom · Forge · Harvest · Star`

  (day 1 of the year is Sundial; day 8 is Sundial again.)

- **Thirteen observed months** — named for what is happening in the
  living world:

  `Root Moon · Sap Moon · Green Moon · Bloom Moon · Grain Moon · Light Moon ·
  Thirst Moon · Fruit Moon · Harvest Moon · Wine Moon · Leaf Moon · Frost Moon ·
  Star Moon`

- **Four observed seasons**: `Emergence · Radiance · Release · Stillness`
  (Spring, Summer, Autumn, Winter).
- **The year day** (`Deep Day`) sits outside the months — a breath
  between years.

The primary display shows all of it at once:

```text
14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624
```

## Traditions

Kairos reads the same observed sky through seven lenses. Each is a JSON
file in `data/traditions/`; nothing is hard-coded.

| Tradition | Calendar | Flavour |
| --- | --- | --- |
| **Rhythm** | 13 × 28 | The observed Kairos calendar — the philosophy made real |
| **Tartarian** | 13 × 28 | Solaris…Terra Nova; Fire/Water/Earth/Air/Ether elements |
| **Celtic** | 13 × 28 | The 13 tree months (Beth, Luis, Fearn…); the four festivals |
| **Chinese** | 12 months | The 24 solar terms; Wood/Fire/Earth/Metal/Water |
| **Vedic** | 12 months | The six *ritus*; the 27 nakshatras |
| **Mesopotamian** | 12 months | The twelve-sign zodiac |
| **Mystical** | 13 × 28 | A 13-archetype wheel; Light/Shadow/Stone/Wind/Void |

> **Honesty note:** Rhythm, Tartarian, and Mystical are *modern,
> constructed* systems (built for Kairos, not recovered from history). The
> historical traditions here are *simplified solar approximations* — they
> use the traditional month names and ideas, not the full lunisolar
> mechanics of the originals. Choose a lens freely, but know what it is.

Switch with the CLI `--tradition` flag, the `Kairos(tradition=...)`
constructor, or the tradition menu in the web app.

## Modules

Optional, additive layers that read the same moment:

- **food** — `food_for_moon(phase)`, `food_for_season(season)`,
  `food_for_tradition(tradition)`.
- **energy** — `mood_for_moon(phase)`, `festival_for_season(season)`,
  `ritual_for_archetype(archetype)`.
- **ritual** — `ritual_for_solar_time(hours)`, `ritual_for_weekday(day)`,
  `ritual_for_season(season)`.

The web app surfaces these as the "Today's energy" card (archetype, moon
mood, element, festival, seasonal food) and inside the help panel.

## CLI
```
python core/timekeeper.py                          # show now
python core/timekeeper.py --tradition vedic        # show now in another tradition
python core/timekeeper.py --lat 51.5 --lon -0.1    # cross-referenced solar noon
python core/timekeeper.py --observe-noon           # record solar noon
python core/timekeeper.py --moon 🌕               # record moon phase
python core/timekeeper.py --season Summer          # record a season event
```

## Hardware

Kairos ships firmware for a physical clock: an SSD1306 OLED + a single
button on a microcontroller.

| Board | Firmware | Notes |
| --- | --- | --- |
| Raspberry Pi Pico / Pico W | `hardware/pico/main.py` (MicroPython) | I2C OLED on GP0/GP1, button on GP15 |
| ESP32 | `hardware/esp32/kairos.ino` (Arduino) | pins in `config.h` |

Press the button when the shadow is shortest — the display then counts
solar time from your noon. Full wiring and flashing instructions are in
`docs/hardware_guide.md`.

> Note: the stock SSD1306 font can't render emoji, so the moon glyphs are
> placeholders on the device itself.

## The celestial engine (KST)

Kairos Time is *computed, not looked up*. The celestial engine
(`core/celestial.py`) gives you, for any moment and location:

- **Solar longitude** — the Sun's position along its yearly path,
  equinox-of-date (cross-checked against the Meeus engine to ~0.005°).
- **Lunar phase & age** — the Moon's lit fraction and days since new.
- **Sidereal time** — the sky's own clock (which stars are on your
  meridian).
- **Dawn stars** — which key stars are above the horizon at sunrise
  (most prominent first), and which star is *next* to appear.
- **Planet positions** — the five naked-eye planets, with the zodiac sign
  their ecliptic longitude falls in.
- **Season** — from solar longitude, in both tropical and Kairos names.

### How it runs

- **Backend**: Skyfield + a JPL ephemeris (first call downloads ~17 MB,
  then fully offline). `pip install skyfield` to enable.
- **Offline web**: the PWA computes solar longitude, lunar age, sidereal
  time, season, and the dawn-star check itself with the vendored SunCalc
  library — no server, no internet, no GPS.

Your observations always override the calculations: record the moon's
shape or a season event and the display shows what you saw.

> **Honesty notes:** the planet "sign" is the *tropical* zodiac sign, not
> the IAU constellation (precession has shifted the star field by roughly
> a sign). And the KST layer's ephemeris file is technically a precomputed
> table — a local one, downloaded once, never queried online.

## Precession checksum & self-check

The second fold of the project: continuously verify the deep-time year
and the display, and notice if they drift.

The vernal equinox drifts through the fixed stars at ~50.29″/year — one
full "Great Year" every 25,772 years. `core/checksum.py` compares the
phase implied by the Earth-age year with the phase observed today:

```text
⚠️ Precession Checksum: Phase offset documented (round-number epoch; not phase-locked to the Great Year)
   Calculated equinox position: 90.8887°
   Observed equinox position:   0.3718°
   Difference: 90.5168° (tolerance: 0.5°)
   Phase offset: ~+6,480 years vs. the observed equinox (expected for a round epoch; the checksum tracks its consistency)
   Trend: stable across 3 checks (difference spread 0.0°)
```

- `track_checksum()` appends every check to `data/checksums.json`
  (atomic writes).
- `checksum_trend()` reports whether the offset has stayed put —
  `stable` means the epoch, the format, and the math are holding
  constant. Drift means something changed and needs attention.

The absolute offset is expected to stay fixed; **stability over time is
the real signal.**

```bash
python core/timekeeper.py --checksum      # one check
curl http://127.0.0.1:8000/api/checksum   # check + track (server)
```

## The web app

The PWA in `web/` is self-contained and installable (manifest + service
worker). Open it two ways:

- **Live demo** (GitHub Pages, no install): https://jbstoker.github.io/kairos/
  — the offline SunCalc engine runs entirely in your browser.
- **Locally**:
  ```bash
  python web/server.py               # http://127.0.0.1:8000 (+ /api/kst, /api/now, /api/checksum)
  # or just open web/index.html directly — the offline SunCalc engine takes over
  ```

- **Unified spatial panel** — one `#kstDisplay` dashboard: the primary
  Kairos line, the sky-dome observation matrix with the Gregorian clock in
  its centre, and the metric footer (solar longitude, lunar age, planets,
  celestial season). Gregorian is only the centre clock; the tradition is
  an optional layer set in Configure.
- **Sky-dome observation matrix** — the Sun and Moon are placed by their
  real **altitude + azimuth** (vendored SunCalc, `web/static/js/
  astronomy_engine.js`) on a circular **degree wheel** (0–360° every 30°,
  N/E/S/W cardinals on the corrected axis — facing south, east is left).
  Subtle altitude rings + a light-grey orbital band between the sun/moon
  rings show the sky position at a glance.
- **Eclipse detection** — when the beads share azimuth (≤ ~1.7°), altitude
  (≤ 5°) and the Moon is near a lunar node (≤ ~19°), the beads glow and the
  `#eclipse-status` line lights up — tolerances cover partial eclipses
  (validated against the 2026-08-12 Wergea 89% partial eclipse).
- **Solar-position display** — the primary line reads `HH:MM (DDD.D°)`
  (`web/static/js/solar_time.js`): **true solar time** — 12:00 = solar
  noon, via SunCalc — with the Sun's real azimuth as the degree, so the
  number and the bead always agree.
- **Tradition-aware line** — `web/static/js/unified_display.js` rebuilds
  the primary line with the selected tradition's real calendar date.
- **Manual observer location** — ⚙️ Configure → 📍 Your location: lat/lon
  fields + "Use my GPS". Saved to `kairos_location`; the dial reads it
  live (no GPS required).
- **Observation buttons** — calibrate solar noon two ways: 🌅 Sunrise + 🌇
  Sunset (noon is the midpoint) or, as a fallback, ⚖️ Equal Shadows (press
  when a stick's shadow equals the stick, morning and afternoon). Season
  buttons and moon emojis store observations in `localStorage` and
  re-calibrate the display instantly.
- **Help panel (?)** — explains every number, the planets' positions and
  traditional meanings, today's energy (archetype, moon mood, element,
  festival, seasonal food), and the five elements.
- **Offline mode** uses browser geolocation (else `kairos_location` in
  localStorage, else 52°N 5°E) to run the SunCalc engine locally.
- **Continuous self-check** — the footer line shows the precession checksum
  status with the live offset (e.g. `🔭 Precession offset: 90.5168° ·
  stable · updated 14:32`). With the Flask server running, each check is
  also recorded in `data/checksums.json`, so drift in the epoch or the math
  becomes a visible trend; offline, the identical arithmetic runs in the
  browser (`web/checksum_selfcheck.js`, pinned to the Python engine by a
  test).
- **Seasonal layer** — produce, herbs, mushrooms, meat, and festivals for the
  current Kairos season, filterable by region and tradition. Every item is
  clickable → a detail modal. "➕ Add Produce" / "➕ Add Festival" save family
  knowledge to `data/seasonal_data.json` when the server is running, else to
  this device (`web/seasonal_display.js` + `web/seasonal_defaults.js`,
  generated from the JSON by `tools/sync_seasonal.py`).
- **Honest phytochemical inventory** — produce detail modals also carry a
  compound list (approximate values from the USDA FoodData Central database
  and other public references), a clickable source link, per-item user notes,
  and a **data disclaimer** at the bottom (ℹ️, small and low-contrast): the
  values are approximations, not lab-verified measurements for your specific
  plant. Everything lives in `data/phytochemical_data.json`, bundled by
  `tools/sync_phytochemical.py` and rendered by `web/phytochemical_display.js`.
- **Offline planets** — the five naked-eye planets' tropical zodiac signs are
  computed in the browser (`web/planets.js`, compact orbital elements,
  verified against the Skyfield engine) when no backend is reachable.
- **Share this moment** — the current Kairos line as text, copy to clipboard,
  or a canvas-rendered image; **📸 Capture Moment** lets you take (or pick) a
  photo, stamps it with the Kairos line, and shares it via the native share
  sheet (or downloads it as a PNG).
- **Tidy, mobile-first layout** — the energy and In-season cards collapse
  (tap their headers), the **🌅 Now / ⚙️ Configure** tab bar sits at the
  bottom, the observation matrix scales to 90% width, and the shared
  action buttons (Capture · Share) form one segmented toolbar.

## Data & file formats

Everything is plain JSON — auditable by hand.

| File | Contents |
| --- | --- |
| `data/observations.json` | your solar-noon, moon, and season observations (the anchor) |
| `data/traditions/*.json` | the seven traditions (names, months, seasons, weekdays, elements, archetypes) |
| `data/star_data.json` | the key stars and their seasonal meanings |
| `data/checksums.json` | the running precession-checksum log |
| `data/seasonal_data.json` | the user-editable seasonal produce & festivals (web + CLI) |
| `data/phytochemical_data.json` | the honest phytochemical inventory: compound lists, the USDA source link, and the data disclaimer |
| `data/phytochemical_notes.json` | per-item user notes added in the web app |
| `data/ephemeris/` | where local JPL ephemeris files can live |

Observation entry shape:
`{"timestamp": "2026-08-15T12:00:00", "value": "🌕"}`

## API reference

### Python

```python
from core.timekeeper import Kairos

kairos = Kairos("rhythm")                    # or any tradition
kairos.observe_solar_noon()                  # record your noon
kairos.observe_moon_phase("🌕")
kairos.now()                                 # structured snapshot
kairos.display()                             # human-readable
kairos.kst_now(51.5, -0.1)                   # celestial snapshot (needs skyfield)
kairos.kst_display_line(51.5, -0.1)          # the primary one-line display
kairos.calendar_date()                       # the tradition date
kairos.archetype()                           # today's archetype
```

Also: `core.solar`, `core.lunar`, `core.season`, `core.meeus_algorithms`,
`core.suncalc_bridge`, `core.celestial`, `core.cross_reference`,
`core.checksum`, `core.constants`. Full details in `docs/api.md`.

### HTTP (web server)

| Endpoint | Returns |
| --- | --- |
| `GET /` | the PWA |
| `GET /api/kst?lat=&lon=` | the celestial snapshot |
| `GET /api/now` | the tradition snapshot |
| `GET /api/checksum` | the precession checksum + tracked trend |

## Configuration

| Setting | How | Default |
| --- | --- | --- |
| Ephemeris file | env `KAIROS_EPHEMERIS` | `de421.bsp` (17 MB; `de440.bsp` for 100 MB) |
| Earth age (years) | `core/timekeeper.EARTH_AGE_YEARS`, `core/checksum.EARTH_AGE_DEFAULT` | `4_540_000_000` |
| Observations file | `core/anchor.OBS_FILE` | `data/observations.json` |
| Offline web location | geolocation → `localStorage['kairos_location']` | 52°N 5°E |

The Earth-age epoch is deliberately *configurable*: science evolves, and
Kairos follows — the checksum will show the new offset.

## The Mathematics of Kairos

Every value Kairos shows is computed locally from the formulas below — no
ephemeris tables, no network. Two independent engines (Meeus and SunCalc)
cross-check each other, and the Skyfield/JPL layer validates the celestial
side; where they disagree by more than a tolerance, Kairos says so instead
of hiding it. And always, per the constitution: **your observations
override the math.**

### 1. Day length

$$
D = \frac{2}{15}\cdot\arccos\!\big(-\tan\varphi\cdot\tan\delta\big) \quad[\text{hours}]
$$

φ = latitude, δ = solar declination. The arccos argument is clamped to
[−1, 1] (polar day/night).

- Source: `core/solar.py → estimate_day_length(lat_deg, declination_deg)`
- `estimate_day_length(0, 0)` → **12.0 h** (equator, equinox)
- `estimate_day_length(90 − 23.44, 23.44)` → **24.0 h** (Arctic Circle, solstice)
- `estimate_day_length(51.5, 20)` → **15.63 h** (London, declination 20°)

### 2. Solar time (observation-based)

$$
T_{solar} = (\text{now} - \text{last observed solar noon}) \bmod 24\ \text{h}
$$

Solar noon is the moment your shadow is shortest; Kairos measures hours
since then. With lat/lon known, the cross-referenced engine predicts noon,
but a recorded observation always wins.

- Source: `core/solar.py → current_solar_time()`; `core/timekeeper.py → _solar_time_and_noon()`
- `format_solar_time(14.53)` → `"14:31"`

### 3. The Moon

Synodic month: S = 29.53058867 days. Phase index i (0–7, 🌑…🌘) → age:

$$
A = \frac{i}{8}\cdot S
$$

- Source: `core/lunar.py → moon_age_from_phase()`
- `moon_age_from_phase(4)` → **14.77 d** (Full Moon); phase 0 → 0.0 d (New Moon)

The celestial engine computes the true fraction from the Sun–Moon
ecliptic-longitude difference: fraction = Δλ / 360°.

### 4. Julian Day & the Sun (Meeus engine)

*"Astronomical Algorithms"* — implemented in `core/meeus_algorithms.py`.

**Julian Day** (Gregorian, year ≥ 1582), D = day, h = decimal hours UT:

$$
JD = \lfloor 365.25(Y{+}4716)\rfloor + \lfloor 30.6001(M{+}1)\rfloor + D + B - 1524.5 + \frac{h}{24}
$$

where Y, M are year/month (M ≤ 2 → Y−1, M+12) and B = 2 − ⌊Y/100⌋ + ⌊⌊Y/100⌋/4⌋.

- `julian_day(2000,1,1,12)` → **2451545.0** (the J2000 epoch)
- `julian_day(2024,1,1)` → **2460310.5**

**Julian centuries since J2000:**

$$
T = \frac{JD - 2451545.0}{36525}
$$

- `T(2024-08-15 12h)` → **0.246215**

**Sun position (degrees):**

$$
\begin{aligned}
L_0 &= 280.46646 + 36000.76983\,T + 0.0003032\,T^2 && \text{(mean longitude)}\\
M &= 357.52911 + 35999.05029\,T - 0.0001537\,T^2 && \text{(mean anomaly)}\\
e &= 0.016708634 - 0.000042037\,T - 0.0000001267\,T^2 && \text{(eccentricity)}\\
C &= (1.914602 - 0.004817\,T - 0.000014\,T^2)\sin M\\
   &+ (0.019993 - 0.000101\,T)\sin 2M + 0.000289\sin 3M && \text{(equation of centre)}\\
\lambda &= L_0 + C - 0.00569 - 0.00478\sin\Omega,\quad \Omega = 125.04 - 1934.136\,T && \text{(apparent longitude)}\\
\varepsilon_0 &= 23.43929111 - 0.013004167\,T - 0.00000016389\,T^2 + 0.0000005036\,T^3\\
\varepsilon &= \varepsilon_0 + 0.00256\cos\Omega && \text{(true obliquity)}\\
\delta &= \arcsin(\sin\varepsilon\cdot\sin\lambda) && \text{(apparent declination)}
\end{aligned}
$$

- `apparent_longitude(2024-06-21 12h)` → **90.60°** (June solstice)
- `apparent_declination(2024-06-21 12h)` → **+23.44°**

**Equation of time** (minutes):

$$
y = \tan^2\!\tfrac{\varepsilon}{2}, \qquad
E = y\sin 2L_0 - 2e\sin M + 4ey\sin M\cos 2L_0 - \tfrac{1}{2}y^2\sin 4L_0 - 1.25\,e^2\sin 2M
$$
$$ \mathrm{EoT} = \deg(E)\times 4 $$

Positive = apparent sun ahead → solar noon before 12:00 mean time.

- 2024-02-11 → **−14.23 min** · 2024-11-03 → **+16.49 min**

**Solar noon (UTC)** at longitude λ:

$$
\text{noon}_{UTC} = 12{:}00 - \mathrm{EoT} - \frac{\lambda}{15}
$$

- `solar_noon_utc(0.0, 2024-08-15)` → **2024-08-15T12:04:24 UTC**

### 5. Precession & the equinox of date

Skyfield's ecliptic longitude is referenced to the J2000 frame. The
traditional *equinox-of-date* longitude (0° = vernal equinox) adds the IAU
general precession in longitude:

$$
p = \frac{5028.796195\,T + 1.1054348\,T^2 + 0.00007964\,T^3}{3600} \quad[\text{degrees}]
$$

- Source: `core/celestial.py → solar_longitude()`
- With this correction the Skyfield value and the independent Meeus engine
  agree to **~0.005°** across all dates (enforced by the test suite).

### 6. SunCalc (independent cross-check)

Classic SunCalc formulas — vendored at `web/lib/suncalc.js` and ported in
`core/suncalc_bridge.py`. d = days since J2000.

$$
\begin{aligned}
M &= 357.5291 + 0.98560028\,d && \text{(mean anomaly)}\\
C &= 1.9148\sin M + 0.02\sin 2M + 0.0003\sin 3M && \text{(equation of centre)}\\
L &= M + C + 102.9372^\circ + 180^\circ && \text{(ecliptic longitude)}\\
\alpha &= \operatorname{atan2}\big(\sin L\cos\varepsilon,\ \cos L\big) && \text{(right ascension, }\varepsilon=23.4397^\circ\text{)}\\
\delta &= \arcsin(\sin\varepsilon\sin L) && \text{(declination)}\\
H &= \theta_{sidereal} - \alpha && \text{(hour angle)}\\
h &= \arcsin(\sin\varphi\sin\delta + \cos\varphi\cos\delta\cos H) && \text{(altitude)}\\
A &= \operatorname{atan2}\big(\sin H,\ \cos H\sin\varphi - \tan\delta\cos\varphi\big) && \text{(azimuth)}
\end{aligned}
$$

Kairos solar noon = the moment H = 0 within the UTC day (scan + refine).
SunCalc and Meeus agree on solar noon to **~26 seconds**.

### 7. Sidereal time

Greenwich mean sidereal time (hours) at days-since-J2000 d:

$$
GMST = \frac{280.46061837 + 360.98564736629\,d}{15} \bmod 24
$$

Local sidereal time: $\;LST = (GMST_{hours} + \lambda/15) \bmod 24$

- Source: `core/celestial.py → local_sidereal_time()`; `web/kst_display.js → siderealHours()`
- GMST at J2000 → **18.6975 h** (exact); London 2024-08-15 12:00 UTC → **09h37m**

### 8. Seasons

Tropical seasons from solar longitude (Northern frame):

$$
\text{Spring }[0,90^\circ),\ \text{Summer }[90,180^\circ),\ \text{Autumn }[180,270^\circ),\ \text{Winter }[270,360^\circ)
$$

From the Gregorian month (approximation):
`season = SEASONS[((month+9) mod 12) // 3]`

- Source: `core/season.py`
- `season_for_month(4)` → **Spring**

### 9. Kairos calendars

**13-month solar calendar:** 13 × 28 + 1 = 365 days (day 365 is the year day).

$$
m = \left\lfloor\frac{d-1}{28}\right\rfloor,\qquad \text{day} = (d-1)\bmod 28 + 1
$$

Weekday: `WEEKDAYS[(d−1) mod 7]`, WEEKDAYS = Sun, Moon, Fire, Water, Earth, Air, Star.

**12-month traditions:** 5 × 31 + 7 × 30 = 365 days.

- Source: `core/utils.py → month_day_from_doy()`; `traditions/tartarian/calendar.py → tartarian_date()`
- `tartarian_date(1)` → **Solaris 1 (Sun)** · `tartarian_date(29)` → **Lunaris 1**
- `month_day_from_doy(365, 13)` → year day, day 1

### 10. Chinese five elements

Year element (heavenly-stem cycle, two years per element):

$$
\text{element} = \text{ELEMENTS}\big[((\text{year}-4)\bmod 10) // 2\big],\quad \text{ELEMENTS} = \text{Wood, Fire, Earth, Metal, Water}
$$

- Source: `traditions/chinese/five_elements.py → element_for_year()`
- `element_for_year(2024)` → **Wood**

### 11. Cross-referenced consensus

When several methods predict solar noon, Kairos takes the **circular mean**
of their times-of-day (minutes mᵢ, 0–1440):

$$
\theta_i = \frac{2\pi\, m_i}{1440}, \qquad
\bar m = \frac{\arg\!\sum_i e^{\,j\theta_i}}{2\pi}\times 1440
$$

Circular difference (shortest way around the 24 h circle):

$$
\Delta(a,b) = \min\!\big(|a-b|,\ 1440-|a-b|\big)
$$

If the largest pairwise disagreement exceeds 30 s, a warning is emitted
instead of hiding it.

- Source: `core/cross_reference.py`
- Mean of [770, 790, 772] min → **777.33 min** (≈ 12:57)
- Δ(1430, 10) (23:50 vs 00:10) → **20 min**

### 12. Precession checksum

One "Great Year" = 25,772 tropical years; rate ≈ 50.29″/yr:

$$
r = \frac{360}{25772} \approx 0.01397\ \text{deg/yr}
$$

Phase implied by a deep-time year E, and the phase observed today
(precession accumulated since J2000):

$$
\text{pos} = \frac{E \bmod 25772}{25772}\times 360, \qquad
\text{expected} = (\text{year} - 2000 + \text{fraction}) \times r
$$

Checksum passes when the circular difference ≤ tolerance (default 0.5°).

- Source: `core/checksum.py`
- `calculate_precession_position(4540002026.624)` → **90.8887°**; observed → **0.3718°**;
  difference **90.5°** → `inconsistent` (the round 4.54 Ga epoch is ~6,480 yr out of
  phase — an expected property of a round-number epoch, documented rather than hidden).
- The phase-aligned epoch **≈ 4,539,995,547** flips the status to `consistent`.

### 13. Earth-Age year & display

$$
Y = 4{,}540{,}000{,}000 + \text{year} + \frac{\text{day\_of\_year}-1}{365.2422}
$$

Display split into scale + precision joined by `/`:

$$
\text{scale} = \left(\frac{Y}{10^9}\right)\text{ floored to 2 decimals} + \text{"B"}, \qquad
\text{precision} = Y - \left\lfloor\frac{Y}{10^9}\times 100\right\rfloor \div 100 \times 10^9
$$

- Source: `core/timekeeper.py → format_year()`; `web/kst_display.js → formatYear()`
- `format_year(4540002026.624)` → **`"4.54B / 2026.624"`**

### Verification

The test suite pins every formula above to real values — the Skyfield solar
longitude and the Meeus engine agree to **< 0.05°** across dates, GMST at
J2000 is exact, the Arctic-Circle day length is exactly 24 h, and the moon
age at new/full moon is exact to a day-fraction.

```bash
pip install -r requirements.txt
python -m pytest tests
```

## Extending Kairos

Kairos is built to be forked and grown.

- **Add a tradition** — drop a JSON file in `data/traditions/`:
  `{name, months, month_names, year_day, season_names, weekdays?,
  elements?, archetypes?}`. It appears in the CLI and API, and after one
  line in `web/index.html` + `web/app.js` in the web app too.
- **Add a module** — a package under `modules/` with small pure functions
  that take strings/numbers and return suggestions.
- **Add an engine method** — a function in `core/`; write a test first.
- **Add phytochemical data** — add a compound list for a seasonal item in
  `data/phytochemical_data.json` (values are approximations; the disclaimer
  and source link are part of the file), then re-run
  `python tools/sync_phytochemical.py` to refresh the offline web bundle.
- **Tests** — `python -m pytest tests`; every formula is pinned to a real
  value so regressions can't hide.

## Project structure

```text
core/            observation store, solar/lunar/season math, Meeus &
                 SunCalc engines, Skyfield celestial engine, checksum,
                 canonical constants
traditions/      the seven calendar traditions
modules/         food, energy, ritual layers
data/            observations, traditions, star catalog, checksum log,
                 ephemeris, seasonal + phytochemical inventories
web/             the PWA: index, styles, app logic, KST renderer, help
                 layer, vendored SunCalc, Flask server
hardware/        Pico (MicroPython) + ESP32 (Arduino) firmware
tests/           the pinned test suite
docs/            philosophy, calibration, API, hardware guide, Wikipedia draft
```

## FAQ

**Do I need the internet?** No. The core is pure math. The celestial
engine downloads one ephemeris file once, then runs offline.

**Do I need GPS or a location?** No — Kairos is observation-based. A
location only enables *predictions* (and the offline web engine).

**What is "4.54B / 2026.624"?** The Earth-Age year: ~4.54 billion years
plus the current year. The scale `4.54B` is the Earth's age; the
precision `2026.624` is where we are now within that era.

**Why does the checksum say "phase offset documented"?** Because the
round 4.54-billion epoch was never meant to be aligned with the
25,772-year precession cycle. The checksum's job is to confirm the offset
stays *constant* over time.

**What is the difference between the observed and tropical seasons?** The
tropical seasons (Spring…) come from solar longitude; the observed names
(Emergence…) are Kairos's rendering of the same four qualities.

**Can I use my own names?** Yes — everything is JSON constants, and it's
GPLv3. Rename anything.

## Wikipedia

The project also has a **live GitHub Wiki**: https://github.com/jbstoker/kairos/wiki
(generated from this README with `python tools/sync_wiki.py`, pushed to the
wiki's own repository).

A living Wikipedia draft (not yet submitted) lives in
`docs/wikipedia_draft.md`. It follows Wikipedia's style guide and is kept
version-controlled so it can grow with the project. Per Wikipedia's
notability policy it should only be submitted via the Articles for
Creation process once independent, reliable coverage exists.

## Tests

The full suite pins every formula to a real value — from day length to the
precession checksum — so a regression can't hide.

```bash
pip install -r requirements.txt
python -m pytest tests
```

## License
GPLv3 — you are free to use, modify, and share, but any derivative must remain open and transparent.
