# Kairos — Wikipedia draft (for Articles for Creation)

> **Status: DRAFT — not yet submitted to Wikipedia.**
>
> This file is a living draft, kept in the repository so it is version
> controlled and updated as the project develops. It is written to
> Wikipedia's style guide: neutral point of view, verifiable claims, and
> no promotional language.
>
> **Before submitting** (via the Articles for Creation process at
> https://en.wikipedia.org/wiki/Wikipedia:Articles_for_creation), the
> article needs independent, reliable sources — notability is assessed
> by *significant coverage in reliable sources independent of the
> subject* (see https://en.wikipedia.org/wiki/Wikipedia:Notability).
> A GitHub repository alone does not establish notability. Typical
> qualifying sources: technology-press articles, academic papers,
> conference talks, or notable derivations of the software.
>
> To keep this draft honest: every `[citation needed]` marker must be
> replaced with a real source before submission. Do not submit it while
> it still contains placeholder text.

---

{{Short description|Open-source observation-based timekeeping system}}
{{Use dmy dates|date=August 2026}}
{{Use list-defined references|date=August 2026}}

{{Infobox software
| name = Kairos
| logo = <!-- web/icon-192.png once hosted -->
| screenshot =
| caption =
| author = <!-- the maintainers -->
| developer = Kairos project community
| released = {{Start date and age|2026|df=yes}} <!-- first public release -->
| latest release version = 2.0.0
| latest release date = {{Start date and age|2026|df=yes}}
| programming language = [[Python (programming language)|Python]], [[JavaScript]], [[MicroPython]], [[C++]]
| operating system = [[Cross-platform]]
| platform = [[Raspberry Pi Pico]], [[ESP32]], [[Web browser]]
| genre = [[Timekeeping]], [[Astronomy]], [[Open-source software]]
| license = [[GNU General Public License|GPL-3.0-or-later]]
| website = https://github.com/jbstoker/kairos
}}

'''Kairos''' is a [[free and open-source software|free and open-source]],
offline-first [[time]] and [[calendar]] system that derives its time from
direct observation of the [[Sun]], the [[Moon]], and the [[season]]s rather
than from satellite navigation, network time, or precomputed tables.<ref
name="readme">{{cite web |title=Kairos README |url=https://github.com/jbstoker/kairos |website=GitHub |access-date=15 August 2026}}</ref> Its name refers to the [[Ancient Greek]] concept of {{lang|grc|kairos}}, the opportune moment, as opposed to {{lang|grc|chronos}}, measured or mechanical time.<ref name="philosophy">{{cite web |title=Kairos Philosophy |url=https://github.com/jbstoker/kairos/blob/master/docs/philosophy.md |access-date=15 August 2026}}</ref>

It is intended as a companion to conventional calendars rather than a
replacement: it tells the user what day, season, moon phase, and time of
day the sky is showing, using observations that can be made by eye. The
software exists in three forms — a [[Python (programming language)|Python]]
program, a [[progressive web app]] that works offline in the browser, and
clock hardware for small microcontrollers.<ref name="readme" />

== Overview ==

Kairos treats the sky itself as the clock. Three ideas run through the
design:

* **Solar time, not clock time.** The day is measured from solar noon —
  the moment the sun is at its highest point in the sky, when a vertical
  shadow is shortest and points due north (or, in the southern hemisphere,
  due south) — rather than from midnight.
* **Observation over calculation.** Anything the program computes can be
  corrected by something the user has actually seen: the sun's position,
  the moon's shape, or the arrival of a season. Observations are stored
  locally and take priority over any prediction.<ref name="api">{{cite web |title=Kairos API documentation |url=https://github.com/jbstoker/kairos/blob/master/docs/api.md |access-date=15 August 2026}}</ref>
* **Offline by default.** Positions are calculated with formulas and small
  data files on the device itself, so no internet connection or external
  time authority is required.<ref name="readme" />

In everyday use, a person might press a button at sunrise and again at
sunset; the app takes the midpoint of the two moments as solar noon and
starts counting the day from there. Alternatively, the user can press the
button twice when a stick's shadow is exactly as long as the stick (once
in the morning and once in the afternoon); the midpoint of those two
moments is also noon.<ref name="calibration">{{cite web |title=Kairos Calibration Guide |url=https://github.com/jbstoker/kairos/blob/master/docs/calibration.md |access-date=15 August 2026}}</ref> Once noon is known, Kairos can display the time of day, the day of the week, a month of its own 13-month calendar, the season, the phase of the moon, and the positions of the naked-eye planets, all calculated locally.<ref name="readme" />

== History ==
Kairos was first released in 2026. Version 2.0.0 established the core
observation format, seven bundled traditions (Rhythm, Tartarian, Celtic,
Chinese, Vedic, Mesopotamian, and Mystical), the cross-referenced
solar-noon engine, and the celestial KST layer.<ref name="readme" /><ref name="api" /> Later development added the user-editable seasonal
layer, the Sunrise+Sunset and Equal-Shadows observation methods, offline
planetary positions in the web app, and the continuous precession
self-check.<ref name="readme" /> Development follows a stated
"constitution" that requires the project to remain offline by default,
verifiable, and independent of external authority.<ref name="constitution">{{cite web |title=Kairos Constitution |url=https://github.com/jbstoker/kairos/blob/master/CONSTITUTION.md |access-date=15 August 2026}}</ref>

== Design ==
=== Observation over authority ===
Rather than querying an ephemeris service or a network clock, Kairos
anchors its time to observations recorded by the user. Solar noon is found
either from the midpoint between an observed sunrise and sunset or from
two "equal shadow" moments — when a stick's shadow is exactly as long as
the stick.<ref name="calibration" /> The moon's phase and seasonal events
such as first frost or leaf fall are recorded directly.<ref name="readme" /> All observations are stored locally in a [[JSON]] log and can
override any computed prediction.<ref name="api" />

=== Cross-referenced predictions ===
When a user supplies their latitude and longitude, Kairos can predict
solar noon locally using several independent calculation methods — a
direct implementation of the algorithms in Jean Meeus' ''Astronomical
Algorithms'', a [[Python (programming language)|Python]] port of the
[[SunCalc]] solar library, and, optionally, the Skyfield astronomy
library. The methods are compared against each other; if they disagree by
more than 30 seconds the system reports the disagreement instead of
silently returning a single answer.<ref name="api" />

=== Kairos Time (KST) ===
Kairos Time is a fully celestial time layer that computes the Sun's
ecliptic longitude (equinox of date), the Moon's phase and age, local
sidereal time (a clock based on the rotation of the stars rather than the
sun), and the dawn visibility of key stars — the "heliacal rising", the
first morning a star becomes visible again in the twilight after being
hidden by the Sun — for stars such as [[Sirius]] and the [[Pleiades]],
using the Skyfield library and a downloaded [[JPL]] ephemeris file.<ref
name="api" /> In the web app, the positions of the five naked-eye planets
(Mercury, Venus, Mars, Jupiter, and Saturn) are also computed in the
browser itself with a compact orbital-element method when no server is
available.<ref name="readme" /> The [[Gregorian calendar]] is shown only
as a small reference, per the project's constitution.<ref name="constitution" />

=== Precession self-check ===
Kairos also validates the deep-time year it displays — roughly 4.54
billion years (the accepted age of the Earth) plus the current calendar
year — against the slow westward drift of the equinoxes known as
[[Axial precession|precession]], which completes one cycle in about
25,772 years. Each check compares the year's implied position of the
equinox with the equinox's observed position since the J2000.0 epoch and
appends the result to a local log. Because the round-number epoch has a
known, fixed phase offset, the purpose of the check is to confirm that the
offset stays constant; if it ever drifts, the software reports it rather
than silently changing the display.<ref name="api" />

=== Traditions and modules ===
The same observation log can be rendered through multiple calendar
traditions, each defined in a JSON file: Rhythm (the observed Kairos
names), a 13-month Tartarian calendar, the [[Celtic tree calendar]], the
Chinese [[Twenty-Four Solar Terms]], the Vedic ''ritucharya'' seasons,
the Mesopotamian zodiac, and a mystical 13-month calendar. Optional
modules suggest seasonal food, moon-phase moods, and daily, weekly, and
seasonal rituals.<ref name="api" />

=== Software ===
The progressive web app runs entirely in the browser and can be installed
like a native application; a service worker keeps it usable offline. In
addition to the KST display, it offers observation buttons for solar
noon, the moon phase, and the season; a seasonal layer that lists produce
and festivals for the current season, filterable by region and tradition,
where every item opens a detail view and users can add their own entries
(stored in the browser when offline, or written back to the server's JSON
data file when the included server is running); and a "share moment"
feature that exports the current time as text, as a stylised image, or as
a photograph with the time overlaid for the device's native share
sheet.<ref name="readme" />

=== Hardware ===
The project publishes firmware for a physical Kairos clock: a
[[Raspberry Pi Pico]] (MicroPython) or [[ESP32]] (Arduino) driving an
[[SSD1306]] OLED display, with a single button for recording solar
noon.<ref name="hardware">{{cite web |title=Kairos hardware guide |url=https://github.com/jbstoker/kairos/blob/master/docs/hardware_guide.md |access-date=15 August 2026}}</ref>

== Development and distribution ==
Kairos is developed in the open on GitHub. A continuous-integration
workflow runs the project's automated test suite on every push, and a
live copy of the web app is published to GitHub Pages.<ref name="readme" />

== License ==
Kairos is licensed under the [[GNU General Public License]] version 3 or
later. Its fork policy requires any derivative that adds dependence on
external authority (such as a cloud time service) to state that
divergence clearly.<ref name="constitution" />

== References ==
{{reflist}}

== External links ==
* [https://github.com/jbstoker/kairos Kairos on GitHub]
* [https://jbstoker.github.io/kairos/ Kairos web app (live demo)]

[[Category:Timekeeping software]]
[[Category:Free software]]
[[Category:Software using the GPL license]]
[[Category:Free astronomy software]]
[[Category:Python (programming language) software]]
[[Category:2026 software]]
