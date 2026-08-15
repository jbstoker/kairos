"""Kairos internationalisation (i18n) — CLI strings and canonical names.

One flat ``key -> text`` table per language. ``en`` is the source of truth
for the key set; adding a language means adding one ``{lang: {...}}`` block
with the same keys (``tests/test_i18n.py`` enforces parity automatically).

Usage::

    from core.i18n import translator, tr_name

    t = translator("nl")
    t("cli.solar_noon_recorded")                    # "Zonne-middag opgenomen."
    t("cli.moon_phase_recorded", name="Volle maan") # interpolation via {name}
    tr_name(t, "day.", "Sundial")                   # canonical-name lookup
"""

# --------------------------------------------------------------------- #
# Languages
# --------------------------------------------------------------------- #

# Codes of the supported languages. The first one is the default.
LANGUAGES = ["en", "nl", "fy", "de", "fr", "es", "zh"]

# Native names, used by the web language selector.
LANG_NAMES = {
    "en": "English",
    "nl": "Nederlands",
    "fy": "Frysk",
    "de": "Deutsch",
    "fr": "Français",
    "es": "Español",
    "zh": "中文",
}

# Accept plain codes ("nl") and common aliases ("nl-NL", "de_DE", "pt-BR").
_ALIASES = {
    "nl": "nl", "dutch": "nl", "nederlands": "nl",
    "fy": "fy", "frisian": "fy", "frysk": "fy", "westfries": "fy",
    "de": "de", "german": "de", "deutsch": "de",
    "fr": "fr", "french": "fr", "francais": "fr",
    "es": "es", "spanish": "es", "espanol": "es",
    "zh": "zh", "chinese": "zh", "cn": "zh", "zh-cn": "zh",
}


def normalize_lang(lang):
    """Return a supported language code, falling back to ``"en"``."""
    if not lang:
        return "en"
    code = str(lang).lower().split("-")[0].split("_")[0]
    if code in LANGUAGES:
        return code
    return _ALIASES.get(code, _ALIASES.get(str(lang).lower(), "en"))


def tr_name(t, prefix, name):
    """Translate a canonical name (``prefix`` + English name).

    Falls back to the original name when no translation exists — so
    tradition proper nouns such as ``"Solaris"`` pass through unchanged.
    """
    key = prefix + name
    if key in TRANSLATIONS["en"]:
        return t(key)
    return name


class Translator:
    """Small string lookup with ``{var}`` interpolation and ``en`` fallback."""

    def __init__(self, lang="en"):
        self.lang = normalize_lang(lang)
        self._table = TRANSLATIONS[self.lang]

    def t(self, key, **kwargs):
        text = self._table.get(key)
        if text is None:
            text = TRANSLATIONS["en"].get(key, key)
        if kwargs:
            try:
                return text.format(**kwargs)
            except (KeyError, IndexError, ValueError):
                return text
        return text

    def __call__(self, key, **kwargs):
        return self.t(key, **kwargs)


def translator(lang="en"):
    """Return a cached :class:`Translator` for a language code."""
    lang = normalize_lang(lang)
    if lang not in _CACHE:
        _CACHE[lang] = Translator(lang)
    return _CACHE[lang]



_CACHE = {}


# --------------------------------------------------------------------- #
# Translation tables
# --------------------------------------------------------------------- #

