// Kairos i18n — translations and language switching for the PWA.
//
// One flat "key -> text" table per language (CATALOG below). English ("en")
// is the source of truth for the key set; to add a language, add one block
// with the same keys (tests/test_i18n_web.py enforces parity automatically).
//
// Usage:
//   t('app.tagline')                     -> translated string
//   t('app.status_moon_season', {moon: 'Full Moon', season: 'Summer'})
//   trName('month.', 'Harvest Moon')     -> canonical-name lookup w/ fallback
//   setLang('nl')                        -> persist, re-apply, notify listeners
//
// Static HTML uses data-i18n attributes (apply() walks the DOM):
//   <div data-i18n="app.tagline"></div>
//   <input data-i18n-placeholder="add.name_placeholder">
//   <button data-i18n-title="helpBtn.title"></button>
//   <span data-i18n-html="footer.community"></span>
//
// Works under Node for the test suite (module.exports), like web/tabs.js.

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.KairosI18n = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ---- Language registry ------------------------------------------------
    var LANGS = ['en', 'nl', 'fy', 'de', 'fr', 'es', 'zh'];
    var LANG_NAMES = {
        en: 'English', nl: 'Nederlands', fy: 'Frysk', de: 'Deutsch',
        fr: 'Français', es: 'Español', zh: '中文'
    };
    var STORAGE_KEY = 'kairos_lang';
    var FALLBACK = 'en';
    var CATALOG = {
        'en': {

            // ---- Document & shell -----------------------------------------
            'title': 'Kairos — Natural Time',
            'logo.alt': 'Kairos logo',
            'app.tagline': 'time you observe',
            'helpBtn.title': 'What does this mean?',
            'tabs.now': '🌅 Now',
            'tabs.configure': '⚙️ Configure',
            'display.observing': 'Observing...',
            'gregorian.prefix': '(Gregorian: {date})',
            'action.capture': '📸 Capture Moment',
            'action.capture.title':
                'Take a photo and stamp it with this Kairos moment',
            'action.share': '📤 Share This Moment',
            'action.share.title': 'Export this moment as text or image',
            'kst.solar_longitude': '🌞 Solar Longitude',
            'kst.lunar_age': '🌙 Lunar Age',
            'kst.sidereal_time': '🌀 Sidereal Time',
            'kst.visible_star': '⭐ Visible Star',
            'kst.celestial_season': '🌍 Celestial Season',
            'kst.planets': '🪐 Planets',
            'seasonal.in_season': '🌿 In season',
            'seasonal.tune': '⚙️ tune',
            'seasonal.tune.title': 'Filters and editing',
            'seasonal.looking_up': 'Looking up the sky…',
            'checksum.computing': '🔭 Precession offset: computing…',
            'checksum.title': 'Kairos self-check — is the deep-time year '
                + 'still in phase with the observed vernal equinox?',
            // ---- Configure tab -------------------------------------------
            'config.tradition': '🕰️ Your tradition',
            'config.tradition_hint':
                'Read the same observed sky through a different calendar lens.',
            'config.language': '🌐 Language',
            'config.language_hint': 'Choose the language of this app.',
            'config.seasonal_filters': '🌿 Seasonal filters & editing',
            'config.seasonal_filters_hint':
                'Choose which items appear in "In season" on the Now tab.',
            'config.all_traditions': 'All traditions',
            'config.tradition_filter': 'Tradition filter',
            'config.auto_region': 'Auto region',
            'config.region_filter': 'Region filter',
            'config.add_produce': '➕ Add Produce',
            'config.add_festival': '➕ Add Festival',
            'config.calibrate': '🌞 Calibrate your local solar time',
            'config.calibrate_hint':
                'Press 🌅 Sunrise when the sun touches the horizon and 🌇 '
                + 'Sunset when it disappears — or use a stick: press ⚖️ '
                + 'Shadow = Stick when the shadow matches the stick '
                + '(morning and afternoon).',
            'config.sunrise': '🌅 Sunrise',
            'config.enter_times': '📝 Or enter observed times',
            'config.use_times': '💾 Use these times',
            'config.solar_noon': '☀️ Solar noon (culmination)',
            'config.set_noon': '💾 Set solar noon',
            'config.sunset': '🌇 Sunset',
            'config.equal_shadow': '⚖️ Shadow = Stick',
            'config.shadow_status':
                'Press when the sun touches the horizon, or when your shadow '
                + 'equals the stick.',
            'config.observe_moon': '🌙 Observe the moon',
            'config.observe_moon_hint': 'Tap the emoji that matches what you see.',
            'config.observe_season': '🍂 Observe the season',
            'config.observe_season_hint': 'Press the season that feels right.',
            'app.ready': 'Ready.',
            'footer': 'Kairos — no GPS, no internet, just you and the sky',
            'footer.community':
                '🌍 Join the community — share your <b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" target="_blank" '
                + 'rel="noopener noreferrer">github.com/jbstoker/kairos</a>',
            'close': 'Close',
            'help.modal_title': 'Kairos — what am I looking at?',
            'help.foot':
                'Kairos is observation-first. These are hints from the sky — '
                + 'the sky you actually see is always the authority.',


            // ---- Add / seasonal modals ------------------------------------
            'seasonal.title': 'Item',
            'seasonal.add_own': '➕ Add your own',
            'add.kind': 'Kind',
            'add.kind_produce': 'Produce (food, herb, mushroom, meat)',
            'add.kind_festival': 'Festival / celebration',
            'add.name': 'Name *',
            'add.name_placeholder': 'e.g. Nettle',
            'add.category': 'Category',
            'category.fruit': 'fruit',
            'category.vegetable': 'vegetable',
            'category.herb': 'herb',
            'category.fungus': 'fungus',
            'category.meat': 'meat',
            'category.other': 'other',
            'add.in_season': 'In season (Kairos season)',
            'kairos_season.Emergence': 'Emergence (Spring)',
            'kairos_season.Radiance': 'Radiance (Summer)',
            'kairos_season.Release': 'Release (Autumn)',
            'kairos_season.Stillness': 'Stillness (Winter)',
            'add.uses': 'Uses',
            'add.uses_placeholder': 'fresh, sauces, …',
            'add.how_to_find': 'How to find',
            'add.how_to_find_placeholder': 'grows near…',
            'add.activities': 'Activities',
            'add.activities_placeholder': 'bonfires, feasting',
            'add.foods': 'Foods',
            'add.foods_placeholder': 'bread, wine',
            'add.regions': 'Regions (comma-separated)',
            'add.regions_placeholder': 'temperate, forest',
            'add.traditions': 'Traditions (comma-separated)',
            'add.traditions_placeholder': 'global',
            'add.description': 'Description',
            'add.emoji': 'Emoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Save',
            // ---- Share modal ----------------------------------------------
            'share.title': '📤 Share this moment',
            'share.alt_moment': 'Your moment',
            'share.living_in': 'Living in {moment}',
            'share.copy': '📋 Copy',
            'share.download': '🖼️ Download image',
            'share.photo': '📤 Share photo',
            // ---- Status & observation messages ----------------------------
            'app.status_moon_season': 'Moon: {moon} | Season: {season}',
            'app.unknown': 'unknown',
            'app.optional_layer': 'optional layer',
            'app.noon_observed': 'Noon: {time} (observed)',
            'app.solar_noon_title':
                'Observed solar noon — your local solar time.',
            'app.solar_no_noon_title':
                'No observation yet — record 🌅 Sunrise + 🌇 Sunset (or ⚖️ '
                + 'equal shadows) to see your local solar time.',
            'app.checksum_stable': 'stable across {count} checks',
            'app.checksum_drifting': 'DRIFTING across {count} checks',
            'app.updated': 'updated {time}',
            'app.selfcheck_unavailable': 'Self-check: unavailable',
            'checksum.precession_offset': 'Precession offset',
            'share.moment_copied': '✅ Moment copied to clipboard',
            'share.copy_manually': 'Select the text and copy manually.',
            'share.watermark': 'time you observe · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Kairos moment image downloaded',
            'share.share_title': 'My Kairos Moment',
            'share.photo_shared': '📤 Kairos moment photo shared / downloaded',
            'share.photo_error': '⚠️ Could not read the captured image.',
            'obs.sunrise_recorded':
                '✅ Sunrise recorded — press Sunset when the sun disappears.',
            'obs.need_sunrise': '⚠️ Please record sunrise first.',
            'obs.shadow_first':
                '✅ First equal-shadow moment recorded — press again in the '
                + 'afternoon when the shadow matches again.',
            'obs.noon_calculated': '✅ Solar noon calculated: {time}',
            'obs.noon_calibrated':
                '✅ Solar noon calibrated via {label} — KST updated.',
            'obs.method_equal_shadows': 'equal shadows',
            'obs.method_sunrise_sunset': 'sunrise + sunset',
            'obs.enter_both': '⚠️ Enter both sunrise and sunset times.',
            'obs.enter_noon': '⚠️ Enter a solar noon time first.',
            'obs.enter_order': '⚠️ Sunset must come after sunrise.',
            'obs.method_entered_times': 'entered sunrise + sunset',
            'obs.method_entered_noon': 'entered solar noon',
            'obs.season_set': '✅ Season set to {season}',
            'obs.moon_set': '✅ Moon set to {emoji} — KST calibrated',
            'obs.tradition_switched': 'Tradition switched to {tradition}',

            // ---- KST / star display --------------------------------------
            'kst.days': 'days',
            'kst.more': '+{count} more ▾',
            'kst.hide': '− hide',
            'kst.next_star': '⭐ — (next: {star} in ~{days}d)',
            'kst.none': '⭐ —',
            // ---- Seasonal layer -------------------------------------------
            'seasonal.tap_details': 'Tap for details',
            'seasonal.festivals': '🎉 Festivals',
            'seasonal.empty_hint':
                'Nothing in season for these filters — observe the sky, and '
                + 'add your own knowledge with ➕ Add Produce / ➕ Add Festival.',
            'seasonal.empty': 'Nothing in season for these filters.',
            'seasonal.no_details': 'No details yet.',
            'seasonal.name_first': '⚠️ Give the item a name first.',
            'seasonal.added_server': '✅ "{name}" added (server)',
            'seasonal.added_device_offline':
                '✅ "{name}" added (this device — server offline)',
            'seasonal.added_device': '✅ "{name}" added (this device)',
            'seasonal.this_app': '(this app)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Global',
            'seasonal.field.season': 'Season',
            'seasonal.field.regions': 'Regions',
            'seasonal.field.traditions': 'Traditions',
            'seasonal.field.description': 'Description',
            'seasonal.field.activities': 'Activities',
            'seasonal.field.foods': 'Foods',
            'seasonal.field.category': 'Category',
            'seasonal.field.seasons': 'Seasons',
            'seasonal.field.uses': 'Uses',
            'seasonal.field.how_to_find': 'How to find',
            // ---- Phytochemical layer --------------------------------------
            'phytochem.title': '🧪 Phytochemical inventory',
            'phytochem.no_inventory':
                'No phytochemical inventory for this item yet.',
            'phytochem.source': '🔗 Source:',
            'phytochem.your_note': 'Your note for this item',
            'phytochem.note_placeholder':
                'e.g. This matches my local variety — or: I found this to be '
                + 'different in my region.',
            'phytochem.save_note': '💾 Save note',
            'phytochem.saved': 'Saved on this device.',
            'phytochem.removed': 'Note removed.',
            // ---- Energy card & help modal ---------------------------------
            'energy.archetype': '🜂 Archetype',
            'energy.moon_mood': '🌙 Moon mood',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 In season',
            'energy.festival': 'festival',
            'energy.food': 'food',
            'help.what_am_i_looking_at': 'What am I looking at?',
            'help.planets_now': '🪐 The planets now (esoteric notes)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Planet positions come from the celestial engine — with the '
                + 'server, Skyfield; offline, a compact browser algorithm '
                + '(web/planets.js).',
            'help.todays_energy': '✨ Today&apos;s energy',
            'help.five_elements': '🜂 The five elements',
            'help.phytochem': '🧪 The phytochemical inventory',
            'help.phytochem_text':
                'Produce detail modals include a phytochemical inventory '
                + '(lycopene, quercetin, vitamin C, …). The values are '
                + '<strong>approximations</strong> from public references — '
                + 'USDA FoodData Central and others — not lab-verified '
                + 'measurements for your specific plant. Every inventory '
                + 'carries the ℹ️ disclaimer at the bottom, a clickable '
                + 'source link, and a note box where you can record what you '
                + 'observe in your own region.',
            'help.community': '🌍 The community',
            'help.community_text':
                'Kairos grows by being shared. Take a photo of your moment, '
                + 'add your Kairos date, and share it with '
                + '<strong>#KairosTime</strong>. Add plants, traditions, and '
                + 'festivals from your region — the repo is '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, and '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> shows how.',

            // ---- KST help --------------------------------------------------
            'kst_help.wheel.title': '🌞 The Cosmic Wheel',
            'kst_help.wheel.text':
                'The wheel is the Sun\'s path through the year. Its colour '
                + 'is the celestial season; the sun marker rotates to the '
                + 'Sun\'s current ecliptic longitude — the same measure '
                + 'ancient sky-watchers used to mark the turning year.',
            'kst_help.solarLongitude.title': '🌞 Solar Longitude',
            'kst_help.solarLongitude.text':
                'The Sun\'s position in degrees along its yearly path '
                + '(0–360°). 0° = spring equinox, 90° = summer solstice, '
                + '180° = autumn equinox, 270° = winter solstice. It is the '
                + 'oldest calendar there is — the Sun\'s address among the '
                + 'stars.',
            'kst_help.lunarAge.title': '🌙 Lunar Age',
            'kst_help.lunarAge.text':
                'Days since the last new moon (the ~29.53-day synodic '
                + 'month). 0 = new moon, ~7.4 = first quarter, ~14.8 = full '
                + 'moon, ~22.1 = last quarter. Every culture\'s month once '
                + 'began with the reappearance of this slender crescent.',
            'kst_help.sidereal.title': '🌀 Sidereal Time',
            'kst_help.sidereal.text':
                'The sky\'s own clock. Local sidereal time tells you which '
                + 'stars are on your meridian right now — 24 sidereal hours '
                + 'for one full rotation of the fixed stars. Wall clocks tell '
                + 'you what the Sun is doing; sidereal time tells you what '
                + 'the sky is doing.',
            'kst_help.star.title': '⭐ Visible Star',
            'kst_help.star.text':
                'The most prominent key star above the horizon at dawn (if '
                + 'several are up, Kairos shows \'+N more\'). Sirius, the '
                + 'Pleiades and Orion marked harvests and floods in many '
                + 'cultures. If none are up, Kairos says so — and hints '
                + 'which star to watch for next.',
            'kst_help.season.title': '🌍 Season',
            'kst_help.season.text':
                'The tropical season from solar longitude (a '
                + 'Northern-hemisphere frame). The wheel changes colour with '
                + 'it — Spring blue, Summer green, Autumn gold, Winter grey.',

            // ---- Season buttons (Configure tab) ---------------------------
            'season_button.Spring': '🌸 Spring',
            'season_button.Summer': '☀️ Summer',
            'season_button.Autumn': '🍂 Autumn',
            'season_button.Winter': '❄️ Winter',
            // ---- Canonical Kairos names ------------------------------------
            'day.Sundial': 'Sundial', 'day.Well': 'Well', 'day.Root': 'Root',
            'day.Bloom': 'Bloom', 'day.Forge': 'Forge',
            'day.Harvest': 'Harvest', 'day.Star': 'Star',
            'month.Root Moon': 'Root Moon', 'month.Sap Moon': 'Sap Moon',
            'month.Green Moon': 'Green Moon', 'month.Bloom Moon': 'Bloom Moon',
            'month.Grain Moon': 'Grain Moon', 'month.Light Moon': 'Light Moon',
            'month.Thirst Moon': 'Thirst Moon', 'month.Fruit Moon': 'Fruit Moon',
            'month.Harvest Moon': 'Harvest Moon', 'month.Wine Moon': 'Wine Moon',
            'month.Leaf Moon': 'Leaf Moon', 'month.Frost Moon': 'Frost Moon',
            'month.Star Moon': 'Star Moon',
            'year_day.Deep Day': 'Deep Day',
            'season.Emergence': 'Emergence', 'season.Radiance': 'Radiance',
            'season.Release': 'Release', 'season.Stillness': 'Stillness',
            'season.Spring': 'Spring', 'season.Summer': 'Summer',
            'season.Autumn': 'Autumn', 'season.Winter': 'Winter',
            'weekday.Sun': 'Sun', 'weekday.Moon': 'Moon',
            'weekday.Fire': 'Fire', 'weekday.Water': 'Water',
            'weekday.Earth': 'Earth', 'weekday.Air': 'Air',
            'weekday.Star': 'Star',
            'moon.New Moon': 'New Moon',
            'moon.Waxing Crescent': 'Waxing Crescent',
            'moon.First Quarter': 'First Quarter',
            'moon.Waxing Gibbous': 'Waxing Gibbous',
            'moon.Full Moon': 'Full Moon',
            'moon.Waning Gibbous': 'Waning Gibbous',
            'moon.Last Quarter': 'Last Quarter',
            'moon.Waning Crescent': 'Waning Crescent',
            'zodiac.Aries': 'Aries', 'zodiac.Taurus': 'Taurus',
            'zodiac.Gemini': 'Gemini', 'zodiac.Cancer': 'Cancer',
            'zodiac.Leo': 'Leo', 'zodiac.Virgo': 'Virgo',
            'zodiac.Libra': 'Libra', 'zodiac.Scorpio': 'Scorpio',
            'zodiac.Sagittarius': 'Sagittarius',
            'zodiac.Capricorn': 'Capricorn', 'zodiac.Aquarius': 'Aquarius',
            'zodiac.Pisces': 'Pisces',
            'archetype.Creator': 'Creator', 'archetype.Healer': 'Healer',
            'archetype.Warrior': 'Warrior', 'archetype.Sage': 'Sage',
            'archetype.Lover': 'Lover', 'archetype.Guardian': 'Guardian',
            'archetype.Mystic': 'Mystic', 'archetype.Destroyer': 'Destroyer',
            'archetype.Fool': 'Fool', 'archetype.Magician': 'Magician',
            'archetype.Empress': 'Empress', 'archetype.Emperor': 'Emperor',
            'archetype.Star': 'Star',
            // ---- Meaning texts (help panel) --------------------------------
            'archetype_meaning.Creator':
                'the impulse to bring new things into being. Ritual: make '
                + 'something with your hands.',
            'archetype_meaning.Healer':
                'the energy of repair and care. Ritual: rest, tend, listen.',
            'archetype_meaning.Warrior':
                'focused will in service of a cause. Ritual: stand for '
                + 'something.',
            'archetype_meaning.Sage':
                'knowledge shared with patience. Ritual: read, write, teach.',
            'archetype_meaning.Lover':
                'the bonds that make life sweet. Ritual: connect, share, '
                + 'celebrate.',
            'archetype_meaning.Guardian':
                'steadiness in service of others. Ritual: protect, prepare, '
                + 'defend.',
            'archetype_meaning.Mystic':
                'direct contact with the unseen. Ritual: meditate, dream, '
                + 'observe.',
            'archetype_meaning.Destroyer':
                'the clearing that makes room. Ritual: release, let go, burn.',
            'archetype_meaning.Fool':
                'open curiosity without a plan. Ritual: play, wander, laugh.',
            'archetype_meaning.Magician':
                'will made effective. Ritual: transform, manifest, practice.',
            'archetype_meaning.Empress':
                'abundance and care. Ritual: nurture, grow, receive.',
            'archetype_meaning.Emperor':
                'structure that serves. Ritual: lead, build, order.',
            'archetype_meaning.Star':
                'the promise that orients the way. Ritual: hope, vision, '
                + 'guide.',

            'moon_meaning.New Moon':
                'quiet, introspective, seeding — the dark before the light.',
            'moon_meaning.Waxing Crescent':
                'hopeful, curious, growing — a promise taking shape.',
            'moon_meaning.First Quarter':
                'driven, decisive, active — momentum and choice.',
            'moon_meaning.Waxing Gibbous':
                'refining, focused, productive — polishing the work.',
            'moon_meaning.Full Moon':
                'luminous, expressive, expansive — the peak of the tide.',
            'moon_meaning.Waning Gibbous':
                'reflective, grateful, sharing — giving back what overflowed.',
            'moon_meaning.Last Quarter':
                'releasing, honest, clearing — cutting what no longer serves.',
            'moon_meaning.Waning Crescent':
                'resting, dreaming, surrendering — the seed settles.',
            'element.Light': 'Light', 'element.Shadow': 'Shadow',
            'element.Stone': 'Stone', 'element.Wind': 'Wind',
            'element.Void': 'Void',
            'element_meaning.Light':
                'clarity, beginnings, vision — what is revealed.',
            'element_meaning.Shadow':
                'stillness, depth, rest — what waits beneath.',
            'element_meaning.Stone':
                'structure, patience, form — what endures.',
            'element_meaning.Wind':
                'movement, change, voice — what carries.',
            'element_meaning.Void':
                'release, space, mystery — what makes room.',
            'festival.Spring':
                'rebirth rituals · seed blessings · equinox gatherings',
            'festival.Summer':
                'solstice fires · long-day feasts · honoring the sun',
            'festival.Autumn':
                'harvest festivals · ancestor remembrance · gratitude feasts',
            'festival.Winter':
                'light ceremonies · solstice vigils · new year fires',
            'food.Spring': 'asparagus, peas, radishes, spinach, strawberries',
            'food.Summer': 'tomatoes, zucchini, berries, corn, peppers',
            'food.Autumn': 'squash, apples, mushrooms, root vegetables, pumpkin',
            'food.Winter': 'cabbage, potatoes, carrots, citrus, leeks',
            'planet.mercury': 'Mercury', 'planet.venus': 'Venus',
            'planet.mars': 'Mars', 'planet.jupiter': 'Jupiter',
            'planet.saturn': 'Saturn',
            'planet_meaning.mercury':
                'the messenger — mind, speech, movement, exchange. The quick '
                + 'energy that connects one thing to another.',
            'planet_meaning.venus':
                'the attractor — love, beauty, harmony, worth. What draws us '
                + 'together and makes life worth savouring.',
            'planet_meaning.mars':
                'the warrior — drive, courage, desire, action. Focused will, '
                + 'for better or worse.',
            'planet_meaning.jupiter':
                'the expander — luck, meaning, growth, generosity. The sense '
                + 'that things are opening up.',
            'planet_meaning.saturn':
                'the gatekeeper — structure, time, discipline, boundary. The '
                + 'slow teacher of limits.',
            'star.Sirius': 'Sirius', 'star.Pleiades': 'Pleiades',
            'star.Orion': 'Orion', 'star.Arcturus': 'Arcturus',
            'star.Vega': 'Vega',
        },

        'nl': {
            'title': 'Kairos — natuurlijke tijd',
            'logo.alt': 'Kairos-logo',
            'app.tagline': 'tijd die je observeert',
            'helpBtn.title': 'Wat betekent dit?',
            'tabs.now': '🌅 Nu',
            'tabs.configure': '⚙️ Configureren',
            'display.observing': 'Observeren…',
            'gregorian.prefix': '(Gregoriaans: {date})',
            'action.capture': '📸 Moment vastleggen',
            'action.capture.title':
                'Maak een foto en stempel hem met dit Kairos-moment',
            'action.share': '📤 Dit moment delen',
            'action.share.title': 'Exporteer dit moment als tekst of afbeelding',
            'kst.solar_longitude': '🌞 Zonnelengte',
            'kst.lunar_age': '🌙 Maanleeftijd',
            'kst.sidereal_time': '🌀 Siderische tijd',
            'kst.visible_star': '⭐ Zichtbare ster',
            'kst.celestial_season': '🌍 Hemelse seizoen',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': '🌿 In het seizoen',
            'seasonal.tune': '⚙️ afstemmen',
            'seasonal.tune.title': 'Filters en bewerken',
            'seasonal.looking_up': 'Naar de hemel kijken…',
            'checksum.computing': '🔭 Precessie-offset: berekenen…',
            'checksum.title':
                'Kairos-zelfcontrole — staat het aardetijdperk-jaar nog in '
                + 'fase met de waargenomen lentegelijk?',
            'config.tradition': '🕰️ Uw traditie',
            'config.tradition_hint':
                'Lees dezelfde waargenomen hemel door een andere '
                + 'kalenderlens.',
            'config.language': '🌐 Taal',
            'config.language_hint': 'Kies de taal van deze app.',
            'config.seasonal_filters': '🌿 Seizoensfilters en bewerken',
            'config.seasonal_filters_hint':
                'Kies welke items in "In het seizoen" op het tabblad Nu '
                + 'verschijnen.',
            'config.all_traditions': 'Alle tradities',
            'config.tradition_filter': 'Traditiefilter',
            'config.auto_region': 'Automatische regio',
            'config.region_filter': 'Regiofilter',
            'config.add_produce': '➕ Product toevoegen',
            'config.add_festival': '➕ Festival toevoegen',
            'config.calibrate': '🌞 Kalibreer uw lokale zonnetijd',
            'config.calibrate_hint':
                'Druk op 🌅 Zonsopgang wanneer de zon de horizon raakt en op '
                + '🌇 Zonsondergang wanneer hij verdwijnt — of gebruik een '
                + 'stok: druk op ⚖️ Schaduw = Stok wanneer de schaduw even '
                + 'lang is als de stok (ochtend en middag).',
            'config.sunrise': '🌅 Zonsopgang',
            'config.enter_times': '📝 Of voer waargenomen tijden in',
            'config.use_times': '💾 Gebruik deze tijden',
            'config.solar_noon': '☀️ Zonne-middag (culminatie)',
            'config.set_noon': '💾 Zonne-middag instellen',
            'config.sunset': '🌇 Zonsondergang',
            'config.equal_shadow': '⚖️ Schaduw = Stok',
            'config.shadow_status':
                'Druk wanneer de zon de horizon raakt, of wanneer uw schaduw '
                + 'even lang is als de stok.',
            'config.observe_moon': '🌙 Observeer de maan',
            'config.observe_moon_hint':
                'Tik op de emoji die overeenkomt met wat u ziet.',
            'config.observe_season': '🍂 Observeer het seizoen',
            'config.observe_season_hint': 'Druk op het seizoen dat klopt.',
            'app.ready': 'Klaar.',
            'footer': 'Kairos — geen gps, geen internet, alleen jij en de hemel',
            'footer.community':
                '🌍 Doe mee met de gemeenschap — deel uw <b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': 'Sluiten',
            'help.modal_title': 'Kairos — waar kijk ik naar?',
            'help.foot':
                'Kairos is observatie-gericht. Dit zijn hints van de hemel — '
                + 'de hemel die u werkelijk ziet is altijd de autoriteit.',
            'seasonal.title': 'Item',
            'seasonal.add_own': '➕ Voeg zelf toe',
            'add.kind': 'Soort',
            'add.kind_produce': 'Product (voedsel, kruid, paddenstoel, vlees)',
            'add.kind_festival': 'Festival / viering',
            'add.name': 'Naam *',
            'add.name_placeholder': 'bijv. Brandnetel',
            'add.category': 'Categorie',
            'category.fruit': 'fruit',
            'category.vegetable': 'groente',
            'category.herb': 'kruid',
            'category.fungus': 'paddenstoel',
            'category.meat': 'vlees',
            'category.other': 'overig',
            'add.in_season': 'In het seizoen (Kairos-seizoen)',
            'kairos_season.Emergence': 'Ontwaking (Lente)',
            'kairos_season.Radiance': 'Straling (Zomer)',
            'kairos_season.Release': 'Loslating (Herfst)',
            'kairos_season.Stillness': 'Stilte (Winter)',
            'add.uses': 'Gebruik',
            'add.uses_placeholder': 'vers, sauzen, …',
            'add.how_to_find': 'Hoe te vinden',
            'add.how_to_find_placeholder': 'groeit bij…',
            'add.activities': 'Activiteiten',
            'add.activities_placeholder': 'vuren, feesten',
            'add.foods': 'Voedsel',
            'add.foods_placeholder': 'brood, wijn',
            'add.regions': 'Regio\'s (gescheiden door komma\'s)',
            'add.regions_placeholder': 'gematigd, bos',
            'add.traditions': 'Tradities (gescheiden door komma\'s)',
            'add.traditions_placeholder': 'globaal',
            'add.description': 'Beschrijving',
            'add.emoji': 'Emoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Opslaan',
            'share.title': '📤 Dit moment delen',
            'share.alt_moment': 'Uw moment',
            'share.living_in': 'Leven in {moment}',
            'share.copy': '📋 Kopiëren',
            'share.download': '🖼️ Afbeelding downloaden',
            'share.photo': '📤 Foto delen',
            'app.status_moon_season': 'Maan: {moon} | Seizoen: {season}',
            'app.unknown': 'onbekend',
            'app.optional_layer': 'optionele laag',
            'app.noon_observed': 'Middag: {time} (waargenomen)',
            'app.solar_noon_title':
                'Waargenomen zonne-middag — uw lokale zonnetijd.',
            'app.solar_no_noon_title':
                'Nog geen waarneming — neem 🌅 Zonsopgang + 🌇 Zonsondergang '
                + '(of ⚖️ gelijke schaduwen) waar om uw lokale zonnetijd te '
                + 'zien.',
            'app.checksum_stable': 'stabiel over {count} controles',
            'app.checksum_drifting': 'DRIFTEND over {count} controles',
            'app.updated': 'bijgewerkt {time}',
            'app.selfcheck_unavailable': 'Zelfcontrole: niet beschikbaar',
            'checksum.precession_offset': 'Precessie-offset',
            'share.moment_copied': '✅ Moment naar klembord gekopieerd',
            'share.copy_manually': 'Selecteer de tekst en kopieer handmatig.',
            'share.watermark':
                'tijd die je observeert · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Kairos-momentafbeelding gedownload',
            'share.share_title': 'Mijn Kairos-moment',
            'share.photo_shared': '📤 Kairos-momentfoto gedeeld / gedownload',
            'share.photo_error': '⚠️ Kan de vastgelegde afbeelding niet lezen.',
            'obs.sunrise_recorded':
                '✅ Zonsopgang opgenomen — druk op Zonsondergang wanneer de '
                + 'zon verdwijnt.',
            'obs.need_sunrise': '⚠️ Neem eerst de zonsopgang op.',
            'obs.shadow_first':
                '✅ Eerste gelijke-schaduw-moment opgenomen — druk vanmiddag '
                + 'nogmaals wanneer de schaduw weer even lang is.',
            'obs.noon_calculated': '✅ Zonne-middag berekend: {time}',
            'obs.noon_calibrated':
                '✅ Zonne-middag gekalibreerd via {label} — KST bijgewerkt.',
            'obs.method_equal_shadows': 'gelijke schaduwen',
            'obs.method_sunrise_sunset': 'zonsopgang + zonsondergang',
            'obs.enter_both': '⚠️ Voer zowel de zonsopgang als de zonsondergang in.',
            'obs.enter_noon': '⚠️ Voer eerst een zonne-middag in.',
            'obs.enter_order': '⚠️ De zonsondergang moet na de zonsopgang liggen.',
            'obs.method_entered_times': 'ingevoerde zonsopgang + zonsondergang',
            'obs.method_entered_noon': 'ingevoerde zonne-middag',
            'obs.season_set': '✅ Seizoen ingesteld op {season}',
            'obs.moon_set': '✅ Maan ingesteld op {emoji} — KST gekalibreerd',
            'obs.tradition_switched': 'Traditie gewijzigd naar {tradition}',
            'kst.days': 'dagen',
            'kst.more': '+{count} meer ▾',
            'kst.hide': '− verbergen',
            'kst.next_star': '⭐ — (volgende: {star} over ~{days} d)',
            'kst.none': '⭐ —',
            'seasonal.tap_details': 'Tik voor details',
            'seasonal.festivals': '🎉 Festivals',
            'seasonal.empty_hint':
                'Niets in het seizoen voor deze filters — observeer de hemel, '
                + 'en voeg uw eigen kennis toe met ➕ Product toevoegen / ➕ '
                + 'Festival toevoegen.',
            'seasonal.empty': 'Niets in het seizoen voor deze filters.',
            'seasonal.no_details': 'Nog geen details.',
            'seasonal.name_first': '⚠️ Geef het item eerst een naam.',
            'seasonal.added_server': '✅ "{name}" toegevoegd (server)',
            'seasonal.added_device_offline':
                '✅ "{name}" toegevoegd (dit apparaat — server offline)',
            'seasonal.added_device': '✅ "{name}" toegevoegd (dit apparaat)',
            'seasonal.this_app': '(deze app)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Globaal',
            'seasonal.field.season': 'Seizoen',
            'seasonal.field.regions': 'Regio\'s',
            'seasonal.field.traditions': 'Tradities',
            'seasonal.field.description': 'Beschrijving',
            'seasonal.field.activities': 'Activiteiten',
            'seasonal.field.foods': 'Voedsel',
            'seasonal.field.category': 'Categorie',
            'seasonal.field.seasons': 'Seizoenen',
            'seasonal.field.uses': 'Gebruik',
            'seasonal.field.how_to_find': 'Hoe te vinden',
            'phytochem.title': '🧪 Fytochemische inventaris',
            'phytochem.no_inventory':
                'Nog geen fytochemische inventaris voor dit item.',
            'phytochem.source': '🔗 Bron:',
            'phytochem.your_note': 'Uw notitie voor dit item',
            'phytochem.note_placeholder':
                'bijv. Dit komt overeen met mijn lokale variant — of: ik heb '
                + 'dit anders ervaren in mijn regio.',
            'phytochem.save_note': '💾 Notitie opslaan',
            'phytochem.saved': 'Opgeslagen op dit apparaat.',
            'phytochem.removed': 'Notitie verwijderd.',
            'energy.archetype': '🜂 Archetype',
            'energy.moon_mood': '🌙 Maanstemming',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 In het seizoen',
            'energy.festival': 'festival',
            'energy.food': 'voedsel',
            'help.what_am_i_looking_at': 'Waar kijk ik naar?',
            'help.planets_now': '🪐 De planeten nu (esoterische notities)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Planeetposities komen van de hemelengine — met de server, '
                + 'Skyfield; offline, een compact browser-algoritme '
                + '(web/planets.js).',
            'help.todays_energy': '✨ De energie van vandaag',
            'help.five_elements': '🜂 De vijf elementen',
            'help.phytochem': '🧪 De fytochemische inventaris',
            'help.phytochem_text':
                'Product-detailschermen bevatten een fytochemische inventaris '
                + '(lycopeen, quercetine, vitamine C, …). De waarden zijn '
                + '<strong>benaderingen</strong> uit openbare referenties — '
                + 'USDA FoodData Central en anderen — geen laboratorium-'
                + 'metingen voor uw specifieke plant. Elke inventaris draagt '
                + 'onderaan de ℹ️-disclaimer, een klikbare bronlink en een '
                + 'notitieveld waar u kunt vastleggen wat u in uw eigen regio '
                + 'observeert.',
            'help.community': '🌍 De gemeenschap',
            'help.community_text':
                'Kairos groeit door delen. Maak een foto van uw moment, voeg '
                + 'uw Kairos-datum toe en deel het met '
                + '<strong>#KairosTime</strong>. Voeg planten, tradities en '
                + 'festivals uit uw regio toe — de repo is '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, en '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> laat zien hoe.',
            'kst_help.wheel.title': '🌞 Het kosmische wiel',
            'kst_help.wheel.text':
                'Het wiel is de baan van de zon door het jaar. De kleur is '
                + 'het hemelse seizoen; de zonmarkering draait naar de '
                + 'huidige eclipticale lengte van de zon — dezelfde maat die '
                + 'oude hemelkijkers gebruikten om het keren van het jaar te '
                + 'markeren.',
            'kst_help.solarLongitude.title': '🌞 Zonnelengte',
            'kst_help.solarLongitude.text':
                'De positie van de zon in graden langs haar jaarlijkse baan '
                + '(0–360°). 0° = lentegelijk, 90° = zomerzonnewende, 180° = '
                + 'herfstgelijk, 270° = winterzonnewende. Het is de oudste '
                + 'kalender die er is — het adres van de zon tussen de '
                + 'sterren.',
            'kst_help.lunarAge.title': '🌙 Maanleeftijd',
            'kst_help.lunarAge.text':
                'Dagen sinds de laatste nieuwe maan (de ~29,53-dagen '
                + 'synodische maand). 0 = nieuwe maan, ~7,4 = eerste '
                + 'kwartier, ~14,8 = volle maan, ~22,1 = laatste kwartier. '
                + 'Vroeger begon de maand van elke cultuur met de terugkeer '
                + 'van deze slanke sikkel.',
            'kst_help.sidereal.title': '🌀 Siderische tijd',
            'kst_help.sidereal.text':
                'De eigen klok van de hemel. Lokale siderische tijd vertelt '
                + 'u welke sterren nu op uw meridiaan staan — 24 siderische '
                + 'uren voor één volledige rotatie van de vaste sterren. '
                + 'Wandklokken vertellen u wat de zon doet; siderische tijd '
                + 'vertelt u wat de hemel doet.',
            'kst_help.star.title': '⭐ Zichtbare ster',
            'kst_help.star.text':
                'De meest prominente sleutelster boven de horizon bij '
                + 'zonsopgang (als er meerdere staan, toont Kairos \'+N '
                + 'meer\'). Sirius, de Pleiaden en Orion markeerden in veel '
                + 'culturen oogst en overstromingen. Als er geen staat, zegt '
                + 'Kairos dat — en hint welke ster u als volgende in de '
                + 'gaten moet houden.',
            'kst_help.season.title': '🌍 Seizoen',
            'kst_help.season.text':
                'Het tropische seizoen op basis van de zonnelengte (een '
                + 'noordelijk-halfrondkader). Het wiel verandert van kleur '
                + 'mee — lente blauw, zomer groen, herfst goud, winter grijs.',
            'season_button.Spring': '🌸 Lente',
            'season_button.Summer': '☀️ Zomer',
            'season_button.Autumn': '🍂 Herfst',
            'season_button.Winter': '❄️ Winter',
            'day.Sundial': 'Zonnewijzer', 'day.Well': 'Bron',
            'day.Root': 'Wortel', 'day.Bloom': 'Bloei',
            'day.Forge': 'Smederij', 'day.Harvest': 'Oogst',
            'day.Star': 'Ster',
            'month.Root Moon': 'Wortelmaan', 'month.Sap Moon': 'Sapmaan',
            'month.Green Moon': 'Groenmaan', 'month.Bloom Moon': 'Bloeimaan',
            'month.Grain Moon': 'Graanmaan', 'month.Light Moon': 'Lichtmaan',
            'month.Thirst Moon': 'Dorstmaan', 'month.Fruit Moon': 'Fruitmaan',
            'month.Harvest Moon': 'Oogstmaan', 'month.Wine Moon': 'Wijnmaan',
            'month.Leaf Moon': 'Bladmaan', 'month.Frost Moon': 'Rijpmaan',
            'month.Star Moon': 'Sterrenmaan',
            'year_day.Deep Day': 'Diepe Dag',
            'season.Emergence': 'Ontwaking', 'season.Radiance': 'Straling',
            'season.Release': 'Loslating', 'season.Stillness': 'Stilte',
            'season.Spring': 'Lente', 'season.Summer': 'Zomer',
            'season.Autumn': 'Herfst', 'season.Winter': 'Winter',
            'weekday.Sun': 'Zon', 'weekday.Moon': 'Maan',
            'weekday.Fire': 'Vuur', 'weekday.Water': 'Water',
            'weekday.Earth': 'Aarde', 'weekday.Air': 'Lucht',
            'weekday.Star': 'Ster',
            'moon.New Moon': 'Nieuwe maan',
            'moon.Waxing Crescent': 'Wassende maansikkel',
            'moon.First Quarter': 'Eerste kwartier',
            'moon.Waxing Gibbous': 'Wassende maan',
            'moon.Full Moon': 'Volle maan',
            'moon.Waning Gibbous': 'Afnemende maan',
            'moon.Last Quarter': 'Laatste kwartier',
            'moon.Waning Crescent': 'Afnemende maansikkel',
            'zodiac.Aries': 'Ram', 'zodiac.Taurus': 'Stier',
            'zodiac.Gemini': 'Tweelingen', 'zodiac.Cancer': 'Kreeft',
            'zodiac.Leo': 'Leeuw', 'zodiac.Virgo': 'Maagd',
            'zodiac.Libra': 'Weegschaal', 'zodiac.Scorpio': 'Schorpioen',
            'zodiac.Sagittarius': 'Boogschutter',
            'zodiac.Capricorn': 'Steenbok', 'zodiac.Aquarius': 'Waterman',
            'zodiac.Pisces': 'Vissen',
            'archetype.Creator': 'Schepper', 'archetype.Healer': 'Genezer',
            'archetype.Warrior': 'Krijger', 'archetype.Sage': 'Wijze',
            'archetype.Lover': 'Minnaar', 'archetype.Guardian': 'Beschermer',
            'archetype.Mystic': 'Mysticus', 'archetype.Destroyer': 'Vernietiger',
            'archetype.Fool': 'Dwaas', 'archetype.Magician': 'Magiër',
            'archetype.Empress': 'Keizerin', 'archetype.Emperor': 'Keizer',
            'archetype.Star': 'Ster',
            'archetype_meaning.Creator':
                'de impuls om nieuwe dingen tot leven te brengen. Ritueel: '
                + 'maak iets met uw handen.',
            'archetype_meaning.Healer':
                'de energie van herstel en zorg. Ritueel: rust, verzorg, '
                + 'luister.',
            'archetype_meaning.Warrior':
                'gefocuste wil in dienst van een zaak. Ritueel: sta ergens '
                + 'voor.',
            'archetype_meaning.Sage':
                'kennis gedeeld met geduld. Ritueel: lees, schrijf, geef '
                + 'les.',
            'archetype_meaning.Lover':
                'de banden die het leven zoet maken. Ritueel: verbind, deel, '
                + 'vier.',
            'archetype_meaning.Guardian':
                'standvastigheid in dienst van anderen. Ritueel: bescherm, '
                + 'bereid voor, verdedig.',
            'archetype_meaning.Mystic':
                'direct contact met het ongeziene. Ritueel: mediteer, droom, '
                + 'observeer.',
            'archetype_meaning.Destroyer':
                'het opruimen dat ruimte maakt. Ritueel: laat los, geef op, '
                + 'verbrand.',
            'archetype_meaning.Fool':
                'open nieuwsgierigheid zonder plan. Ritueel: speel, dwaal, '
                + 'lach.',
            'archetype_meaning.Magician':
                'wil die effectief wordt. Ritueel: transformeer, '
                + 'manifesteer, oefen.',
            'archetype_meaning.Empress':
                'overvloed en zorg. Ritueel: voed, groei, ontvang.',
            'archetype_meaning.Emperor':
                'structuur die dient. Ritueel: leid, bouw, orden.',
            'archetype_meaning.Star':
                'de belofte die de weg wijst. Ritueel: hoop, visie, gids.',
            'moon_meaning.New Moon':
                'stil, introspectief, zaaien — het donker voor het licht.',
            'moon_meaning.Waxing Crescent':
                'hoopvol, nieuwsgierig, groeiend — een belofte die vorm '
                + 'krijgt.',
            'moon_meaning.First Quarter':
                'gedreven, besluitvaardig, actief — momentum en keuze.',
            'moon_meaning.Waxing Gibbous':
                'verfijnen, gefocust, productief — het werk polijsten.',
            'moon_meaning.Full Moon':
                'stralend, expressief, expansief — de piek van het getij.',
            'moon_meaning.Waning Gibbous':
                'reflecterend, dankbaar, delend — teruggeven wat overstroomde.',
            'moon_meaning.Last Quarter':
                'loslatend, eerlijk, opruimend — snijden wat niet meer dient.',
            'moon_meaning.Waning Crescent':
                'rusten, dromen, overgeven — het zaad nestelt zich.',
            'element.Light': 'Licht', 'element.Shadow': 'Schaduw',
            'element.Stone': 'Steen', 'element.Wind': 'Wind',
            'element.Void': 'Leegte',
            'element_meaning.Light':
                'helderheid, begin, visie — wat onthuld wordt.',
            'element_meaning.Shadow':
                'stilte, diepte, rust — wat eronder wacht.',
            'element_meaning.Stone':
                'structuur, geduld, vorm — wat blijft bestaan.',
            'element_meaning.Wind':
                'beweging, verandering, stem — wat draagt.',
            'element_meaning.Void':
                'loslating, ruimte, mysterie — wat ruimte maakt.',
            'festival.Spring':
                'wedergeboorte-rituelen · zaadzegeningen · equinox-'
                + 'bijeenkomsten',
            'festival.Summer':
                'zonnewendevuren · lange-dag-feesten · de zon eren',
            'festival.Autumn':
                'oogstfeesten · herdenken van voorouders · dankfeesten',
            'festival.Winter':
                'lichtceremonies · zonnewende-waken · nieuwjaarsvuren',
            'food.Spring': 'asperges, erwten, radijsjes, spinazie, aardbeien',
            'food.Summer': 'tomaten, courgettes, bessen, maïs, paprika\'s',
            'food.Autumn': 'pompoen, appels, paddenstoelen, wortelgroenten, kool',
            'food.Winter': 'kool, aardappelen, wortels, citrus, prei',
            'planet.mercury': 'Mercurius', 'planet.venus': 'Venus',
            'planet.mars': 'Mars', 'planet.jupiter': 'Jupiter',
            'planet.saturn': 'Saturnus',
            'planet_meaning.mercury':
                'de boodschapper — geest, spraak, beweging, uitwisseling. De '
                + 'snelle energie die het ene met het andere verbindt.',
            'planet_meaning.venus':
                'de aantrekker — liefde, schoonheid, harmonie, waarde. Wat '
                + 'ons samenbrengt en het leven de moeite waard maakt.',
            'planet_meaning.mars':
                'de krijger — gedrevenheid, moed, verlangen, actie. '
                + 'Gefocuste wil, ten goede of ten kwade.',
            'planet_meaning.jupiter':
                'de uitbreider — geluk, betekenis, groei, vrijgevigheid. Het '
                + 'gevoel dat dingen zich openen.',
            'planet_meaning.saturn':
                'de poortwachter — structuur, tijd, discipline, grens. De '
                + 'langzame leraar van grenzen.',
            'star.Sirius': 'Sirius', 'star.Pleiades': 'Pleiaden',
            'star.Orion': 'Orion', 'star.Arcturus': 'Arcturus',
            'star.Vega': 'Vega',
        },

        'fy': {
            'title': 'Kairos — natuerlike tiid',
            'logo.alt': 'Kairos-logo',
            'app.tagline': 'tiid dy\'t jo waarnimme',
            'helpBtn.title': 'Wat betsjut dit?',
            'tabs.now': '🌅 No',
            'tabs.configure': '⚙️ Konfigurearje',
            'display.observing': 'Waarnimme…',
            'gregorian.prefix': '(Gregoriaansk: {date})',
            'action.capture': '📸 Momint fêstlizze',
            'action.capture.title':
                'Meitsje in foto en stamp him mei dit Kairos-momint',
            'action.share': '📤 Dit momint diele',
            'action.share.title':
                'Eksportearje dit momint as tekst of ôfbylding',
            'kst.solar_longitude': '🌞 Sinnelingte',
            'kst.lunar_age': '🌙 Moanneleeftiid',
            'kst.sidereal_time': '🌀 Sideryske tiid',
            'kst.visible_star': '⭐ Sichtbere stjer',
            'kst.celestial_season': '🌍 Himelsk seizoen',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': '🌿 Yn it seizoen',
            'seasonal.tune': '⚙️ ôfstimme',
            'seasonal.tune.title': 'Filters en bewurkje',
            'seasonal.looking_up': 'Nei de himel sjen…',
            'checksum.computing': '🔭 Presesje-offset: berekkenje…',
            'checksum.title':
                'Kairos-selssoarch — stiet it ierdtiidrek-jier noch yn '
                + 'faze mei de waarnommen maitiidsekwinoks?',
            'config.tradition': '🕰️ Jo tradysje',
            'config.tradition_hint':
                'Lês deselde waarnommen himel troch in oare kalinderlens.',
            'config.language': '🌐 Taal',
            'config.language_hint': 'Kies de taal fan dizze app.',
            'config.seasonal_filters': '🌿 Seizoenfilters en bewurkje',
            'config.seasonal_filters_hint':
                'Kies hokker items yn "Yn it seizoen" op it ljepblêd No '
                + 'ferskine.',
            'config.all_traditions': 'Alle tradysjes',
            'config.tradition_filter': 'Tradysjefilter',
            'config.auto_region': 'Automatyske regio',
            'config.region_filter': 'Regiofilter',
            'config.add_produce': '➕ Produkt tafoegje',
            'config.add_festival': '➕ Festival tafoegje',
            'config.calibrate': '🌞 Kalibrearje jo lokale sinnetiid',
            'config.calibrate_hint':
                'Druk op 🌅 Sinne-opkomst as de sinne de hoarizon reitsje en '
                + 'op 🌇 Sinne-ûndergong as er ferdwynt — of brûk in stôk: '
                + 'druk op ⚖️ Skaad = Stôk as it skaad like lang is as de '
                + 'stôk (moarns en middeis).',
            'config.sunrise': '🌅 Sinne-opkomst',
            'config.enter_times': '📝 Of fier waarnommen tiden yn',
            'config.use_times': '💾 Brûk dizze tiden',
            'config.solar_noon': '☀️ Sinne-middei (kulminaasje)',
            'config.set_noon': '💾 Sinne-middei ynstelle',
            'config.sunset': '🌇 Sinne-ûndergong',
            'config.equal_shadow': '⚖️ Skaad = Stôk',
            'config.shadow_status':
                'Druk as de sinne de hoarizon reitsje, of as jo skaad like '
                + 'lang is as de stôk.',
            'config.observe_moon': '🌙 Waarnimme de moanne',
            'config.observe_moon_hint':
                'Tik op de emoji dy\'t past by wat jo sjogge.',
            'config.observe_season': '🍂 Waarnimme it seizoen',
            'config.observe_season_hint': 'Druk op it seizoen dat kloppet.',
            'app.ready': 'Klear.',
            'footer':
                'Kairos — gjin gps, gjin ynternet, allinne jo en de himel',
            'footer.community':
                '🌍 Doch mei oan de mienskip — diel jo <b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': 'Slute',
            'help.modal_title': 'Kairos — wêr sjoch ik nei?',
            'help.foot':
                'Kairos is observaasje-rydend. Dit binne hints fan de himel — '
                + 'de himel dy\'t jo wier sjogge is altyd de autoriteit.',
            'seasonal.title': 'Item',
            'seasonal.add_own': '➕ Foegje sels ta',
            'add.kind': 'Soarte',
            'add.kind_produce': 'Produkt (iten, krûd, poddestoel, fleis)',
            'add.kind_festival': 'Festival / fiering',
            'add.name': 'Namme *',
            'add.name_placeholder': 'byg. Brânnettel',
            'add.category': 'Kategory',
            'category.fruit': 'fruit',
            'category.vegetable': 'griente',
            'category.herb': 'krûd',
            'category.fungus': 'poddestoel',
            'category.meat': 'fleis',
            'category.other': 'oar',
            'add.in_season': 'Yn it seizoen (Kairos-seizoen)',
            'kairos_season.Emergence': 'Untstean (Maaitiid)',
            'kairos_season.Radiance': 'Glâns (Simmer)',
            'kairos_season.Release': 'Loslitten (Hjerst)',
            'kairos_season.Stillness': 'Stilte (Winter)',
            'add.uses': 'Gebrûk',
            'add.uses_placeholder': 'farsk, sausen, …',
            'add.how_to_find': 'Hoe te finen',
            'add.how_to_find_placeholder': 'waakst by…',
            'add.activities': 'Aktiviteiten',
            'add.activities_placeholder': 'fjoeren, feesten',
            'add.foods': 'Iten',
            'add.foods_placeholder': 'brea, wyn',
            'add.regions': 'Regio\'s (mei komma\'s skieden)',
            'add.regions_placeholder': 'matich, bosk',
            'add.traditions': 'Tradysjes (mei komma\'s skieden)',
            'add.traditions_placeholder': 'wrâldwiid',
            'add.description': 'Beskriuwing',
            'add.emoji': 'Emoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Bewarje',
            'share.title': '📤 Dit momint diele',
            'share.alt_moment': 'Jo momint',
            'share.living_in': 'Libje yn {moment}',
            'share.copy': '📋 Kopiearje',
            'share.download': '🖼️ Ofbylding downloade',
            'share.photo': '📤 Foto diele',
            'app.status_moon_season': 'Moanne: {moon} | Seizoen: {season}',
            'app.unknown': 'ûnbekend',
            'app.optional_layer': 'opsjonele laach',
            'app.noon_observed': 'Middei: {time} (waarnommen)',
            'app.solar_noon_title':
                'Waarnommen sinne-middei — jo lokale sinnetiid.',
            'app.solar_no_noon_title':
                'Noch gjin waarnimming — nim 🌅 Sinne-opkomst + 🌇 '
                + 'Sinne-ûndergong (of ⚖️ gelikense skaad) waar om jo lokale '
                + 'sinnetiid te sjen.',
            'app.checksum_stable': 'stabyl oer {count} kontrôles',
            'app.checksum_drifting': 'DRIFTET oer {count} kontrôles',
            'app.updated': 'bywurke {time}',
            'app.selfcheck_unavailable': 'Selssoarch: net beskikber',
            'checksum.precession_offset': 'Presesje-offset',
            'share.moment_copied': '✅ Momint nei klamboerd kopiearre',
            'share.copy_manually':
                'Selektearje de tekst en kopiearje hânmjittich.',
            'share.watermark':
                'tiid dy\'t jo waarnimme · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Kairos-momintôfbylding download',
            'share.share_title': 'Myn Kairos-momint',
            'share.photo_shared': '📤 Kairos-momintfoto dield / download',
            'share.photo_error':
                '⚠️ Kin de fêstleine ôfbylding net lêze.',
            'obs.sunrise_recorded':
                '✅ Sinne-opkomst opnommen — druk op Sinne-ûndergong as de '
                + 'sinne ferdwynt.',
            'obs.need_sunrise': '⚠️ Nim earst de sinne-opkomst op.',
            'obs.shadow_first':
                '✅ Earste gelikense-skaad-momint opnommen — druk middeis '
                + 'nochris as it skaad wer like lang is.',
            'obs.noon_calculated': '✅ Sinne-middei berekkene: {time}',
            'obs.noon_calibrated':
                '✅ Sinne-middei kalibrearre fia {label} — KST bywurke.',
            'obs.method_equal_shadows': 'gelikense skaad',
            'obs.method_sunrise_sunset': 'sinne-opkomst + sinne-ûndergong',
            'obs.enter_both': '⚠️ Fier sawol de sinne-opkomst as de sinne-ûndergong yn.',
            'obs.enter_noon': '⚠️ Fier earst in sinne-middei yn.',
            'obs.enter_order': '⚠️ De sinne-ûndergong moat nei de sinne-opkomst komme.',
            'obs.method_entered_times': 'ynfierde sinne-opkomst + sinne-ûndergong',
            'obs.method_entered_noon': 'ynfierde sinne-middei',
            'obs.season_set': '✅ Seizoen ynsteld op {season}',
            'obs.moon_set': '✅ Moanne ynsteld op {emoji} — KST kalibrearre',
            'obs.tradition_switched': 'Tradysje feroare nei {tradition}',
            'kst.days': 'dagen',
            'kst.more': '+{count} mear ▾',
            'kst.hide': '− ferbergje',
            'kst.next_star': '⭐ — (folgjende: {star} oer ~{days} d)',
            'kst.none': '⭐ —',
            'seasonal.tap_details': 'Tik foar details',
            'seasonal.festivals': '🎉 Festivals',
            'seasonal.empty_hint':
                'Neat yn it seizoen foar dizze filters — waarnimme de himel, '
                + 'en foegje jo eigen kennis ta mei ➕ Produkt tafoegje / ➕ '
                + 'Festival tafoegje.',
            'seasonal.empty': 'Neat yn it seizoen foar dizze filters.',
            'seasonal.no_details': 'Noch gjin details.',
            'seasonal.name_first': '⚠️ Jou it item earst in namme.',
            'seasonal.added_server': '✅ "{name}" tafoege (server)',
            'seasonal.added_device_offline':
                '✅ "{name}" tafoege (dit apparaat — server offline)',
            'seasonal.added_device': '✅ "{name}" tafoege (dit apparaat)',
            'seasonal.this_app': '(dizze app)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Wrâldwiid',
            'seasonal.field.season': 'Seizoen',
            'seasonal.field.regions': 'Regio\'s',
            'seasonal.field.traditions': 'Tradysjes',
            'seasonal.field.description': 'Beskriuwing',
            'seasonal.field.activities': 'Aktiviteiten',
            'seasonal.field.foods': 'Iten',
            'seasonal.field.category': 'Kategory',
            'seasonal.field.seasons': 'Seizoenen',
            'seasonal.field.uses': 'Gebrûk',
            'seasonal.field.how_to_find': 'Hoe te finen',
            'phytochem.title': '🧪 Fytochemyske ynventaris',
            'phytochem.no_inventory':
                'Noch gjin fytochemyske ynventaris foar dit item.',
            'phytochem.source': '🔗 Boarne:',
            'phytochem.your_note': 'Jo oantekening foar dit item',
            'phytochem.note_placeholder':
                'byg. Dit komt oerien mei myn lokale fariant — of: ik haw '
                + 'dit oars ûnderfûn yn myn regio.',
            'phytochem.save_note': '💾 Oantekening bewarje',
            'phytochem.saved': 'Bewarre op dit apparaat.',
            'phytochem.removed': 'Oantekening fuortsmiten.',
            'energy.archetype': '🜂 Argetype',
            'energy.moon_mood': '🌙 Moannestimming',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 Yn it seizoen',
            'energy.festival': 'festival',
            'energy.food': 'iten',
            'help.what_am_i_looking_at': 'Wêr sjoch ik nei?',
            'help.planets_now':
                '🪐 De planeten no (esoteryske oantekenings)',
            'help.planet_in': 'yn {sign}',
            'help.planets_fallback':
                'Planeetposysjes komme fan de himel-engine — mei de server, '
                + 'Skyfield; offline, in kompakt browser-algoritme '
                + '(web/planets.js).',
            'help.todays_energy': '✨ De enerzjy fan hjoed',
            'help.five_elements': '🜂 De fiif eleminten',
            'help.phytochem': '🧪 De fytochemyske ynventaris',
            'help.phytochem_text':
                'Produkt-detailskermen befetsje in fytochemyske ynventaris '
                + '(lycopeen, quercetine, fitamine C, …). De wearden binne '
                + '<strong>benaderings</strong> út iepenbiere referinsjes — '
                + 'USDA FoodData Central en oaren — gjin lab-ferifiearre '
                + 'mjittingen foar jo spesifike plant. Elke ynventaris '
                + 'draacht ûnderoan de ℹ️-disklamer, in klikbere '
                + 'boarnelink en in oantekeningfjild wêryn jo fêstlizze '
                + 'kinne wat jo yn jo eigen regio waarnimme.',
            'help.community': '🌍 De mienskip',
            'help.community_text':
                'Kairos groeit troch dielen. Meitsje in foto fan jo momint, '
                + 'foegje jo Kairos-datum ta en diel it mei '
                + '<strong>#KairosTime</strong>. Foegje planten, tradysjes '
                + 'en festivals út jo regio ta — de repo is '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, en '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> lit sjen hoe.',
            'kst_help.wheel.title': '🌞 It kosmyske tsjil',
            'kst_help.wheel.text':
                'It tsjil is de baan fan de sinne troch it jier. De kleur is '
                + 'it himelske seizoen; de sinne-markearring draait nei de '
                + 'hjoeddeiske ekliptikale lingte fan de sinne — deselde '
                + 'mjitte dy\'t âlde himelwachten brûkten om it kearen fan '
                + 'it jier te markearjen.',
            'kst_help.solarLongitude.title': '🌞 Sinnelingte',
            'kst_help.solarLongitude.text':
                'De posysje fan de sinne yn graden lâns har jierlikse baan '
                + '(0–360°). 0° = maitiidsekwinoks, 90° = simmersinnekeare, '
                + '180° = hjerstekwinoks, 270° = wintersinnekeare. It is de '
                + 'âldste kalinder dy\'t der is — it adres fan de sinne '
                + 'tusken de stjerren.',
            'kst_help.lunarAge.title': '🌙 Moanneleeftiid',
            'kst_help.lunarAge.text':
                'Dagen sûnt de lêste nije moanne (de ~29,53-dagen synodyske '
                + 'moanne). 0 = nije moanne, ~7,4 = earste kertier, ~14,8 = '
                + 'folle moanne, ~22,1 = lêste kertier. Eartiids begûn de '
                + 'moanne fan elke kultuer mei it ferskinen fan dizze tinne '
                + 'skelf.',
            'kst_help.sidereal.title': '🌀 Sideryske tiid',
            'kst_help.sidereal.text':
                'De eigen klok fan de himel. Lokale sideryske tiid fertelt '
                + 'jo hokker stjerren no op jo meridiaan steane — 24 '
                + 'sideryske oeren foar ien folsleine rotaasje fan de fêste '
                + 'stjerren. Muorrelokken fertelle jo wat de sinne docht; '
                + 'sideryske tiid fertelt jo wat de himel docht.',
            'kst_help.star.title': '⭐ Sichtbere stjer',
            'kst_help.star.text':
                'De meast opfallende kaai-stjer boppe de hoarizon by '
                + 'sinne-opkomst (as der meardere steane, lit Kairos \'+N '
                + 'mear\' sjen). Sirius, de Plejaden en Orion markearren yn '
                + 'in protte kultueren rispingen en oerstreamingen. As der '
                + 'gjin stiet, seit Kairos dat — en hints hokker stjer jo as '
                + 'folgjende yn de gaten hâlde moatte.',
            'kst_help.season.title': '🌍 Seizoen',
            'kst_help.season.text':
                'It tropyske seizoen op basis fan de sinnelingte (in '
                + 'noardlik healrûn-kader). It tsjil feroaret fan kleur '
                + 'mei — maaitiid blau, simmer grien, hjerst goud, winter '
                + 'griis.',
            'season_button.Spring': '🌸 Maaitiid',
            'season_button.Summer': '☀️ Simmer',
            'season_button.Autumn': '🍂 Hjerst',
            'season_button.Winter': '❄️ Winter',
            'day.Sundial': 'Sinnewizer', 'day.Well': 'Welle',
            'day.Root': 'Woartel', 'day.Bloom': 'Bloeij',
            'day.Forge': 'Smidderij', 'day.Harvest': 'Rispinge',
            'day.Star': 'Stjer',
            'month.Root Moon': 'Woartelmoanne', 'month.Sap Moon': 'Sapmoanne',
            'month.Green Moon': 'Grienmoanne', 'month.Bloom Moon': 'Bloeimoanne',
            'month.Grain Moon': 'Nôtmoanne', 'month.Light Moon': 'Ljochtmoanne',
            'month.Thirst Moon': 'Toarstmoanne', 'month.Fruit Moon': 'Fruchtmoanne',
            'month.Harvest Moon': 'Rispingemoanne', 'month.Wine Moon': 'Wynmoanne',
            'month.Leaf Moon': 'Blêdmoanne', 'month.Frost Moon': 'Froastmoanne',
            'month.Star Moon': 'Stjerremoanne',
            'year_day.Deep Day': 'Djippe Dei',
            'season.Emergence': 'Untstean', 'season.Radiance': 'Glâns',
            'season.Release': 'Loslitten', 'season.Stillness': 'Stilte',
            'season.Spring': 'Maaitiid', 'season.Summer': 'Simmer',
            'season.Autumn': 'Hjerst', 'season.Winter': 'Winter',
            'weekday.Sun': 'Sinne', 'weekday.Moon': 'Moanne',
            'weekday.Fire': 'Fjoer', 'weekday.Water': 'Wetter',
            'weekday.Earth': 'Ierde', 'weekday.Air': 'Loft',
            'weekday.Star': 'Stjer',
            'moon.New Moon': 'Nije moanne',
            'moon.Waxing Crescent': 'Waaksende moanne',
            'moon.First Quarter': 'Earste kertier',
            'moon.Waxing Gibbous': 'Waaksende moanne',
            'moon.Full Moon': 'Folle moanne',
            'moon.Waning Gibbous': 'Neigeande moanne',
            'moon.Last Quarter': 'Lêste kertier',
            'moon.Waning Crescent': 'Neigeande moanne',
            'zodiac.Aries': 'Ram', 'zodiac.Taurus': 'Bolle',
            'zodiac.Gemini': 'Twilling', 'zodiac.Cancer': 'Kreeft',
            'zodiac.Leo': 'Liuw', 'zodiac.Virgo': 'Faam',
            'zodiac.Libra': 'Weachskaal', 'zodiac.Scorpio': 'Skorpioen',
            'zodiac.Sagittarius': 'Bôgesjitter',
            'zodiac.Capricorn': 'Stienbok', 'zodiac.Aquarius': 'Wetterman',
            'zodiac.Pisces': 'Fisk',
            'archetype.Creator': 'Skepper', 'archetype.Healer': 'Genêzer',
            'archetype.Warrior': 'Kriger', 'archetype.Sage': 'Wize',
            'archetype.Lover': 'Minner', 'archetype.Guardian': 'Hoeder',
            'archetype.Mystic': 'Mystikus', 'archetype.Destroyer': 'Ferdylger',
            'archetype.Fool': 'Dwaas', 'archetype.Magician': 'Magiër',
            'archetype.Empress': 'Keizerinne', 'archetype.Emperor': 'Keizer',
            'archetype.Star': 'Stjer',
            'archetype_meaning.Creator':
                'de oandriuw om nije dingen ta stân te bringen. Ritueel: '
                + 'meitsje wat mei jo hannen.',
            'archetype_meaning.Healer':
                'de enerzjy fan herstel en soarch. Ritueel: rêst, '
                + 'fersoargje, harkje.',
            'archetype_meaning.Warrior':
                'fokusearre wil yn tsjinst fan in saak. Ritueel: stean '
                + 'foar wat.',
            'archetype_meaning.Sage':
                'kennis dield mei geduld. Ritueel: lês, skriuw, jaan les.',
            'archetype_meaning.Lover':
                'de bannen dy\'t it libben swiet meitsje. Ritueel: ferbine, '
                + 'diele, fiere.',
            'archetype_meaning.Guardian':
                'fêstigens yn tsjinst fan oaren. Ritueel: beskermje, '
                + 'tariede, ferdigenje.',
            'archetype_meaning.Mystic':
                'direkt kontakt mei it ûnsjoene. Ritueel: meditearje, '
                + 'dreame, waarnimme.',
            'archetype_meaning.Destroyer':
                'it opromjen dat romte makket. Ritueel: loslitte, opjaan, '
                + 'ferbaarne.',
            'archetype_meaning.Fool':
                'iepen nijsgjirrigens sûnder plan. Ritueel: boartsje, '
                + 'dwale, laitsje.',
            'archetype_meaning.Magician':
                'wil dy\'t effektyf wurdt. Ritueel: transformearje, '
                + 'manifestearje, oefenje.',
            'archetype_meaning.Empress':
                'oerfloed en soarch. Ritueel: fiede, groeie, ûntfange.',
            'archetype_meaning.Emperor':
                'struktuer dy\'t tsjinnet. Ritueel: liede, bouwe, oarderje.',
            'archetype_meaning.Star':
                'de belofte dy\'t de wei wiist. Ritueel: hope, fyzje, gids.',
            'moon_meaning.New Moon':
                'stil, yntrospektyf, siedzjen — it tsjuster foar it ljocht.',
            'moon_meaning.Waxing Crescent':
                'hoopfol, nijsgjirrich, groeiend — in belofte dy\'t foarm '
                + 'krijt.',
            'moon_meaning.First Quarter':
                'oandreaun, beslissend, aktyf — momentum en kar.',
            'moon_meaning.Waxing Gibbous':
                'ferfine, fokusearre, produktyf — it wurk poetsje.',
            'moon_meaning.Full Moon':
                'ljochtend, ekspresyf, útwreidzjend — de pyk fan it tij.',
            'moon_meaning.Waning Gibbous':
                'refleksyf, tankber, dielend — weromjaan wat oerspûde.',
            'moon_meaning.Last Quarter':
                'loslittend, earlik, opromjend — snije wat net mear tsjinnet.',
            'moon_meaning.Waning Crescent':
                'rêst, dreame, oerjaan — it sied nêstelt him.',
            'element.Light': 'Ljocht', 'element.Shadow': 'Skaad',
            'element.Stone': 'Stien', 'element.Wind': 'Wyn',
            'element.Void': 'Leechte',
            'element_meaning.Light':
                'helderens, begjin, fyzje — wat ûntbleate wurdt.',
            'element_meaning.Shadow':
                'stilte, djipte, rêst — wat derûnder wachtet.',
            'element_meaning.Stone':
                'struktuer, geduld, foarm — wat bestean bliuwt.',
            'element_meaning.Wind':
                'beweging, feroaring, stim — wat draacht.',
            'element_meaning.Void':
                'loslitten, romte, mystearje — wat romte makket.',
            'festival.Spring':
                'werberte-rituelen · sied-segeningen · ekwinoks-gearkomsten',
            'festival.Summer':
                'sinnekearfjoeren · lange-dei-feesten · de sinne earje',
            'festival.Autumn':
                'rispingefeesten · foarâldenbetinking · tankfeesten',
            'festival.Winter':
                'ljochtseremoanjes · sinnekear-waken · nijjiersfjoeren',
            'food.Spring': 'asperzjes, earten, radyskes, spinaazje, ierdbeien',
            'food.Summer': 'tomaten, koertsjes, beien, mais, paprikas',
            'food.Autumn': 'pompoen, apels, poddestuollen, woartelgriente, koal',
            'food.Winter': 'koal, ierappels, woartels, sitrus, prei',
            'planet.mercury': 'Mercurius', 'planet.venus': 'Venus',
            'planet.mars': 'Mars', 'planet.jupiter': 'Jupiter',
            'planet.saturn': 'Saturnus',
            'planet_meaning.mercury':
                'de boadskipper — geast, spraak, beweging, útwikseling. De '
                + 'snelle enerzjy dy\'t it iene mei it oare ferbynt.',
            'planet_meaning.venus':
                'de lûker — leafde, skientme, harmony, wearde. Wat ús '
                + 'byinoar bringt en it libben de muoite wurdich makket.',
            'planet_meaning.mars':
                'de kriger — driuw, moed, winsk, aksje. Fokusearre wil, ta '
                + 'goed of ta kwea.',
            'planet_meaning.jupiter':
                'de útwreider — gelok, betsjutting, groei, romhertigens. It '
                + 'gefoel dat dingen har iepenje.',
            'planet_meaning.saturn':
                'de poartewachter — struktuer, tiid, dissipline, grins. De '
                + 'stadige learaar fan grinzen.',
            'star.Sirius': 'Sirius', 'star.Pleiades': 'Plejaden',
            'star.Orion': 'Orion', 'star.Arcturus': 'Arcturus',
            'star.Vega': 'Vega',
        },

        'de': {
            'title': 'Kairos — Natürliche Zeit',
            'logo.alt': 'Kairos-Logo',
            'app.tagline': 'Zeit, die du beobachtest',
            'helpBtn.title': 'Was bedeutet das?',
            'tabs.now': '🌅 Jetzt',
            'tabs.configure': '⚙️ Einstellungen',
            'display.observing': 'Beobachten…',
            'gregorian.prefix': '(Gregorianisch: {date})',
            'action.capture': '📸 Moment festhalten',
            'action.capture.title':
                'Ein Foto aufnehmen und mit diesem Kairos-Moment stempeln',
            'action.share': '📤 Diesen Moment teilen',
            'action.share.title':
                'Diesen Moment als Text oder Bild exportieren',
            'kst.solar_longitude': '🌞 Sonnenlänge',
            'kst.lunar_age': '🌙 Mondalter',
            'kst.sidereal_time': '🌀 Sternzeit',
            'kst.visible_star': '⭐ Sichtbarer Stern',
            'kst.celestial_season': '🌍 Himmlische Jahreszeit',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': '🌿 In der Saison',
            'seasonal.tune': '⚙️ filtern',
            'seasonal.tune.title': 'Filter und Bearbeiten',
            'seasonal.looking_up': 'Zum Himmel schauen…',
            'checksum.computing': '🔭 Präzessionsversatz: wird berechnet…',
            'checksum.title':
                'Kairos-Selbstprüfung — ist das Erdzeitalter-Jahr noch in '
                + 'Phase mit der beobachteten Frühlings-Tagundnachtgleiche?',
            'config.tradition': '🕰️ Ihre Tradition',
            'config.tradition_hint':
                'Denselben beobachteten Himmel durch eine andere '
                + 'Kalenderlinse lesen.',
            'config.language': '🌐 Sprache',
            'config.language_hint': 'Wählen Sie die Sprache dieser App.',
            'config.seasonal_filters': '🌿 Saisonfilter und Bearbeiten',
            'config.seasonal_filters_hint':
                'Wählen Sie, welche Einträge auf dem Tab "Jetzt" unter '
                + '"In der Saison" erscheinen.',
            'config.all_traditions': 'Alle Traditionen',
            'config.tradition_filter': 'Traditionsfilter',
            'config.auto_region': 'Automatische Region',
            'config.region_filter': 'Regionenfilter',
            'config.add_produce': '➕ Produkt hinzufügen',
            'config.add_festival': '➕ Festival hinzufügen',
            'config.calibrate': '🌞 Lokale Sonnenzeit kalibrieren',
            'config.calibrate_hint':
                'Drücken Sie 🌅 Sonnenaufgang, wenn die Sonne den Horizont '
                + 'berührt, und 🌇 Sonnenuntergang, wenn sie verschwindet — '
                + 'oder nutzen Sie einen Stock: Drücken Sie ⚖️ Schatten = '
                + 'Stock, wenn der Schatten so lang ist wie der Stock '
                + '(morgens und nachmittags).',
            'config.sunrise': '🌅 Sonnenaufgang',
            'config.enter_times': '📝 Oder beobachtete Zeiten eingeben',
            'config.use_times': '💾 Diese Zeiten verwenden',
            'config.solar_noon': '☀️ Sonnenmittag (Kulmination)',
            'config.set_noon': '💾 Sonnenmittag festlegen',
            'config.sunset': '🌇 Sonnenuntergang',
            'config.equal_shadow': '⚖️ Schatten = Stock',
            'config.shadow_status':
                'Drücken Sie, wenn die Sonne den Horizont berührt oder Ihr '
                + 'Schatten so lang ist wie der Stock.',
            'config.observe_moon': '🌙 Den Mond beobachten',
            'config.observe_moon_hint':
                'Tippen Sie auf das Emoji, das dem entspricht, was Sie sehen.',
            'config.observe_season': '🍂 Die Jahreszeit beobachten',
            'config.observe_season_hint':
                'Drücken Sie die Jahreszeit, die sich richtig anfühlt.',
            'app.ready': 'Bereit.',
            'footer':
                'Kairos — kein GPS, kein Internet, nur du und der Himmel',
            'footer.community':
                '🌍 Werden Sie Teil der Gemeinschaft — teilen Sie Ihre '
                + '<b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': 'Schließen',
            'help.modal_title': 'Kairos — worauf schaue ich?',
            'help.foot':
                'Kairos ist beobachtungs-orientiert. Das sind Hinweise vom '
                + 'Himmel — der Himmel, den Sie wirklich sehen, ist immer '
                + 'die Autorität.',
            'seasonal.title': 'Eintrag',
            'seasonal.add_own': '➕ Eigenen Eintrag hinzufügen',
            'add.kind': 'Art',
            'add.kind_produce': 'Produkt (Lebensmittel, Kraut, Pilz, Fleisch)',
            'add.kind_festival': 'Festival / Feier',
            'add.name': 'Name *',
            'add.name_placeholder': 'z. B. Brennnessel',
            'add.category': 'Kategorie',
            'category.fruit': 'Obst',
            'category.vegetable': 'Gemüse',
            'category.herb': 'Kraut',
            'category.fungus': 'Pilz',
            'category.meat': 'Fleisch',
            'category.other': 'Sonstiges',
            'add.in_season': 'In der Saison (Kairos-Jahreszeit)',
            'kairos_season.Emergence': 'Erwachen (Frühling)',
            'kairos_season.Radiance': 'Strahlkraft (Sommer)',
            'kairos_season.Release': 'Loslassen (Herbst)',
            'kairos_season.Stillness': 'Stille (Winter)',
            'add.uses': 'Verwendung',
            'add.uses_placeholder': 'frisch, Saucen, …',
            'add.how_to_find': 'So zu finden',
            'add.how_to_find_placeholder': 'wächst in der Nähe von…',
            'add.activities': 'Aktivitäten',
            'add.activities_placeholder': 'Lagerfeuer, Feiern',
            'add.foods': 'Speisen',
            'add.foods_placeholder': 'Brot, Wein',
            'add.regions': 'Regionen (durch Kommas getrennt)',
            'add.regions_placeholder': 'gemäßigt, Wald',
            'add.traditions': 'Traditionen (durch Kommas getrennt)',
            'add.traditions_placeholder': 'global',
            'add.description': 'Beschreibung',
            'add.emoji': 'Emoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Speichern',
            'share.title': '📤 Diesen Moment teilen',
            'share.alt_moment': 'Ihr Moment',
            'share.living_in': 'Leben in {moment}',
            'share.copy': '📋 Kopieren',
            'share.download': '🖼️ Bild herunterladen',
            'share.photo': '📤 Foto teilen',
            'app.status_moon_season': 'Mond: {moon} | Jahreszeit: {season}',
            'app.unknown': 'unbekannt',
            'app.optional_layer': 'optionale Ebene',
            'app.noon_observed': 'Mittag: {time} (beobachtet)',
            'app.solar_noon_title':
                'Beobachteter Sonnenmittag — Ihre lokale Sonnenzeit.',
            'app.solar_no_noon_title':
                'Noch keine Beobachtung — nehmen Sie 🌅 Sonnenaufgang + 🌇 '
                + 'Sonnenuntergang (oder ⚖️ gleiche Schatten) wahr, um Ihre '
                + 'lokale Sonnenzeit zu sehen.',
            'app.checksum_stable': 'stabil über {count} Prüfungen',
            'app.checksum_drifting': 'DRIFTET über {count} Prüfungen',
            'app.updated': 'aktualisiert {time}',
            'app.selfcheck_unavailable': 'Selbstprüfung: nicht verfügbar',
            'checksum.precession_offset': 'Präzessionsversatz',
            'share.moment_copied': '✅ Moment in die Zwischenablage kopiert',
            'share.copy_manually': 'Text markieren und manuell kopieren.',
            'share.watermark':
                'Zeit, die du beobachtest · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Kairos-Momentbild heruntergeladen',
            'share.share_title': 'Mein Kairos-Moment',
            'share.photo_shared':
                '📤 Kairos-Momentfoto geteilt / heruntergeladen',
            'share.photo_error':
                '⚠️ Das aufgenommene Bild konnte nicht gelesen werden.',
            'obs.sunrise_recorded':
                '✅ Sonnenaufgang aufgezeichnet — drücken Sie bei '
                + 'Sonnenuntergang, wenn die Sonne verschwindet.',
            'obs.need_sunrise': '⚠️ Bitte zuerst den Sonnenaufgang aufzeichnen.',
            'obs.shadow_first':
                '✅ Erster Gleichschatten-Moment aufgezeichnet — drücken Sie '
                + 'nachmittags erneut, wenn der Schatten wieder gleich lang '
                + 'ist.',
            'obs.noon_calculated': '✅ Sonnenmittag berechnet: {time}',
            'obs.noon_calibrated':
                '✅ Sonnenmittag über {label} kalibriert — KST aktualisiert.',
            'obs.method_equal_shadows': 'gleiche Schatten',
            'obs.method_sunrise_sunset': 'Sonnenaufgang + Sonnenuntergang',
            'obs.enter_both': '⚠️ Bitte Sonnenaufgang und Sonnenuntergang eingeben.',
            'obs.enter_noon': '⚠️ Bitte zuerst einen Sonnenmittag eingeben.',
            'obs.enter_order': '⚠️ Der Sonnenuntergang muss nach dem Sonnenaufgang liegen.',
            'obs.method_entered_times': 'eingegebener Sonnenaufgang + Sonnenuntergang',
            'obs.method_entered_noon': 'eingegebener Sonnenmittag',
            'obs.season_set': '✅ Jahreszeit auf {season} gesetzt',
            'obs.moon_set': '✅ Mond gesetzt auf {emoji} — KST kalibriert',
            'obs.tradition_switched': 'Tradition gewechselt zu {tradition}',
            'kst.days': 'Tage',
            'kst.more': '+{count} mehr ▾',
            'kst.hide': '− ausblenden',
            'kst.next_star': '⭐ — (als Nächstes: {star} in ~{days} T)',
            'kst.none': '⭐ —',
            'seasonal.tap_details': 'Zum Anzeigen tippen',
            'seasonal.festivals': '🎉 Festivals',
            'seasonal.empty_hint':
                'Nichts in der Saison für diese Filter — beobachten Sie den '
                + 'Himmel und fügen Sie Ihr eigenes Wissen hinzu: ➕ Produkt '
                + 'hinzufügen / ➕ Festival hinzufügen.',
            'seasonal.empty': 'Nichts in der Saison für diese Filter.',
            'seasonal.no_details': 'Noch keine Details.',
            'seasonal.name_first': '⚠️ Geben Sie dem Eintrag zuerst einen Namen.',
            'seasonal.added_server': '✅ "{name}" hinzugefügt (Server)',
            'seasonal.added_device_offline':
                '✅ "{name}" hinzugefügt (dieses Gerät — Server offline)',
            'seasonal.added_device': '✅ "{name}" hinzugefügt (dieses Gerät)',
            'seasonal.this_app': '(diese App)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Global',
            'seasonal.field.season': 'Jahreszeit',
            'seasonal.field.regions': 'Regionen',
            'seasonal.field.traditions': 'Traditionen',
            'seasonal.field.description': 'Beschreibung',
            'seasonal.field.activities': 'Aktivitäten',
            'seasonal.field.foods': 'Speisen',
            'seasonal.field.category': 'Kategorie',
            'seasonal.field.seasons': 'Jahreszeiten',
            'seasonal.field.uses': 'Verwendung',
            'seasonal.field.how_to_find': 'So zu finden',
            'phytochem.title': '🧪 Phytochemische Bestandsaufnahme',
            'phytochem.no_inventory':
                'Noch keine phytochemische Bestandsaufnahme für diesen Eintrag.',
            'phytochem.source': '🔗 Quelle:',
            'phytochem.your_note': 'Ihre Notiz für diesen Eintrag',
            'phytochem.note_placeholder':
                'z. B. Das entspricht meiner lokalen Sorte — oder: Ich habe '
                + 'es in meiner Region anders beobachtet.',
            'phytochem.save_note': '💾 Notiz speichern',
            'phytochem.saved': 'Auf diesem Gerät gespeichert.',
            'phytochem.removed': 'Notiz entfernt.',
            'energy.archetype': '🜂 Archetyp',
            'energy.moon_mood': '🌙 Mondstimmung',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 In der Saison',
            'energy.festival': 'Festival',
            'energy.food': 'Nahrung',
            'help.what_am_i_looking_at': 'Worauf schaue ich?',
            'help.planets_now': '🪐 Die Planeten jetzt (esoterische Hinweise)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Die Planetenpositionen stammen von der Himmels-Engine — mit '
                + 'dem Server von Skyfield; offline von einem kompakten '
                + 'Browser-Algorithmus (web/planets.js).',
            'help.todays_energy': '✨ Die Energie von heute',
            'help.five_elements': '🜂 Die fünf Elemente',
            'help.phytochem': '🧪 Die phytochemische Bestandsaufnahme',
            'help.phytochem_text':
                'Detailansichten von Produkten enthalten eine '
                + 'phytochemische Bestandsaufnahme (Lycopin, Quercetin, '
                + 'Vitamin C, …). Die Werte sind <strong>Näherungswerte</'
                + 'strong> aus öffentlichen Quellen — USDA FoodData Central '
                + 'und andere — keine laborgeprüften Messwerte für Ihre '
                + 'spezifische Pflanze. Jede Bestandsaufnahme enthält unten '
                + 'den ℹ️-Hinweis, einen klickbaren Quellenlink und ein '
                + 'Notizfeld, in dem Sie festhalten können, was Sie in Ihrer '
                + 'Region beobachten.',
            'help.community': '🌍 Die Gemeinschaft',
            'help.community_text':
                'Kairos wächst durch Teilen. Machen Sie ein Foto Ihres '
                + 'Moments, fügen Sie Ihr Kairos-Datum hinzu und teilen Sie '
                + 'es mit <strong>#KairosTime</strong>. Fügen Sie Pflanzen, '
                + 'Traditionen und Festivals aus Ihrer Region hinzu — das '
                + 'Repository ist <a href="https://github.com/jbstoker/'
                + 'kairos" target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, und '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> zeigt, wie es geht.',
            'kst_help.wheel.title': '🌞 Das kosmische Rad',
            'kst_help.wheel.text':
                'Das Rad ist der Weg der Sonne durch das Jahr. Seine Farbe '
                + 'ist die himmlische Jahreszeit; die Sonnenmarkierung dreht '
                + 'sich auf die aktuelle ekliptikale Länge der Sonne — '
                + 'dasselbe Maß, mit dem antike Himmelsbeobachter das '
                + 'Wenden des Jahres markierten.',
            'kst_help.solarLongitude.title': '🌞 Sonnenlänge',
            'kst_help.solarLongitude.text':
                'Die Position der Sonne in Grad auf ihrer jährlichen Bahn '
                + '(0–360°). 0° = Frühlings-Tagundnachtgleiche, 90° = '
                + 'Sommersonnenwende, 180° = Herbst-Tagundnachtgleiche, '
                + '270° = Wintersonnenwende. Es ist der älteste Kalender '
                + 'überhaupt — die Adresse der Sonne unter den Sternen.',
            'kst_help.lunarAge.title': '🌙 Mondalter',
            'kst_help.lunarAge.text':
                'Tage seit dem letzten Neumond (der ~29,53-tägige synodische '
                + 'Monat). 0 = Neumond, ~7,4 = erstes Viertel, ~14,8 = '
                + 'Vollmond, ~22,1 = letztes Viertel. Einst begann der Monat '
                + 'jeder Kultur mit dem Wiedererscheinen dieser zarten '
                + 'Sichel.',
            'kst_help.sidereal.title': '🌀 Sternzeit',
            'kst_help.sidereal.text':
                'Die eigene Uhr des Himmels. Die lokale Sternzeit sagt '
                + 'Ihnen, welche Sterne gerade auf Ihrem Meridian stehen — '
                + '24 Sternstunden für eine volle Drehung der Fixsterne. '
                + 'Wanduhren sagen Ihnen, was die Sonne tut; die Sternzeit '
                + 'sagt Ihnen, was der Himmel tut.',
            'kst_help.star.title': '⭐ Sichtbarer Stern',
            'kst_help.star.text':
                'Der auffälligste Schlüsselstern über dem Horizont bei '
                + 'Tagesanbruch (wenn mehrere stehen, zeigt Kairos \'+N '
                + 'mehr\'). Sirius, die Plejaden und Orion markierten in '
                + 'vielen Kulturen Ernten und Fluten. Wenn keiner steht, '
                + 'sagt Kairos das — und deutet an, welchen Stern Sie als '
                + 'Nächstes beobachten sollten.',
            'kst_help.season.title': '🌍 Jahreszeit',
            'kst_help.season.text':
                'Die tropische Jahreszeit aus der Sonnenlänge (ein '
                + 'Nordhalbkugel-Bezug). Das Rad wechselt mit ihr die Farbe '
                + '— Frühling blau, Sommer grün, Herbst gold, Winter grau.',
            'season_button.Spring': '🌸 Frühling',
            'season_button.Summer': '☀️ Sommer',
            'season_button.Autumn': '🍂 Herbst',
            'season_button.Winter': '❄️ Winter',
            'day.Sundial': 'Sonnenuhr', 'day.Well': 'Brunnen',
            'day.Root': 'Wurzel', 'day.Bloom': 'Blüte',
            'day.Forge': 'Schmiede', 'day.Harvest': 'Ernte',
            'day.Star': 'Stern',
            'month.Root Moon': 'Wurzelmond', 'month.Sap Moon': 'Saftmond',
            'month.Green Moon': 'Grünmond', 'month.Bloom Moon': 'Blühmond',
            'month.Grain Moon': 'Kornmond', 'month.Light Moon': 'Lichtmond',
            'month.Thirst Moon': 'Durstmond', 'month.Fruit Moon': 'Fruchtmond',
            'month.Harvest Moon': 'Erntemond', 'month.Wine Moon': 'Weinmond',
            'month.Leaf Moon': 'Blattmond', 'month.Frost Moon': 'Frostmond',
            'month.Star Moon': 'Sternenmond',
            'year_day.Deep Day': 'Tiefer Tag',
            'season.Emergence': 'Erwachen', 'season.Radiance': 'Strahlkraft',
            'season.Release': 'Loslassen', 'season.Stillness': 'Stille',
            'season.Spring': 'Frühling', 'season.Summer': 'Sommer',
            'season.Autumn': 'Herbst', 'season.Winter': 'Winter',
            'weekday.Sun': 'Sonne', 'weekday.Moon': 'Mond',
            'weekday.Fire': 'Feuer', 'weekday.Water': 'Wasser',
            'weekday.Earth': 'Erde', 'weekday.Air': 'Luft',
            'weekday.Star': 'Stern',
            'moon.New Moon': 'Neumond',
            'moon.Waxing Crescent': 'Zunehmende Sichel',
            'moon.First Quarter': 'Erstes Viertel',
            'moon.Waxing Gibbous': 'Zunehmender Mond',
            'moon.Full Moon': 'Vollmond',
            'moon.Waning Gibbous': 'Abnehmender Mond',
            'moon.Last Quarter': 'Letztes Viertel',
            'moon.Waning Crescent': 'Abnehmende Sichel',
            'zodiac.Aries': 'Widder', 'zodiac.Taurus': 'Stier',
            'zodiac.Gemini': 'Zwillinge', 'zodiac.Cancer': 'Krebs',
            'zodiac.Leo': 'Löwe', 'zodiac.Virgo': 'Jungfrau',
            'zodiac.Libra': 'Waage', 'zodiac.Scorpio': 'Skorpion',
            'zodiac.Sagittarius': 'Schütze',
            'zodiac.Capricorn': 'Steinbock', 'zodiac.Aquarius': 'Wassermann',
            'zodiac.Pisces': 'Fische',
            'archetype.Creator': 'Schöpfer', 'archetype.Healer': 'Heiler',
            'archetype.Warrior': 'Krieger', 'archetype.Sage': 'Weiser',
            'archetype.Lover': 'Liebender', 'archetype.Guardian': 'Beschützer',
            'archetype.Mystic': 'Mystiker', 'archetype.Destroyer': 'Zerstörer',
            'archetype.Fool': 'Narr', 'archetype.Magician': 'Magier',
            'archetype.Empress': 'Kaiserin', 'archetype.Emperor': 'Kaiser',
            'archetype.Star': 'Stern',
            'archetype_meaning.Creator':
                'der Impuls, Neues ins Leben zu bringen. Ritual: etwas mit '
                + 'den Händen schaffen.',
            'archetype_meaning.Healer':
                'die Energie von Reparatur und Fürsorge. Ritual: ruhen, '
                + 'pflegen, zuhören.',
            'archetype_meaning.Warrior':
                'fokussierter Wille im Dienst einer Sache. Ritual: für '
                + 'etwas einstehen.',
            'archetype_meaning.Sage':
                'Wissen, geduldig geteilt. Ritual: lesen, schreiben, lehren.',
            'archetype_meaning.Lover':
                'die Bande, die das Leben versüßen. Ritual: verbinden, '
                + 'teilen, feiern.',
            'archetype_meaning.Guardian':
                'Beständigkeit im Dienst anderer. Ritual: schützen, '
                + 'vorbereiten, verteidigen.',
            'archetype_meaning.Mystic':
                'direkter Kontakt mit dem Unsichtbaren. Ritual: meditieren, '
                + 'träumen, beobachten.',
            'archetype_meaning.Destroyer':
                'das Aufräumen, das Platz schafft. Ritual: loslassen, '
                + 'aufgeben, verbrennen.',
            'archetype_meaning.Fool':
                'offene Neugier ohne Plan. Ritual: spielen, wandern, lachen.',
            'archetype_meaning.Magician':
                'Wille, der wirksam wird. Ritual: transformieren, '
                + 'manifestieren, üben.',
            'archetype_meaning.Empress':
                'Fülle und Fürsorge. Ritual: nähren, wachsen, empfangen.',
            'archetype_meaning.Emperor':
                'Struktur, die dient. Ritual: führen, bauen, ordnen.',
            'archetype_meaning.Star':
                'das Versprechen, das den Weg weist. Ritual: hoffen, '
                + 'visionieren, leiten.',
            'moon_meaning.New Moon':
                'still, introspektiv, säend — das Dunkel vor dem Licht.',
            'moon_meaning.Waxing Crescent':
                'hoffnungsvoll, neugierig, wachsend — ein Versprechen nimmt '
                + 'Gestalt an.',
            'moon_meaning.First Quarter':
                'angetrieben, entschlossen, aktiv — Schwung und Wahl.',
            'moon_meaning.Waxing Gibbous':
                'verfeinernd, fokussiert, produktiv — die Arbeit polieren.',
            'moon_meaning.Full Moon':
                'leuchtend, ausdrucksstark, expansiv — der Höhepunkt der '
                + 'Flut.',
            'moon_meaning.Waning Gibbous':
                'reflektierend, dankbar, teilend — zurückgeben, was überlief.',
            'moon_meaning.Last Quarter':
                'loslassend, ehrlich, klärend — abschneiden, was nicht mehr '
                + 'dient.',
            'moon_meaning.Waning Crescent':
                'ruhen, träumen, sich hingeben — der Same legt sich.',
            'element.Light': 'Licht', 'element.Shadow': 'Schatten',
            'element.Stone': 'Stein', 'element.Wind': 'Wind',
            'element.Void': 'Leere',
            'element_meaning.Light':
                'Klarheit, Anfänge, Vision — was offenbart wird.',
            'element_meaning.Shadow':
                'Stille, Tiefe, Ruhe — was darunter wartet.',
            'element_meaning.Stone':
                'Struktur, Geduld, Form — was Bestand hat.',
            'element_meaning.Wind':
                'Bewegung, Wandel, Stimme — was trägt.',
            'element_meaning.Void':
                'Loslassen, Raum, Mysterium — was Raum schafft.',
            'festival.Spring':
                'Wiedergeburt-Rituale · Saat-Segnungen · '
                + 'Tagundnachtgleiche-Treffen',
            'festival.Summer':
                'Sonnenwendfeuer · Langtag-Feste · die Sonne ehren',
            'festival.Autumn':
                'Erntefeste · Gedenken der Ahnen · Dankfeste',
            'festival.Winter':
                'Lichtzeremonien · Sonnenwendwachen · Neujahrsfeuer',
            'food.Spring': 'Spargel, Erbsen, Radieschen, Spinat, Erdbeeren',
            'food.Summer': 'Tomaten, Zucchini, Beeren, Mais, Paprika',
            'food.Autumn': 'Zucchini, Äpfel, Pilze, Wurzelgemüse, Kürbis',
            'food.Winter': 'Kohl, Kartoffeln, Karotten, Zitrusfrüchte, Lauch',
            'planet.mercury': 'Merkur', 'planet.venus': 'Venus',
            'planet.mars': 'Mars', 'planet.jupiter': 'Jupiter',
            'planet.saturn': 'Saturn',
            'planet_meaning.mercury':
                'der Bote — Geist, Sprache, Bewegung, Austausch. Die schnelle '
                + 'Energie, die eines mit dem anderen verbindet.',
            'planet_meaning.venus':
                'die Anziehende — Liebe, Schönheit, Harmonie, Wert. Was uns '
                + 'zusammenführt und das Leben lebenswert macht.',
            'planet_meaning.mars':
                'der Krieger — Antrieb, Mut, Verlangen, Tat. Fokussierter '
                + 'Wille, zum Guten oder Schlechten.',
            'planet_meaning.jupiter':
                'der Erweiterer — Glück, Sinn, Wachstum, Großzügigkeit. Das '
                + 'Gefühl, dass sich Dinge öffnen.',
            'planet_meaning.saturn':
                'der Torwächter — Struktur, Zeit, Disziplin, Grenze. Der '
                + 'langsame Lehrer der Grenzen.',
            'star.Sirius': 'Sirius', 'star.Pleiades': 'Plejaden',
            'star.Orion': 'Orion', 'star.Arcturus': 'Arkturus',
            'star.Vega': 'Wega',
        },

        'fr': {
            'title': 'Kairos — Temps naturel',
            'logo.alt': 'Logo Kairos',
            'app.tagline': 'le temps que vous observez',
            'helpBtn.title': 'Qu\'est-ce que cela signifie ?',
            'tabs.now': '🌅 Maintenant',
            'tabs.configure': '⚙️ Configurer',
            'display.observing': 'Observation…',
            'gregorian.prefix': '(Grégorien : {date})',
            'action.capture': '📸 Capturer le moment',
            'action.capture.title':
                'Prendre une photo et la tamponner de ce moment Kairos',
            'action.share': '📤 Partager ce moment',
            'action.share.title':
                'Exporter ce moment en texte ou en image',
            'kst.solar_longitude': '🌞 Longitude solaire',
            'kst.lunar_age': '🌙 Âge lunaire',
            'kst.sidereal_time': '🌀 Temps sidéral',
            'kst.visible_star': '⭐ Étoile visible',
            'kst.celestial_season': '🌍 Saison céleste',
            'kst.planets': '🪐 Planètes',
            'seasonal.in_season': '🌿 De saison',
            'seasonal.tune': '⚙️ ajuster',
            'seasonal.tune.title': 'Filtres et édition',
            'seasonal.looking_up': 'Observation du ciel…',
            'checksum.computing': '🔭 Décalage de précession : calcul…',
            'checksum.title':
                'Auto-vérification Kairos — l\'année d\'âge de la Terre '
                + 'est-elle toujours en phase avec l\'équinoxe de printemps '
                + 'observé ?',
            'config.tradition': '🕰️ Votre tradition',
            'config.tradition_hint':
                'Lire le même ciel observé à travers une autre lentille '
                + 'calendaire.',
            'config.language': '🌐 Langue',
            'config.language_hint': 'Choisissez la langue de cette application.',
            'config.seasonal_filters': '🌿 Filtres saisonniers et édition',
            'config.seasonal_filters_hint':
                'Choisissez les éléments qui apparaissent dans « De saison » '
                + 'sur l\'onglet Maintenant.',
            'config.all_traditions': 'Toutes les traditions',
            'config.tradition_filter': 'Filtre de tradition',
            'config.auto_region': 'Région automatique',
            'config.region_filter': 'Filtre de région',
            'config.add_produce': '➕ Ajouter un produit',
            'config.add_festival': '➕ Ajouter un festival',
            'config.calibrate': '🌞 Calibrer votre heure solaire locale',
            'config.calibrate_hint':
                'Appuyez sur 🌅 Lever du soleil quand le soleil touche '
                + 'l\'horizon et sur 🌇 Coucher du soleil quand il '
                + 'disparaît — ou utilisez un bâton : appuyez sur ⚖️ Ombre '
                + '= Bâton quand l\'ombre égale le bâton (matin et '
                + 'après-midi).',
            'config.sunrise': '🌅 Lever du soleil',
            'config.enter_times': '📝 Ou saisissez les heures observées',
            'config.use_times': '💾 Utiliser ces heures',
            'config.solar_noon': '☀️ Midi solaire (culmination)',
            'config.set_noon': '💾 Définir le midi solaire',
            'config.sunset': '🌇 Coucher du soleil',
            'config.equal_shadow': '⚖️ Ombre = Bâton',
            'config.shadow_status':
                'Appuyez quand le soleil touche l\'horizon, ou quand votre '
                + 'ombre égale le bâton.',
            'config.observe_moon': '🌙 Observer la lune',
            'config.observe_moon_hint':
                'Touchez l\'émoji qui correspond à ce que vous voyez.',
            'config.observe_season': '🍂 Observer la saison',
            'config.observe_season_hint':
                'Appuyez sur la saison qui vous semble juste.',
            'app.ready': 'Prêt.',
            'footer':
                'Kairos — pas de GPS, pas d\'internet, juste vous et le ciel',
            'footer.community':
                '🌍 Rejoignez la communauté — partagez votre '
                + '<b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': 'Fermer',
            'help.modal_title': 'Kairos — qu\'est-ce que je regarde ?',
            'help.foot':
                'Kairos est avant tout observation. Ce sont des indices '
                + 'venus du ciel — le ciel que vous voyez réellement est '
                + 'toujours l\'autorité.',
            'seasonal.title': 'Élément',
            'seasonal.add_own': '➕ Ajouter le vôtre',
            'add.kind': 'Type',
            'add.kind_produce': 'Produit (aliment, herbe, champignon, viande)',
            'add.kind_festival': 'Festival / célébration',
            'add.name': 'Nom *',
            'add.name_placeholder': 'p. ex. Ortie',
            'add.category': 'Catégorie',
            'category.fruit': 'fruit',
            'category.vegetable': 'légume',
            'category.herb': 'herbe',
            'category.fungus': 'champignon',
            'category.meat': 'viande',
            'category.other': 'autre',
            'add.in_season': 'De saison (saison Kairos)',
            'kairos_season.Emergence': 'Émergence (Printemps)',
            'kairos_season.Radiance': 'Rayonnement (Été)',
            'kairos_season.Release': 'Délivrance (Automne)',
            'kairos_season.Stillness': 'Immobilité (Hiver)',
            'add.uses': 'Usages',
            'add.uses_placeholder': 'frais, sauces, …',
            'add.how_to_find': 'Où le trouver',
            'add.how_to_find_placeholder': 'pousse près de…',
            'add.activities': 'Activités',
            'add.activities_placeholder': 'feux, festins',
            'add.foods': 'Aliments',
            'add.foods_placeholder': 'pain, vin',
            'add.regions': 'Régions (séparées par des virgules)',
            'add.regions_placeholder': 'tempéré, forêt',
            'add.traditions': 'Traditions (séparées par des virgules)',
            'add.traditions_placeholder': 'mondial',
            'add.description': 'Description',
            'add.emoji': 'Émoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Enregistrer',
            'share.title': '📤 Partager ce moment',
            'share.alt_moment': 'Votre moment',
            'share.living_in': 'Vivre dans {moment}',
            'share.copy': '📋 Copier',
            'share.download': '🖼️ Télécharger l\'image',
            'share.photo': '📤 Partager la photo',
            'app.status_moon_season': 'Lune : {moon} | Saison : {season}',
            'app.unknown': 'inconnu',
            'app.optional_layer': 'couche facultative',
            'app.noon_observed': 'Midi : {time} (observé)',
            'app.solar_noon_title':
                'Midi solaire observé — votre heure solaire locale.',
            'app.solar_no_noon_title':
                'Aucune observation pour l\'instant — observez 🌅 Lever du '
                + 'soleil + 🌇 Coucher du soleil (ou ⚖️ ombres égales) pour '
                + 'voir votre heure solaire locale.',
            'app.checksum_stable': 'stable sur {count} vérifications',
            'app.checksum_drifting': 'À LA DÉRIVE sur {count} vérifications',
            'app.updated': 'mis à jour {time}',
            'app.selfcheck_unavailable': 'Auto-vérification : indisponible',
            'checksum.precession_offset': 'Décalage de précession',
            'share.moment_copied': '✅ Moment copié dans le presse-papiers',
            'share.copy_manually': 'Sélectionnez le texte et copiez-le à la main.',
            'share.watermark':
                'le temps que vous observez · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Image du moment Kairos téléchargée',
            'share.share_title': 'Mon moment Kairos',
            'share.photo_shared':
                '📤 Photo du moment Kairos partagée / téléchargée',
            'share.photo_error':
                '⚠️ Impossible de lire l\'image capturée.',
            'obs.sunrise_recorded':
                '✅ Lever du soleil enregistré — appuyez sur Coucher du '
                + 'soleil quand le soleil disparaît.',
            'obs.need_sunrise': '⚠️ Veuillez d\'abord enregistrer le lever du soleil.',
            'obs.shadow_first':
                '✅ Premier moment d\'ombre égale enregistré — appuyez à '
                + 'nouveau l\'après-midi quand l\'ombre redevient égale.',
            'obs.noon_calculated': '✅ Midi solaire calculé : {time}',
            'obs.noon_calibrated':
                '✅ Midi solaire calibré via {label} — KST mis à jour.',
            'obs.method_equal_shadows': 'ombres égales',
            'obs.method_sunrise_sunset': 'lever + coucher du soleil',
            'obs.enter_both': '⚠️ Saisissez le lever et le coucher du soleil.',
            'obs.enter_noon': '⚠️ Saisissez d\'abord un midi solaire.',
            'obs.enter_order': '⚠️ Le coucher doit venir après le lever.',
            'obs.method_entered_times': 'lever + coucher saisis',
            'obs.method_entered_noon': 'midi solaire saisi',
            'obs.season_set': '✅ Saison définie sur {season}',
            'obs.moon_set': '✅ Lune réglée sur {emoji} — KST calibré',
            'obs.tradition_switched': 'Tradition changée en {tradition}',
            'kst.days': 'jours',
            'kst.more': '+{count} autres ▾',
            'kst.hide': '− masquer',
            'kst.next_star': '⭐ — (prochaine : {star} dans ~{days} j)',
            'kst.none': '⭐ —',
            'seasonal.tap_details': 'Touchez pour plus de détails',
            'seasonal.festivals': '🎉 Festivals',
            'seasonal.empty_hint':
                'Rien de saisonnier pour ces filtres — observez le ciel et '
                + 'ajoutez votre propre savoir avec ➕ Ajouter un produit / '
                + '➕ Ajouter un festival.',
            'seasonal.empty': 'Rien de saisonnier pour ces filtres.',
            'seasonal.no_details': 'Pas encore de détails.',
            'seasonal.name_first': '⚠️ Donnez d\'abord un nom à l\'élément.',
            'seasonal.added_server': '✅ "{name}" ajouté (serveur)',
            'seasonal.added_device_offline':
                '✅ "{name}" ajouté (cet appareil — serveur hors ligne)',
            'seasonal.added_device': '✅ "{name}" ajouté (cet appareil)',
            'seasonal.this_app': '(cette application)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Mondial',
            'seasonal.field.season': 'Saison',
            'seasonal.field.regions': 'Régions',
            'seasonal.field.traditions': 'Traditions',
            'seasonal.field.description': 'Description',
            'seasonal.field.activities': 'Activités',
            'seasonal.field.foods': 'Aliments',
            'seasonal.field.category': 'Catégorie',
            'seasonal.field.seasons': 'Saisons',
            'seasonal.field.uses': 'Usages',
            'seasonal.field.how_to_find': 'Où le trouver',
            'phytochem.title': '🧪 Inventaire phytochimique',
            'phytochem.no_inventory':
                'Aucun inventaire phytochimique pour cet élément pour '
                + 'l\'instant.',
            'phytochem.source': '🔗 Source :',
            'phytochem.your_note': 'Votre note pour cet élément',
            'phytochem.note_placeholder':
                'p. ex. Cela correspond à ma variété locale — ou : je l\'ai '
                + 'trouvé différent dans ma région.',
            'phytochem.save_note': '💾 Enregistrer la note',
            'phytochem.saved': 'Enregistré sur cet appareil.',
            'phytochem.removed': 'Note supprimée.',
            'energy.archetype': '🜂 Archétype',
            'energy.moon_mood': '🌙 Humeur de la lune',
            'energy.element': '{glyph} Élément',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 De saison',
            'energy.festival': 'festival',
            'energy.food': 'aliment',
            'help.what_am_i_looking_at': 'Qu\'est-ce que je regarde ?',
            'help.planets_now':
                '🪐 Les planètes maintenant (notes ésotériques)',
            'help.planet_in': 'dans {sign}',
            'help.planets_fallback':
                'Les positions planétaires viennent du moteur céleste — avec '
                + 'le serveur, Skyfield ; hors ligne, un algorithme compact '
                + 'de navigateur (web/planets.js).',
            'help.todays_energy': '✨ L\'énergie d\'aujourd\'hui',
            'help.five_elements': '🜂 Les cinq éléments',
            'help.phytochem': '🧪 L\'inventaire phytochimique',
            'help.phytochem_text':
                'Les fenêtres de détail des produits incluent un inventaire '
                + 'phytochimique (lycopène, quercétine, vitamine C, …). Les '
                + 'valeurs sont des <strong>approximations</strong> tirées '
                + 'de références publiques — USDA FoodData Central et '
                + 'autres — pas des mesures vérifiées en laboratoire pour '
                + 'votre plante précise. Chaque inventaire porte '
                + 'l\'avertissement ℹ️ en bas, un lien de source cliquable '
                + 'et une zone de note où vous pouvez consigner ce que vous '
                + 'observez dans votre région.',
            'help.community': '🌍 La communauté',
            'help.community_text':
                'Kairos grandit en étant partagé. Prenez une photo de votre '
                + 'moment, ajoutez votre date Kairos et partagez-la avec '
                + '<strong>#KairosTime</strong>. Ajoutez des plantes, des '
                + 'traditions et des festivals de votre région — le dépôt '
                + 'est <a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, et '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> montre comment.',
            'kst_help.wheel.title': '🌞 La Roue cosmique',
            'kst_help.wheel.text':
                'La roue est le chemin du soleil à travers l\'année. Sa '
                + 'couleur est la saison céleste ; le marqueur solaire '
                + 'tourne vers la longitude écliptique actuelle du soleil — '
                + 'la même mesure que les anciens observateurs du ciel '
                + 'utilisaient pour marquer le tournant de l\'année.',
            'kst_help.solarLongitude.title': '🌞 Longitude solaire',
            'kst_help.solarLongitude.text':
                'La position du soleil en degrés le long de son chemin '
                + 'annuel (0–360°). 0° = équinoxe de printemps, 90° = '
                + 'solstice d\'été, 180° = équinoxe d\'automne, 270° = '
                + 'solstice d\'hiver. C\'est le plus ancien calendrier qui '
                + 'soit — l\'adresse du soleil parmi les étoiles.',
            'kst_help.lunarAge.title': '🌙 Âge lunaire',
            'kst_help.lunarAge.text':
                'Jours depuis la dernière nouvelle lune (le mois synodique '
                + 'd\'environ 29,53 jours). 0 = nouvelle lune, ~7,4 = '
                + 'premier quartier, ~14,8 = pleine lune, ~22,1 = dernier '
                + 'quartier. Le mois de chaque culture commençait autrefois '
                + 'par la réapparition de ce fin croissant.',
            'kst_help.sidereal.title': '🌀 Temps sidéral',
            'kst_help.sidereal.text':
                'L\'horloge propre du ciel. Le temps sidéral local vous dit '
                + 'quelles étoiles sont sur votre méridien en ce moment — 24 '
                + 'heures sidérales pour une rotation complète des étoiles '
                + 'fixes. Les horloges murales vous disent ce que fait le '
                + 'soleil ; le temps sidéral vous dit ce que fait le ciel.',
            'kst_help.star.title': '⭐ Étoile visible',
            'kst_help.star.text':
                'L\'étoile clé la plus proéminente au-dessus de l\'horizon à '
                + 'l\'aube (si plusieurs sont levées, Kairos montre \'+N '
                + 'autres\'). Sirius, les Pléiades et Orion marquaient '
                + 'moissons et crues dans bien des cultures. Si aucune '
                + 'n\'est levée, Kairos le dit — et indique quelle étoile '
                + 'surveiller ensuite.',
            'kst_help.season.title': '🌍 Saison',
            'kst_help.season.text':
                'La saison tropicale issue de la longitude solaire (un cadre '
                + 'hémisphère nord). La roue change de couleur avec elle — '
                + 'printemps bleu, été vert, automne or, hiver gris.',
            'season_button.Spring': '🌸 Printemps',
            'season_button.Summer': '☀️ Été',
            'season_button.Autumn': '🍂 Automne',
            'season_button.Winter': '❄️ Hiver',
            'day.Sundial': 'Cadran solaire', 'day.Well': 'Puits',
            'day.Root': 'Racine', 'day.Bloom': 'Floraison',
            'day.Forge': 'Forge', 'day.Harvest': 'Moisson',
            'day.Star': 'Étoile',
            'month.Root Moon': 'Lune des racines',
            'month.Sap Moon': 'Lune de sève',
            'month.Green Moon': 'Lune verte',
            'month.Bloom Moon': 'Lune de floraison',
            'month.Grain Moon': 'Lune des grains',
            'month.Light Moon': 'Lune de lumière',
            'month.Thirst Moon': 'Lune de soif',
            'month.Fruit Moon': 'Lune des fruits',
            'month.Harvest Moon': 'Lune de moisson',
            'month.Wine Moon': 'Lune du vin',
            'month.Leaf Moon': 'Lune des feuilles',
            'month.Frost Moon': 'Lune de givre',
            'month.Star Moon': 'Lune des étoiles',
            'year_day.Deep Day': 'Jour profond',
            'season.Emergence': 'Émergence', 'season.Radiance': 'Rayonnement',
            'season.Release': 'Délivrance', 'season.Stillness': 'Immobilité',
            'season.Spring': 'Printemps', 'season.Summer': 'Été',
            'season.Autumn': 'Automne', 'season.Winter': 'Hiver',
            'weekday.Sun': 'Soleil', 'weekday.Moon': 'Lune',
            'weekday.Fire': 'Feu', 'weekday.Water': 'Eau',
            'weekday.Earth': 'Terre', 'weekday.Air': 'Air',
            'weekday.Star': 'Étoile',
            'moon.New Moon': 'Nouvelle lune',
            'moon.Waxing Crescent': 'Croissant de lune',
            'moon.First Quarter': 'Premier quartier',
            'moon.Waxing Gibbous': 'Gibbeuse croissante',
            'moon.Full Moon': 'Pleine lune',
            'moon.Waning Gibbous': 'Gibbeuse décroissante',
            'moon.Last Quarter': 'Dernier quartier',
            'moon.Waning Crescent': 'Croissant décroissant',
            'zodiac.Aries': 'Bélier', 'zodiac.Taurus': 'Taureau',
            'zodiac.Gemini': 'Gémeaux', 'zodiac.Cancer': 'Cancer',
            'zodiac.Leo': 'Lion', 'zodiac.Virgo': 'Vierge',
            'zodiac.Libra': 'Balance', 'zodiac.Scorpio': 'Scorpion',
            'zodiac.Sagittarius': 'Sagittaire',
            'zodiac.Capricorn': 'Capricorne', 'zodiac.Aquarius': 'Verseau',
            'zodiac.Pisces': 'Poissons',
            'archetype.Creator': 'Créateur', 'archetype.Healer': 'Guérisseur',
            'archetype.Warrior': 'Guerrier', 'archetype.Sage': 'Sage',
            'archetype.Lover': 'Amoureux', 'archetype.Guardian': 'Gardien',
            'archetype.Mystic': 'Mystique', 'archetype.Destroyer': 'Destructeur',
            'archetype.Fool': 'Fou', 'archetype.Magician': 'Magicien',
            'archetype.Empress': 'Impératrice', 'archetype.Emperor': 'Empereur',
            'archetype.Star': 'Étoile',
            'archetype_meaning.Creator':
                'l\'impulsion de faire naître de nouvelles choses. Rituel : '
                + 'créez quelque chose de vos mains.',
            'archetype_meaning.Healer':
                'l\'énergie de la réparation et du soin. Rituel : '
                + 'reposez-vous, prenez soin, écoutez.',
            'archetype_meaning.Warrior':
                'la volonté focalisée au service d\'une cause. Rituel : '
                + 'prenez position pour quelque chose.',
            'archetype_meaning.Sage':
                'le savoir partagé avec patience. Rituel : lisez, écrivez, '
                + 'enseignez.',
            'archetype_meaning.Lover':
                'les liens qui rendent la vie douce. Rituel : connectez, '
                + 'partagez, célébrez.',
            'archetype_meaning.Guardian':
                'la constance au service des autres. Rituel : protégez, '
                + 'préparez, défendez.',
            'archetype_meaning.Mystic':
                'le contact direct avec l\'invisible. Rituel : méditez, '
                + 'rêvez, observez.',
            'archetype_meaning.Destroyer':
                'le nettoyage qui fait de la place. Rituel : lâchez prise, '
                + 'laissez partir, brûlez.',
            'archetype_meaning.Fool':
                'la curiosité ouverte sans plan. Rituel : jouez, flânez, '
                + 'riez.',
            'archetype_meaning.Magician':
                'la volonté rendue efficace. Rituel : transformez, '
                + 'manifestez, pratiquez.',
            'archetype_meaning.Empress':
                'l\'abondance et le soin. Rituel : nourrissez, faites '
                + 'grandir, recevez.',
            'archetype_meaning.Emperor':
                'la structure qui sert. Rituel : menez, construisez, '
                + 'ordonnez.',
            'archetype_meaning.Star':
                'la promesse qui oriente le chemin. Rituel : espérez, '
                + 'visionnez, guidez.',
            'moon_meaning.New Moon':
                'calme, introspectif, semeur — l\'obscurité avant la lumière.',
            'moon_meaning.Waxing Crescent':
                'plein d\'espoir, curieux, en croissance — une promesse qui '
                + 'prend forme.',
            'moon_meaning.First Quarter':
                'entraîné, décisif, actif — élan et choix.',
            'moon_meaning.Waxing Gibbous':
                'qui affine, concentré, productif — polir le travail.',
            'moon_meaning.Full Moon':
                'lumineux, expressif, expansif — le sommet de la marée.',
            'moon_meaning.Waning Gibbous':
                'réfléchi, reconnaissant, généreux — rendre ce qui a débordé.',
            'moon_meaning.Last Quarter':
                'libérateur, honnête, clarifiant — couper ce qui ne sert plus.',
            'moon_meaning.Waning Crescent':
                'reposant, rêvant, se rendant — la graine se pose.',
            'element.Light': 'Lumière', 'element.Shadow': 'Ombre',
            'element.Stone': 'Pierre', 'element.Wind': 'Vent',
            'element.Void': 'Vide',
            'element_meaning.Light':
                'clarté, commencements, vision — ce qui est révélé.',
            'element_meaning.Shadow':
                'immobilité, profondeur, repos — ce qui attend dessous.',
            'element_meaning.Stone':
                'structure, patience, forme — ce qui dure.',
            'element_meaning.Wind':
                'mouvement, changement, voix — ce qui porte.',
            'element_meaning.Void':
                'libération, espace, mystère — ce qui fait de la place.',
            'festival.Spring':
                'rituels de renaissance · bénédictions des semences · '
                + 'rassemblements d\'équinoxe',
            'festival.Summer':
                'feux du solstice · festins des longs jours · honorer le '
                + 'soleil',
            'festival.Autumn':
                'fêtes des moissons · mémoire des ancêtres · festins de '
                + 'gratitude',
            'festival.Winter':
                'cérémonies de lumière · veillées du solstice · feux de '
                + 'nouvel an',
            'food.Spring': 'asperges, petits pois, radis, épinards, fraises',
            'food.Summer': 'tomates, courgettes, baies, maïs, poivrons',
            'food.Autumn': 'courges, pommes, champignons, légumes racines, potiron',
            'food.Winter': 'chou, pommes de terre, carottes, agrumes, poireaux',
            'planet.mercury': 'Mercure', 'planet.venus': 'Vénus',
            'planet.mars': 'Mars', 'planet.jupiter': 'Jupiter',
            'planet.saturn': 'Saturne',
            'planet_meaning.mercury':
                'le messager — l\'esprit, la parole, le mouvement, '
                + 'l\'échange. L\'énergie rapide qui relie une chose à une '
                + 'autre.',
            'planet_meaning.venus':
                'l\'attractrice — l\'amour, la beauté, l\'harmonie, la '
                + 'valeur. Ce qui nous rapproche et rend la vie savoureuse.',
            'planet_meaning.mars':
                'le guerrier — l\'élan, le courage, le désir, l\'action. La '
                + 'volonté focalisée, pour le meilleur ou pour le pire.',
            'planet_meaning.jupiter':
                'l\'expandeur — la chance, le sens, la croissance, la '
                + 'générosité. Le sentiment que les choses s\'ouvrent.',
            'planet_meaning.saturn':
                'le gardien du seuil — la structure, le temps, la '
                + 'discipline, la limite. Le lent professeur des limites.',
            'star.Sirius': 'Sirius', 'star.Pleiades': 'Pléiades',
            'star.Orion': 'Orion', 'star.Arcturus': 'Arcturus',
            'star.Vega': 'Véga',
        },

        'es': {
            'title': 'Kairos — Tiempo natural',
            'logo.alt': 'Logotipo de Kairos',
            'app.tagline': 'el tiempo que observas',
            'helpBtn.title': '¿Qué significa esto?',
            'tabs.now': '🌅 Ahora',
            'tabs.configure': '⚙️ Configurar',
            'display.observing': 'Observando…',
            'gregorian.prefix': '(Gregoriano: {date})',
            'action.capture': '📸 Capturar el momento',
            'action.capture.title':
                'Toma una foto y séllela con este momento Kairos',
            'action.share': '📤 Compartir este momento',
            'action.share.title':
                'Exporta este momento como texto o imagen',
            'kst.solar_longitude': '🌞 Longitud solar',
            'kst.lunar_age': '🌙 Edad lunar',
            'kst.sidereal_time': '🌀 Tiempo sideral',
            'kst.visible_star': '⭐ Estrella visible',
            'kst.celestial_season': '🌍 Estación celeste',
            'kst.planets': '🪐 Planetas',
            'seasonal.in_season': '🌿 De temporada',
            'seasonal.tune': '⚙️ ajustar',
            'seasonal.tune.title': 'Filtros y edición',
            'seasonal.looking_up': 'Mirando al cielo…',
            'checksum.computing': '🔭 Desfase de precesión: calculando…',
            'checksum.title':
                'Autocomprobación de Kairos: ¿el año de edad de la Tierra '
                + 'sigue en fase con el equinoccio de primavera observado?',
            'config.tradition': '🕰️ Tu tradición',
            'config.tradition_hint':
                'Lee el mismo cielo observado a través de otra lente '
                + 'calendárica.',
            'config.language': '🌐 Idioma',
            'config.language_hint': 'Elige el idioma de esta aplicación.',
            'config.seasonal_filters': '🌿 Filtros de temporada y edición',
            'config.seasonal_filters_hint':
                'Elige qué elementos aparecen en "De temporada" en la '
                + 'pestaña Ahora.',
            'config.all_traditions': 'Todas las tradiciones',
            'config.tradition_filter': 'Filtro de tradición',
            'config.auto_region': 'Región automática',
            'config.region_filter': 'Filtro de región',
            'config.add_produce': '➕ Añadir producto',
            'config.add_festival': '➕ Añadir festival',
            'config.calibrate': '🌞 Calibrar tu hora solar local',
            'config.calibrate_hint':
                'Pulsa 🌅 Amanecer cuando el sol toque el horizonte y 🌇 '
                + 'Atardecer cuando desaparezca — o usa un palo: pulsa ⚖️ '
                + 'Sombra = Palo cuando la sombra iguale al palo (por la '
                + 'mañana y por la tarde).',
            'config.sunrise': '🌅 Amanecer',
            'config.enter_times': '📝 O introduce las horas observadas',
            'config.use_times': '💾 Usar estas horas',
            'config.solar_noon': '☀️ Mediodía solar (culminación)',
            'config.set_noon': '💾 Establecer mediodía solar',
            'config.sunset': '🌇 Atardecer',
            'config.equal_shadow': '⚖️ Sombra = Palo',
            'config.shadow_status':
                'Pulsa cuando el sol toque el horizonte, o cuando tu sombra '
                + 'iguale al palo.',
            'config.observe_moon': '🌙 Observar la luna',
            'config.observe_moon_hint':
                'Toca el emoji que coincida con lo que ves.',
            'config.observe_season': '🍂 Observar la estación',
            'config.observe_season_hint':
                'Pulsa la estación que te parezca correcta.',
            'app.ready': 'Listo.',
            'footer':
                'Kairos — sin GPS, sin internet, solo tú y el cielo',
            'footer.community':
                '🌍 Únete a la comunidad — comparte tu <b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': 'Cerrar',
            'help.modal_title': 'Kairos — ¿qué estoy viendo?',
            'help.foot':
                'Kairos se basa en la observación. Estas son pistas del '
                + 'cielo — el cielo que realmente ves es siempre la '
                + 'autoridad.',
            'seasonal.title': 'Elemento',
            'seasonal.add_own': '➕ Añadir el tuyo',
            'add.kind': 'Tipo',
            'add.kind_produce': 'Producto (alimento, hierba, seta, carne)',
            'add.kind_festival': 'Festival / celebración',
            'add.name': 'Nombre *',
            'add.name_placeholder': 'p. ej. Ortiga',
            'add.category': 'Categoría',
            'category.fruit': 'fruta',
            'category.vegetable': 'verdura',
            'category.herb': 'hierba',
            'category.fungus': 'seta',
            'category.meat': 'carne',
            'category.other': 'otro',
            'add.in_season': 'De temporada (estación Kairos)',
            'kairos_season.Emergence': 'Surgimiento (Primavera)',
            'kairos_season.Radiance': 'Resplandor (Verano)',
            'kairos_season.Release': 'Liberación (Otoño)',
            'kairos_season.Stillness': 'Quietud (Invierno)',
            'add.uses': 'Usos',
            'add.uses_placeholder': 'fresco, salsas, …',
            'add.how_to_find': 'Cómo encontrarlo',
            'add.how_to_find_placeholder': 'crece cerca de…',
            'add.activities': 'Actividades',
            'add.activities_placeholder': 'hogueras, banquetes',
            'add.foods': 'Alimentos',
            'add.foods_placeholder': 'pan, vino',
            'add.regions': 'Regiones (separadas por comas)',
            'add.regions_placeholder': 'templado, bosque',
            'add.traditions': 'Tradiciones (separadas por comas)',
            'add.traditions_placeholder': 'global',
            'add.description': 'Descripción',
            'add.emoji': 'Emoji',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 Guardar',
            'share.title': '📤 Compartir este momento',
            'share.alt_moment': 'Tu momento',
            'share.living_in': 'Viviendo en {moment}',
            'share.copy': '📋 Copiar',
            'share.download': '🖼️ Descargar imagen',
            'share.photo': '📤 Compartir foto',
            'app.status_moon_season': 'Luna: {moon} | Estación: {season}',
            'app.unknown': 'desconocido',
            'app.optional_layer': 'capa opcional',
            'app.noon_observed': 'Mediodía: {time} (observado)',
            'app.solar_noon_title':
                'Mediodía solar observado — tu hora solar local.',
            'app.solar_no_noon_title':
                'Aún no hay observación — registra 🌅 Amanecer + 🌇 '
                + 'Atardecer (o ⚖️ sombras iguales) para ver tu hora solar '
                + 'local.',
            'app.checksum_stable': 'estable en {count} comprobaciones',
            'app.checksum_drifting': 'A LA DERIVA en {count} comprobaciones',
            'app.updated': 'actualizado {time}',
            'app.selfcheck_unavailable': 'Autocomprobación: no disponible',
            'checksum.precession_offset': 'Desfase de precesión',
            'share.moment_copied': '✅ Momento copiado al portapapeles',
            'share.copy_manually': 'Selecciona el texto y cópialo manualmente.',
            'share.watermark':
                'el tiempo que observas · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Imagen del momento Kairos descargada',
            'share.share_title': 'Mi momento Kairos',
            'share.photo_shared':
                '📤 Foto del momento Kairos compartida / descargada',
            'share.photo_error': '⚠️ No se pudo leer la imagen capturada.',
            'obs.sunrise_recorded':
                '✅ Amanecer registrado — pulsa Atardecer cuando el sol '
                + 'desaparezca.',
            'obs.need_sunrise': '⚠️ Registra primero el amanecer.',
            'obs.shadow_first':
                '✅ Primer momento de sombra igual registrado — pulsa de '
                + 'nuevo por la tarde cuando la sombra vuelva a ser igual.',
            'obs.noon_calculated': '✅ Mediodía solar calculado: {time}',
            'obs.noon_calibrated':
                '✅ Mediodía solar calibrado mediante {label} — KST '
                + 'actualizado.',
            'obs.method_equal_shadows': 'sombras iguales',
            'obs.method_sunrise_sunset': 'amanecer + atardecer',
            'obs.enter_both': '⚠️ Introduce tanto el amanecer como el atardecer.',
            'obs.enter_noon': '⚠️ Introduce primero un mediodía solar.',
            'obs.enter_order': '⚠️ El atardecer debe ser después del amanecer.',
            'obs.method_entered_times': 'amanecer + atardecer introducidos',
            'obs.method_entered_noon': 'mediodía solar introducido',
            'obs.season_set': '✅ Estación establecida en {season}',
            'obs.moon_set': '✅ Luna establecida en {emoji} — KST calibrado',
            'obs.tradition_switched': 'Tradición cambiada a {tradition}',
            'kst.days': 'días',
            'kst.more': '+{count} más ▾',
            'kst.hide': '− ocultar',
            'kst.next_star': '⭐ — (siguiente: {star} en ~{days} d)',
            'kst.none': '⭐ —',
            'seasonal.tap_details': 'Toca para ver detalles',
            'seasonal.festivals': '🎉 Festivales',
            'seasonal.empty_hint':
                'Nada de temporada para estos filtros — observa el cielo y '
                + 'añade tu propio conocimiento con ➕ Añadir producto / ➕ '
                + 'Añadir festival.',
            'seasonal.empty': 'Nada de temporada para estos filtros.',
            'seasonal.no_details': 'Aún sin detalles.',
            'seasonal.name_first': '⚠️ Ponle un nombre al elemento primero.',
            'seasonal.added_server': '✅ "{name}" añadido (servidor)',
            'seasonal.added_device_offline':
                '✅ "{name}" añadido (este dispositivo — servidor sin '
                + 'conexión)',
            'seasonal.added_device': '✅ "{name}" añadido (este dispositivo)',
            'seasonal.this_app': '(esta aplicación)',
            'seasonal.auto_region': 'Auto · {region}',
            'seasonal.global': 'Global',
            'seasonal.field.season': 'Estación',
            'seasonal.field.regions': 'Regiones',
            'seasonal.field.traditions': 'Tradiciones',
            'seasonal.field.description': 'Descripción',
            'seasonal.field.activities': 'Actividades',
            'seasonal.field.foods': 'Alimentos',
            'seasonal.field.category': 'Categoría',
            'seasonal.field.seasons': 'Estaciones',
            'seasonal.field.uses': 'Usos',
            'seasonal.field.how_to_find': 'Cómo encontrarlo',
            'phytochem.title': '🧪 Inventario fitoquímico',
            'phytochem.no_inventory':
                'Aún no hay inventario fitoquímico para este elemento.',
            'phytochem.source': '🔗 Fuente:',
            'phytochem.your_note': 'Tu nota para este elemento',
            'phytochem.note_placeholder':
                'p. ej. Esto coincide con mi variedad local — o: lo he '
                + 'encontrado diferente en mi región.',
            'phytochem.save_note': '💾 Guardar nota',
            'phytochem.saved': 'Guardado en este dispositivo.',
            'phytochem.removed': 'Nota eliminada.',
            'energy.archetype': '🜂 Arquetipo',
            'energy.moon_mood': '🌙 Estado de ánimo lunar',
            'energy.element': '{glyph} Elemento',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 De temporada',
            'energy.festival': 'festival',
            'energy.food': 'alimento',
            'help.what_am_i_looking_at': '¿Qué estoy viendo?',
            'help.planets_now': '🪐 Los planetas ahora (notas esotéricas)',
            'help.planet_in': 'en {sign}',
            'help.planets_fallback':
                'Las posiciones planetarias provienen del motor celeste — '
                + 'con el servidor, Skyfield; sin conexión, un algoritmo '
                + 'compacto del navegador (web/planets.js).',
            'help.todays_energy': '✨ La energía de hoy',
            'help.five_elements': '🜂 Los cinco elementos',
            'help.phytochem': '🧪 El inventario fitoquímico',
            'help.phytochem_text':
                'Los modales de detalle de los productos incluyen un '
                + 'inventario fitoquímico (licopeno, quercetina, vitamina C, '
                + '…). Los valores son <strong>aproximaciones</strong> de '
                + 'referencias públicas — USDA FoodData Central y otras — no '
                + 'mediciones verificadas en laboratorio para tu planta '
                + 'concreta. Cada inventario lleva el aviso ℹ️ al final, un '
                + 'enlace a la fuente y un cuadro de notas donde puedes '
                + 'registrar lo que observas en tu región.',
            'help.community': '🌍 La comunidad',
            'help.community_text':
                'Kairos crece al compartirse. Haz una foto de tu momento, '
                + 'añade tu fecha Kairos y compártela con '
                + '<strong>#KairosTime</strong>. Añade plantas, tradiciones '
                + 'y festivales de tu región — el repositorio es '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>, y '
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> muestra cómo.',
            'kst_help.wheel.title': '🌞 La Rueda cósmica',
            'kst_help.wheel.text':
                'La rueda es el camino del sol a través del año. Su color es '
                + 'la estación celeste; el marcador solar rota hasta la '
                + 'longitud eclíptica actual del sol — la misma medida que '
                + 'los antiguos observadores del cielo usaban para marcar el '
                + 'giro del año.',
            'kst_help.solarLongitude.title': '🌞 Longitud solar',
            'kst_help.solarLongitude.text':
                'La posición del sol en grados a lo largo de su camino anual '
                + '(0–360°). 0° = equinoccio de primavera, 90° = solsticio '
                + 'de verano, 180° = equinoccio de otoño, 270° = solsticio '
                + 'de invierno. Es el calendario más antiguo que existe — la '
                + 'dirección del sol entre las estrellas.',
            'kst_help.lunarAge.title': '🌙 Edad lunar',
            'kst_help.lunarAge.text':
                'Días desde la última luna nueva (el mes sinódico de ~29,53 '
                + 'días). 0 = luna nueva, ~7,4 = cuarto creciente, ~14,8 = '
                + 'luna llena, ~22,1 = cuarto menguante. El mes de cada '
                + 'cultura comenzaba antaño con la reaparición de este '
                + 'delgado creciente.',
            'kst_help.sidereal.title': '🌀 Tiempo sideral',
            'kst_help.sidereal.text':
                'El reloj propio del cielo. El tiempo sideral local te dice '
                + 'qué estrellas están en tu meridiano ahora mismo — 24 '
                + 'horas siderales por una rotación completa de las '
                + 'estrellas fijas. Los relojes de pared te dicen qué hace '
                + 'el sol; el tiempo sideral te dice qué hace el cielo.',
            'kst_help.star.title': '⭐ Estrella visible',
            'kst_help.star.text':
                'La estrella clave más prominente sobre el horizonte al '
                + 'amanecer (si hay varias, Kairos muestra \'+N más\'). '
                + 'Sirio, las Pléyades y Orión marcaron cosechas e '
                + 'inundaciones en muchas culturas. Si no hay ninguna, '
                + 'Kairos lo dice — y sugiere qué estrella vigilar a '
                + 'continuación.',
            'kst_help.season.title': '🌍 Estación',
            'kst_help.season.text':
                'La estación tropical según la longitud solar (un marco del '
                + 'hemisferio norte). La rueda cambia de color con ella — '
                + 'primavera azul, verano verde, otoño dorado, invierno gris.',
            'season_button.Spring': '🌸 Primavera',
            'season_button.Summer': '☀️ Verano',
            'season_button.Autumn': '🍂 Otoño',
            'season_button.Winter': '❄️ Invierno',
            'day.Sundial': 'Reloj de sol', 'day.Well': 'Pozo',
            'day.Root': 'Raíz', 'day.Bloom': 'Florecimiento',
            'day.Forge': 'Forja', 'day.Harvest': 'Cosecha',
            'day.Star': 'Estrella',
            'month.Root Moon': 'Luna de raíz', 'month.Sap Moon': 'Luna de savia',
            'month.Green Moon': 'Luna verde', 'month.Bloom Moon': 'Luna de floración',
            'month.Grain Moon': 'Luna de grano', 'month.Light Moon': 'Luna de luz',
            'month.Thirst Moon': 'Luna de sed', 'month.Fruit Moon': 'Luna de frutos',
            'month.Harvest Moon': 'Luna de cosecha', 'month.Wine Moon': 'Luna de vino',
            'month.Leaf Moon': 'Luna de hojas', 'month.Frost Moon': 'Luna de escarcha',
            'month.Star Moon': 'Luna de estrellas',
            'year_day.Deep Day': 'Día profundo',
            'season.Emergence': 'Surgimiento', 'season.Radiance': 'Resplandor',
            'season.Release': 'Liberación', 'season.Stillness': 'Quietud',
            'season.Spring': 'Primavera', 'season.Summer': 'Verano',
            'season.Autumn': 'Otoño', 'season.Winter': 'Invierno',
            'weekday.Sun': 'Sol', 'weekday.Moon': 'Luna',
            'weekday.Fire': 'Fuego', 'weekday.Water': 'Agua',
            'weekday.Earth': 'Tierra', 'weekday.Air': 'Aire',
            'weekday.Star': 'Estrella',
            'moon.New Moon': 'Luna nueva',
            'moon.Waxing Crescent': 'Luna creciente',
            'moon.First Quarter': 'Cuarto creciente',
            'moon.Waxing Gibbous': 'Gibosa creciente',
            'moon.Full Moon': 'Luna llena',
            'moon.Waning Gibbous': 'Gibosa menguante',
            'moon.Last Quarter': 'Cuarto menguante',
            'moon.Waning Crescent': 'Luna menguante',
            'zodiac.Aries': 'Aries', 'zodiac.Taurus': 'Tauro',
            'zodiac.Gemini': 'Géminis', 'zodiac.Cancer': 'Cáncer',
            'zodiac.Leo': 'Leo', 'zodiac.Virgo': 'Virgo',
            'zodiac.Libra': 'Libra', 'zodiac.Scorpio': 'Escorpio',
            'zodiac.Sagittarius': 'Sagitario',
            'zodiac.Capricorn': 'Capricornio', 'zodiac.Aquarius': 'Acuario',
            'zodiac.Pisces': 'Piscis',
            'archetype.Creator': 'Creador', 'archetype.Healer': 'Sanador',
            'archetype.Warrior': 'Guerrero', 'archetype.Sage': 'Sabio',
            'archetype.Lover': 'Amante', 'archetype.Guardian': 'Guardián',
            'archetype.Mystic': 'Místico', 'archetype.Destroyer': 'Destructor',
            'archetype.Fool': 'Loco', 'archetype.Magician': 'Mago',
            'archetype.Empress': 'Emperatriz', 'archetype.Emperor': 'Emperador',
            'archetype.Star': 'Estrella',
            'archetype_meaning.Creator':
                'el impulso de traer cosas nuevas al ser. Ritual: haz algo '
                + 'con tus manos.',
            'archetype_meaning.Healer':
                'la energía de la reparación y el cuidado. Ritual: descansa, '
                + 'atiende, escucha.',
            'archetype_meaning.Warrior':
                'voluntad enfocada al servicio de una causa. Ritual: '
                + 'defiende algo.',
            'archetype_meaning.Sage':
                'conocimiento compartido con paciencia. Ritual: lee, '
                + 'escribe, enseña.',
            'archetype_meaning.Lover':
                'los lazos que endulzan la vida. Ritual: conecta, comparte, '
                + 'celebra.',
            'archetype_meaning.Guardian':
                'firmeza al servicio de los demás. Ritual: protege, prepara, '
                + 'defiende.',
            'archetype_meaning.Mystic':
                'contacto directo con lo invisible. Ritual: medita, sueña, '
                + 'observa.',
            'archetype_meaning.Destroyer':
                'la limpieza que hace espacio. Ritual: suelta, deja ir, quema.',
            'archetype_meaning.Fool':
                'curiosidad abierta sin plan. Ritual: juega, pasea, ríe.',
            'archetype_meaning.Magician':
                'voluntad hecha efectiva. Ritual: transforma, manifiesta, '
                + 'practica.',
            'archetype_meaning.Empress':
                'abundancia y cuidado. Ritual: nutre, haz crecer, recibe.',
            'archetype_meaning.Emperor':
                'estructura que sirve. Ritual: lidera, construye, ordena.',
            'archetype_meaning.Star':
                'la promesa que orienta el camino. Ritual: esperanza, '
                + 'visión, guía.',
            'moon_meaning.New Moon':
                'quietud, introspección, siembra — la oscuridad antes de la '
                + 'luz.',
            'moon_meaning.Waxing Crescent':
                'esperanzador, curioso, creciente — una promesa tomando '
                + 'forma.',
            'moon_meaning.First Quarter':
                'impulsivo, decidido, activo — impulso y elección.',
            'moon_meaning.Waxing Gibbous':
                'refinando, enfocado, productivo — puliendo el trabajo.',
            'moon_meaning.Full Moon':
                'luminoso, expresivo, expansivo — la cima de la marea.',
            'moon_meaning.Waning Gibbous':
                'reflexivo, agradecido, generoso — devolviendo lo que se '
                + 'desbordó.',
            'moon_meaning.Last Quarter':
                'liberador, honesto, aclarador — cortar lo que ya no sirve.',
            'moon_meaning.Waning Crescent':
                'descansando, soñando, entregándose — la semilla se asienta.',
            'element.Light': 'Luz', 'element.Shadow': 'Sombra',
            'element.Stone': 'Piedra', 'element.Wind': 'Viento',
            'element.Void': 'Vacío',
            'element_meaning.Light':
                'claridad, comienzos, visión — lo que se revela.',
            'element_meaning.Shadow':
                'quietud, profundidad, descanso — lo que espera debajo.',
            'element_meaning.Stone':
                'estructura, paciencia, forma — lo que perdura.',
            'element_meaning.Wind':
                'movimiento, cambio, voz — lo que lleva.',
            'element_meaning.Void':
                'liberación, espacio, misterio — lo que hace sitio.',
            'festival.Spring':
                'rituales de renacimiento · bendiciones de semillas · '
                + 'reuniones de equinoccio',
            'festival.Summer':
                'hogueras del solsticio · banquetes del día largo · honrar '
                + 'al sol',
            'festival.Autumn':
                'fiestas de cosecha · recuerdo de antepasados · banquetes '
                + 'de gratitud',
            'festival.Winter':
                'ceremonias de luz · vigilias del solsticio · fuegos de '
                + 'año nuevo',
            'food.Spring': 'espárragos, guisantes, rábanos, espinacas, fresas',
            'food.Summer': 'tomates, calabacines, bayas, maíz, pimientos',
            'food.Autumn': 'calabacín, manzanas, setas, hortalizas de raíz, calabaza',
            'food.Winter': 'col, patatas, zanahorias, cítricos, puerros',
            'planet.mercury': 'Mercurio', 'planet.venus': 'Venus',
            'planet.mars': 'Marte', 'planet.jupiter': 'Júpiter',
            'planet.saturn': 'Saturno',
            'planet_meaning.mercury':
                'el mensajero — mente, habla, movimiento, intercambio. La '
                + 'energía rápida que conecta una cosa con otra.',
            'planet_meaning.venus':
                'la atractora — amor, belleza, armonía, valor. Lo que nos '
                + 'une y hace que la vida merezca saborearse.',
            'planet_meaning.mars':
                'el guerrero — impulso, coraje, deseo, acción. Voluntad '
                + 'enfocada, para bien o para mal.',
            'planet_meaning.jupiter':
                'el expansor — suerte, sentido, crecimiento, generosidad. '
                + 'La sensación de que las cosas se abren.',
            'planet_meaning.saturn':
                'el guardián del umbral — estructura, tiempo, disciplina, '
                + 'límite. El lento maestro de los límites.',
            'star.Sirius': 'Sirio', 'star.Pleiades': 'Pléyades',
            'star.Orion': 'Orión', 'star.Arcturus': 'Arturo',
            'star.Vega': 'Vega',
        },

        'zh': {
            'title': 'Kairos — 自然时间',
            'logo.alt': 'Kairos 标志',
            'app.tagline': '你所观察的时间',
            'helpBtn.title': '这是什么意思？',
            'tabs.now': '🌅 现在',
            'tabs.configure': '⚙️ 设置',
            'display.observing': '正在观察…',
            'gregorian.prefix': '（公历：{date}）',
            'action.capture': '📸 捕捉瞬间',
            'action.capture.title': '拍照并盖上这个 Kairos 时刻的印章',
            'action.share': '📤 分享这一刻',
            'action.share.title': '将此时刻导出为文本或图片',
            'kst.solar_longitude': '🌞 太阳黄经',
            'kst.lunar_age': '🌙 月龄',
            'kst.sidereal_time': '🌀 恒星时',
            'kst.visible_star': '⭐ 可见恒星',
            'kst.celestial_season': '🌍 天球季节',
            'kst.planets': '🪐 行星',
            'seasonal.in_season': '🌿 当季',
            'seasonal.tune': '⚙️ 筛选',
            'seasonal.tune.title': '筛选与编辑',
            'seasonal.looking_up': '正在仰望天空…',
            'checksum.computing': '🔭 岁差偏移：计算中…',
            'checksum.title':
                'Kairos 自检——地球年龄年是否仍与所观测的春分点保持'
                + '相位一致？',
            'config.tradition': '🕰️ 您的历法传统',
            'config.tradition_hint':
                '透过不同的历法视角，阅读同一片被观测的天空。',
            'config.language': '🌐 语言',
            'config.language_hint': '选择此应用的语言。',
            'config.seasonal_filters': '🌿 季节筛选与编辑',
            'config.seasonal_filters_hint':
                '选择哪些条目会出现在“现在”选项卡的“当季”中。',
            'config.all_traditions': '所有传统',
            'config.tradition_filter': '传统筛选',
            'config.auto_region': '自动区域',
            'config.region_filter': '区域筛选',
            'config.add_produce': '➕ 添加农产品',
            'config.add_festival': '➕ 添加节日',
            'config.calibrate': '🌞 校准您的本地太阳时',
            'config.calibrate_hint':
                '当太阳触及地平线时按 🌅 日出，当太阳消失时按 🌇 日落'
                + '——或使用一根木棍：当影子的长度等于木棍时按下 ⚖️ '
                + '影长 = 棍长（上午和下午各一次）。',
            'config.sunrise': '🌅 日出',
            'config.enter_times': '📝 或输入观测到的时间',
            'config.use_times': '💾 使用这些时间',
            'config.solar_noon': '☀️ 太阳正午（中天）',
            'config.set_noon': '💾 设置太阳正午',
            'config.sunset': '🌇 日落',
            'config.equal_shadow': '⚖️ 影长 = 棍长',
            'config.shadow_status':
                '当太阳触及地平线、或您的影子长度等于木棍时按下。',
            'config.observe_moon': '🌙 观察月亮',
            'config.observe_moon_hint':
                '点击与您所见相符的表情符号。',
            'config.observe_season': '🍂 观察季节',
            'config.observe_season_hint': '按下感觉正确的季节。',
            'app.ready': '就绪。',
            'footer': 'Kairos — 无需 GPS、无需网络，只有您和天空',
            'footer.community':
                '🌍 加入社区 — 分享您的 <b>#KairosTime</b> · '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>',
            'close': '关闭',
            'help.modal_title': 'Kairos — 我在看什么？',
            'help.foot':
                'Kairos 以观察为先。这些都是来自天空的提示——您真正看到'
                + '的天空永远是权威。',
            'seasonal.title': '条目',
            'seasonal.add_own': '➕ 添加您自己的',
            'add.kind': '类型',
            'add.kind_produce': '农产品（食物、草药、蘑菇、肉类）',
            'add.kind_festival': '节日 / 庆典',
            'add.name': '名称 *',
            'add.name_placeholder': '例如：荨麻',
            'add.category': '类别',
            'category.fruit': '水果',
            'category.vegetable': '蔬菜',
            'category.herb': '草药',
            'category.fungus': '蘑菇',
            'category.meat': '肉类',
            'category.other': '其他',
            'add.in_season': '当季（Kairos 季节）',
            'kairos_season.Emergence': '萌发（春）',
            'kairos_season.Radiance': '光辉（夏）',
            'kairos_season.Release': '释放（秋）',
            'kairos_season.Stillness': '静寂（冬）',
            'add.uses': '用途',
            'add.uses_placeholder': '新鲜、酱料、…',
            'add.how_to_find': '如何寻找',
            'add.how_to_find_placeholder': '生长在…附近',
            'add.activities': '活动',
            'add.activities_placeholder': '篝火、盛宴',
            'add.foods': '食物',
            'add.foods_placeholder': '面包、葡萄酒',
            'add.regions': '地区（用逗号分隔）',
            'add.regions_placeholder': '温带、森林',
            'add.traditions': '传统（用逗号分隔）',
            'add.traditions_placeholder': '全球',
            'add.description': '描述',
            'add.emoji': '表情符号',
            'add.emoji_placeholder': '🍅',
            'add.save': '💾 保存',
            'share.title': '📤 分享这一刻',
            'share.alt_moment': '您的时刻',
            'share.living_in': '生活在 {moment}',
            'share.copy': '📋 复制',
            'share.download': '🖼️ 下载图片',
            'share.photo': '📤 分享照片',
            'app.status_moon_season': '月亮：{moon} | 季节：{season}',
            'app.unknown': '未知',
            'app.optional_layer': '可选层',
            'app.noon_observed': '正午：{time}（已观测）',
            'app.solar_noon_title': '已观测的太阳正午——您的本地太阳时。',
            'app.solar_no_noon_title':
                '尚无观测——请记录 🌅 日出 + 🌇 日落（或 ⚖️ 等长影子）以'
                + '查看您的本地太阳时。',
            'app.checksum_stable': '在 {count} 次检查中保持稳定',
            'app.checksum_drifting': '在 {count} 次检查中漂移',
            'app.updated': '更新于 {time}',
            'app.selfcheck_unavailable': '自检：不可用',
            'checksum.precession_offset': '岁差偏移',
            'share.moment_copied': '✅ 时刻已复制到剪贴板',
            'share.copy_manually': '请选择文本并手动复制。',
            'share.watermark': '你所观察的时间 · kairos.jbstoker.github.io',
            'share.image_downloaded': '🖼️ Kairos 时刻图片已下载',
            'share.share_title': '我的 Kairos 时刻',
            'share.photo_shared': '📤 Kairos 时刻照片已分享 / 下载',
            'share.photo_error': '⚠️ 无法读取所拍摄的图片。',
            'obs.sunrise_recorded':
                '✅ 日出已记录——当太阳消失时按下日落。',
            'obs.need_sunrise': '⚠️ 请先记录日出。',
            'obs.shadow_first':
                '✅ 第一个等长影子时刻已记录——下午当影子再次等长时再按'
                + '一次。',
            'obs.noon_calculated': '✅ 太阳正午已计算：{time}',
            'obs.noon_calibrated': '✅ 太阳正午已通过 {label} 校准——KST '
                + '已更新。',
            'obs.method_equal_shadows': '等长影子',
            'obs.method_sunrise_sunset': '日出 + 日落',
            'obs.enter_both': '⚠️ 请同时输入日出和日落时间。',
            'obs.enter_noon': '⚠️ 请先输入太阳正午时间。',
            'obs.enter_order': '⚠️ 日落必须晚于日出。',
            'obs.method_entered_times': '输入的日出 + 日落',
            'obs.method_entered_noon': '输入的太阳正午',
            'obs.season_set': '✅ 季节已设置为 {season}',
            'obs.moon_set': '✅ 月亮已设置为 {emoji} — KST 已校准',
            'obs.tradition_switched': '传统已切换为 {tradition}',
            'kst.days': '天',
            'kst.more': '+{count} 更多 ▾',
            'kst.hide': '− 隐藏',
            'kst.next_star': '⭐ —（下一颗：{star}，约 {days} 天后）',
            'kst.none': '⭐ —',
            'seasonal.tap_details': '点击查看详情',
            'seasonal.festivals': '🎉 节日',
            'seasonal.empty_hint':
                '这些筛选条件下没有当季之物——观察天空，并用 ➕ 添加农产品'
                + ' / ➕ 添加节日来添加您自己的知识。',
            'seasonal.empty': '这些筛选条件下没有当季之物。',
            'seasonal.no_details': '暂无详情。',
            'seasonal.name_first': '⚠️ 请先为条目命名。',
            'seasonal.added_server': '✅ 已添加"{name}"（服务器）',
            'seasonal.added_device_offline':
                '✅ 已添加"{name}"（此设备——服务器离线）',
            'seasonal.added_device': '✅ 已添加"{name}"（此设备）',
            'seasonal.this_app': '（此应用）',
            'seasonal.auto_region': '自动 · {region}',
            'seasonal.global': '全球',
            'seasonal.field.season': '季节',
            'seasonal.field.regions': '地区',
            'seasonal.field.traditions': '传统',
            'seasonal.field.description': '描述',
            'seasonal.field.activities': '活动',
            'seasonal.field.foods': '食物',
            'seasonal.field.category': '类别',
            'seasonal.field.seasons': '季节',
            'seasonal.field.uses': '用途',
            'seasonal.field.how_to_find': '如何寻找',
            'phytochem.title': '🧪 植物化学成分清单',
            'phytochem.no_inventory': '此条目暂无植物化学成分清单。',
            'phytochem.source': '🔗 来源：',
            'phytochem.your_note': '您对此条目的备注',
            'phytochem.note_placeholder':
                '例如：这符合我当地的品种——或者：我在我所在的地区发现'
                + '有所不同。',
            'phytochem.save_note': '💾 保存备注',
            'phytochem.saved': '已保存在此设备上。',
            'phytochem.removed': '备注已删除。',
            'energy.archetype': '🜂 原型',
            'energy.moon_mood': '🌙 月亮情绪',
            'energy.element': '{glyph} 元素',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '🍎 当季',
            'energy.festival': '节日',
            'energy.food': '食物',
            'help.what_am_i_looking_at': '我在看什么？',
            'help.planets_now': '🪐 现在的行星（秘传注解）',
            'help.planet_in': '位于 {sign}',
            'help.planets_fallback':
                '行星位置来自天体引擎——使用服务器时为 Skyfield；离线时'
                + '为紧凑的浏览器算法（web/planets.js）。',
            'help.todays_energy': '✨ 今日的能量',
            'help.five_elements': '🜂 五大元素',
            'help.phytochem': '🧪 植物化学成分清单',
            'help.phytochem_text':
                '农产品详情弹窗包含一份植物化学成分清单（番茄红素、'
                + '槲皮素、维生素 C 等）。数值是来自公开参考资料（USDA '
                + 'FoodData Central 等）的<strong>近似值</strong>，并非针对'
                + '您具体植物的实验室验证数据。每份清单底部都带有 ℹ️ '
                + '免责声明、可点击的来源链接，以及一个备注框，供您记录'
                + '在自己地区的观察。',
            'help.community': '🌍 社区',
            'help.community_text':
                'Kairos 因分享而成长。拍下您的时刻，添加您的 Kairos '
                + '日期，并用 <strong>#KairosTime</strong> 分享它。添加'
                + '您所在地区的植物、传统和节日——仓库在 '
                + '<a href="https://github.com/jbstoker/kairos" '
                + 'target="_blank" rel="noopener noreferrer">'
                + 'github.com/jbstoker/kairos</a>，'
                + '<a href="https://github.com/jbstoker/kairos/blob/master/'
                + 'docs/COMMUNITY.md" target="_blank" rel="noopener noreferrer">'
                + 'docs/COMMUNITY.md</a> 说明了如何参与。',
            'kst_help.wheel.title': '🌞 宇宙之轮',
            'kst_help.wheel.text':
                '轮盘是太阳在一年中的路径。其颜色代表天球季节；太阳标记'
                + '随太阳当前的黄经旋转——古代观天者正是用同样的度量来'
                + '标记一年的转折。',
            'kst_help.solarLongitude.title': '🌞 太阳黄经',
            'kst_help.solarLongitude.text':
                '太阳沿其年度路径的位置（以度计，0–360°）。0° = 春分，'
                + '90° = 夏至，180° = 秋分，270° = 冬至。这是现存最古老'
                + '的历法——太阳在群星间的地址。',
            'kst_help.lunarAge.title': '🌙 月龄',
            'kst_help.lunarAge.text':
                '距上次新月的天数（约 29.53 天的朔望月）。0 = 新月，约 '
                + '7.4 = 上弦月，约 14.8 = 满月，约 22.1 = 下弦月。每个'
                + '文化的月份曾经都始于这弯纤细月牙的重现。',
            'kst_help.sidereal.title': '🌀 恒星时',
            'kst_help.sidereal.text':
                '天空自己的时钟。本地恒星时告诉您此刻哪些恒星位于您的'
                + '子午线上——固定恒星每完整旋转一周为 24 恒星时。墙上'
                + '时钟告诉您太阳在做什么；恒星时告诉您天空在做什么。',
            'kst_help.star.title': '⭐ 可见恒星',
            'kst_help.star.text':
                '黎明时地平线上最显眼的关键恒星（如果有多颗升起，Kairos '
                + '会显示“+N 更多”）。在许多文化中，天狼星、昴星团和'
                + '猎户座标志着收获与洪水的时节。如果一颗也没有，Kairos '
                + '会如实相告——并提示接下来应关注哪颗星。',
            'kst_help.season.title': '🌍 季节',
            'kst_help.season.text':
                '由太阳黄经得出的热带季节（以北半球为参照）。轮盘随之'
                + '变色——春蓝、夏绿、秋金、冬灰。',
            'season_button.Spring': '🌸 春',
            'season_button.Summer': '☀️ 夏',
            'season_button.Autumn': '🍂 秋',
            'season_button.Winter': '❄️ 冬',
            'day.Sundial': '日晷', 'day.Well': '井', 'day.Root': '根',
            'day.Bloom': '绽放', 'day.Forge': '锻造', 'day.Harvest': '丰收',
            'day.Star': '星辰',
            'month.Root Moon': '根月', 'month.Sap Moon': '汁月',
            'month.Green Moon': '绿月', 'month.Bloom Moon': '花月',
            'month.Grain Moon': '谷月', 'month.Light Moon': '光月',
            'month.Thirst Moon': '渴月', 'month.Fruit Moon': '果月',
            'month.Harvest Moon': '收月', 'month.Wine Moon': '酒月',
            'month.Leaf Moon': '叶月', 'month.Frost Moon': '霜月',
            'month.Star Moon': '星月',
            'year_day.Deep Day': '深日',
            'season.Emergence': '萌发', 'season.Radiance': '光辉',
            'season.Release': '释放', 'season.Stillness': '静寂',
            'season.Spring': '春', 'season.Summer': '夏',
            'season.Autumn': '秋', 'season.Winter': '冬',
            'weekday.Sun': '日', 'weekday.Moon': '月', 'weekday.Fire': '火',
            'weekday.Water': '水', 'weekday.Earth': '土',
            'weekday.Air': '风', 'weekday.Star': '星',
            'moon.New Moon': '新月', 'moon.Waxing Crescent': '娥眉月',
            'moon.First Quarter': '上弦月', 'moon.Waxing Gibbous': '盈凸月',
            'moon.Full Moon': '满月', 'moon.Waning Gibbous': '亏凸月',
            'moon.Last Quarter': '下弦月', 'moon.Waning Crescent': '残月',
            'zodiac.Aries': '白羊座', 'zodiac.Taurus': '金牛座',
            'zodiac.Gemini': '双子座', 'zodiac.Cancer': '巨蟹座',
            'zodiac.Leo': '狮子座', 'zodiac.Virgo': '处女座',
            'zodiac.Libra': '天秤座', 'zodiac.Scorpio': '天蝎座',
            'zodiac.Sagittarius': '射手座', 'zodiac.Capricorn': '摩羯座',
            'zodiac.Aquarius': '水瓶座', 'zodiac.Pisces': '双鱼座',
            'archetype.Creator': '创造者', 'archetype.Healer': '治愈者',
            'archetype.Warrior': '战士', 'archetype.Sage': '智者',
            'archetype.Lover': '爱人', 'archetype.Guardian': '守护者',
            'archetype.Mystic': '神秘者', 'archetype.Destroyer': '毁灭者',
            'archetype.Fool': '愚者', 'archetype.Magician': '魔术师',
            'archetype.Empress': '女皇', 'archetype.Emperor': '皇帝',
            'archetype.Star': '星辰',
            'archetype_meaning.Creator':
                '将新事物带入存在的冲动。仪式：用双手创造一些东西。',
            'archetype_meaning.Healer':
                '修复与关怀的能量。仪式：休息、照料、倾听。',
            'archetype_meaning.Warrior':
                '为一项事业服务的专注意志。仪式：为某事挺身而出。',
            'archetype_meaning.Sage':
                '以耐心分享的知识。仪式：阅读、书写、教导。',
            'archetype_meaning.Lover':
                '让生活甜美的纽带。仪式：连接、分享、庆祝。',
            'archetype_meaning.Guardian':
                '为他人服务的坚定。仪式：保护、准备、捍卫。',
            'archetype_meaning.Mystic':
                '与不可见之物的直接接触。仪式：冥想、做梦、观察。',
            'archetype_meaning.Destroyer':
                '腾出空间的清理。仪式：释放、放手、燃烧。',
            'archetype_meaning.Fool':
                '没有计划的开放好奇。仪式：玩耍、漫游、欢笑。',
            'archetype_meaning.Magician':
                '使意志生效。仪式：转化、显化、练习。',
            'archetype_meaning.Empress':
                '丰盛与关怀。仪式：滋养、成长、接受。',
            'archetype_meaning.Emperor':
                '为人服务的结构。仪式：领导、建设、秩序。',
            'archetype_meaning.Star':
                '指引道路的承诺。仪式：希望、愿景、引导。',
            'moon_meaning.New Moon':
                '安静、内省、播种——光明之前的黑暗。',
            'moon_meaning.Waxing Crescent':
                '满怀希望、好奇、成长——一个逐渐成形的承诺。',
            'moon_meaning.First Quarter':
                '驱动、决断、行动——势头与选择。',
            'moon_meaning.Waxing Gibbous':
                '精益求精、专注、高效——打磨工作。',
            'moon_meaning.Full Moon':
                '明亮、表达、扩展——潮汐之巅。',
            'moon_meaning.Waning Gibbous':
                '反思、感恩、分享——回馈溢出的部分。',
            'moon_meaning.Last Quarter':
                '释放、诚实、清理——切除不再有用的东西。',
            'moon_meaning.Waning Crescent':
                '休息、做梦、臣服——种子静静安顿。',
            'element.Light': '光', 'element.Shadow': '影',
            'element.Stone': '石', 'element.Wind': '风',
            'element.Void': '空',
            'element_meaning.Light':
                '清晰、开端、远见——被揭示的事物。',
            'element_meaning.Shadow':
                '静止、深度、休息——在下方等待的事物。',
            'element_meaning.Stone':
                '结构、耐心、形态——持久的事物。',
            'element_meaning.Wind':
                '运动、变化、声音——承载的事物。',
            'element_meaning.Void':
                '释放、空间、神秘——腾出空间的事物。',
            'festival.Spring': '重生仪式 · 种子祝福 · 春分聚会',
            'festival.Summer': '至日篝火 · 长昼盛宴 · 礼赞太阳',
            'festival.Autumn': '丰收庆典 · 缅怀先人 · 感恩盛宴',
            'festival.Winter': '光之仪式 · 至日守夜 · 新年之火',
            'food.Spring': '芦笋、豌豆、小萝卜、菠菜、草莓',
            'food.Summer': '西红柿、西葫芦、浆果、玉米、甜椒',
            'food.Autumn': '西葫芦、苹果、蘑菇、根茎蔬菜、南瓜',
            'food.Winter': '卷心菜、土豆、胡萝卜、柑橘、韭葱',
            'planet.mercury': '水星', 'planet.venus': '金星',
            'planet.mars': '火星', 'planet.jupiter': '木星',
            'planet.saturn': '土星',
            'planet_meaning.mercury':
                '信使——心智、言语、运动、交流。连接万物与万物的迅捷'
                + '能量。',
            'planet_meaning.venus':
                '吸引者——爱、美、和谐、价值。将我们凝聚在一起、使生活'
                + '值得品味的事物。',
            'planet_meaning.mars':
                '战士——驱动力、勇气、欲望、行动。专注的意志，无论好坏。',
            'planet_meaning.jupiter':
                '扩展者——幸运、意义、成长、慷慨。事物正在展开的感觉。',
            'planet_meaning.saturn':
                '守门人——结构、时间、纪律、边界。缓慢的边界之师。',
            'star.Sirius': '天狼星', 'star.Pleiades': '昴星团',
            'star.Orion': '猎户座', 'star.Arcturus': '大角星',
            'star.Vega': '织女星',
        }
    };

    // ---- Current language -------------------------------------------------
    function normalizeLang(lang) {
        var l = String(lang || '').toLowerCase().split('-')[0];
        return (LANGS.indexOf(l) !== -1) ? l : FALLBACK;
    }

    function currentLang() {
        var stored = null;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* noop */ }
        return normalizeLang(stored);
    }

    var listeners = [];

    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    function notify() {
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](); } catch (e) { /* keep going */ }
        }
    }

    // ---- Lookup -----------------------------------------------------------
    function t(key, vars) {
        var table = CATALOG[currentLang()] || CATALOG[FALLBACK];
        var text = table[key];
        if (text === undefined) text = CATALOG[FALLBACK][key];
        if (text === undefined) return key;
        if (vars) {
            text = text.replace(/\{(\w+)\}/g, function (m, name) {
                return (vars[name] !== undefined) ? String(vars[name]) : m;
            });
        }
        return text;
    }

    // Translate a canonical name like 'Harvest Moon' under a prefix; falls
    // back to the original name when no translation exists (proper nouns).
    function trName(prefix, name) {
        var key = prefix + name;
        if (CATALOG[FALLBACK][key] !== undefined) return t(key);
        return name;
    }

    // ---- Applying to the DOM ---------------------------------------------
    function apply(rootEl) {
        var root = rootEl || (typeof document !== 'undefined' ? document : null);
        if (!root) return;
        if (root.documentElement) root.documentElement.lang = currentLang();
        var nodes = root.querySelectorAll(
            '[data-i18n], [data-i18n-placeholder], [data-i18n-title], '
            + '[data-i18n-html], [data-i18n-alt]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
            var ph = el.getAttribute('data-i18n-placeholder');
            if (ph) el.setAttribute('placeholder', t(ph));
            var ti = el.getAttribute('data-i18n-title');
            if (ti) el.setAttribute('title', t(ti));
            var htm = el.getAttribute('data-i18n-html');
            if (htm) el.innerHTML = t(htm);
            var alt = el.getAttribute('data-i18n-alt');
            if (alt) el.setAttribute('alt', t(alt));
        }
    }

    // ---- Switching --------------------------------------------------------
    function setLang(lang) {
        lang = normalizeLang(lang);
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* noop */ }
        apply();
        notify();
    }

    function init() {
        // Populate the language <select> in the Configure tab, if present.
        var sel = document.getElementById('languageSelect');
        if (sel) {
            sel.innerHTML = '';
            for (var i = 0; i < LANGS.length; i++) {
                var opt = document.createElement('option');
                opt.value = LANGS[i];
                opt.textContent = LANG_NAMES[LANGS[i]];
                sel.appendChild(opt);
            }
            sel.value = currentLang();
            sel.addEventListener('change', function () {
                setLang(sel.value);
                if (window.refreshKST) window.refreshKST();
            });
        }
        apply();
        // Re-apply whenever dynamic content re-renders.
        onChange(function () {
            if (window.updateDisplay) window.updateDisplay();
            if (window.refreshSeasonal) window.refreshSeasonal();
        });
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            // Everything above this <script> is already parsed — translate it
            // now to avoid an English flash, then wire the selector on ready.
            apply();
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    return {
        LANGS: LANGS,
        LANG_NAMES: LANG_NAMES,
        CATALOG: CATALOG,
        normalizeLang: normalizeLang,
        currentLang: currentLang,
        setLang: setLang,
        t: t,
        trName: trName,
        apply: apply,
        onChange: onChange
    };
}));



































