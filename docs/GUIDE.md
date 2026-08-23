# Kairos User Guide

## Getting Started

### 1. Open Kairos
- On your phone or desktop, navigate to the Kairos URL.
- You will see the current Kairos moment: `time · day · month · season · year`.

### 2. Calibrate Your Local Solar Time
- Press **🌅 Sunrise** when the sun touches the horizon.
- Press **🌇 Sunset** when it disappears.
- Alternatively, use the **⚖️ Shadow = Stick** method.

### 3. Observe the Moon
- Look at the moon.
- Tap the emoji that matches what you see: 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘

### 4. Observe the Season
- Look outside.
- Press the season that feels right: Spring · Summer · Autumn · Winter

### 5. Explore
- Click on any food, herb, or festival to see more.
- Add your own plants, traditions, and celebrations.
- Share your moment — with a photo, a date, and a place.

---

## What You Can Do

| Use | How |
|-----|-----|
| **Live your day** | Let the rhythm of the day guide your work, rest, and connection |
| **Plan your meals** | Eat what is in season — see the full chemical inventory of any plant |
| **Celebrate** | Mark festivals, rituals, and moments that matter to you |
| **Share** | Capture your moment — with a photo, a date, and a place — and share it |
| **Observe** | Check the checksum — the system shows you its assumptions, its sources, its limits |

---

## The Sky-Dome (Observation Matrix)

The centre of the app is a living sky map, not just a clock:

- The **Sun and Moon beads** are placed by their **real altitude and
  azimuth** — how high, and in which direction, right now where you are.
  Below the horizon a bead clamps to the wheel edge and turns into a dimmed
  **ghost bead**.
- A circular **degree wheel** (0–360° every 30°) with **altitude rings** at
  20/40/60/80° lets you read the sky position at a glance: altitude is the
  distance from the wheel edge (0°) to the zenith at the centre (90°).
  Facing south: `180°` is top (noon), `90°` left (sunrise), `0°` bottom,
  `270°` right (sunset).
- Inside the wheel, a decorative **13-point natural ring** marks the
  13-fold division (360/13 = 27.69°), echoing the 13 · 28 · 7 sequence — a
  separate scale that never replaces the azimuth labels.
- An optional **virtual Earth** with a **Sun-originating light beam**: toggle
  **🌍 Show Light Beam** in ⚙️ Configure. A gradient beam connects the Sun
  bead to the Earth at the centre — bright golden by day, fading through
  dusk/dawn, dimmest at night, and red during an eclipse. The *YOU* marker
  and the Gregorian clock sit in the central globe. Off by default,
  remembered on the device.
- At dusk and dawn a soft **twilight glow** fades in around the horizon —
  civil twilight (sun between −6° and 0°) glows brightest, nautical
  twilight (−12° to −6°) glows fainter, and full night shows no glow. While
  the sun is below the horizon, a **sunrise countdown** under the wheel
  shows the real minutes until the next sunrise.
- When the Sun and Moon share a sky position — during a **solar eclipse** —
  the beads overlap and the line below lights up `🌑 ECLIPSE IN PROGRESS`.
- **No GPS needed.** Kairos uses the browser's location when available, and
  you can always set your coordinates by hand in **⚙️ Configure → 📍 Your
  location** (e.g. `53.1503 / 5.8389` for Wergea, Friesland) — saved on
  your device.

## Choosing a Lens

In **⚙️ Configure** the old single "Your tradition" dropdown is replaced by
two independent lenses:

- **📅 Calendar Lens** — which calendar the header date shows: Kairos,
  Tartarian, Celtic, Chinese, Vedic or Mystical.
- **🌿 Energy Lens** — which tradition reinterprets the day's energy. Each of
  the seven traditions (Curanderismo, Taoist, Vedic, Pagan/Wiccan,
  Mesopotamian, Egyptian, Mayan) maps the archetype, moon mood, element,
  festival and in-season food into its own terms; **None (pure Kairos)**
  keeps the original readings.

Both choices persist on the device, and the energy card adapts instantly.

## Understanding the Format

`19:33 (293.4°) · ⛲Well · Harvest Moon 9 · ☀️Radiance · 4.54B / 2026.635`

| Element | Meaning |
|---------|---------|
| `19:33 (293.4°)` | **True solar time** (12:00 = solar noon) + the Sun's real **azimuth** — the number and the sky-dome bead always agree |
| `⛲Well` | The day — one of seven names |
| `Harvest Moon 9` | The month and day — one of 13 moons |
| `☀️Radiance` | The season — Emergence, Radiance, Release, or Stillness |
| `4.54B / 2026.635` | The year — Earth's age, split into scale and precision |

## Tidy View

- The **energy** and **In season** cards are **collapsed by default** —
  tap their headers to expand them.
- The **🌅 Now / ⚙️ Configure** tab bar sits **right below the seasonal
  card** — only the button for the view you're *not* on is visible, so the
  bar always shows one way out (on Now you see ⚙️ Configure, and vice
  versa). The precession self-check line sits below the community footer.

---

> *“Kairos does not measure time. It invites you to observe it.”*

## Wearable Watch Face

Want Kairos on your wrist? Open **`watch.html`** — linked as *⌚ Wearable
watch face* in the app's footer — a standalone page that shows **only the
clock**:

- **The time** — true solar time, huge: 12:00 is solar noon wherever you are.
- **The date** — a small Kairos line below: *Sundial · Bloom Moon 16 ·
  Radiance*.
- **The sky** — a tiny caption with the Sun's azimuth and the Moon's phase.

It uses the same location you already set in the app, runs fully offline, and
installs as a fullscreen PWA (add it to your watch's home screen). For a pure
clock with nothing else, use **`watch.html?min=1`**; to fix a location
explicitly — e.g. a wall-mounted watch — use **`watch.html?lat=53.1&lon=5.8`**.

---

## Natural Time (13 / 28 / 13)

Want a clock that matches the 13-month calendar? In **⚙️ Configure → ⏱️ Time
System** choose **🌿 Natural Time**: the same solar day is read as **13 hours
per day, 28 minutes per hour, 13 seconds per minute** — a regular,
self-similar rhythm instead of the 24 / 60 / 60 grid.

- Natural **00:00** is solar midnight, natural **06:14** is solar noon,
  natural **13:00** is the day's end.
- It is a **reading layer, not a replacement**: it counts the app's true
  solar time, so the degree in the header is still the Sun's azimuth — the
  number and the sky-dome bead always agree.
- While it's active, the header shows a small *🌿 Natural* pill under the
  primary line.
- Everything else (calendar, energy, seasons, the watch face) keeps working
  unchanged — the watch face stays a pure solar clock.

### Kairos Natural (26 / 28 / 7)

The same sky can also be read on a **26-hour dial — 13 light + 13 dark
hours**, each hour 28 minutes, each minute 7 seconds (26 × 28 × 7 = 5,096
natural seconds). Choose **🌿 Kairos Natural (26h / 28m / 7s)** in ⚙️
Configure → ⏱️ Time System:

- Natural **00:00** is solar midnight, natural **13:00** is solar noon,
  natural **26:00** is the day's end.
- The header shows the real day/night: **☀️** while the Sun is above the
  horizon, **🌙** below it — the same truth the sky-dome bead shows.
- Like the 13h dial, it counts the app's true solar time, so the degree
  stays the Sun's azimuth and the number and the bead always agree.
- The *🌿 Kairos Natural* pill replaces the *🌿 Natural* pill while it's
  active.

Switch back to **🌍 Current Time (24h / 60 / 60)** at any time — your choice
is remembered on the device.