TRANSLATIONS = {
    "en": {
        # argparse ------------------------------------------------------ #
        "cli.description": "Kairos — natural time system",
        "cli.invalid_time": "Invalid time. Use HH:MM, e.g. --noon 13:41",
        "cli.help.noon": "record solar noon at a specific local time today, e.g. --noon 13:41",
        "cli.help.help": "show this help message and exit",
        "cli.help.tradition":
            "tradition to render (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat": "your latitude in degrees (enables cross-referenced noon)",
        "cli.help.lon": "your longitude in degrees, east positive",
        "cli.help.observe_noon": "record today's solar noon",
        "cli.help.moon": "record moon phase, e.g. --moon 🌕",
        "cli.help.season": "record a season event: Spring/Summer/Autumn/Winter",
        "cli.help.kst": "show Kairos Time (celestial engine) — needs skyfield",
        "cli.help.checksum": "run the precession checksum on the Earth-age year",
        "cli.help.lang": "interface language: en, nl, fy, de, fr, es, zh "
                         "(default: en)",
        # observation messages ----------------------------------------- #
        "cli.solar_noon_recorded": "Solar noon recorded.",
        "cli.invalid_emoji": "Invalid emoji. Use 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Moon phase recorded: {name}",
        "cli.invalid_season": "Invalid season. Use one of: {seasons}",
        "cli.season_recorded": "Season event recorded: {event}",
        # display ------------------------------------------------------- #
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Solar time",
        "cli.display.noon": "Noon",
        "cli.display.moon": "Moon",
        "cli.display.season": "Season",
        "cli.display.date": "Date",
        "cli.display.archetype": "Archetype",
        "cli.display.gregorian": "Gregorian",
        "cli.display.noon_unset":
            "unset — observe sunrise + sunset (or equal shadows) to calibrate",
        "cli.display.moon_age": "{phase} (age {age}d)",
        "cli.display.calendar_date":
            "{month} {day} ({weekday}), day {doy}",
        "cli.display.valid_seasons": "Spring, Summer, Autumn, Winter",
        "cli.display.no_observation": "No observation",
        "cli.display.unknown": "Unknown",
        # KST ----------------------------------------------------------- #
        "cli.kst_header": "Kairos Time (KST) — celestial",
        "cli.kst_unavailable": "KST unavailable: {error}",
        # checksum ------------------------------------------------------ #
        "cli.checksum.consistent": "Aligned with celestial cycles",
        "cli.checksum.inconsistent":
            "Phase offset documented (round-number epoch; not phase-locked "
            "to the Great Year)",
        "cli.checksum.header": "{icon} Precession Checksum: {text}",
        "cli.checksum.calculated": "Calculated equinox position: {value}°",
        "cli.checksum.observed": "Observed equinox position:   {value}°",
        "cli.checksum.difference":
            "Difference: {value}° (tolerance: {tolerance}°)",
        "cli.checksum.phase_offset":
            "Phase offset: ~{offset} years vs. the observed equinox "
            "(expected for a round epoch; the checksum tracks its consistency)",
        "cli.checksum.trend":
            "Trend: {stable} across {count} checks (difference spread "
            "{spread}°)",
        "cli.checksum.stable": "stable",
        "cli.checksum.drifting": "DRIFTING ⚠️",
        "cli.checksum.trend_none":
            "Trend: no tracking data yet — run the server or `--checksum` "
            "repeatedly",
        # canonical Kairos names --------------------------------------- #
        "day.Sundial": "Sundial", "day.Well": "Well", "day.Root": "Root",
        "day.Bloom": "Bloom", "day.Forge": "Forge", "day.Harvest": "Harvest",
        "day.Star": "Star",
        "month.Root Moon": "Root Moon", "month.Sap Moon": "Sap Moon",
        "month.Green Moon": "Green Moon", "month.Bloom Moon": "Bloom Moon",
        "month.Grain Moon": "Grain Moon", "month.Light Moon": "Light Moon",
        "month.Thirst Moon": "Thirst Moon", "month.Fruit Moon": "Fruit Moon",
        "month.Harvest Moon": "Harvest Moon", "month.Wine Moon": "Wine Moon",
        "month.Leaf Moon": "Leaf Moon", "month.Frost Moon": "Frost Moon",
        "month.Star Moon": "Star Moon",
        "year_day.Deep Day": "Deep Day",
        "season.Emergence": "Emergence", "season.Radiance": "Radiance",
        "season.Release": "Release", "season.Stillness": "Stillness",
        "season.Spring": "Spring", "season.Summer": "Summer",
        "season.Autumn": "Autumn", "season.Winter": "Winter",
        "weekday.Sun": "Sun", "weekday.Moon": "Moon", "weekday.Fire": "Fire",
        "weekday.Water": "Water", "weekday.Earth": "Earth",
        "weekday.Air": "Air", "weekday.Star": "Star",
        "moon.New Moon": "New Moon", "moon.Waxing Crescent": "Waxing Crescent",
        "moon.First Quarter": "First Quarter",
        "moon.Waxing Gibbous": "Waxing Gibbous", "moon.Full Moon": "Full Moon",
        "moon.Waning Gibbous": "Waning Gibbous",
        "moon.Last Quarter": "Last Quarter",
        "moon.Waning Crescent": "Waning Crescent",
        "archetype.Creator": "Creator", "archetype.Healer": "Healer",
        "archetype.Warrior": "Warrior", "archetype.Sage": "Sage",
        "archetype.Lover": "Lover", "archetype.Guardian": "Guardian",
        "archetype.Mystic": "Mystic", "archetype.Destroyer": "Destroyer",
        "archetype.Fool": "Fool", "archetype.Magician": "Magician",
        "archetype.Empress": "Empress", "archetype.Emperor": "Emperor",
        "archetype.Star": "Star",
    },

    "nl": {
        "cli.description": "Kairos — natuurlijk tijdsysteem",
        "cli.invalid_time": "Ongeldige tijd. Gebruik HH:MM, bijv. --noon 13:41",
        "cli.help.noon": "neem de zonne-middag op op een specifieke lokale tijd vandaag, bijv. --noon 13:41",
        "cli.help.help": "toon dit helpbericht en sluit af",
        "cli.help.tradition":
            "traditie om te tonen (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat":
            "uw breedtegraad in graden (schakelt de gecross-referente middag in)",
        "cli.help.lon": "uw lengtegraad in graden, oost positief",
        "cli.help.observe_noon": "neem de zonne-middag van vandaag op",
        "cli.help.moon": "neem maanfase op, bijv. --moon 🌕",
        "cli.help.season":
            "neem een seizoensgebeurtenis op: Lente/Zomer/Herfst/Winter",
        "cli.help.kst": "toon Kairos-tijd (hemelengine) — vereist skyfield",
        "cli.help.checksum":
            "voer de precessie-checksum uit op het aardetijdperk-jaar",
        "cli.help.lang": "interface-taal: en, nl, fy, de, fr, es, zh "
                         "(standaard: en)",
        "cli.solar_noon_recorded": "Zonne-middag opgenomen.",
        "cli.invalid_emoji": "Ongeldige emoji. Gebruik 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Maanfase opgenomen: {name}",
        "cli.invalid_season": "Ongeldig seizoen. Gebruik een van: {seasons}",
        "cli.season_recorded": "Seizoensgebeurtenis opgenomen: {event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Zonnetijd",
        "cli.display.noon": "Middag",
        "cli.display.moon": "Maan",
        "cli.display.season": "Seizoen",
        "cli.display.date": "Datum",
        "cli.display.archetype": "Archetype",
        "cli.display.gregorian": "Gregoriaans",
        "cli.display.noon_unset":
            "niet ingesteld — neem zonsopgang + zonsondergang (of gelijke "
            "schaduwen) waar om te kalibreren",
        "cli.display.moon_age": "{phase} (leeftijd {age}d)",
        "cli.display.calendar_date": "{month} {day} ({weekday}), dag {doy}",
        "cli.display.valid_seasons": "Lente, Zomer, Herfst, Winter",
        "cli.display.no_observation": "Geen waarneming",
        "cli.display.unknown": "Onbekend",
        "cli.kst_header": "Kairos-tijd (KST) — hemels",
        "cli.kst_unavailable": "KST niet beschikbaar: {error}",
        "cli.checksum.consistent": "Uitgelijnd met de hemelcycli",
        "cli.checksum.inconsistent":
            "Fase-offset gedocumenteerd (afgerond tijdperk; niet "
            "fase-vergrendeld op het Grote Jaar)",
        "cli.checksum.header": "{icon} Precessie-checksum: {text}",
        "cli.checksum.calculated": "Berekende equinoxpositie: {value}°",
        "cli.checksum.observed": "Waargenomen equinoxpositie:   {value}°",
        "cli.checksum.difference":
            "Verschil: {value}° (tolerantie: {tolerance}°)",
        "cli.checksum.phase_offset":
            "Fase-offset: ~{offset} jaar t.o.v. de waargenomen equinox "
            "(verwacht bij een rond tijdperk; de checksum bewaakt de "
            "consistentie ervan)",
        "cli.checksum.trend":
            "Trend: {stable} over {count} controles (spreiding van het "
            "verschil {spread}°)",
        "cli.checksum.stable": "stabiel",
        "cli.checksum.drifting": "DRIFTEND ⚠️",
        "cli.checksum.trend_none":
            "Trend: nog geen volggegevens — start de server of voer "
            "`--checksum` herhaaldelijk uit",
        "day.Sundial": "Zonnewijzer", "day.Well": "Bron", "day.Root": "Wortel",
        "day.Bloom": "Bloei", "day.Forge": "Smederij", "day.Harvest": "Oogst",
        "day.Star": "Ster",
        "month.Root Moon": "Wortelmaan", "month.Sap Moon": "Sapmaan",
        "month.Green Moon": "Groenmaan", "month.Bloom Moon": "Bloeimaan",
        "month.Grain Moon": "Graanmaan", "month.Light Moon": "Lichtmaan",
        "month.Thirst Moon": "Dorstmaan", "month.Fruit Moon": "Fruitmaan",
        "month.Harvest Moon": "Oogstmaan", "month.Wine Moon": "Wijnmaan",
        "month.Leaf Moon": "Bladmaan", "month.Frost Moon": "Rijpmaan",
        "month.Star Moon": "Sterrenmaan",
        "year_day.Deep Day": "Diepe Dag",
        "season.Emergence": "Ontwaking", "season.Radiance": "Straling",
        "season.Release": "Loslating", "season.Stillness": "Stilte",
        "season.Spring": "Lente", "season.Summer": "Zomer",
        "season.Autumn": "Herfst", "season.Winter": "Winter",
        "weekday.Sun": "Zon", "weekday.Moon": "Maan", "weekday.Fire": "Vuur",
        "weekday.Water": "Water", "weekday.Earth": "Aarde",
        "weekday.Air": "Lucht", "weekday.Star": "Ster",
        "moon.New Moon": "Nieuwe maan",
        "moon.Waxing Crescent": "Wassende maansikkel",
        "moon.First Quarter": "Eerste kwartier",
        "moon.Waxing Gibbous": "Wassende maan",
        "moon.Full Moon": "Volle maan",
        "moon.Waning Gibbous": "Afnemende maan",
        "moon.Last Quarter": "Laatste kwartier",
        "moon.Waning Crescent": "Afnemende maansikkel",
        "archetype.Creator": "Schepper", "archetype.Healer": "Genezer",
        "archetype.Warrior": "Krijger", "archetype.Sage": "Wijze",
        "archetype.Lover": "Minnaar", "archetype.Guardian": "Beschermer",
        "archetype.Mystic": "Mysticus", "archetype.Destroyer": "Vernietiger",
        "archetype.Fool": "Dwaas", "archetype.Magician": "Magiër",
        "archetype.Empress": "Keizerin", "archetype.Emperor": "Keizer",
        "archetype.Star": "Ster",
    },

    "fy": {
        "cli.description": "Kairos — natuerlik tiidsysteem",
        "cli.invalid_time": "Net brûkbere tiid. Brûk HH:MM, byg. --noon 13:41",
        "cli.help.noon": "nij de sinne-middei op op in spesifike lokale tiid hjoed, byg. --noon 13:41",
        "cli.help.help": "toan dit helpberjocht en slút ôf",
        "cli.help.tradition":
            "tradysje om te toanen (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat":
            "jo breedtegraad yn graden (skeakelet de oerstekte middei yn)",
        "cli.help.lon": "jo lingtegraad yn graden, east posityf",
        "cli.help.observe_noon": "nij de sinne-middei fan hjoed op",
        "cli.help.moon": "nij moannefaze op, byg. --moon 🌕",
        "cli.help.season":
            "nij in seizoensbarren op: Maaitiid/Simmer/Hjerst/Winter",
        "cli.help.kst": "toan Kairos-tiid (himel-engine) — fereasket skyfield",
        "cli.help.checksum":
            "rinnen de presesje-checksum op it ierdtiidrek-jier",
        "cli.help.lang": "interface-taal: en, nl, fy, de, fr, es, zh "
                         "(standert: en)",
        "cli.solar_noon_recorded": "Sinne-middei opnommen.",
        "cli.invalid_emoji": "Net brûkbere emoji. Brûk 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Moannefaze opnommen: {name}",
        "cli.invalid_season": "Net brûkber seizoen. Brûk ien fan: {seasons}",
        "cli.season_recorded": "Seizoensbarren opnommen: {event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Sinnetiid",
        "cli.display.noon": "Middei",
        "cli.display.moon": "Moanne",
        "cli.display.season": "Seizoen",
        "cli.display.date": "Datum",
        "cli.display.archetype": "Argetype",
        "cli.display.gregorian": "Gregoriaansk",
        "cli.display.noon_unset":
            "net ynsteld — nim sinne-opkomst + sinne-ûndergong (of gelikense "
            "skaad) waar om te kalibrearjen",
        "cli.display.moon_age": "{phase} (leeftiid {age}d)",
        "cli.display.calendar_date": "{month} {day} ({weekday}), dei {doy}",
        "cli.display.valid_seasons": "Maaitiid, Simmer, Hjerst, Winter",
        "cli.display.no_observation": "Gjin waarnimming",
        "cli.display.unknown": "Unbekend",
        "cli.kst_header": "Kairos-tiid (KST) — himelsk",
        "cli.kst_unavailable": "KST net beskikber: {error}",
        "cli.checksum.consistent": "Útlined mei de himel-sykly",
        "cli.checksum.inconsistent":
            "Faze-offset dokumintearre (rûn tiidrek; net faze-fergrindele "
            "oan it Grutte Jier)",
        "cli.checksum.header": "{icon} Presesje-checksum: {text}",
        "cli.checksum.calculated": "Berekkene ekwinoksposysje: {value}°",
        "cli.checksum.observed": "Waarnommen ekwinoksposysje:   {value}°",
        "cli.checksum.difference":
            "Ferskil: {value}° (tolerânsje: {tolerance}°)",
        "cli.checksum.phase_offset":
            "Faze-offset: ~{offset} jier tsjin de waarnommen ekwinoks "
            "(ferwachte by in rûn tiidrek; de checksum folget de konsistinsje)",
        "cli.checksum.trend":
            "Trend: {stable} oer {count} kontrôles (fersprieding fan it "
            "ferskil {spread}°)",
        "cli.checksum.stable": "stabyl",
        "cli.checksum.drifting": "DRIFTET ⚠️",
        "cli.checksum.trend_none":
            "Trend: noch gjin folchgegevens — start de server of run "
            "`--checksum` geregeld",
        "day.Sundial": "Sinnewizer", "day.Well": "Welle", "day.Root": "Woartel",
        "day.Bloom": "Bloeij", "day.Forge": "Smidderij",
        "day.Harvest": "Rispinge", "day.Star": "Stjer",
        "month.Root Moon": "Woartelmoanne", "month.Sap Moon": "Sapmoanne",
        "month.Green Moon": "Grienmoanne", "month.Bloom Moon": "Bloeimoanne",
        "month.Grain Moon": "Nôtmoanne", "month.Light Moon": "Ljochtmoanne",
        "month.Thirst Moon": "Toarstmoanne", "month.Fruit Moon": "Fruchtmoanne",
        "month.Harvest Moon": "Rispingemoanne", "month.Wine Moon": "Wynmoanne",
        "month.Leaf Moon": "Blêdmoanne", "month.Frost Moon": "Froastmoanne",
        "month.Star Moon": "Stjerremoanne",
        "year_day.Deep Day": "Djippe Dei",
        "season.Emergence": "Untstean", "season.Radiance": "Glâns",
        "season.Release": "Loslitten", "season.Stillness": "Stilte",
        "season.Spring": "Maaitiid", "season.Summer": "Simmer",
        "season.Autumn": "Hjerst", "season.Winter": "Winter",
        "weekday.Sun": "Sinne", "weekday.Moon": "Moanne", "weekday.Fire": "Fjoer",
        "weekday.Water": "Wetter", "weekday.Earth": "Ierde",
        "weekday.Air": "Loft", "weekday.Star": "Stjer",
        "moon.New Moon": "Nije moanne",
        "moon.Waxing Crescent": "Waaksende moanne",
        "moon.First Quarter": "Earste kertier",
        "moon.Waxing Gibbous": "Waaksende moanne",
        "moon.Full Moon": "Folle moanne",
        "moon.Waning Gibbous": "Neigeande moanne",
        "moon.Last Quarter": "Lêste kertier",
        "moon.Waning Crescent": "Neigeande moanne",
        "archetype.Creator": "Skepper", "archetype.Healer": "Genêzer",
        "archetype.Warrior": "Kriger", "archetype.Sage": "Wize",
        "archetype.Lover": "Minner", "archetype.Guardian": "Hoeder",
        "archetype.Mystic": "Mystikus", "archetype.Destroyer": "Ferdylger",
        "archetype.Fool": "Dwaas", "archetype.Magician": "Magiër",
        "archetype.Empress": "Keizerinne", "archetype.Emperor": "Keizer",
        "archetype.Star": "Stjer",
    },

    "de": {
        "cli.description": "Kairos — natürliches Zeitsystem",
        "cli.invalid_time": "Ungültige Zeit. Verwenden Sie HH:MM, z. B. --noon 13:41",
        "cli.help.noon": "Sonnenmittag zu einer bestimmten lokalen Zeit heute aufzeichnen, z. B. --noon 13:41",
        "cli.help.help": "diese Hilfe anzeigen und beenden",
        "cli.help.tradition":
            "Tradition zum Anzeigen (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat":
            "Ihr Breitengrad in Grad (aktiviert den querverwiesenen Mittag)",
        "cli.help.lon": "Ihr Längengrad in Grad, Osten positiv",
        "cli.help.observe_noon": "den heutigen Sonnenmittag aufzeichnen",
        "cli.help.moon": "Mondphase aufzeichnen, z. B. --moon 🌕",
        "cli.help.season":
            "ein saisonales Ereignis aufzeichnen: "
            "Frühling/Sommer/Herbst/Winter",
        "cli.help.kst": "Kairos-Zeit (Himmels-Engine) anzeigen — benötigt "
                        "skyfield",
        "cli.help.checksum":
            "die Präzessions-Prüfsumme für das Erdzeitalter-Jahr ausführen",
        "cli.help.lang": "Oberflächensprache: en, nl, fy, de, fr, es, zh "
                         "(Standard: en)",
        "cli.solar_noon_recorded": "Sonnenmittag aufgezeichnet.",
        "cli.invalid_emoji": "Ungültiges Emoji. Verwenden Sie 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Mondphase aufgezeichnet: {name}",
        "cli.invalid_season":
            "Ungültige Jahreszeit. Verwenden Sie eine von: {seasons}",
        "cli.season_recorded": "Saisonales Ereignis aufgezeichnet: {event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Sonnenzeit",
        "cli.display.noon": "Mittag",
        "cli.display.moon": "Mond",
        "cli.display.season": "Jahreszeit",
        "cli.display.date": "Datum",
        "cli.display.archetype": "Archetyp",
        "cli.display.gregorian": "Gregorianisch",
        "cli.display.noon_unset":
            "nicht gesetzt — Sonnenaufgang + Sonnenuntergang (oder gleiche "
            "Schatten) beobachten, um zu kalibrieren",
        "cli.display.moon_age": "{phase} (Alter {age} T)",
        "cli.display.calendar_date": "{month} {day} ({weekday}), Tag {doy}",
        "cli.display.valid_seasons": "Frühling, Sommer, Herbst, Winter",
        "cli.display.no_observation": "Keine Beobachtung",
        "cli.display.unknown": "Unbekannt",
        "cli.kst_header": "Kairos-Zeit (KST) — himmlisch",
        "cli.kst_unavailable": "KST nicht verfügbar: {error}",
        "cli.checksum.consistent": "Mit den Himmelszyklen ausgerichtet",
        "cli.checksum.inconsistent":
            "Phasenversatz dokumentiert (rundes Epochenjahr; nicht an das "
            "Große Jahr phasengekoppelt)",
        "cli.checksum.header": "{icon} Präzessions-Prüfsumme: {text}",
        "cli.checksum.calculated":
            "Berechnete Äquinoktium-Position: {value}°",
        "cli.checksum.observed": "Beobachtete Äquinoktium-Position:   {value}°",
        "cli.checksum.difference":
            "Differenz: {value}° (Toleranz: {tolerance}°)",
        "cli.checksum.phase_offset":
            "Phasenversatz: ~{offset} Jahre gegenüber dem beobachteten "
            "Äquinoktium (bei einem runden Epochenjahr erwartet; die "
            "Prüfsumme überwacht seine Konsistenz)",
        "cli.checksum.trend":
            "Trend: {stable} über {count} Prüfungen (Differenz-Spanne "
            "{spread}°)",
        "cli.checksum.stable": "stabil",
        "cli.checksum.drifting": "DRIFTET ⚠️",
        "cli.checksum.trend_none":
            "Trend: noch keine Verlaufsdaten — starten Sie den Server oder "
            "führen Sie `--checksum` wiederholt aus",
        "day.Sundial": "Sonnenuhr", "day.Well": "Brunnen", "day.Root": "Wurzel",
        "day.Bloom": "Blüte", "day.Forge": "Schmiede", "day.Harvest": "Ernte",
        "day.Star": "Stern",
        "month.Root Moon": "Wurzelmond", "month.Sap Moon": "Saftmond",
        "month.Green Moon": "Grünmond", "month.Bloom Moon": "Blühmond",
        "month.Grain Moon": "Kornmond", "month.Light Moon": "Lichtmond",
        "month.Thirst Moon": "Durstmond", "month.Fruit Moon": "Fruchtmond",
        "month.Harvest Moon": "Erntemond", "month.Wine Moon": "Weinmond",
        "month.Leaf Moon": "Blattmond", "month.Frost Moon": "Frostmond",
        "month.Star Moon": "Sternenmond",
        "year_day.Deep Day": "Tiefer Tag",
        "season.Emergence": "Erwachen", "season.Radiance": "Strahlkraft",
        "season.Release": "Loslassen", "season.Stillness": "Stille",
        "season.Spring": "Frühling", "season.Summer": "Sommer",
        "season.Autumn": "Herbst", "season.Winter": "Winter",
        "weekday.Sun": "Sonne", "weekday.Moon": "Mond", "weekday.Fire": "Feuer",
        "weekday.Water": "Wasser", "weekday.Earth": "Erde",
        "weekday.Air": "Luft", "weekday.Star": "Stern",
        "moon.New Moon": "Neumond",
        "moon.Waxing Crescent": "Zunehmende Sichel",
        "moon.First Quarter": "Erstes Viertel",
        "moon.Waxing Gibbous": "Zunehmender Mond",
        "moon.Full Moon": "Vollmond",
        "moon.Waning Gibbous": "Abnehmender Mond",
        "moon.Last Quarter": "Letztes Viertel",
        "moon.Waning Crescent": "Abnehmende Sichel",
        "archetype.Creator": "Schöpfer", "archetype.Healer": "Heiler",
        "archetype.Warrior": "Krieger", "archetype.Sage": "Weiser",
        "archetype.Lover": "Liebender", "archetype.Guardian": "Beschützer",
        "archetype.Mystic": "Mystiker", "archetype.Destroyer": "Zerstörer",
        "archetype.Fool": "Narr", "archetype.Magician": "Magier",
        "archetype.Empress": "Kaiserin", "archetype.Emperor": "Kaiser",
        "archetype.Star": "Stern",
    },

    "fr": {
        "cli.description": "Kairos — système de temps naturel",
        "cli.invalid_time": "Heure invalide. Utilisez HH:MM, p. ex. --noon 13:41",
        "cli.help.noon": "enregistrer le midi solaire à une heure locale précise aujourd'hui, p. ex. --noon 13:41",
        "cli.help.help": "afficher cette aide et quitter",
        "cli.help.tradition":
            "tradition à afficher (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat":
            "votre latitude en degrés (active le midi recoupé)",
        "cli.help.lon": "votre longitude en degrés, est positif",
        "cli.help.observe_noon": "enregistrer le midi solaire d'aujourd'hui",
        "cli.help.moon": "enregistrer la phase lunaire, p. ex. --moon 🌕",
        "cli.help.season":
            "enregistrer un événement de saison : "
            "Printemps/Été/Automne/Hiver",
        "cli.help.kst": "afficher le temps Kairos (moteur céleste) — nécessite "
                        "skyfield",
        "cli.help.checksum":
            "lancer la somme de contrôle de précession sur l'année d'âge de "
            "la Terre",
        "cli.help.lang": "langue de l'interface : en, nl, fy, de, fr, es, zh "
                         "(défaut : en)",
        "cli.solar_noon_recorded": "Midi solaire enregistré.",
        "cli.invalid_emoji": "Émoji invalide. Utilisez 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Phase lunaire enregistrée : {name}",
        "cli.invalid_season": "Saison invalide. Utilisez l'une de : {seasons}",
        "cli.season_recorded": "Événement de saison enregistré : {event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Heure solaire",
        "cli.display.noon": "Midi",
        "cli.display.moon": "Lune",
        "cli.display.season": "Saison",
        "cli.display.date": "Date",
        "cli.display.archetype": "Archétype",
        "cli.display.gregorian": "Grégorien",
        "cli.display.noon_unset":
            "non réglé — observez le lever + le coucher du soleil (ou les "
            "ombres égales) pour calibrer",
        "cli.display.moon_age": "{phase} (âge {age} j)",
        "cli.display.calendar_date": "{month} {day} ({weekday}), jour {doy}",
        "cli.display.valid_seasons": "Printemps, Été, Automne, Hiver",
        "cli.display.no_observation": "Aucune observation",
        "cli.display.unknown": "Inconnu",
        "cli.kst_header": "Temps Kairos (KST) — céleste",
        "cli.kst_unavailable": "KST indisponible : {error}",
        "cli.checksum.consistent": "Aligné sur les cycles célestes",
        "cli.checksum.inconsistent":
            "Décalage de phase documenté (époque ronde ; non verrouillée "
            "sur la Grande Année)",
        "cli.checksum.header": "{icon} Somme de contrôle de précession : "
                              "{text}",
        "cli.checksum.calculated": "Position calculée de l'équinoxe : {value}°",
        "cli.checksum.observed": "Position observée de l'équinoxe :   {value}°",
        "cli.checksum.difference":
            "Différence : {value}° (tolérance : {tolerance}°)",
        "cli.checksum.phase_offset":
            "Décalage de phase : ~{offset} ans par rapport à l'équinoxe "
            "observé (attendu pour une époque ronde ; la somme de contrôle "
            "en surveille la constance)",
        "cli.checksum.trend":
            "Tendance : {stable} sur {count} vérifications (écart de la "
            "différence {spread}°)",
        "cli.checksum.stable": "stable",
        "cli.checksum.drifting": "À LA DÉRIVE ⚠️",
        "cli.checksum.trend_none":
            "Tendance : pas encore de données — lancez le serveur ou "
            "exécutez `--checksum` régulièrement",
        "day.Sundial": "Cadran solaire", "day.Well": "Puits",
        "day.Root": "Racine", "day.Bloom": "Floraison", "day.Forge": "Forge",
        "day.Harvest": "Moisson", "day.Star": "Étoile",
        "month.Root Moon": "Lune des racines", "month.Sap Moon": "Lune de sève",
        "month.Green Moon": "Lune verte", "month.Bloom Moon": "Lune de floraison",
        "month.Grain Moon": "Lune des grains", "month.Light Moon": "Lune de lumière",
        "month.Thirst Moon": "Lune de soif", "month.Fruit Moon": "Lune des fruits",
        "month.Harvest Moon": "Lune de moisson", "month.Wine Moon": "Lune du vin",
        "month.Leaf Moon": "Lune des feuilles", "month.Frost Moon": "Lune de givre",
        "month.Star Moon": "Lune des étoiles",
        "year_day.Deep Day": "Jour profond",
        "season.Emergence": "Émergence", "season.Radiance": "Rayonnement",
        "season.Release": "Délivrance", "season.Stillness": "Immobilité",
        "season.Spring": "Printemps", "season.Summer": "Été",
        "season.Autumn": "Automne", "season.Winter": "Hiver",
        "weekday.Sun": "Soleil", "weekday.Moon": "Lune", "weekday.Fire": "Feu",
        "weekday.Water": "Eau", "weekday.Earth": "Terre",
        "weekday.Air": "Air", "weekday.Star": "Étoile",
        "moon.New Moon": "Nouvelle lune",
        "moon.Waxing Crescent": "Croissant de lune",
        "moon.First Quarter": "Premier quartier",
        "moon.Waxing Gibbous": "Gibbeuse croissante",
        "moon.Full Moon": "Pleine lune",
        "moon.Waning Gibbous": "Gibbeuse décroissante",
        "moon.Last Quarter": "Dernier quartier",
        "moon.Waning Crescent": "Croissant décroissant",
        "archetype.Creator": "Créateur", "archetype.Healer": "Guérisseur",
        "archetype.Warrior": "Guerrier", "archetype.Sage": "Sage",
        "archetype.Lover": "Amoureux", "archetype.Guardian": "Gardien",
        "archetype.Mystic": "Mystique", "archetype.Destroyer": "Destructeur",
        "archetype.Fool": "Fou", "archetype.Magician": "Magicien",
        "archetype.Empress": "Impératrice", "archetype.Emperor": "Empereur",
        "archetype.Star": "Étoile",
    },

    "es": {
        "cli.description": "Kairos — sistema de tiempo natural",
        "cli.invalid_time": "Hora no válida. Use HH:MM, p. ej. --noon 13:41",
        "cli.help.noon": "registrar el mediodía solar a una hora local concreta hoy, p. ej. --noon 13:41",
        "cli.help.help": "mostrar esta ayuda y salir",
        "cli.help.tradition":
            "tradición a mostrar (tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical)",
        "cli.help.lat":
            "su latitud en grados (activa el mediodía con referencia cruzada)",
        "cli.help.lon": "su longitud en grados, este positivo",
        "cli.help.observe_noon": "registrar el mediodía solar de hoy",
        "cli.help.moon": "registrar la fase lunar, p. ej. --moon 🌕",
        "cli.help.season":
            "registrar un evento de estación: Primavera/Verano/Otoño/Invierno",
        "cli.help.kst": "mostrar el tiempo Kairos (motor celeste) — requiere "
                        "skyfield",
        "cli.help.checksum":
            "ejecutar la suma de comprobación de precesión en el año de edad "
            "de la Tierra",
        "cli.help.lang": "idioma de la interfaz: en, nl, fy, de, fr, es, zh "
                         "(por defecto: en)",
        "cli.solar_noon_recorded": "Mediodía solar registrado.",
        "cli.invalid_emoji": "Emoji no válido. Use 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "Fase lunar registrada: {name}",
        "cli.invalid_season": "Estación no válida. Use una de: {seasons}",
        "cli.season_recorded": "Evento de estación registrado: {event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "Hora solar",
        "cli.display.noon": "Mediodía",
        "cli.display.moon": "Luna",
        "cli.display.season": "Estación",
        "cli.display.date": "Fecha",
        "cli.display.archetype": "Arquetipo",
        "cli.display.gregorian": "Gregoriano",
        "cli.display.noon_unset":
            "sin configurar: observe el amanecer + el atardecer (o sombras "
            "iguales) para calibrar",
        "cli.display.moon_age": "{phase} (edad {age} d)",
        "cli.display.calendar_date": "{month} {day} ({weekday}), día {doy}",
        "cli.display.valid_seasons": "Primavera, Verano, Otoño, Invierno",
        "cli.display.no_observation": "Sin observación",
        "cli.display.unknown": "Desconocido",
        "cli.kst_header": "Tiempo Kairos (KST) — celeste",
        "cli.kst_unavailable": "KST no disponible: {error}",
        "cli.checksum.consistent": "Alineado con los ciclos celestes",
        "cli.checksum.inconsistent":
            "Desfase de fase documentado (época redonda; no bloqueado a la "
            "Gran Año)",
        "cli.checksum.header": "{icon} Suma de comprobación de precesión: "
                              "{text}",
        "cli.checksum.calculated": "Posición calculada del equinoccio: {value}°",
        "cli.checksum.observed": "Posición observada del equinoccio:   {value}°",
        "cli.checksum.difference":
            "Diferencia: {value}° (tolerancia: {tolerance}°)",
        "cli.checksum.phase_offset":
            "Desfase de fase: ~{offset} años frente al equinoccio observado "
            "(esperado para una época redonda; la suma de comprobación vigila "
            "su constancia)",
        "cli.checksum.trend":
            "Tendencia: {stable} en {count} comprobaciones (dispersión de la "
            "diferencia {spread}°)",
        "cli.checksum.stable": "estable",
        "cli.checksum.drifting": "A LA DERIVA ⚠️",
        "cli.checksum.trend_none":
            "Tendencia: sin datos todavía — inicie el servidor o ejecute "
            "`--checksum` repetidamente",
        "day.Sundial": "Reloj de sol", "day.Well": "Pozo", "day.Root": "Raíz",
        "day.Bloom": "Florecimiento", "day.Forge": "Forja",
        "day.Harvest": "Cosecha", "day.Star": "Estrella",
        "month.Root Moon": "Luna de raíz", "month.Sap Moon": "Luna de savia",
        "month.Green Moon": "Luna verde", "month.Bloom Moon": "Luna de floración",
        "month.Grain Moon": "Luna de grano", "month.Light Moon": "Luna de luz",
        "month.Thirst Moon": "Luna de sed", "month.Fruit Moon": "Luna de frutos",
        "month.Harvest Moon": "Luna de cosecha", "month.Wine Moon": "Luna de vino",
        "month.Leaf Moon": "Luna de hojas", "month.Frost Moon": "Luna de escarcha",
        "month.Star Moon": "Luna de estrellas",
        "year_day.Deep Day": "Día profundo",
        "season.Emergence": "Surgimiento", "season.Radiance": "Resplandor",
        "season.Release": "Liberación", "season.Stillness": "Quietud",
        "season.Spring": "Primavera", "season.Summer": "Verano",
        "season.Autumn": "Otoño", "season.Winter": "Invierno",
        "weekday.Sun": "Sol", "weekday.Moon": "Luna", "weekday.Fire": "Fuego",
        "weekday.Water": "Agua", "weekday.Earth": "Tierra",
        "weekday.Air": "Aire", "weekday.Star": "Estrella",
        "moon.New Moon": "Luna nueva",
        "moon.Waxing Crescent": "Luna creciente",
        "moon.First Quarter": "Cuarto creciente",
        "moon.Waxing Gibbous": "Gibosa creciente",
        "moon.Full Moon": "Luna llena",
        "moon.Waning Gibbous": "Gibosa menguante",
        "moon.Last Quarter": "Cuarto menguante",
        "moon.Waning Crescent": "Luna menguante",
        "archetype.Creator": "Creador", "archetype.Healer": "Sanador",
        "archetype.Warrior": "Guerrero", "archetype.Sage": "Sabio",
        "archetype.Lover": "Amante", "archetype.Guardian": "Guardián",
        "archetype.Mystic": "Místico", "archetype.Destroyer": "Destructor",
        "archetype.Fool": "Loco", "archetype.Magician": "Mago",
        "archetype.Empress": "Emperatriz", "archetype.Emperor": "Emperador",
        "archetype.Star": "Estrella",
    },

    "zh": {
        "cli.description": "Kairos — 自然时间系统",
        "cli.invalid_time": "无效时间。请使用 HH:MM 格式，例如 --noon 13:41",
        "cli.help.noon": "在今天某个具体本地时间记录太阳正午，例如 --noon 13:41",
        "cli.help.help": "显示此帮助信息并退出",
        "cli.help.tradition":
            "要显示的历法传统（tartarian, celtic, chinese, vedic, "
            "mesopotamian, mystical）",
        "cli.help.lat": "您的纬度（度），启用交叉参考正午",
        "cli.help.lon": "您的经度（度），东经为正",
        "cli.help.observe_noon": "记录今天的太阳正午",
        "cli.help.moon": "记录月相，例如 --moon 🌕",
        "cli.help.season": "记录季节事件：春/夏/秋/冬",
        "cli.help.kst": "显示凯罗斯时间（天体引擎）——需要 skyfield",
        "cli.help.checksum": "对地球年龄年执行岁差校验和",
        "cli.help.lang": "界面语言：en, nl, fy, de, fr, es, zh（默认：en）",
        "cli.solar_noon_recorded": "太阳正午已记录。",
        "cli.invalid_emoji": "无效表情符号。请使用 🌑🌒🌓🌔🌕🌖🌗🌘",
        "cli.moon_phase_recorded": "月相已记录：{name}",
        "cli.invalid_season": "无效季节。请使用其中之一：{seasons}",
        "cli.season_recorded": "季节事件已记录：{event}",
        "cli.display.tradition": "Kairos — {tradition}",
        "cli.display.solar_time": "太阳时",
        "cli.display.noon": "正午",
        "cli.display.moon": "月亮",
        "cli.display.season": "季节",
        "cli.display.date": "日期",
        "cli.display.archetype": "原型",
        "cli.display.gregorian": "公历",
        "cli.display.noon_unset":
            "未设置——请观察日出 + 日落（或等长影子）以校准",
        "cli.display.moon_age": "{phase}（年龄 {age} 天）",
        "cli.display.calendar_date": "{month} {day}（{weekday}），第 {doy} 天",
        "cli.display.valid_seasons": "春、夏、秋、冬",
        "cli.display.no_observation": "无观测",
        "cli.display.unknown": "未知",
        "cli.kst_header": "凯罗斯时间（KST）——天体",
        "cli.kst_unavailable": "KST 不可用：{error}",
        "cli.checksum.consistent": "与天体周期对齐",
        "cli.checksum.inconsistent": "相位偏移已记录（整数纪元；未与大年锁定相位）",
        "cli.checksum.header": "{icon} 岁差校验和：{text}",
        "cli.checksum.calculated": "计算的分点位置：{value}°",
        "cli.checksum.observed": "观测的分点位置：{value}°",
        "cli.checksum.difference": "差值：{value}°（容差：{tolerance}°）",
        "cli.checksum.phase_offset":
            "相位偏移：与观测分点相差约 {offset} 年（整数纪元属正常现象；"
            "校验和会持续监测其一致性）",
        "cli.checksum.trend":
            "趋势：{stable}，共 {count} 次检查（差值分布 {spread}°）",
        "cli.checksum.stable": "稳定",
        "cli.checksum.drifting": "漂移中 ⚠️",
        "cli.checksum.trend_none":
            "趋势：尚无跟踪数据——请运行服务器或反复执行 `--checksum`",
        "day.Sundial": "日晷", "day.Well": "井", "day.Root": "根",
        "day.Bloom": "绽放", "day.Forge": "锻造", "day.Harvest": "丰收",
        "day.Star": "星辰",
        "month.Root Moon": "根月", "month.Sap Moon": "汁月",
        "month.Green Moon": "绿月", "month.Bloom Moon": "花月",
        "month.Grain Moon": "谷月", "month.Light Moon": "光月",
        "month.Thirst Moon": "渴月", "month.Fruit Moon": "果月",
        "month.Harvest Moon": "收月", "month.Wine Moon": "酒月",
        "month.Leaf Moon": "叶月", "month.Frost Moon": "霜月",
        "month.Star Moon": "星月",
        "year_day.Deep Day": "深日",
        "season.Emergence": "萌发", "season.Radiance": "光辉",
        "season.Release": "释放", "season.Stillness": "静寂",
        "season.Spring": "春", "season.Summer": "夏",
        "season.Autumn": "秋", "season.Winter": "冬",
        "weekday.Sun": "日", "weekday.Moon": "月", "weekday.Fire": "火",
        "weekday.Water": "水", "weekday.Earth": "土",
        "weekday.Air": "风", "weekday.Star": "星",
        "moon.New Moon": "新月", "moon.Waxing Crescent": "娥眉月",
        "moon.First Quarter": "上弦月", "moon.Waxing Gibbous": "盈凸月",
        "moon.Full Moon": "满月", "moon.Waning Gibbous": "亏凸月",
        "moon.Last Quarter": "下弦月", "moon.Waning Crescent": "残月",
        "archetype.Creator": "创造者", "archetype.Healer": "治愈者",
        "archetype.Warrior": "战士", "archetype.Sage": "智者",
        "archetype.Lover": "爱人", "archetype.Guardian": "守护者",
        "archetype.Mystic": "神秘者", "archetype.Destroyer": "毁灭者",
        "archetype.Fool": "愚者", "archetype.Magician": "魔术师",
        "archetype.Empress": "女皇", "archetype.Emperor": "皇帝",
        "archetype.Star": "星辰",
    },
}

