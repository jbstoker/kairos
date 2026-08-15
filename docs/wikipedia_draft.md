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
offline-first [[time]] system based on direct observation of the
[[Sun]], the [[Moon]], and the [[season]]s rather than on satellite
navigation, network time, or precomputed tables.<ref name="readme">{{cite web |title=Kairos README |url=https://github.com/jbstoker/kairos |website=GitHub |access-date=15 August 2026}}</ref> Its name refers to the [[Ancient Greek]] concept of {{lang|grc|kairos}}, the opportune moment, as opposed to {{lang|grc|chronos}}, measured or mechanical time.<ref name="philosophy">{{cite web |title=Kairos Philosophy |url=https://github.com/jbstoker/kairos/blob/master/docs/philosophy.md |access-date=15 August 2026}}</ref>

The system is organized around three layers: a [[Python (programming language)|Python]] core that stores user observations (solar noon, moon phase, season events) and converts them into several traditional calendars; a [[progressive web app]] that runs entirely in the browser without a server; and [[embedded system|embedded]] clock hardware based on [[MicroPython]] and [[Arduino]] microcontrollers.<ref name="readme" /> A separate "Kairos Time" (KST) engine computes astronomical quantities such as [[ecliptic longitude|solar longitude]], [[lunar phase]], and [[sidereal time]] locally from [[JPL]] ephemerides.<ref name="api">{{cite web |title=Kairos API documentation |url=https://github.com/jbstoker/kairos/blob/master/docs/api.md |access-date=15 August 2026}}</ref>

== History ==
Kairos was first released in 2026, with version 2.0.0 establishing the
core observation format, six bundled traditions (Tartarian, Celtic,
Chinese, Vedic, Mesopotamian, and Mystical), the cross-referenced
solar-noon engine, and the celestial KST layer.<ref name="readme" /><ref name="api" /> Development follows a stated "constitution" that
requires the project to remain offline by default, verifiable, and
independent of external authority.<ref name="constitution">{{cite web |title=Kairos Constitution |url=https://github.com/jbstoker/kairos/blob/master/CONSTITUTION.md |access-date=15 August 2026}}</ref>

== Design ==
=== Observation over authority ===
Rather than querying an ephemeris service or a network clock, Kairos
anchors its time to observations recorded by the user: the midpoint between
sunrise and sunset ([[solar noon]]), the apparent phase of the
Moon, and seasonal events such as first frost or leaf fall.<ref name="readme" /> These observations are stored locally in a [[JSON]] log and
can override any computed prediction.<ref name="api" />

=== Cross-referenced predictions ===
When a user supplies their latitude and longitude, Kairos can predict
solar noon locally using several independent calculation methods — a
direct implementation of the algorithms in Jean Meeus' ''Astronomical
Algorithms'', a [[Python (programming language)|Python]] port of the
[[SunCalc]] solar library, and, optionally, the Skyfield astronomy
library. The methods are compared against each other and the system
reports any disagreement of more than about 30 seconds, rather than
silently returning a single answer.<ref name="api" />

=== Kairos Time (KST) ===
Kairos Time is a fully celestial time layer that computes the Sun's
ecliptic longitude (equinox of date), the Moon's phase and age, local
sidereal time, and the dawn visibility ("heliacal rising") of key stars
such as [[Sirius]] and the [[Pleiades]], using the Skyfield library and
a downloaded [[JPL]] ephemeris file.<ref name="api" /> The [[Gregorian
calendar]] is shown only as a small reference, per the project's
constitution.<ref name="constitution" />

=== Traditions and modules ===
The same observation log can be rendered through multiple calendar
traditions, each defined in a JSON file: a 13-month Tartarian calendar,
the [[Celtic tree calendar]], the Chinese [[Twenty-Four Solar Terms]],
the Vedic ''ritucharya'' seasons, the Mesopotamian zodiac, and a
mystical 13-month calendar. Optional modules suggest seasonal food,
moon-phase moods, and daily, weekly, and seasonal rituals.<ref name="api" />

=== Hardware ===
The project publishes firmware for a physical Kairos clock: a
[[Raspberry Pi Pico]] (MicroPython) or [[ESP32]] (Arduino) driving an
[[SSD1306]] OLED display, with a single button for recording solar
noon.<ref name="hardware">{{cite web |title=Kairos hardware guide |url=https://github.com/jbstoker/kairos/blob/master/docs/hardware_guide.md |access-date=15 August 2026}}</ref>

== License ==
Kairos is licensed under the [[GNU General Public License]] version 3 or
later. Its fork policy requires any derivative that adds dependence on
external authority (such as a cloud time service) to state that
divergence clearly.<ref name="constitution" />

== References ==
{{reflist}}

== External links ==

* [Kairos on GitHub](https://github.com/jbstoker/kairos)

[[Category:Timekeeping software]]
[[Category:Free software]]
[[Category:Software using the GPL license]]
[[Category:Free astronomy software]]
[[Category:Python (programming language) software]]
[[Category:2026 software]]
