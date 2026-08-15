# Local ephemeris files

This folder is for local astronomical ephemeris files that Kairos can use
to validate or improve its predictions:

- `de440.bsp`, `de421.bsp` — JPL Development Ephemerides (used by the
  optional Skyfield bridge, downloaded on first use if Skyfield is
  installed).

Kairos' two built-in methods (Meeus and a SunCalc port in `core/`) are
self-contained and need no files here. This folder is for people who want
a third, very accurate reference without any network dependency.

The project philosophy applies here too: predictions are suggestions.
Your recorded observations — sunrise and sunset, equal shadows, the moon's
shape — are always the final authority.
