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
            'action.capture': 'Capture Moment',
            'action.capture.title':
                'Take a photo and stamp it with this Kairos moment',
            'action.share': 'Share This Moment',
            'action.share.title': 'Export this moment as text or image',
            'kst.solar_longitude': '🌞 Solar Longitude',
            'kst.lunar_age': '🌙 Lunar Age',
            'kst.sidereal_time': '🌀 Sidereal Time',
            'kst.visible_star': '⭐ Visible Star',
            'kst.celestial_season': '🌍 Celestial Season',
            'kst.planets': '🪐 Planets',
            'seasonal.in_season': 'In season',
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
            'config.time_system': '⏱️ Time System',
            'config.time_system_hint':
                'Read the same sky through a 13-based clock (13h / 28m / 13s) or the '
                + '26-hour rhythm — 13 light + 13 dark hours (26h / 28m / 7s). '
                + 'Natural noon is solar noon in both.',
            'config.time_system_current': '🌍 Current Time (24h / 60 / 60)',
            'config.time_system_natural': '🌿 Natural Time (13h / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Natural',
            'config.time_system_kairos_natural': '🌿 Kairos Natural (26h / 28m / 7s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Natural',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Strides / 28 Beats / 7 Pulses)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Show Sun Light',
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
            'energy.archetype': 'Archetype',
            'energy.moon_mood': 'Moon mood',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'In season',
            'energy.festival': 'festival',
            'energy.food': 'food',
            'help.what_am_i_looking_at': 'What am I looking at?',
            'help.planets_now': '🪐 The planets now (esoteric notes)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Planet positions come from the celestial engine — with the '
                + 'server, Skyfield; offline, a compact browser algorithm '
                + '(web/planets.js).',
            'help.todays_energy': 'Today&apos;s energy',
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
            'season_button.Spring': 'Spring',
            'season_button.Summer': 'Summer',
            'season_button.Autumn': 'Autumn',
            'season_button.Winter': 'Winter',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Calendar Lens',
            'config.energy_lens': '🌿 Energy Lens',
            'config.month_style': '📅 Month Names',
            'config.month_style_kairos': '🌿 Kairos Moons (Root Moon, etc.)',
            'config.month_style_zodiac': '♐ True Zodiac (Capricornus, etc.)',
            'config.index_style': '🔢 Display Index',
            'config.index_style_zero': '🌿 Natural (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Traditional (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Display index set to {style}',
            'obs.month_style_switched': 'Month style set to {style}',
            'energy_lens_none': 'None (pure Kairos)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoist',
            'energy_lens_vedic': 'Vedic',
            'energy_lens_pagan': 'Pagan / Wiccan',
            'energy_lens_mesopotamian': 'Mesopotamian',
            'energy_lens_egyptian': 'Egyptian',
            'energy_lens_mayan': 'Mayan',
            'direction_north': 'North',
            'direction_south': 'South',
            'direction_east': 'East',
            'direction_west': 'West',
            'direction_center': 'Center',
            'color_red': 'Red',
            'color_blue': 'Blue',
            'color_green': 'Green',
            'color_yellow': 'Yellow',
            'color_white': 'White',
            'color_black': 'Black',
            'obs.energy_switched': 'Energy lens set to {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Maker / Weaver', 'curanderismo_practice_creator': 'Create something with your hands.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Tend to yourself or others.',
            'curanderismo_archetype_warrior': 'Protector / Guardian', 'curanderismo_practice_warrior': 'Stand for something true.',
            'curanderismo_archetype_sage': 'Elder / Wisdom-keeper', 'curanderismo_practice_sage': 'Share knowledge or listen deeply.',
            'curanderismo_archetype_lover': 'Dancer / Gatherer', 'curanderismo_practice_lover': 'Connect, share food, celebrate.',
            'curanderismo_archetype_guardian': 'Watchman / Defender', 'curanderismo_practice_guardian': 'Protect the weak or the land.',
            'curanderismo_archetype_mystic': 'Dreamer / Seer', 'curanderismo_practice_mystic': 'Meditate, dream, observe.',
            'curanderismo_archetype_destroyer': 'Transformer / Fire-tender', 'curanderismo_practice_destroyer': 'Burn what no longer serves.',
            'curanderismo_archetype_fool': 'Trickster / Crow', 'curanderismo_practice_fool': 'Laugh, play, break the pattern.',
            'curanderismo_archetype_magician': 'Shapeshifter / Changer', 'curanderismo_practice_magician': 'Change your form, try something new.',
            'curanderismo_archetype_empress': 'Mother / Earth-keeper', 'curanderismo_practice_empress': 'Nurture, grow, receive.',
            'curanderismo_archetype_emperor': 'Father / Sky-keeper', 'curanderismo_practice_emperor': 'Lead, build, order.',
            'curanderismo_archetype_star': 'Stargazer / Road-opener', 'curanderismo_practice_star': 'Hope, vision, guide.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Dark / Waiting', 'curanderismo_practice_new': 'Rest, plant a seed (intention).',
            'curanderismo_moon_waxing_crescent': 'Growing / Birthing', 'curanderismo_practice_waxing_crescent': 'Take a first step.',
            'curanderismo_moon_first_quarter': 'Pushing / Emerging', 'curanderismo_practice_first_quarter': 'Break through a barrier.',
            'curanderismo_moon_waxing_gibbous': 'Building / Strengthening', 'curanderismo_practice_waxing_gibbous': 'Keep going, refine.',
            'curanderismo_moon_full': 'Bright / Full', 'curanderismo_practice_full': 'Feast, give thanks, release.',
            'curanderismo_moon_waning_gibbous': 'Sharing / Teaching', 'curanderismo_practice_waning_gibbous': 'Offer your knowledge.',
            'curanderismo_moon_last_quarter': 'Releasing / Cutting', 'curanderismo_practice_last_quarter': 'Let go of what is heavy.',
            'curanderismo_moon_waning_crescent': 'Resting / Dreaming', 'curanderismo_practice_waning_crescent': 'Sleep, dream, listen.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Fire',
            'curanderismo_element_water': 'Water',
            'curanderismo_element_earth': 'Earth',
            'curanderismo_element_air': 'Air',
            'curanderismo_element_ether': 'Ether / Spirit',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Sun Festival)', 'curanderismo_practice_summer_solstice': 'Sunrise ritual, fire ceremony.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Moon Festival)', 'curanderismo_practice_winter_solstice': 'Night vigil, storytelling.',
            'curanderismo_festival_spring_equinox': 'Flower Ceremony', 'curanderismo_practice_spring_equinox': 'Plant seeds, offer flowers.',
            'curanderismo_festival_autumn_equinox': 'Harvest Ceremony', 'curanderismo_practice_autumn_equinox': 'Give thanks, share food.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Mother Night)', 'curanderismo_practice_full_moon': 'Dance, sing, release.',
            'curanderismo_festival_new_moon': 'Dark Night Ceremony', 'curanderismo_practice_new_moon': 'Fast, meditate, set intention.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Fresh greens, berries, eggs', 'curanderismo_season_emergence_herbs': 'Nettle, dandelion, mint',
            'curanderismo_season_radiance_foods': 'Corn, tomatoes, peppers, squash', 'curanderismo_season_radiance_herbs': 'Basil, sage, rosemary',
            'curanderismo_season_release_foods': 'Pumpkins, root veg, apples', 'curanderismo_season_release_herbs': 'Cinnamon, clove, ginger',
            'curanderismo_season_stillness_foods': 'Beans, grains, dried fruit', 'curanderismo_season_stillness_herbs': 'Eucalyptus, pine, cedar',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Craftsman (百工)', 'taoist_practice_creator': 'Shape something with patience and skill.',
            'taoist_archetype_healer': 'Herbalist (医者)', 'taoist_practice_healer': 'Prepare herbs, tend the body.',
            'taoist_archetype_warrior': 'Guardian (护法)', 'taoist_practice_warrior': 'Stand firm, protect balance.',
            'taoist_archetype_sage': 'Sage (贤者)', 'taoist_practice_sage': 'Study, then teach plainly.',
            'taoist_archetype_lover': 'Harmonizer (和合)', 'taoist_practice_lover': 'Nurture bonds, share tea.',
            'taoist_archetype_guardian': 'Gatekeeper (守门)', 'taoist_practice_guardian': 'Hold the threshold, keep order.',
            'taoist_archetype_mystic': 'Immortal (仙人)', 'taoist_practice_mystic': 'Sit in stillness, cultivate qi.',
            'taoist_archetype_destroyer': 'Renovator (除旧)', 'taoist_practice_destroyer': 'Clear away the stale, make room.',
            'taoist_archetype_fool': 'Wanderer (云游)', 'taoist_practice_fool': 'Wander, laugh, live simply.',
            'taoist_archetype_magician': 'Alchemist (炼丹)', 'taoist_practice_magician': 'Turn the lead within into gold.',
            'taoist_archetype_empress': 'Mother (慈母)', 'taoist_practice_empress': 'Nurture growth, be generous.',
            'taoist_archetype_emperor': 'Patriarch (师尊)', 'taoist_practice_emperor': 'Guide with virtue, not force.',
            'taoist_archetype_star': 'North Star (北辰)', 'taoist_practice_star': 'Stay true, orient others.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Dark Yin (太阴)', 'taoist_practice_new': 'Rest, gather qi.',
            'taoist_moon_waxing_crescent': 'Sprouting (萌发)', 'taoist_practice_waxing_crescent': 'Plant the seed of intent.',
            'taoist_moon_first_quarter': 'Growing (生长)', 'taoist_practice_first_quarter': 'Push through, gain ground.',
            'taoist_moon_waxing_gibbous': 'Maturing (成熟)', 'taoist_practice_waxing_gibbous': 'Refine your work.',
            'taoist_moon_full': 'Bright Yang (阳盈)', 'taoist_practice_full': 'Celebrate, give thanks.',
            'taoist_moon_waning_gibbous': 'Sharing (分享)', 'taoist_practice_waning_gibbous': 'Teach what you know.',
            'taoist_moon_last_quarter': 'Releasing (回收)', 'taoist_practice_last_quarter': 'Let go, simplify.',
            'taoist_moon_waning_crescent': 'Returning (归藏)', 'taoist_practice_waning_crescent': 'Withdraw, store, dream.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Fire (火)',
            'taoist_element_water': 'Water (水)',
            'taoist_element_earth': 'Earth (土)',
            'taoist_element_air': 'Wind (风)',
            'taoist_element_ether': 'Void (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Midyear Fire (夏至)', 'taoist_practice_summer_solstice': 'Honor the full yang.',
            'taoist_festival_winter_solstice': 'Return of Light (冬至)', 'taoist_practice_winter_solstice': 'Honor the newborn yang.',
            'taoist_festival_spring_equinox': 'Spring Balance (春分)', 'taoist_practice_spring_equinox': 'Plant, begin, balance.',
            'taoist_festival_autumn_equinox': 'Autumn Balance (秋分)', 'taoist_practice_autumn_equinox': 'Harvest, store, let go.',
            'taoist_festival_full_moon': 'Moon Festival (望)', 'taoist_practice_full_moon': 'Gather, give thanks, gaze at the moon.',
            'taoist_festival_new_moon': 'Dark Moon (朔)', 'taoist_practice_new_moon': 'Rest, fast, renew.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Spring greens, bamboo shoots, eggs', 'taoist_season_emergence_herbs': 'Mint, chrysanthemum, green tea',
            'taoist_season_radiance_foods': 'Melon, cucumber, bitter greens', 'taoist_season_radiance_herbs': 'Lotus leaf, mung bean, peppermint',
            'taoist_season_release_foods': 'Roots, squash, rice', 'taoist_season_release_herbs': 'Ginger, goji, cinnamon',
            'taoist_season_stillness_foods': 'Warm soups, tofu, preserved foods', 'taoist_season_stillness_herbs': 'Astragalus, black tea, cloves',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Begin something new with clarity.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Serve health; care for body and mind.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Protect dharma with courage.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Learn, chant, share wisdom.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Delight in connection and song.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Guard the threshold with devotion.',
            'vedic_archetype_mystic': 'Yogi', 'vedic_practice_mystic': 'Meditate, breathe, go within.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Dissolve what no longer serves.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Play music, wander, sing.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Practice the art until it becomes power.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Give and receive abundance.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Preserve order with grace.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Be the fixed point of the turning sky.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Dark Moon)', 'vedic_practice_new': 'Rest, fast, set a sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Begin the new venture.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Gather strength, act.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Discipline, refine, fast gently.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Give thanks, share, celebrate.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Reflect, serve, simplify.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Release attachments, cleanse.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Withdraw, rest, dream.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Fire)',
            'vedic_element_water': 'Jala (Water)',
            'vedic_element_earth': 'Prithvi (Earth)',
            'vedic_element_air': 'Vayu (Air)',
            'vedic_element_ether': 'Akasha (Ether)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Dakshinayana begins', 'vedic_practice_summer_solstice': 'Honor the turning of the sun.',
            'vedic_festival_winter_solstice': 'Uttarayana begins', 'vedic_practice_winter_solstice': 'Celebrate the return of light.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Worship the Mother, plant anew.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Honor the goddess, share the harvest.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Meditate, give, celebrate.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Honor the ancestors, rest.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Greens, sprouts, mango', 'vedic_season_emergence_herbs': 'Tulsi, turmeric, coriander',
            'vedic_season_radiance_foods': 'Cooling yogurt, cucumber, lassi', 'vedic_season_radiance_herbs': 'Fennel, mint, rose',
            'vedic_season_release_foods': 'Grains, ghee, root veg', 'vedic_season_release_herbs': 'Ashwagandha, ginger, cardamom',
            'vedic_season_stillness_foods': 'Warm kitchari, nuts, dates', 'vedic_season_stillness_herbs': 'Triphala, cinnamon, tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Creatrix / Maker', 'pagan_practice_creator': 'Shape, weave, bring into being.',
            'pagan_archetype_healer': 'Green Witch', 'pagan_practice_healer': 'Work with herbs, tend wounds.',
            'pagan_archetype_warrior': 'Warrior Maiden', 'pagan_practice_warrior': 'Stand for what you love.',
            'pagan_archetype_sage': 'Crone', 'pagan_practice_sage': 'Speak the old wisdom plainly.',
            'pagan_archetype_lover': 'May Queen', 'pagan_practice_lover': 'Celebrate the flesh and the earth.',
            'pagan_archetype_guardian': 'Hearth Guardian', 'pagan_practice_guardian': 'Protect home and circle.',
            'pagan_archetype_mystic': 'Oracle / Seer', 'pagan_practice_mystic': 'Listen to the in-between.',
            'pagan_archetype_destroyer': 'Shadow Worker', 'pagan_practice_destroyer': 'Release, compost, transform.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Laugh at the sacred.',
            'pagan_archetype_magician': 'Witch / Spellweaver', 'pagan_practice_magician': 'Will, word, and gesture.',
            'pagan_archetype_empress': 'Earth Mother', 'pagan_practice_empress': 'Nurture all that grows.',
            'pagan_archetype_emperor': 'Horned God / King', 'pagan_practice_emperor': 'Rule the cycle with strength.',
            'pagan_archetype_star': 'Star Goddess', 'pagan_practice_star': 'Weave the web, guide the way.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Dark Moon', 'pagan_practice_new': 'Rest, dream, cast no spell.',
            'pagan_moon_waxing_crescent': 'Waxing Crescent', 'pagan_practice_waxing_crescent': 'Begin, plant, attract.',
            'pagan_moon_first_quarter': 'Waxing Half', 'pagan_practice_first_quarter': 'Push through obstacles.',
            'pagan_moon_waxing_gibbous': 'Waxing Full', 'pagan_practice_waxing_gibbous': 'Refine and strengthen.',
            'pagan_moon_full': 'Esbat (Full Moon)', 'pagan_practice_full': 'Ritual, charge, release.',
            'pagan_moon_waning_gibbous': 'Waning Full', 'pagan_practice_waning_gibbous': 'Share the abundance.',
            'pagan_moon_last_quarter': 'Waning Half', 'pagan_practice_last_quarter': 'Cut away what binds.',
            'pagan_moon_waning_crescent': 'Balsamic / Darkening', 'pagan_practice_waning_crescent': 'Hush, rest, prepare.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Fire',
            'pagan_element_water': 'Water',
            'pagan_element_earth': 'Earth',
            'pagan_element_air': 'Air',
            'pagan_element_ether': 'Spirit / Aether',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Leap the fire, honor the sun.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Burn the log, welcome the light.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Plant seeds, balance light and dark.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Give thanks, preserve the harvest.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Cast the circle, charge your tools.',
            'pagan_festival_new_moon': 'New Moon Rite', 'pagan_practice_new_moon': 'Set intentions in the dark.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Eggs, greens, early berries', 'pagan_season_emergence_herbs': 'Nettle, dandelion, mint',
            'pagan_season_radiance_foods': 'Berries, corn, tomatoes', 'pagan_season_radiance_herbs': 'Lavender, chamomile, rosemary',
            'pagan_season_release_foods': 'Apples, squash, grains', 'pagan_season_release_herbs': 'Sage, cinnamon, cloves',
            'pagan_season_stillness_foods': 'Root veg, nuts, preserves', 'pagan_season_stillness_herbs': 'Pine, cedar, holly',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Order the chaos, begin.',
            'mesopotamian_archetype_healer': 'Healer of Gula', 'mesopotamian_practice_healer': 'Tend wounds, use the herbs.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Fight for the harvest.',
            'mesopotamian_archetype_sage': 'Nabu (Scribe)', 'mesopotamian_practice_sage': 'Write, count, record.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Love boldly, celebrate.',
            'mesopotamian_archetype_guardian': 'Gatekeeper of Shamash', 'mesopotamian_practice_guardian': 'Keep the gate of justice.',
            'mesopotamian_archetype_mystic': 'Seer of Enki', 'mesopotamian_practice_mystic': 'Dive into the deep waters.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Oversee endings, clear decay.',
            'mesopotamian_archetype_fool': 'Jester of the Court', 'mesopotamian_practice_fool': 'Mock the mighty, tell truth.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Enchanter)', 'mesopotamian_practice_magician': 'Speak the word that binds.',
            'mesopotamian_archetype_empress': 'Queen of Heaven (Ishtar)', 'mesopotamian_practice_empress': 'Rule with radiance.',
            'mesopotamian_archetype_emperor': 'Anu (King of Gods)', 'mesopotamian_practice_emperor': 'Hold the heavens and the law.',
            'mesopotamian_archetype_star': 'Nanshe (Dream Reader)', 'mesopotamian_practice_star': 'Read the dreams and portents.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'New Moon (Arḫu)', 'mesopotamian_practice_new': 'Rest, wait, plan.',
            'mesopotamian_moon_waxing_crescent': 'Crescent Rising', 'mesopotamian_practice_waxing_crescent': 'Begin the work.',
            'mesopotamian_moon_first_quarter': 'Half Moon', 'mesopotamian_practice_first_quarter': 'Press the campaign.',
            'mesopotamian_moon_waxing_gibbous': 'Waxing Full', 'mesopotamian_practice_waxing_gibbous': 'Build the walls, store grain.',
            'mesopotamian_moon_full': 'Full Moon (Šapattu)', 'mesopotamian_practice_full': 'Rest from work, feast, honor the gods.',
            'mesopotamian_moon_waning_gibbous': 'Waning Full', 'mesopotamian_practice_waning_gibbous': 'Settle accounts, share.',
            'mesopotamian_moon_last_quarter': 'Waning Half', 'mesopotamian_practice_last_quarter': 'Cut debts, finish tasks.',
            'mesopotamian_moon_waning_crescent': 'Dark Crescent', 'mesopotamian_practice_waning_crescent': 'Hush the city, keep vigil.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Fire of Girra',
            'mesopotamian_element_water': 'Waters of Abzu (Ea)',
            'mesopotamian_element_earth': 'Earth of Ki',
            'mesopotamian_element_air': 'Winds of Enlil',
            'mesopotamian_element_ether': 'Heavens of Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Mid-Summer Akitu', 'mesopotamian_practice_summer_solstice': 'Honor the sun at its height.',
            'mesopotamian_festival_winter_solstice': 'Winter Akitu', 'mesopotamian_practice_winter_solstice': 'Renew the year in the dark.',
            'mesopotamian_festival_spring_equinox': 'Akitu (New Year)', 'mesopotamian_practice_spring_equinox': 'Crown the king, renew the world.',
            'mesopotamian_festival_autumn_equinox': 'Harvest of Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Mourn and thank the dying god.',
            'mesopotamian_festival_full_moon': 'Šapattu (Full Moon)', 'mesopotamian_practice_full_moon': 'Lay down work, keep festival.',
            'mesopotamian_festival_new_moon': 'Arḫu (New Moon)', 'mesopotamian_practice_new_moon': 'Mark the month, wait on the crescent.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Barley, dates, greens', 'mesopotamian_season_emergence_herbs': 'Thyme, cumin, coriander',
            'mesopotamian_season_radiance_foods': 'Figs, grapes, cucumbers', 'mesopotamian_season_radiance_herbs': 'Mint, sesame, anise',
            'mesopotamian_season_release_foods': 'Dates, pomegranates, grains', 'mesopotamian_season_release_herbs': 'Saffron, bay, sesame',
            'mesopotamian_season_stillness_foods': 'Stored grain, dried dates, lentils', 'mesopotamian_season_stillness_herbs': 'Juniper, frankincense, myrrh',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Khnum', 'egyptian_practice_creator': 'Mold the day with intent.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Practice medicine, write the remedies.',
            'egyptian_archetype_warrior': 'Sekhmet', 'egyptian_practice_warrior': 'Burn fiercely, protect Ma\'at.',
            'egyptian_archetype_sage': 'Thoth', 'egyptian_practice_sage': 'Count, write, measure the sky.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Delight in music, love, and feast.',
            'egyptian_archetype_guardian': 'Anubis / Wepwawet', 'egyptian_practice_guardian': 'Guard the thresholds of change.',
            'egyptian_archetype_mystic': 'Isis (Enchantress)', 'egyptian_practice_mystic': 'Weave spells of protection and life.',
            'egyptian_archetype_destroyer': 'Seth (Devourer)', 'egyptian_practice_destroyer': 'Upset what is rigid, clear the stale.',
            'egyptian_archetype_fool': 'Bes', 'egyptian_practice_fool': 'Dance, drum, guard the household.',
            'egyptian_archetype_magician': 'Kheri-heb (Heka priest)', 'egyptian_practice_magician': 'Speak the words of power.',
            'egyptian_archetype_empress': 'Isis / Mut', 'egyptian_practice_empress': 'Mother all, protect the throne.',
            'egyptian_archetype_emperor': 'Ra (Pharaoh)', 'egyptian_practice_emperor': 'Rise with the sun, order the land.',
            'egyptian_archetype_star': 'Nut (Star Seer)', 'egyptian_practice_star': 'Read the sky, keep the cosmic rhythm.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Dark of Nun', 'egyptian_practice_new': 'Rest in the waters of beginning.',
            'egyptian_moon_waxing_crescent': 'Crescent of Khonsu', 'egyptian_practice_waxing_crescent': 'Begin the voyage.',
            'egyptian_moon_first_quarter': 'Growing Half', 'egyptian_practice_first_quarter': 'Build with both hands.',
            'egyptian_moon_waxing_gibbous': 'Waxing Full', 'egyptian_practice_waxing_gibbous': 'Gather strength and grain.',
            'egyptian_moon_full': 'Eye of Khonsu (Full)', 'egyptian_practice_full': 'Feast, honor the moon god.',
            'egyptian_moon_waning_gibbous': 'Waning Full', 'egyptian_practice_waning_gibbous': 'Give back, record, settle.',
            'egyptian_moon_last_quarter': 'Waning Half', 'egyptian_practice_last_quarter': 'Lighten the load, cleanse.',
            'egyptian_moon_waning_crescent': 'Waning Crescent', 'egyptian_practice_waning_crescent': 'Withdraw, dream, prepare for rebirth.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Fire of Ra',
            'egyptian_element_water': 'Waters of Nun',
            'egyptian_element_earth': 'Earth of Geb',
            'egyptian_element_air': 'Air of Shu',
            'egyptian_element_ether': 'Sky of Nut',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Sothic New Year (Rising of Sirius)', 'egyptian_practice_summer_solstice': 'Mark the flood, begin the year.',
            'egyptian_festival_winter_solstice': 'Feast of the Hidden Sun', 'egyptian_practice_winter_solstice': 'Honor the sun\'s rebirth in the dark.',
            'egyptian_festival_spring_equinox': 'Opet (Spring Rising)', 'egyptian_practice_spring_equinox': 'Process with the gods, bless the land.',
            'egyptian_festival_autumn_equinox': 'Feast of Thoth', 'egyptian_practice_autumn_equinox': 'Honor writing, judgment, and balance.',
            'egyptian_festival_full_moon': 'Feast of the Full Moon', 'egyptian_practice_full_moon': 'Keep vigil, offer, celebrate.',
            'egyptian_festival_new_moon': 'Feast of the New Moon', 'egyptian_practice_new_moon': 'Renew, cleanse, begin.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Grain, fava beans, greens', 'egyptian_season_emergence_herbs': 'Lettuce, mint, garlic',
            'egyptian_season_radiance_foods': 'Figs, grapes, melon', 'egyptian_season_radiance_herbs': 'Cumin, dill, onion',
            'egyptian_season_release_foods': 'Dates, pomegranate, wheat', 'egyptian_season_release_herbs': 'Frankincense, myrrh, anise',
            'egyptian_season_stillness_foods': 'Stored grains, dried fish, honey', 'egyptian_season_stillness_herbs': 'Thyme, juniper, fenugreek',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Maker)', 'mayan_practice_creator': 'Weave the new day into being.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Tend the body, work with herbs.',
            'mayan_archetype_warrior': 'Jaguar Warrior', 'mayan_practice_warrior': 'Move in the dark, protect the tribe.',
            'mayan_archetype_sage': 'Daykeeper (Aj Q\'ij)', 'mayan_practice_sage': 'Count the days, read the signs.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Celebrate love and the night.',
            'mayan_archetype_guardian': 'Guardian of Chac', 'mayan_practice_guardian': 'Protect water, rain, and growth.',
            'mayan_archetype_mystic': 'Shaman (Aj Q\'ij)', 'mayan_practice_mystic': 'Travel between worlds.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Guide endings, tend the underworld.',
            'mayan_archetype_fool': 'Howler Monkey (Batz\')', 'mayan_practice_fool': 'Howl, drum, craft, laugh.',
            'mayan_archetype_magician': 'Enchanter (God D)', 'mayan_practice_magician': 'Change shape, see beyond.',
            'mayan_archetype_empress': 'Ix Chel (Moon Mother)', 'mayan_practice_empress': 'Nurse creation, weave fate.',
            'mayan_archetype_emperor': 'Kinich Ahau (Sun Lord)', 'mayan_practice_emperor': 'Rise daily, feed the people.',
            'mayan_archetype_star': 'Venus (Kukulkan\'s Star)', 'mayan_practice_star': 'Track the dawn star, guide the way.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Dark Moon (Ik\')', 'mayan_practice_new': 'Rest, fast, listen.',
            'mayan_moon_waxing_crescent': 'Growing Crescent', 'mayan_practice_waxing_crescent': 'Plant, begin, grow.',
            'mayan_moon_first_quarter': 'Half Moon', 'mayan_practice_first_quarter': 'Clear the field, act.',
            'mayan_moon_waxing_gibbous': 'Waxing Full', 'mayan_practice_waxing_gibbous': 'Harvest strength, refine.',
            'mayan_moon_full': 'Full Moon (Nohoch)', 'mayan_practice_full': 'Feast, give thanks, release.',
            'mayan_moon_waning_gibbous': 'Waning Full', 'mayan_practice_waning_gibbous': 'Share, teach, distribute.',
            'mayan_moon_last_quarter': 'Waning Half', 'mayan_practice_last_quarter': 'Let go, thin out, release.',
            'mayan_moon_waning_crescent': 'Setting Crescent', 'mayan_practice_waning_crescent': 'Sleep, dream, renew.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Fire (K\'ak\')',
            'mayan_element_water': 'Water (Ha\')',
            'mayan_element_earth': 'Earth (Kab)',
            'mayan_element_air': 'Wind (Ik\')',
            'mayan_element_ether': 'Sky (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Solstice of the Sun', 'mayan_practice_summer_solstice': 'Honor the sun at its height.',
            'mayan_festival_winter_solstice': 'New Fire (Return of the Sun)', 'mayan_practice_winter_solstice': 'Relight the fire, renew the cycle.',
            'mayan_festival_spring_equinox': 'Descent of Kukulkan', 'mayan_practice_spring_equinox': 'Watch the serpent descend the pyramid.',
            'mayan_festival_autumn_equinox': 'Ascension of Kukulkan', 'mayan_practice_autumn_equinox': 'Watch the serpent ascend.',
            'mayan_festival_full_moon': 'Full Moon Ceremony', 'mayan_practice_full_moon': 'Chant, dance, offer.',
            'mayan_festival_new_moon': 'New Fire Ceremony', 'mayan_practice_new_moon': 'Fast, cleanse, set intention.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Maize, beans, greens', 'mayan_season_emergence_herbs': 'Epazote, cilantro, mint',
            'mayan_season_radiance_foods': 'Corn, tomatoes, tropical fruit', 'mayan_season_radiance_herbs': 'Achiote, chaya, lime',
            'mayan_season_release_foods': 'Squash, maize harvest, avocado', 'mayan_season_release_herbs': 'Allspice, vanilla, cacao',
            'mayan_season_stillness_foods': 'Dried maize, beans, honey', 'mayan_season_stillness_herbs': 'Copal, cacao, sarsaparilla',
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
            'action.capture': 'Moment vastleggen',
            'action.capture.title':
                'Maak een foto en stempel hem met dit Kairos-moment',
            'action.share': 'Dit moment delen',
            'action.share.title': 'Exporteer dit moment als tekst of afbeelding',
            'kst.solar_longitude': '🌞 Zonnelengte',
            'kst.lunar_age': '🌙 Maanleeftijd',
            'kst.sidereal_time': '🌀 Siderische tijd',
            'kst.visible_star': '⭐ Zichtbare ster',
            'kst.celestial_season': '🌍 Hemelse seizoen',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': 'In het seizoen',
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
            'config.time_system': '⏱️ Tijdsysteem',
            'config.time_system_hint':
                'Lees dezelfde hemel door een 13-delige klok (13u / 28m / 13s) of het '
                + '26-uurse ritme — 13 lichturen + 13 donkere uren (26u / 28m / 7s). '
                + 'Natuurlijke middag is in beide zonsmiddag.',
            'config.time_system_current': '🌍 Huidige tijd (24u / 60 / 60)',
            'config.time_system_natural': '🌿 Natuurlijke tijd (13u / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Natuurlijk',
            'config.time_system_kairos_natural': '🌿 Kairos Natuurlijk (26u / 28m / 7s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Natuurlijk',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Stappen / 28 Slagen / 7 Pulsen)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Toon zonlicht',
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
            'energy.archetype': 'Archetype',
            'energy.moon_mood': 'Maanstemming',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'In het seizoen',
            'energy.festival': 'festival',
            'energy.food': 'voedsel',
            'help.what_am_i_looking_at': 'Waar kijk ik naar?',
            'help.planets_now': '🪐 De planeten nu (esoterische notities)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Planeetposities komen van de hemelengine — met de server, '
                + 'Skyfield; offline, een compact browser-algoritme '
                + '(web/planets.js).',
            'help.todays_energy': 'De energie van vandaag',
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
            'season_button.Spring': 'Lente',
            'season_button.Summer': 'Zomer',
            'season_button.Autumn': 'Herfst',
            'season_button.Winter': 'Winter',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Kalenderlens',
            'config.energy_lens': '🌿 Energielens',
            'config.month_style': '📅 Maandnamen',
            'config.month_style_kairos': '🌿 Kairos-manen (Wortelmaan, enz.)',
            'config.month_style_zodiac': '♐ Ware Dierenriem (Steenbok, enz.)',
            'config.index_style': '🔢 Weergave-index',
            'config.index_style_zero': '🌿 Natuurlijk (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Traditioneel (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Weergave-index ingesteld op {style}',
            'obs.month_style_switched': 'Maandstijl ingesteld op {style}',
            'energy_lens_none': 'Geen (puur Kairos)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoïsme',
            'energy_lens_vedic': 'Vedisch',
            'energy_lens_pagan': 'Heidens / Wicca',
            'energy_lens_mesopotamian': 'Mesopotamisch',
            'energy_lens_egyptian': 'Egyptisch',
            'energy_lens_mayan': 'Maya',
            'direction_north': 'Noord',
            'direction_south': 'Zuid',
            'direction_east': 'Oost',
            'direction_west': 'West',
            'direction_center': 'Centrum',
            'color_red': 'Rood',
            'color_blue': 'Blauw',
            'color_green': 'Groen',
            'color_yellow': 'Geel',
            'color_white': 'Wit',
            'color_black': 'Zwart',
            'obs.energy_switched': 'Energielens ingesteld op {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Maker / Wever', 'curanderismo_practice_creator': 'Maak iets met je handen.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Zorg voor jezelf of anderen.',
            'curanderismo_archetype_warrior': 'Beschermer / Bewaker', 'curanderismo_practice_warrior': 'Sta voor iets dat waar is.',
            'curanderismo_archetype_sage': 'Ouderling / Wijsheidsbewaarder', 'curanderismo_practice_sage': 'Deel kennis of luister diep.',
            'curanderismo_archetype_lover': 'Danser / Verzamelaar', 'curanderismo_practice_lover': 'Verbind, deel eten, vier.',
            'curanderismo_archetype_guardian': 'Wachter / Verdediger', 'curanderismo_practice_guardian': 'Bescherm de zwakken of het land.',
            'curanderismo_archetype_mystic': 'Dromer / Ziener', 'curanderismo_practice_mystic': 'Mediteer, droom, observeer.',
            'curanderismo_archetype_destroyer': 'Vervormer / Vuurhoeder', 'curanderismo_practice_destroyer': 'Verbren wat niet meer dient.',
            'curanderismo_archetype_fool': 'Trickster / Kraai', 'curanderismo_practice_fool': 'Lach, speel, doorbreek het patroon.',
            'curanderismo_archetype_magician': 'Vormveranderaar / Veranderaar', 'curanderismo_practice_magician': 'Verander je vorm, probeer iets nieuws.',
            'curanderismo_archetype_empress': 'Moeder / Aardebewaker', 'curanderismo_practice_empress': 'Voed, groei, ontvang.',
            'curanderismo_archetype_emperor': 'Vader / Hemelbewaker', 'curanderismo_practice_emperor': 'Leid, bouw, orden.',
            'curanderismo_archetype_star': 'Sterrenkijker / Wegbereider', 'curanderismo_practice_star': 'Hoop, visie, leiding.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Donker / Wachten', 'curanderismo_practice_new': 'Rust, plant een zaadje (intentie).',
            'curanderismo_moon_waxing_crescent': 'Groeien / Geboorte', 'curanderismo_practice_waxing_crescent': 'Zet een eerste stap.',
            'curanderismo_moon_first_quarter': 'Duwen / Tevoorschijn komen', 'curanderismo_practice_first_quarter': 'Doorbreek een barrière.',
            'curanderismo_moon_waxing_gibbous': 'Bouwen / Versterken', 'curanderismo_practice_waxing_gibbous': 'Blijf doorgaan, verfijn.',
            'curanderismo_moon_full': 'Helder / Vol', 'curanderismo_practice_full': 'Feest, dank, laat los.',
            'curanderismo_moon_waning_gibbous': 'Delen / Leren', 'curanderismo_practice_waning_gibbous': 'Bied je kennis aan.',
            'curanderismo_moon_last_quarter': 'Loslaten / Snijden', 'curanderismo_practice_last_quarter': 'Laat los wat zwaar is.',
            'curanderismo_moon_waning_crescent': 'Rusten / Dromen', 'curanderismo_practice_waning_crescent': 'Slaap, droom, luister.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Vuur',
            'curanderismo_element_water': 'Water',
            'curanderismo_element_earth': 'Aarde',
            'curanderismo_element_air': 'Lucht',
            'curanderismo_element_ether': 'Ether / Geest',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Zonnefeest)', 'curanderismo_practice_summer_solstice': 'Zonsopgangritueel, vuurceremonie.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Maanfeest)', 'curanderismo_practice_winter_solstice': 'Nachtwake, verhalen vertellen.',
            'curanderismo_festival_spring_equinox': 'Bloemenceremonie', 'curanderismo_practice_spring_equinox': 'Plant zaden, offer bloemen.',
            'curanderismo_festival_autumn_equinox': 'Oogstceremonie', 'curanderismo_practice_autumn_equinox': 'Dank, deel voedsel.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Moedernacht)', 'curanderismo_practice_full_moon': 'Dans, zing, laat los.',
            'curanderismo_festival_new_moon': 'Ceremonie van de donkere nacht', 'curanderismo_practice_new_moon': 'Vast, mediteer, stel een intentie.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Verse groenten, bessen, eieren', 'curanderismo_season_emergence_herbs': 'Brandnetel, paardenbloem, munt',
            'curanderismo_season_radiance_foods': 'Maïs, tomaten, paprika, pompoen', 'curanderismo_season_radiance_herbs': 'Basilicum, salie, rozemarijn',
            'curanderismo_season_release_foods': 'Pompoenen, wortelgroenten, appels', 'curanderismo_season_release_herbs': 'Kaneel, kruidnagel, gember',
            'curanderismo_season_stillness_foods': 'Bonen, granen, gedroogd fruit', 'curanderismo_season_stillness_herbs': 'Eucalyptus, den, ceder',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Ambachtsman', 'taoist_practice_creator': 'Vorm iets met geduld en vakmanschap.',
            'taoist_archetype_healer': 'Kruidengenezer', 'taoist_practice_healer': 'Bereid kruiden, verzorg het lichaam.',
            'taoist_archetype_warrior': 'Beschermer', 'taoist_practice_warrior': 'Sta stevig, bewaak het evenwicht.',
            'taoist_archetype_sage': 'Wijze', 'taoist_practice_sage': 'Bestudeer, onderwijs helder.',
            'taoist_archetype_lover': 'Harmonisator', 'taoist_practice_lover': 'Verzorg banden, deel thee.',
            'taoist_archetype_guardian': 'Poortwachter', 'taoist_practice_guardian': 'Bewaak de drempel, houd orde.',
            'taoist_archetype_mystic': 'Onsterfelijke', 'taoist_practice_mystic': 'Zit in stilte, cultiveer qi.',
            'taoist_archetype_destroyer': 'Vernieuwer', 'taoist_practice_destroyer': 'Ruim het oude op, maak ruimte.',
            'taoist_archetype_fool': 'Zwerver', 'taoist_practice_fool': 'Dwaal, lach, leef eenvoudig.',
            'taoist_archetype_magician': 'Alchemist', 'taoist_practice_magician': 'Verander het lood binnenin in goud.',
            'taoist_archetype_empress': 'Moeder', 'taoist_practice_empress': 'Voed groei, wees gul.',
            'taoist_archetype_emperor': 'Patriarch', 'taoist_practice_emperor': 'Leid met deugd, niet met dwang.',
            'taoist_archetype_star': 'Poolster', 'taoist_practice_star': 'Blijf trouw, richt anderen.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Donkere Yin', 'taoist_practice_new': 'Rust, verzamel qi.',
            'taoist_moon_waxing_crescent': 'Ontkiemen', 'taoist_practice_waxing_crescent': 'Plant het zaad van intentie.',
            'taoist_moon_first_quarter': 'Groeien', 'taoist_practice_first_quarter': 'Duw door, win terrein.',
            'taoist_moon_waxing_gibbous': 'Rijpen', 'taoist_practice_waxing_gibbous': 'Verfijn je werk.',
            'taoist_moon_full': 'Helder Yang', 'taoist_practice_full': 'Vier, dank.',
            'taoist_moon_waning_gibbous': 'Delen', 'taoist_practice_waning_gibbous': 'Leer wat je weet.',
            'taoist_moon_last_quarter': 'Loslaten', 'taoist_practice_last_quarter': 'Laat los, vereenvoudig.',
            'taoist_moon_waning_crescent': 'Terugkeren', 'taoist_practice_waning_crescent': 'Trek je terug, bewaar, droom.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Vuur (火)',
            'taoist_element_water': 'Water (水)',
            'taoist_element_earth': 'Aarde (土)',
            'taoist_element_air': 'Wind (风)',
            'taoist_element_ether': 'Leegte (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Midzomervuur (夏至)', 'taoist_practice_summer_solstice': 'Eer het volle yang.',
            'taoist_festival_winter_solstice': 'Terugkeer van het licht (冬至)', 'taoist_practice_winter_solstice': 'Eer het pasgeboren yang.',
            'taoist_festival_spring_equinox': 'Lente-evenwicht (春分)', 'taoist_practice_spring_equinox': 'Plant, begin, breng in balans.',
            'taoist_festival_autumn_equinox': 'Herfst-evenwicht (秋分)', 'taoist_practice_autumn_equinox': 'Oogst, bewaar, laat los.',
            'taoist_festival_full_moon': 'Maanfeest (望)', 'taoist_practice_full_moon': 'Verzamel, dank, aanschouw de maan.',
            'taoist_festival_new_moon': 'Donkere maan (朔)', 'taoist_practice_new_moon': 'Rust, vast, vernieuw.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Lentegroenten, bamboescheuten, eieren', 'taoist_season_emergence_herbs': 'Munt, chrysant, groene thee',
            'taoist_season_radiance_foods': 'Meloen, komkommer, bittere groenten', 'taoist_season_radiance_herbs': 'Lotusblad, mungboon, pepermunt',
            'taoist_season_release_foods': 'Wortels, pompoen, rijst', 'taoist_season_release_herbs': 'Gember, goji, kaneel',
            'taoist_season_stillness_foods': 'Warme soepen, tofu, geconserveerd eten', 'taoist_season_stillness_herbs': 'Astragalus, zwarte thee, kruidnagel',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Begin iets nieuws met helderheid.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Dien de gezondheid; zorg voor lichaam en geest.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Bescherm dharma met moed.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Leer, chanteer, deel wijsheid.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Geniet van verbinding en zang.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Bewaak de drempel met toewijding.',
            'vedic_archetype_mystic': 'Yogi', 'vedic_practice_mystic': 'Mediteer, adem, ga naar binnen.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Los op wat niet meer dient.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Speel muziek, dwaal, zing.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Oefen de kunst tot het kracht wordt.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Geef en ontvang overvloed.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Bewaak de orde met gratie.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Wees het vaste punt van de draaiende hemel.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Donkere maan)', 'vedic_practice_new': 'Rust, vast, stel een sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Begin het nieuwe avontuur.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Verzamel kracht, handel.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Discipline, verfijn, vast zachtjes.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Dank, deel, vier.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Reflecteer, dien, vereenvoudig.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Laat hechtingen los, reinig.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Trek je terug, rust, droom.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Vuur)',
            'vedic_element_water': 'Jala (Water)',
            'vedic_element_earth': 'Prithvi (Aarde)',
            'vedic_element_air': 'Vayu (Lucht)',
            'vedic_element_ether': 'Akasha (Ether)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Dakshinayana begint', 'vedic_practice_summer_solstice': 'Eer de wending van de zon.',
            'vedic_festival_winter_solstice': 'Uttarayana begint', 'vedic_practice_winter_solstice': 'Vier de terugkeer van het licht.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Aanbid de Moeder, plant opnieuw.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Eer de godin, deel de oogst.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Mediteer, geef, vier.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Eer de voorouders, rust.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Groenten, spruiten, mango', 'vedic_season_emergence_herbs': 'Tulsi, kurkuma, koriander',
            'vedic_season_radiance_foods': 'Verkoelende yoghurt, komkommer, lassi', 'vedic_season_radiance_herbs': 'Venkel, munt, roos',
            'vedic_season_release_foods': 'Granen, ghee, wortelgroenten', 'vedic_season_release_herbs': 'Ashwagandha, gember, kardemom',
            'vedic_season_stillness_foods': 'Warme kitchari, noten, dadels', 'vedic_season_stillness_herbs': 'Triphala, kaneel, tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Schepster / Maakster', 'pagan_practice_creator': 'Vorm, weef, breng tot leven.',
            'pagan_archetype_healer': 'Groene heks', 'pagan_practice_healer': 'Werk met kruiden, verzorg wonden.',
            'pagan_archetype_warrior': 'Krijgsmaagd', 'pagan_practice_warrior': 'Sta voor waar je van houdt.',
            'pagan_archetype_sage': 'Oude wijze', 'pagan_practice_sage': 'Spreek de oude wijsheid helder.',
            'pagan_archetype_lover': 'Meikoningin', 'pagan_practice_lover': 'Vier het vlees en de aarde.',
            'pagan_archetype_guardian': 'Haardbewaker', 'pagan_practice_guardian': 'Bescherm huis en kring.',
            'pagan_archetype_mystic': 'Orakel / Zieneres', 'pagan_practice_mystic': 'Luister naar het tussenin.',
            'pagan_archetype_destroyer': 'Schaduwwerker', 'pagan_practice_destroyer': 'Laat los, composter, transformeer.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Lach om het heilige.',
            'pagan_archetype_magician': 'Heks / Spreukenwever', 'pagan_practice_magician': 'Wil, woord en gebaar.',
            'pagan_archetype_empress': 'Aardemoeder', 'pagan_practice_empress': 'Voed alles wat groeit.',
            'pagan_archetype_emperor': 'Gehoornde God / Koning', 'pagan_practice_emperor': 'Regeer de cyclus met kracht.',
            'pagan_archetype_star': 'Stergodin', 'pagan_practice_star': 'Weef het web, leid de weg.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Donkere maan', 'pagan_practice_new': 'Rust, droom, spreek geen spreuk.',
            'pagan_moon_waxing_crescent': 'Wassende maansikkel', 'pagan_practice_waxing_crescent': 'Begin, plant, trek aan.',
            'pagan_moon_first_quarter': 'Wassende halve maan', 'pagan_practice_first_quarter': 'Doorbreek obstakels.',
            'pagan_moon_waxing_gibbous': 'Wassende volle maan', 'pagan_practice_waxing_gibbous': 'Verfijn en versterk.',
            'pagan_moon_full': 'Esbat (Volle maan)', 'pagan_practice_full': 'Ritueel, laad op, laat los.',
            'pagan_moon_waning_gibbous': 'Afnemende volle maan', 'pagan_practice_waning_gibbous': 'Deel de overvloed.',
            'pagan_moon_last_quarter': 'Afnemende halve maan', 'pagan_practice_last_quarter': 'Snij weg wat bindt.',
            'pagan_moon_waning_crescent': 'Balsamische maan', 'pagan_practice_waning_crescent': 'Zwijg, rust, bereid je voor.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Vuur',
            'pagan_element_water': 'Water',
            'pagan_element_earth': 'Aarde',
            'pagan_element_air': 'Lucht',
            'pagan_element_ether': 'Geest / Aether',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Spring over het vuur, eer de zon.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Verbrand het blok, verwelkom het licht.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Plant zaden, breng licht en donker in balans.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Dank, bewaar de oogst.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Trek de kring, laad je werktuigen.',
            'pagan_festival_new_moon': 'Nieuwemaanritueel', 'pagan_practice_new_moon': 'Stel intenties in het donker.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Eieren, groenten, vroege bessen', 'pagan_season_emergence_herbs': 'Brandnetel, paardenbloem, munt',
            'pagan_season_radiance_foods': 'Bessen, maïs, tomaten', 'pagan_season_radiance_herbs': 'Lavendel, kamille, rozemarijn',
            'pagan_season_release_foods': 'Appels, pompoen, granen', 'pagan_season_release_herbs': 'Salie, kaneel, kruidnagel',
            'pagan_season_stillness_foods': 'Wortelgroenten, noten, conserven', 'pagan_season_stillness_herbs': 'Den, ceder, hulst',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Orden de chaos, begin.',
            'mesopotamian_archetype_healer': 'Genezer van Gula', 'mesopotamian_practice_healer': 'Verzorg wonden, gebruik de kruiden.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Vecht voor de oogst.',
            'mesopotamian_archetype_sage': 'Nabu (Schrijver)', 'mesopotamian_practice_sage': 'Schrijf, tel, leg vast.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Bemin stoutmoedig, vier.',
            'mesopotamian_archetype_guardian': 'Poortwachter van Shamash', 'mesopotamian_practice_guardian': 'Bewaak de poort van rechtvaardigheid.',
            'mesopotamian_archetype_mystic': 'Ziener van Enki', 'mesopotamian_practice_mystic': 'Duik in de diepe wateren.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Leid eindes, ruim verval op.',
            'mesopotamian_archetype_fool': 'Hofnar', 'mesopotamian_practice_fool': 'Spot met de machtigen, spreek de waarheid.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Tovenaar)', 'mesopotamian_practice_magician': 'Spreek het woord dat bindt.',
            'mesopotamian_archetype_empress': 'Koningin van de hemel (Ishtar)', 'mesopotamian_practice_empress': 'Heers met uitstraling.',
            'mesopotamian_archetype_emperor': 'Anu (Koning der goden)', 'mesopotamian_practice_emperor': 'Houd de hemelen en de wet.',
            'mesopotamian_archetype_star': 'Nanshe (Droomduider)', 'mesopotamian_practice_star': 'Lees de dromen en voortekens.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'Nieuwe maan (Arḫu)', 'mesopotamian_practice_new': 'Rust, wacht, plan.',
            'mesopotamian_moon_waxing_crescent': 'Rijzende sikkel', 'mesopotamian_practice_waxing_crescent': 'Begin het werk.',
            'mesopotamian_moon_first_quarter': 'Halve maan', 'mesopotamian_practice_first_quarter': 'Voer de campagne door.',
            'mesopotamian_moon_waxing_gibbous': 'Wassende volle maan', 'mesopotamian_practice_waxing_gibbous': 'Bouw de muren, sla graan op.',
            'mesopotamian_moon_full': 'Volle maan (Šapattu)', 'mesopotamian_practice_full': 'Rust van werk, feest, eer de goden.',
            'mesopotamian_moon_waning_gibbous': 'Afnemende volle maan', 'mesopotamian_practice_waning_gibbous': 'Verreken, deel.',
            'mesopotamian_moon_last_quarter': 'Afnemende halve maan', 'mesopotamian_practice_last_quarter': 'Snijd schulden door, rond taken af.',
            'mesopotamian_moon_waning_crescent': 'Donkere sikkel', 'mesopotamian_practice_waning_crescent': 'Stil de stad, houd wake.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Vuur van Girra',
            'mesopotamian_element_water': 'Wateren van Abzu (Ea)',
            'mesopotamian_element_earth': 'Aarde van Ki',
            'mesopotamian_element_air': 'Wind van Enlil',
            'mesopotamian_element_ether': 'Hemelen van Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Midzomer-Akitu', 'mesopotamian_practice_summer_solstice': 'Eer de zon op haar hoogtepunt.',
            'mesopotamian_festival_winter_solstice': 'Winter-Akitu', 'mesopotamian_practice_winter_solstice': 'Vernieuw het jaar in het donker.',
            'mesopotamian_festival_spring_equinox': 'Akitu (Nieuwjaar)', 'mesopotamian_practice_spring_equinox': 'Kroon de koning, vernieuw de wereld.',
            'mesopotamian_festival_autumn_equinox': 'Oogst van Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Rouw om en dank de stervende god.',
            'mesopotamian_festival_full_moon': 'Šapattu (Volle maan)', 'mesopotamian_practice_full_moon': 'Leg het werk neer, vier feest.',
            'mesopotamian_festival_new_moon': 'Arḫu (Nieuwe maan)', 'mesopotamian_practice_new_moon': 'Markeer de maand, wacht op de sikkel.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Gerst, dadels, groenten', 'mesopotamian_season_emergence_herbs': 'Tijm, komijn, koriander',
            'mesopotamian_season_radiance_foods': 'Vijgen, druiven, komkommers', 'mesopotamian_season_radiance_herbs': 'Munt, sesam, anijs',
            'mesopotamian_season_release_foods': 'Dadels, granaatappels, granen', 'mesopotamian_season_release_herbs': 'Saffraan, laurier, sesam',
            'mesopotamian_season_stillness_foods': 'Bewaard graan, gedroogde dadels, linzen', 'mesopotamian_season_stillness_herbs': 'Juniper, wierook, mirre',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Khnum', 'egyptian_practice_creator': 'Vorm de dag met intentie.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Beoefen geneeskunde, schrijf de remedies.',
            'egyptian_archetype_warrior': 'Sekhmet', 'egyptian_practice_warrior': 'Brand fel, bescherm Ma\'at.',
            'egyptian_archetype_sage': 'Thoth', 'egyptian_practice_sage': 'Tel, schrijf, meet de hemel.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Geniet van muziek, liefde en feest.',
            'egyptian_archetype_guardian': 'Anubis / Wepwawet', 'egyptian_practice_guardian': 'Bewaak de drempels van verandering.',
            'egyptian_archetype_mystic': 'Isis (Betoverares)', 'egyptian_practice_mystic': 'Weef spreuken van bescherming en leven.',
            'egyptian_archetype_destroyer': 'Seth (Verslinder)', 'egyptian_practice_destroyer': 'Doorbreek wat rigide is, ruim het oude op.',
            'egyptian_archetype_fool': 'Bes', 'egyptian_practice_fool': 'Dans, trommel, bewaak het huishouden.',
            'egyptian_archetype_magician': 'Kheri-heb (Heka-priester)', 'egyptian_practice_magician': 'Spreek de woorden van kracht.',
            'egyptian_archetype_empress': 'Isis / Mut', 'egyptian_practice_empress': 'Moeder alles, bescherm de troon.',
            'egyptian_archetype_emperor': 'Ra (Farao)', 'egyptian_practice_emperor': 'Sta op met de zon, orden het land.',
            'egyptian_archetype_star': 'Nut (Sterrenziener)', 'egyptian_practice_star': 'Lees de hemel, houd het kosmische ritme.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Donker van Nun', 'egyptian_practice_new': 'Rust in de wateren van het begin.',
            'egyptian_moon_waxing_crescent': 'Sikkel van Khonsu', 'egyptian_practice_waxing_crescent': 'Begin de reis.',
            'egyptian_moon_first_quarter': 'Groeide halve maan', 'egyptian_practice_first_quarter': 'Bouw met beide handen.',
            'egyptian_moon_waxing_gibbous': 'Wassende volle maan', 'egyptian_practice_waxing_gibbous': 'Verzamel kracht en graan.',
            'egyptian_moon_full': 'Oog van Khonsu (Vol)', 'egyptian_practice_full': 'Feest, eer de maangod.',
            'egyptian_moon_waning_gibbous': 'Afnemende volle maan', 'egyptian_practice_waning_gibbous': 'Geef terug, leg vast, verreken.',
            'egyptian_moon_last_quarter': 'Afnemende halve maan', 'egyptian_practice_last_quarter': 'Verlicht de last, reinig.',
            'egyptian_moon_waning_crescent': 'Afnemende sikkel', 'egyptian_practice_waning_crescent': 'Trek je terug, droom, bereid je voor op wedergeboorte.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Vuur van Ra',
            'egyptian_element_water': 'Wateren van Nun',
            'egyptian_element_earth': 'Aarde van Geb',
            'egyptian_element_air': 'Lucht van Shu',
            'egyptian_element_ether': 'Hemel van Nut',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Sothisch Nieuwjaar (Opkomst van Sirius)', 'egyptian_practice_summer_solstice': 'Markeer de vloed, begin het jaar.',
            'egyptian_festival_winter_solstice': 'Feest van de Verborgen Zon', 'egyptian_practice_winter_solstice': 'Eer de wedergeboorte van de zon in het donker.',
            'egyptian_festival_spring_equinox': 'Opet (Lenteopkomst)', 'egyptian_practice_spring_equinox': 'Processeer met de goden, zegen het land.',
            'egyptian_festival_autumn_equinox': 'Feest van Thoth', 'egyptian_practice_autumn_equinox': 'Eer schrijven, oordeel en evenwicht.',
            'egyptian_festival_full_moon': 'Feest van de Volle Maan', 'egyptian_practice_full_moon': 'Houd wake, offer, vier.',
            'egyptian_festival_new_moon': 'Feest van de Nieuwe Maan', 'egyptian_practice_new_moon': 'Vernieuw, reinig, begin.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Graan, tuinbonen, groenten', 'egyptian_season_emergence_herbs': 'Sla, munt, knoflook',
            'egyptian_season_radiance_foods': 'Vijgen, druiven, meloen', 'egyptian_season_radiance_herbs': 'Komijn, dille, ui',
            'egyptian_season_release_foods': 'Dadels, granaatappel, tarwe', 'egyptian_season_release_herbs': 'Wierook, mirre, anijs',
            'egyptian_season_stillness_foods': 'Bewaarde granen, gedroogde vis, honing', 'egyptian_season_stillness_herbs': 'Tijm, juniper, fenegriek',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Schepper)', 'mayan_practice_creator': 'Weef de nieuwe dag tot leven.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Verzorg het lichaam, werk met kruiden.',
            'mayan_archetype_warrior': 'Jaguar-krijger', 'mayan_practice_warrior': 'Beweeg in het donker, bescherm de stam.',
            'mayan_archetype_sage': 'Dagenteller (Aj Q\'ij)', 'mayan_practice_sage': 'Tel de dagen, lees de tekens.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Vier liefde en de nacht.',
            'mayan_archetype_guardian': 'Bewaker van Chac', 'mayan_practice_guardian': 'Bescherm water, regen en groei.',
            'mayan_archetype_mystic': 'Sjamaan (Aj Q\'ij)', 'mayan_practice_mystic': 'Reis tussen de werelden.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Leid eindes, verzorg de onderwereld.',
            'mayan_archetype_fool': 'Brulaap (Batz\')', 'mayan_practice_fool': 'Brul, trommel, knutsel, lach.',
            'mayan_archetype_magician': 'Tovenaar (God D)', 'mayan_practice_magician': 'Verander van vorm, zie verder.',
            'mayan_archetype_empress': 'Ix Chel (Maanmoeder)', 'mayan_practice_empress': 'Voed de schepping, weef het lot.',
            'mayan_archetype_emperor': 'Kinich Ahau (Zonneheer)', 'mayan_practice_emperor': 'Sta dagelijks op, voed de mensen.',
            'mayan_archetype_star': 'Venus (Ster van Kukulkan)', 'mayan_practice_star': 'Volg de dageraadster, leid de weg.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Donkere maan (Ik\')', 'mayan_practice_new': 'Rust, vast, luister.',
            'mayan_moon_waxing_crescent': 'Groeisikkel', 'mayan_practice_waxing_crescent': 'Plant, begin, groei.',
            'mayan_moon_first_quarter': 'Halve maan', 'mayan_practice_first_quarter': 'Ruim het veld, handel.',
            'mayan_moon_waxing_gibbous': 'Wassende volle maan', 'mayan_practice_waxing_gibbous': 'Oogst kracht, verfijn.',
            'mayan_moon_full': 'Volle maan (Nohoch)', 'mayan_practice_full': 'Feest, dank, laat los.',
            'mayan_moon_waning_gibbous': 'Afnemende volle maan', 'mayan_practice_waning_gibbous': 'Deel, leer, verdeel.',
            'mayan_moon_last_quarter': 'Afnemende halve maan', 'mayan_practice_last_quarter': 'Laat los, dunt uit, geef op.',
            'mayan_moon_waning_crescent': 'Ondergaande sikkel', 'mayan_practice_waning_crescent': 'Slaap, droom, vernieuw.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Vuur (K\'ak\')',
            'mayan_element_water': 'Water (Ha\')',
            'mayan_element_earth': 'Aarde (Kab)',
            'mayan_element_air': 'Wind (Ik\')',
            'mayan_element_ether': 'Hemel (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Zonnewendefeest', 'mayan_practice_summer_solstice': 'Eer de zon op haar hoogtepunt.',
            'mayan_festival_winter_solstice': 'Nieuw vuur (Terugkeer van de zon)', 'mayan_practice_winter_solstice': 'Steek het vuur opnieuw aan, vernieuw de cyclus.',
            'mayan_festival_spring_equinox': 'Afdaling van Kukulkan', 'mayan_practice_spring_equinox': 'Zie de slang de piramide afdalen.',
            'mayan_festival_autumn_equinox': 'Hemelvaart van Kukulkan', 'mayan_practice_autumn_equinox': 'Zie de slang opstijgen.',
            'mayan_festival_full_moon': 'Vollemaanceremonie', 'mayan_practice_full_moon': 'Chanteer, dans, offer.',
            'mayan_festival_new_moon': 'Nieuwvuurceremonie', 'mayan_practice_new_moon': 'Vast, reinig, stel een intentie.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Maïs, bonen, groenten', 'mayan_season_emergence_herbs': 'Epazote, koriander, munt',
            'mayan_season_radiance_foods': 'Maïs, tomaten, tropisch fruit', 'mayan_season_radiance_herbs': 'Achiote, chaya, limoen',
            'mayan_season_release_foods': 'Pompoen, maïsoogst, avocado', 'mayan_season_release_herbs': 'Piment, vanille, cacao',
            'mayan_season_stillness_foods': 'Gedroogde maïs, bonen, honing', 'mayan_season_stillness_herbs': 'Copal, cacao, sarsaparilla',
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
            'action.capture': 'Momint fêstlizze',
            'action.capture.title':
                'Meitsje in foto en stamp him mei dit Kairos-momint',
            'action.share': 'Dit momint diele',
            'action.share.title':
                'Eksportearje dit momint as tekst of ôfbylding',
            'kst.solar_longitude': '🌞 Sinnelingte',
            'kst.lunar_age': '🌙 Moanneleeftiid',
            'kst.sidereal_time': '🌀 Sideryske tiid',
            'kst.visible_star': '⭐ Sichtbere stjer',
            'kst.celestial_season': '🌍 Himelsk seizoen',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': 'Yn it seizoen',
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
            'config.time_system': '⏱️ Tiidsysteem',
            'config.time_system_hint':
                'Lês deselde himel troch in 13-dielige klok (13o / 28m / 13s) of it '
                + '26-oere ritme — 13 ljochte + 13 tsjustere oeren (26o / 28m / 7s). '
                + 'Natuerlike middei is yn beide sinnemiddei.',
            'config.time_system_current': '🌍 Aktuele tiid (24o / 60 / 60)',
            'config.time_system_natural': '🌿 Natuerlike tiid (13o / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Natuerlik',
            'config.time_system_kairos_natural': '🌿 Kairos Natuerlik (26o / 28m / 7s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Natuerlik',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Stappen / 28 Slagen / 7 Pulsen)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Sinneljocht sjen',
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
            'energy.archetype': 'Argetype',
            'energy.moon_mood': 'Moannestimming',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'Yn it seizoen',
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
            'help.todays_energy': 'De enerzjy fan hjoed',
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
            'season_button.Spring': 'Maaitiid',
            'season_button.Summer': 'Simmer',
            'season_button.Autumn': 'Hjerst',
            'season_button.Winter': 'Winter',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Kalinderylens',
            'config.energy_lens': '🌿 Enerzjylens',
            'config.month_style': '📅 Moannenammen',
            'config.month_style_kairos': '🌿 Kairos-moannen (Woartelmoanne, ens.)',
            'config.month_style_zodiac': '♐ Wiere Diereriem (Stienbok, ens.)',
            'config.index_style': '🔢 Werjef-yndeks',
            'config.index_style_zero': '🌿 Natuerlik (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Tradisjoneel (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Werjef-yndeks ynsteld op {style}',
            'obs.month_style_switched': 'Moannestyl ynsteld op {style}',
            'energy_lens_none': 'Gjin (suver Kairos)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoïsme',
            'energy_lens_vedic': 'Vedysk',
            'energy_lens_pagan': 'Heidensk / Wicca',
            'energy_lens_mesopotamian': 'Mesopotamysk',
            'energy_lens_egyptian': 'Egyptysk',
            'energy_lens_mayan': 'Maya',
            'direction_north': 'Noard',
            'direction_south': 'Súd',
            'direction_east': 'East',
            'direction_west': 'West',
            'direction_center': 'Midden',
            'color_red': 'Read',
            'color_blue': 'Blau',
            'color_green': 'Grien',
            'color_yellow': 'Giel',
            'color_white': 'Wyt',
            'color_black': 'Swart',
            'obs.energy_switched': 'Enerzjylens ynsteld op {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Meitsjer / Wever', 'curanderismo_practice_creator': 'Meitsje wat mei jo hannen.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Soargje foar josels of oaren.',
            'curanderismo_archetype_warrior': 'Beskermer / Wacht', 'curanderismo_practice_warrior': 'Stean foar wat wier is.',
            'curanderismo_archetype_sage': 'Aldste / Wiisheidsbewarder', 'curanderismo_practice_sage': 'Diel kennis of harkje djip.',
            'curanderismo_archetype_lover': 'Dûnser / Sammelder', 'curanderismo_practice_lover': 'Ferbin, diel iten, fieren.',
            'curanderismo_archetype_guardian': 'Wachter / Ferdigener', 'curanderismo_practice_guardian': 'Beskermje de swakken of it lân.',
            'curanderismo_archetype_mystic': 'Dreamer / Sjender', 'curanderismo_practice_mystic': 'Meditearje, dream, observearje.',
            'curanderismo_archetype_destroyer': 'Feroaringsman / Fjoerhoeder', 'curanderismo_practice_destroyer': 'Baarn wat net mear tsjinnet.',
            'curanderismo_archetype_fool': 'Trickster / Krie', 'curanderismo_practice_fool': 'Lakje, boartsje, brek it patroan.',
            'curanderismo_archetype_magician': 'Foarmferoarjer', 'curanderismo_practice_magician': 'Feroarje jo foarm, besyk wat nijs.',
            'curanderismo_archetype_empress': 'Mem / Ierdebewarder', 'curanderismo_practice_empress': 'Fiede, groei, ûntfang.',
            'curanderismo_archetype_emperor': 'Heit / Himbelbewarder', 'curanderismo_practice_emperor': 'Lied, bou, oarderje.',
            'curanderismo_archetype_star': 'Stjerrekijker / Weiberieder', 'curanderismo_practice_star': 'Hoop, fyzje, lieding.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Tsjuster / Wachtsjen', 'curanderismo_practice_new': 'Rêst, plant in siedzje (yntinsje).',
            'curanderismo_moon_waxing_crescent': 'Groei / Berte', 'curanderismo_practice_waxing_crescent': 'Set in earste stap.',
            'curanderismo_moon_first_quarter': 'Drukke / Oerflak komme', 'curanderismo_practice_first_quarter': 'Brek troch in barriêre.',
            'curanderismo_moon_waxing_gibbous': 'Bouwe / Fersterkje', 'curanderismo_practice_waxing_gibbous': 'Gean troch, ferfynje.',
            'curanderismo_moon_full': 'Helder / Fol', 'curanderismo_practice_full': 'Fier feest, tank, lit los.',
            'curanderismo_moon_waning_gibbous': 'Diele / Leare', 'curanderismo_practice_waning_gibbous': 'Bied jo kennis oan.',
            'curanderismo_moon_last_quarter': 'Loslitte / Snije', 'curanderismo_practice_last_quarter': 'Lit los wat swier is.',
            'curanderismo_moon_waning_crescent': 'Rêst / Dreamen', 'curanderismo_practice_waning_crescent': 'Sliep, dream, harkje.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Fjoer',
            'curanderismo_element_water': 'Wetter',
            'curanderismo_element_earth': 'Ierde',
            'curanderismo_element_air': 'Lucht',
            'curanderismo_element_ether': 'Ether / Geast',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Sinnefeest)', 'curanderismo_practice_summer_solstice': 'Sinne-opgongrite, fjoerseremoanje.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Moannefeest)', 'curanderismo_practice_winter_solstice': 'Nachtwacht, ferhalen fertelle.',
            'curanderismo_festival_spring_equinox': 'Blommeseremoanje', 'curanderismo_practice_spring_equinox': 'Plant siedzjes, bied blommen oan.',
            'curanderismo_festival_autumn_equinox': 'Bongerseremoanje', 'curanderismo_practice_autumn_equinox': 'Tank, diel iten.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Moedernacht)', 'curanderismo_practice_full_moon': 'Dûns, sjong, lit los.',
            'curanderismo_festival_new_moon': 'Seremoanje fan de tsjustere nacht', 'curanderismo_practice_new_moon': 'Fast, meditearje, stel in yntinsje.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Farske grienten, beien, aaien', 'curanderismo_season_emergence_herbs': 'Brantnettel, hynsteblom, munt',
            'curanderismo_season_radiance_foods': 'Mais, tomaten, paprika, pompoen', 'curanderismo_season_radiance_herbs': 'Basilicum, salie, rozemarijn',
            'curanderismo_season_release_foods': 'Pompoenen, woartelgriente, apels', 'curanderismo_season_release_herbs': 'Kanel, kruidnagel, gember',
            'curanderismo_season_stillness_foods': 'Beanen, nôt, drûge fruchten', 'curanderismo_season_stillness_herbs': 'Eucalyptus, dinnen, seder',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Ambachtman', 'taoist_practice_creator': 'Foarmje wat mei geduld en fakmanskip.',
            'taoist_archetype_healer': 'Krûdegenêzer', 'taoist_practice_healer': 'Bereid krûden, fersoargje it lichem.',
            'taoist_archetype_warrior': 'Beskermer', 'taoist_practice_warrior': 'Stean stevich, bewarje it lykwicht.',
            'taoist_archetype_sage': 'Wize', 'taoist_practice_sage': 'Bestudearje, lear helder.',
            'taoist_archetype_lover': 'Harmonisator', 'taoist_practice_lover': 'Fersoargje bannen, diel tee.',
            'taoist_archetype_guardian': 'Poartewachter', 'taoist_practice_guardian': 'Bewarje de drompel, hâld oarder.',
            'taoist_archetype_mystic': 'Unstjerlike', 'taoist_practice_mystic': 'Sit yn stilte, kultivearje qi.',
            'taoist_archetype_destroyer': 'Fernijer', 'taoist_practice_destroyer': 'Romje it âlde op, meitsje romte.',
            'taoist_archetype_fool': 'Swalker', 'taoist_practice_fool': 'Dwaal, lakje, libje ienfâldich.',
            'taoist_archetype_magician': 'Alchemist', 'taoist_practice_magician': 'Feroarje it lead binnenyn yn goud.',
            'taoist_archetype_empress': 'Mem', 'taoist_practice_empress': 'Fiede groei, wês romhertich.',
            'taoist_archetype_emperor': 'Patriarch', 'taoist_practice_emperor': 'Lied mei deugd, net mei twang.',
            'taoist_archetype_star': 'Poalstjer', 'taoist_practice_star': 'Bliuw trou, rjochtsje oaren.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Tsjustere Yin', 'taoist_practice_new': 'Rêst, sammel qi.',
            'taoist_moon_waxing_crescent': 'Untspriete', 'taoist_practice_waxing_crescent': 'Plant it siedzje fan yntinsje.',
            'taoist_moon_first_quarter': 'Groeie', 'taoist_practice_first_quarter': 'Duw troch, win terrein.',
            'taoist_moon_waxing_gibbous': 'Rypje', 'taoist_practice_waxing_gibbous': 'Ferfynje jo wurk.',
            'taoist_moon_full': 'Helder Yang', 'taoist_practice_full': 'Fier, tank.',
            'taoist_moon_waning_gibbous': 'Diele', 'taoist_practice_waning_gibbous': 'Lear wat jo witte.',
            'taoist_moon_last_quarter': 'Loslitte', 'taoist_practice_last_quarter': 'Lit los, ferienfâldigje.',
            'taoist_moon_waning_crescent': 'Weromkeare', 'taoist_practice_waning_crescent': 'Lûk jo werom, bewarje, dream.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Fjoer (火)',
            'taoist_element_water': 'Wetter (水)',
            'taoist_element_earth': 'Ierde (土)',
            'taoist_element_air': 'Wyn (风)',
            'taoist_element_ether': 'Leegte (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Midsimmerfjoer (夏至)', 'taoist_practice_summer_solstice': 'Earje it folle yang.',
            'taoist_festival_winter_solstice': 'Weromkomst fan it ljocht (冬至)', 'taoist_practice_winter_solstice': 'Earje it nijberne yang.',
            'taoist_festival_spring_equinox': 'Ljottelykwicht (春分)', 'taoist_practice_spring_equinox': 'Plant, begjin, balansearje.',
            'taoist_festival_autumn_equinox': 'Hjerstlykwicht (秋分)', 'taoist_practice_autumn_equinox': 'Bongelje, bewarje, lit los.',
            'taoist_festival_full_moon': 'Moannefeest (望)', 'taoist_practice_full_moon': 'Sammelje, tank, sjoch de moanne oan.',
            'taoist_festival_new_moon': 'Tsjustere moanne (朔)', 'taoist_practice_new_moon': 'Rêst, fast, fernij.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Ljottengriente, bamboespruten, aaien', 'taoist_season_emergence_herbs': 'Munt, krúsblom, griene tee',
            'taoist_season_radiance_foods': 'Meloen, komkommer, bittere griente', 'taoist_season_radiance_herbs': 'Lotusblêd, mungbean, pepermunt',
            'taoist_season_release_foods': 'Woartels, pompoen, rys', 'taoist_season_release_herbs': 'Gember, goji, kanel',
            'taoist_season_stillness_foods': 'Warme sop, tofu, konservearre iten', 'taoist_season_stillness_herbs': 'Astragalus, swarte tee, kruidnagel',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Begjin wat nijs mei helderheid.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Tsjinje sûnens; soargje foar lichem en geast.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Beskermje dharma mei moed.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Lear, sjong, diel wiisheid.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Geniet fan ferbining en sang.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Bewarje de drompel mei tawijing.',
            'vedic_archetype_mystic': 'Yogi', 'vedic_practice_mystic': 'Meditearje, sykhelje, gean nei binnen.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Los op wat net mear tsjinnet.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Spylje muzyk, dwaal, sjong.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Oefenje de keunst oant it krêft wurdt.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Jou en ûntfang oerfloed.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Bewarje de oarder mei genede.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Wês it fêste punt fan de draaiende himel.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Tsjustere moanne)', 'vedic_practice_new': 'Rêst, fast, stel in sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Begjin it nije aventoer.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Sammel krêft, hannelje.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Dissipline, ferfynje, fast sêft.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Tank, diel, fier.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Reflektearje, tsjinje, ferienfâldigje.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Lit hechtings los, reinigje.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Lûk jo werom, rêst, dream.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Fjoer)',
            'vedic_element_water': 'Jala (Wetter)',
            'vedic_element_earth': 'Prithvi (Ierde)',
            'vedic_element_air': 'Vayu (Lucht)',
            'vedic_element_ether': 'Akasha (Ether)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Dakshinayana begjint', 'vedic_practice_summer_solstice': 'Earje de kear fan de sinne.',
            'vedic_festival_winter_solstice': 'Uttarayana begjint', 'vedic_practice_winter_solstice': 'Fier de weromkomst fan it ljocht.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Oanbid de Mem, plant opnij.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Earje de goadinne, diel de bongel.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Meditearje, jou, fier.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Earje de foarâlden, rêst.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Griente, spruten, mango', 'vedic_season_emergence_herbs': 'Tulsi, koercuma, koriander',
            'vedic_season_radiance_foods': 'Koele yoghurt, komkommer, lassi', 'vedic_season_radiance_herbs': 'Fennel, munt, roas',
            'vedic_season_release_foods': 'Nôt, ghee, woartelgriente', 'vedic_season_release_herbs': 'Ashwagandha, gember, kardemom',
            'vedic_season_stillness_foods': 'Warme kitchari, nuten, dadels', 'vedic_season_stillness_herbs': 'Triphala, kanel, tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Skepper / Makker', 'pagan_practice_creator': 'Foarmje, weevje, bring ta libben.',
            'pagan_archetype_healer': 'Griene heks', 'pagan_practice_healer': 'Wurkje mei krûden, fersoargje wûnen.',
            'pagan_archetype_warrior': 'Krigersfamke', 'pagan_practice_warrior': 'Stean foar wêrfan jo hâlde.',
            'pagan_archetype_sage': 'Alde wize', 'pagan_practice_sage': 'Spreek de âlde wiisheid helder.',
            'pagan_archetype_lover': 'Maaiekeninginne', 'pagan_practice_lover': 'Fier it fleis en de ierde.',
            'pagan_archetype_guardian': 'Herdbewarder', 'pagan_practice_guardian': 'Beskermje hûs en rûnte.',
            'pagan_archetype_mystic': 'Orakel / Sjender', 'pagan_practice_mystic': 'Harkje nei it tuskenin.',
            'pagan_archetype_destroyer': 'Skaadwurker', 'pagan_practice_destroyer': 'Lit los, kompostearje, transformearje.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Lakje om it hillige.',
            'pagan_archetype_magician': 'Heks / Spreukewever', 'pagan_practice_magician': 'Wille, wurd en gebeart.',
            'pagan_archetype_empress': 'Ierdenmem', 'pagan_practice_empress': 'Fiede alles wat groeit.',
            'pagan_archetype_emperor': 'Hoarnige God / Kening', 'pagan_practice_emperor': 'Regearje de syklus mei krêft.',
            'pagan_archetype_star': 'Stjergoadinne', 'pagan_practice_star': 'Weevje it web, lied de wei.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Tsjustere moanne', 'pagan_practice_new': 'Rêst, dream, sprek gjin spreuk.',
            'pagan_moon_waxing_crescent': 'Waaksende moannesiker', 'pagan_practice_waxing_crescent': 'Begjin, plant, lûk oan.',
            'pagan_moon_first_quarter': 'Waaksende heale moanne', 'pagan_practice_first_quarter': 'Brek troch obstakels.',
            'pagan_moon_waxing_gibbous': 'Waaksende folle moanne', 'pagan_practice_waxing_gibbous': 'Ferfynje en fersterkje.',
            'pagan_moon_full': 'Esbat (Folle moanne)', 'pagan_practice_full': 'Ritueel, laad op, lit los.',
            'pagan_moon_waning_gibbous': 'Ofnimmende folle moanne', 'pagan_practice_waning_gibbous': 'Diel de oerfloed.',
            'pagan_moon_last_quarter': 'Ofnimmende heale moanne', 'pagan_practice_last_quarter': 'Snij fuort wat bûnt.',
            'pagan_moon_waning_crescent': 'Balsamyske moanne', 'pagan_practice_waning_crescent': 'Swij, rêst, meitsje jo ree.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Fjoer',
            'pagan_element_water': 'Wetter',
            'pagan_element_earth': 'Ierde',
            'pagan_element_air': 'Lucht',
            'pagan_element_ether': 'Geast / Aether',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Spring oer it fjoer, earje de sinne.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Baarn it blok, ferwolkom it ljocht.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Plant siedzjes, balansearje ljocht en tsjuster.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Tank, bewarje de bongel.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Lûk de sirkel, laad jo reau op.',
            'pagan_festival_new_moon': 'Nijemoanneritueel', 'pagan_practice_new_moon': 'Stel yntinsjes yn it tsjuster.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Aaien, griente, iere beien', 'pagan_season_emergence_herbs': 'Brantnettel, hynsteblom, munt',
            'pagan_season_radiance_foods': 'Beien, mais, tomaten', 'pagan_season_radiance_herbs': 'Lavendel, kamille, rozemarijn',
            'pagan_season_release_foods': 'Apels, pompoen, nôt', 'pagan_season_release_herbs': 'Salie, kanel, kruidnagel',
            'pagan_season_stillness_foods': 'Woartelgriente, nuten, konserves', 'pagan_season_stillness_herbs': 'Dinnen, seder, hulst',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Oarderje de chaos, begjin.',
            'mesopotamian_archetype_healer': 'Genêzer fan Gula', 'mesopotamian_practice_healer': 'Fersoargje wûnen, brûk de krûden.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Fjochtsje foar de bongel.',
            'mesopotamian_archetype_sage': 'Nabu (Skriuwer)', 'mesopotamian_practice_sage': 'Skriuw, tel, liz fêst.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Beminmoedich, fier.',
            'mesopotamian_archetype_guardian': 'Poartewachter fan Shamash', 'mesopotamian_practice_guardian': 'Bewarje de poarte fan rjochtfeardigens.',
            'mesopotamian_archetype_mystic': 'Sjender fan Enki', 'mesopotamian_practice_mystic': 'Dûk yn de djip wetter.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Lied einigen, romje ferfal op.',
            'mesopotamian_archetype_fool': 'Hofnar', 'mesopotamian_practice_fool': 'Spot mei de machtigen, sprek de wierheid.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Tsjoender)', 'mesopotamian_practice_magician': 'Spreek it wurd dat bûnt.',
            'mesopotamian_archetype_empress': 'Keninginne fan de himel (Ishtar)', 'mesopotamian_practice_empress': 'Regearje mei útstrieling.',
            'mesopotamian_archetype_emperor': 'Anu (Kening fan de goaden)', 'mesopotamian_practice_emperor': 'Hâld de himelen en de wet.',
            'mesopotamian_archetype_star': 'Nanshe (Dreamlêzer)', 'mesopotamian_practice_star': 'Lês de dreamen en foartekens.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'Nije moanne (Arḫu)', 'mesopotamian_practice_new': 'Rêst, wachtsje, plan.',
            'mesopotamian_moon_waxing_crescent': 'Rizende siker', 'mesopotamian_practice_waxing_crescent': 'Begjin it wurk.',
            'mesopotamian_moon_first_quarter': 'Heale moanne', 'mesopotamian_practice_first_quarter': 'Trochset de kampanje.',
            'mesopotamian_moon_waxing_gibbous': 'Waaksende folle moanne', 'mesopotamian_practice_waxing_gibbous': 'Bou de muorren, slach nôt op.',
            'mesopotamian_moon_full': 'Folle moanne (Šapattu)', 'mesopotamian_practice_full': 'Rêst fan wurk, feest, earje de goaden.',
            'mesopotamian_moon_waning_gibbous': 'Ofnimmende folle moanne', 'mesopotamian_practice_waning_gibbous': 'Ferrekenje, diel.',
            'mesopotamian_moon_last_quarter': 'Ofnimmende heale moanne', 'mesopotamian_practice_last_quarter': 'Snij skulden troch, foltôch taken.',
            'mesopotamian_moon_waning_crescent': 'Tsjustere siker', 'mesopotamian_practice_waning_crescent': 'Stil de stêd, hâld wacht.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Fjoer fan Girra',
            'mesopotamian_element_water': 'Wetters fan Abzu (Ea)',
            'mesopotamian_element_earth': 'Ierde fan Ki',
            'mesopotamian_element_air': 'Wyn fan Enlil',
            'mesopotamian_element_ether': 'Himelen fan Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Midsimmer-Akitu', 'mesopotamian_practice_summer_solstice': 'Earje de sinne op har hichtepunt.',
            'mesopotamian_festival_winter_solstice': 'Winter-Akitu', 'mesopotamian_practice_winter_solstice': 'Fernij it jier yn it tsjuster.',
            'mesopotamian_festival_spring_equinox': 'Akitu (Nijjier)', 'mesopotamian_practice_spring_equinox': 'Kroanje de kening, fernij de wrâld.',
            'mesopotamian_festival_autumn_equinox': 'Bongel fan Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Rouje om en tankje de stjerrende god.',
            'mesopotamian_festival_full_moon': 'Šapattu (Folle moanne)', 'mesopotamian_practice_full_moon': 'Liz it wurk del, fier feest.',
            'mesopotamian_festival_new_moon': 'Arḫu (Nije moanne)', 'mesopotamian_practice_new_moon': 'Markearje de moanne, wachtsje op de siker.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Gerst, dadels, griente', 'mesopotamian_season_emergence_herbs': 'Tym, komyn, koriander',
            'mesopotamian_season_radiance_foods': 'Figen, druven, komkommers', 'mesopotamian_season_radiance_herbs': 'Munt, sesam, anys',
            'mesopotamian_season_release_foods': 'Dadels, granaatappels, nôt', 'mesopotamian_season_release_herbs': 'Saffraan, laurier, sesam',
            'mesopotamian_season_stillness_foods': 'Bewarre nôt, drûge dadels, linzen', 'mesopotamian_season_stillness_herbs': 'Juniper, wijreek, mirre',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Khnum', 'egyptian_practice_creator': 'Foarmje de dei mei yntinsje.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Oefenje genêskunde, skriuw de remedies.',
            'egyptian_archetype_warrior': 'Sekhmet', 'egyptian_practice_warrior': 'Baarn fûl, beskermje Ma\'at.',
            'egyptian_archetype_sage': 'Thoth', 'egyptian_practice_sage': 'Tel, skriuw, mjit de himel.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Geniet fan muzyk, leafde en feest.',
            'egyptian_archetype_guardian': 'Anubis / Wepwawet', 'egyptian_practice_guardian': 'Bewarje de drompels fan feroaring.',
            'egyptian_archetype_mystic': 'Isis (Tsjoenster)', 'egyptian_practice_mystic': 'Weevje spreuken fan beskerming en libben.',
            'egyptian_archetype_destroyer': 'Seth (Ferslynder)', 'egyptian_practice_destroyer': 'Brek wat rûch is, romje it âlde op.',
            'egyptian_archetype_fool': 'Bes', 'egyptian_practice_fool': 'Dûns, trommel, bewarje it húshâlden.',
            'egyptian_archetype_magician': 'Kheri-heb (Heka-pryster)', 'egyptian_practice_magician': 'Spreek de wurden fan krêft.',
            'egyptian_archetype_empress': 'Isis / Mut', 'egyptian_practice_empress': 'Mem alles, beskermje de troan.',
            'egyptian_archetype_emperor': 'Ra (Farao)', 'egyptian_practice_emperor': 'Stean op mei de sinne, oarderje it lân.',
            'egyptian_archetype_star': 'Nut (Stjerresjender)', 'egyptian_practice_star': 'Lês de himel, hâld it kosmyske ritme.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Tsjuster fan Nun', 'egyptian_practice_new': 'Rêst yn de wetters fan it begjin.',
            'egyptian_moon_waxing_crescent': 'Siker fan Khonsu', 'egyptian_practice_waxing_crescent': 'Begjin de reis.',
            'egyptian_moon_first_quarter': 'Groeide heale moanne', 'egyptian_practice_first_quarter': 'Bou mei beide hannen.',
            'egyptian_moon_waxing_gibbous': 'Waaksende folle moanne', 'egyptian_practice_waxing_gibbous': 'Sammel krêft en nôt.',
            'egyptian_moon_full': 'Each fan Khonsu (Fol)', 'egyptian_practice_full': 'Feest, earje de moannegod.',
            'egyptian_moon_waning_gibbous': 'Ofnimmende folle moanne', 'egyptian_practice_waning_gibbous': 'Jou werom, liz fêst, ferrekenje.',
            'egyptian_moon_last_quarter': 'Ofnimmende heale moanne', 'egyptian_practice_last_quarter': 'Ferljochtsje de lêst, reinigje.',
            'egyptian_moon_waning_crescent': 'Ofnimmende siker', 'egyptian_practice_waning_crescent': 'Lûk jo werom, dream, meitsje jo ree foar werberte.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Fjoer fan Ra',
            'egyptian_element_water': 'Wetters fan Nun',
            'egyptian_element_earth': 'Ierde fan Geb',
            'egyptian_element_air': 'Lucht fan Shu',
            'egyptian_element_ether': 'Himel fan Nut',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Sothysk Nijjier (Opkomst fan Sirius)', 'egyptian_practice_summer_solstice': 'Markearje de floed, begjin it jier.',
            'egyptian_festival_winter_solstice': 'Feest fan de Ferburgen Sinne', 'egyptian_practice_winter_solstice': 'Earje de werberte fan de sinne yn it tsjuster.',
            'egyptian_festival_spring_equinox': 'Opet (Ljotopkomst)', 'egyptian_practice_spring_equinox': 'Optocht mei de goaden, sein it lân.',
            'egyptian_festival_autumn_equinox': 'Feest fan Thoth', 'egyptian_practice_autumn_equinox': 'Earje skriuwen, oardiel en lykwicht.',
            'egyptian_festival_full_moon': 'Feest fan de Folle Moanne', 'egyptian_practice_full_moon': 'Hâld wacht, bied oan, fier.',
            'egyptian_festival_new_moon': 'Feest fan de Nije Moanne', 'egyptian_practice_new_moon': 'Fernij, reinigje, begjin.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Nôt, túnbeane, griente', 'egyptian_season_emergence_herbs': 'Sla, munt, knyflok',
            'egyptian_season_radiance_foods': 'Figen, druven, meloen', 'egyptian_season_radiance_herbs': 'Komyn, dille, sipel',
            'egyptian_season_release_foods': 'Dadels, granaatappel, weet', 'egyptian_season_release_herbs': 'Wijreek, mirre, anys',
            'egyptian_season_stillness_foods': 'Bewarre nôt, drûge fisk, huning', 'egyptian_season_stillness_herbs': 'Tym, juniper, fenegriek',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Skepper)', 'mayan_practice_creator': 'Weevje de nije dei ta libben.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Fersoargje it lichem, wurkje mei krûden.',
            'mayan_archetype_warrior': 'Jaguar-kriger', 'mayan_practice_warrior': 'Beweech yn it tsjuster, beskermje de stam.',
            'mayan_archetype_sage': 'Deiteller (Aj Q\'ij)', 'mayan_practice_sage': 'Tel de dagen, lês de tekens.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Fier leafde en de nacht.',
            'mayan_archetype_guardian': 'Bewarder fan Chac', 'mayan_practice_guardian': 'Beskermje wetter, rein en groei.',
            'mayan_archetype_mystic': 'Sjamaan (Aj Q\'ij)', 'mayan_practice_mystic': 'Reizgje tusken de wrâlden.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Lied einigen, fersoargje de ûnderwrâld.',
            'mayan_archetype_fool': 'Brulaap (Batz\')', 'mayan_practice_fool': 'Brul, trommel, knutselje, lakje.',
            'mayan_archetype_magician': 'Tsjoender (God D)', 'mayan_practice_magician': 'Feroarje fan foarm, sjoch fierder.',
            'mayan_archetype_empress': 'Ix Chel (Moannemem)', 'mayan_practice_empress': 'Fiede de skepping, weevje it lot.',
            'mayan_archetype_emperor': 'Kinich Ahau (Sinnehear)', 'mayan_practice_emperor': 'Stean deistich op, fiede de minsken.',
            'mayan_archetype_star': 'Venus (Stjer fan Kukulkan)', 'mayan_practice_star': 'Folgje de moarnstjer, lied de wei.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Tsjustere moanne (Ik\')', 'mayan_practice_new': 'Rêst, fast, harkje.',
            'mayan_moon_waxing_crescent': 'Groeisiker', 'mayan_practice_waxing_crescent': 'Plant, begjin, groei.',
            'mayan_moon_first_quarter': 'Heale moanne', 'mayan_practice_first_quarter': 'Romje it fjild, hannelje.',
            'mayan_moon_waxing_gibbous': 'Waaksende folle moanne', 'mayan_practice_waxing_gibbous': 'Bongelje krêft, ferfynje.',
            'mayan_moon_full': 'Folle moanne (Nohoch)', 'mayan_practice_full': 'Feest, tank, lit los.',
            'mayan_moon_waning_gibbous': 'Ofnimmende folle moanne', 'mayan_practice_waning_gibbous': 'Diel, lear, ferdiel.',
            'mayan_moon_last_quarter': 'Ofnimmende heale moanne', 'mayan_practice_last_quarter': 'Lit los, dun út, jou op.',
            'mayan_moon_waning_crescent': 'Undergiende siker', 'mayan_practice_waning_crescent': 'Sliep, dream, fernij.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Fjoer (K\'ak\')',
            'mayan_element_water': 'Wetter (Ha\')',
            'mayan_element_earth': 'Ierde (Kab)',
            'mayan_element_air': 'Wyn (Ik\')',
            'mayan_element_ether': 'Himel (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Sinnekearfeest', 'mayan_practice_summer_solstice': 'Earje de sinne op har hichtepunt.',
            'mayan_festival_winter_solstice': 'Nij fjoer (Weromkomst fan de sinne)', 'mayan_practice_winter_solstice': 'Stek it fjoer opnij oan, fernij de syklus.',
            'mayan_festival_spring_equinox': 'Ôfdaling fan Kukulkan', 'mayan_practice_spring_equinox': 'Sjoch de slange de piramide ôfdale.',
            'mayan_festival_autumn_equinox': 'Opfeart fan Kukulkan', 'mayan_practice_autumn_equinox': 'Sjoch de slange opstiigje.',
            'mayan_festival_full_moon': 'Follemoanneseremoanje', 'mayan_practice_full_moon': 'Sjong, dûns, bied oan.',
            'mayan_festival_new_moon': 'Nijfjoerseremoanje', 'mayan_practice_new_moon': 'Fast, reinigje, stel in yntinsje.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Mais, beane, griente', 'mayan_season_emergence_herbs': 'Epazote, koriander, munt',
            'mayan_season_radiance_foods': 'Mais, tomaten, tropysk fruit', 'mayan_season_radiance_herbs': 'Achiote, chaya, limoen',
            'mayan_season_release_foods': 'Pompoen, maisbongel, avocado', 'mayan_season_release_herbs': 'Piment, vanille, kaka',
            'mayan_season_stillness_foods': 'Drûge mais, beane, huning', 'mayan_season_stillness_herbs': 'Copal, kaka, sarsaparilla',
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
            'action.capture': 'Moment festhalten',
            'action.capture.title':
                'Ein Foto aufnehmen und mit diesem Kairos-Moment stempeln',
            'action.share': 'Diesen Moment teilen',
            'action.share.title':
                'Diesen Moment als Text oder Bild exportieren',
            'kst.solar_longitude': '🌞 Sonnenlänge',
            'kst.lunar_age': '🌙 Mondalter',
            'kst.sidereal_time': '🌀 Sternzeit',
            'kst.visible_star': '⭐ Sichtbarer Stern',
            'kst.celestial_season': '🌍 Himmlische Jahreszeit',
            'kst.planets': '🪐 Planeten',
            'seasonal.in_season': 'In der Saison',
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
            'config.time_system': '⏱️ Zeitsystem',
            'config.time_system_hint':
                'Lies denselben Himmel durch eine 13-basierte Uhr (13h / 28m / 13s) '
                + 'oder den 26-Stunden-Rhythmus — 13 helle + 13 dunkle Stunden '
                + '(26h / 28m / 7s). Natürlicher Mittag ist in beiden Sonnenmittag.',
            'config.time_system_current': '🌍 Aktuelle Zeit (24h / 60 / 60)',
            'config.time_system_natural': '🌿 Natürliche Zeit (13h / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Natürlich',
            'config.time_system_kairos_natural': '🌿 Kairos Natürlich (26h / 28m / 7s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Natürlich',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Schritte / 28 Schläge / 7 Pulse)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Sonnenlicht anzeigen',
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
            'energy.archetype': 'Archetyp',
            'energy.moon_mood': 'Mondstimmung',
            'energy.element': '{glyph} Element',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'In der Saison',
            'energy.festival': 'Festival',
            'energy.food': 'Nahrung',
            'help.what_am_i_looking_at': 'Worauf schaue ich?',
            'help.planets_now': '🪐 Die Planeten jetzt (esoterische Hinweise)',
            'help.planet_in': 'in {sign}',
            'help.planets_fallback':
                'Die Planetenpositionen stammen von der Himmels-Engine — mit '
                + 'dem Server von Skyfield; offline von einem kompakten '
                + 'Browser-Algorithmus (web/planets.js).',
            'help.todays_energy': 'Die Energie von heute',
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
            'season_button.Spring': 'Frühling',
            'season_button.Summer': 'Sommer',
            'season_button.Autumn': 'Herbst',
            'season_button.Winter': 'Winter',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Kalenderlinse',
            'config.energy_lens': '🌿 Energielinse',
            'config.month_style': '📅 Monatsnamen',
            'config.month_style_kairos': '🌿 Kairos-Monde (Wurzelmond, usw.)',
            'config.month_style_zodiac': '♐ Wahre Tierkreiszeichen (Steinbock, usw.)',
            'config.index_style': '🔢 Anzeige-Index',
            'config.index_style_zero': '🌿 Natürlich (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Traditionell (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Anzeige-Index gesetzt auf {style}',
            'obs.month_style_switched': 'Monatsstil gesetzt auf {style}',
            'energy_lens_none': 'Keine (reines Kairos)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoistisch',
            'energy_lens_vedic': 'Vedisch',
            'energy_lens_pagan': 'Heidnisch / Wicca',
            'energy_lens_mesopotamian': 'Mesopotamisch',
            'energy_lens_egyptian': 'Ägyptisch',
            'energy_lens_mayan': 'Maya',
            'direction_north': 'Norden',
            'direction_south': 'Süden',
            'direction_east': 'Osten',
            'direction_west': 'Westen',
            'direction_center': 'Mitte',
            'color_red': 'Rot',
            'color_blue': 'Blau',
            'color_green': 'Grün',
            'color_yellow': 'Gelb',
            'color_white': 'Weiß',
            'color_black': 'Schwarz',
            'obs.energy_switched': 'Energielinse gesetzt auf {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Macher / Weber', 'curanderismo_practice_creator': 'Erschaffe etwas mit deinen Händen.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Kümmere dich um dich oder andere.',
            'curanderismo_archetype_warrior': 'Beschützer / Wächter', 'curanderismo_practice_warrior': 'Steh für etwas Wahres ein.',
            'curanderismo_archetype_sage': 'Älteste/r / Weisheitshüter', 'curanderismo_practice_sage': 'Teile Wissen oder höre tief zu.',
            'curanderismo_archetype_lover': 'Tänzer / Sammler', 'curanderismo_practice_lover': 'Verbinde, teile Essen, feiere.',
            'curanderismo_archetype_guardian': 'Wächter / Verteidiger', 'curanderismo_practice_guardian': 'Schütze die Schwachen oder das Land.',
            'curanderismo_archetype_mystic': 'Träumer / Seher', 'curanderismo_practice_mystic': 'Meditiere, träume, beobachte.',
            'curanderismo_archetype_destroyer': 'Verwandler / Feuerhüter', 'curanderismo_practice_destroyer': 'Verbrenne, was nicht mehr dient.',
            'curanderismo_archetype_fool': 'Trickster / Krähe', 'curanderismo_practice_fool': 'Lache, spiele, brich das Muster.',
            'curanderismo_archetype_magician': 'Gestaltwandler', 'curanderismo_practice_magician': 'Verändere deine Form, probiere etwas Neues.',
            'curanderismo_archetype_empress': 'Mutter / Erdenhüterin', 'curanderismo_practice_empress': 'Nähre, wachse, empfange.',
            'curanderismo_archetype_emperor': 'Vater / Himmelshüter', 'curanderismo_practice_emperor': 'Führe, baue, ordne.',
            'curanderismo_archetype_star': 'Sterngucker / Wegbahner', 'curanderismo_practice_star': 'Hoffnung, Vision, Führung.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Dunkel / Warten', 'curanderismo_practice_new': 'Ruhe, pflanze einen Samen (Absicht).',
            'curanderismo_moon_waxing_crescent': 'Wachsen / Gebären', 'curanderismo_practice_waxing_crescent': 'Mache den ersten Schritt.',
            'curanderismo_moon_first_quarter': 'Drängen / Hervortreten', 'curanderismo_practice_first_quarter': 'Durchbrich eine Barriere.',
            'curanderismo_moon_waxing_gibbous': 'Bauen / Stärken', 'curanderismo_practice_waxing_gibbous': 'Mach weiter, verfeinere.',
            'curanderismo_moon_full': 'Hell / Voll', 'curanderismo_practice_full': 'Feiere, danke, lass los.',
            'curanderismo_moon_waning_gibbous': 'Teilen / Lehren', 'curanderismo_practice_waning_gibbous': 'Biete dein Wissen an.',
            'curanderismo_moon_last_quarter': 'Loslassen / Schneiden', 'curanderismo_practice_last_quarter': 'Lass los, was schwer ist.',
            'curanderismo_moon_waning_crescent': 'Ruhen / Träumen', 'curanderismo_practice_waning_crescent': 'Schlafe, träume, lausche.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Feuer',
            'curanderismo_element_water': 'Wasser',
            'curanderismo_element_earth': 'Erde',
            'curanderismo_element_air': 'Luft',
            'curanderismo_element_ether': 'Äther / Geist',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Sonnenfest)', 'curanderismo_practice_summer_solstice': 'Sonnenaufgangsritual, Feuerzeremonie.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Mondfest)', 'curanderismo_practice_winter_solstice': 'Nachtwache, Geschichten erzählen.',
            'curanderismo_festival_spring_equinox': 'Blütenzeremonie', 'curanderismo_practice_spring_equinox': 'Pflanze Samen, opfere Blumen.',
            'curanderismo_festival_autumn_equinox': 'Erntezeremonie', 'curanderismo_practice_autumn_equinox': 'Danke, teile Essen.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Mutternacht)', 'curanderismo_practice_full_moon': 'Tanze, singe, lass los.',
            'curanderismo_festival_new_moon': 'Zeremonie der dunklen Nacht', 'curanderismo_practice_new_moon': 'Faste, meditiere, setze eine Absicht.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Frisches Grün, Beeren, Eier', 'curanderismo_season_emergence_herbs': 'Brennnessel, Löwenzahn, Minze',
            'curanderismo_season_radiance_foods': 'Mais, Tomaten, Paprika, Kürbis', 'curanderismo_season_radiance_herbs': 'Basilikum, Salbei, Rosmarin',
            'curanderismo_season_release_foods': 'Kürbisse, Wurzelgemüse, Äpfel', 'curanderismo_season_release_herbs': 'Zimt, Nelke, Ingwer',
            'curanderismo_season_stillness_foods': 'Bohnen, Getreide, Trockenfrüchte', 'curanderismo_season_stillness_herbs': 'Eukalyptus, Kiefer, Zeder',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Handwerker', 'taoist_practice_creator': 'Forme etwas mit Geduld und Können.',
            'taoist_archetype_healer': 'Kräuterkundige/r', 'taoist_practice_healer': 'Bereite Kräuter, pflege den Körper.',
            'taoist_archetype_warrior': 'Beschützer', 'taoist_practice_warrior': 'Stehe fest, bewahre das Gleichgewicht.',
            'taoist_archetype_sage': 'Weiser', 'taoist_practice_sage': 'Studiere, dann lehre klar.',
            'taoist_archetype_lover': 'Harmonisierer', 'taoist_practice_lover': 'Pflege Bindungen, teile Tee.',
            'taoist_archetype_guardian': 'Torwächter', 'taoist_practice_guardian': 'Bewache die Schwelle, halte Ordnung.',
            'taoist_archetype_mystic': 'Unsterblicher', 'taoist_practice_mystic': 'Sitze in der Stille, kultiviere Qi.',
            'taoist_archetype_destroyer': 'Erneuerer', 'taoist_practice_destroyer': 'Räume das Alte weg, schaffe Raum.',
            'taoist_archetype_fool': 'Wanderer', 'taoist_practice_fool': 'Wandere, lache, lebe einfach.',
            'taoist_archetype_magician': 'Alchemist', 'taoist_practice_magician': 'Verwandle das Blei in dir zu Gold.',
            'taoist_archetype_empress': 'Mutter', 'taoist_practice_empress': 'Nähre Wachstum, sei großzügig.',
            'taoist_archetype_emperor': 'Patriarch', 'taoist_practice_emperor': 'Führe mit Tugend, nicht mit Zwang.',
            'taoist_archetype_star': 'Nordstern', 'taoist_practice_star': 'Bleibe treu, orientiere andere.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Dunkles Yin', 'taoist_practice_new': 'Ruhe, sammle Qi.',
            'taoist_moon_waxing_crescent': 'Keimen', 'taoist_practice_waxing_crescent': 'Pflanze den Samen der Absicht.',
            'taoist_moon_first_quarter': 'Wachsen', 'taoist_practice_first_quarter': 'Dränge voran, gewinne Boden.',
            'taoist_moon_waxing_gibbous': 'Reifen', 'taoist_practice_waxing_gibbous': 'Verfeinere dein Werk.',
            'taoist_moon_full': 'Helles Yang', 'taoist_practice_full': 'Feiere, danke.',
            'taoist_moon_waning_gibbous': 'Teilen', 'taoist_practice_waning_gibbous': 'Lehre, was du weißt.',
            'taoist_moon_last_quarter': 'Loslassen', 'taoist_practice_last_quarter': 'Lass los, vereinfache.',
            'taoist_moon_waning_crescent': 'Rückkehr', 'taoist_practice_waning_crescent': 'Ziehe dich zurück, bewahre, träume.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Feuer (火)',
            'taoist_element_water': 'Wasser (水)',
            'taoist_element_earth': 'Erde (土)',
            'taoist_element_air': 'Wind (风)',
            'taoist_element_ether': 'Leere (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Mittsommerfeuer (夏至)', 'taoist_practice_summer_solstice': 'Ehre das volle Yang.',
            'taoist_festival_winter_solstice': 'Rückkehr des Lichts (冬至)', 'taoist_practice_winter_solstice': 'Ehre das neugeborene Yang.',
            'taoist_festival_spring_equinox': 'Frühlingsgleichgewicht (春分)', 'taoist_practice_spring_equinox': 'Pflanze, beginne, balanciere.',
            'taoist_festival_autumn_equinox': 'Herbstgleichgewicht (秋分)', 'taoist_practice_autumn_equinox': 'Ernte, lagere, lass los.',
            'taoist_festival_full_moon': 'Mondfest (望)', 'taoist_practice_full_moon': 'Versammle dich, danke, schaue den Mond an.',
            'taoist_festival_new_moon': 'Dunkler Mond (朔)', 'taoist_practice_new_moon': 'Ruhe, faste, erneuere.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Frühlingsgrün, Bambussprossen, Eier', 'taoist_season_emergence_herbs': 'Minze, Chrysantheme, grüner Tee',
            'taoist_season_radiance_foods': 'Melone, Gurke, bitteres Grün', 'taoist_season_radiance_herbs': 'Lotusblatt, Mungobohne, Pfefferminze',
            'taoist_season_release_foods': 'Wurzeln, Kürbis, Reis', 'taoist_season_release_herbs': 'Ingwer, Goji, Zimt',
            'taoist_season_stillness_foods': 'Warme Suppen, Tofu, Eingemachtes', 'taoist_season_stillness_herbs': 'Tragant, schwarzer Tee, Nelken',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Beginne etwas Neues mit Klarheit.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Diene der Gesundheit; sorge für Körper und Geist.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Schütze Dharma mit Mut.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Lerne, chante, teile Weisheit.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Freue dich an Verbindung und Gesang.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Bewache die Schwelle mit Hingabe.',
            'vedic_archetype_mystic': 'Yogi', 'vedic_practice_mystic': 'Meditiere, atme, gehe nach innen.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Löse auf, was nicht mehr dient.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Spiele Musik, wandere, singe.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Übe die Kunst, bis sie Kraft wird.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Gib und empfange Fülle.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Bewahre die Ordnung mit Anmut.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Sei der feste Punkt des drehenden Himmels.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Dunkler Mond)', 'vedic_practice_new': 'Ruhe, faste, setze ein Sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Beginne das neue Vorhaben.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Sammle Kraft, handle.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Disziplin, verfeinere, faste sanft.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Danke, teile, feiere.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Reflektiere, diene, vereinfache.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Löse Anhaftungen, reinige.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Ziehe dich zurück, ruhe, träume.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Feuer)',
            'vedic_element_water': 'Jala (Wasser)',
            'vedic_element_earth': 'Prithvi (Erde)',
            'vedic_element_air': 'Vayu (Luft)',
            'vedic_element_ether': 'Akasha (Äther)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Dakshinayana beginnt', 'vedic_practice_summer_solstice': 'Ehre die Wende der Sonne.',
            'vedic_festival_winter_solstice': 'Uttarayana beginnt', 'vedic_practice_winter_solstice': 'Feiere die Rückkehr des Lichts.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Verehre die Mutter, pflanze neu.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Ehre die Göttin, teile die Ernte.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Meditiere, gib, feiere.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Ehre die Ahnen, ruhe.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Grün, Sprossen, Mango', 'vedic_season_emergence_herbs': 'Tulsi, Kurkuma, Koriander',
            'vedic_season_radiance_foods': 'Kühlender Joghurt, Gurke, Lassi', 'vedic_season_radiance_herbs': 'Fenchel, Minze, Rose',
            'vedic_season_release_foods': 'Getreide, Ghee, Wurzelgemüse', 'vedic_season_release_herbs': 'Ashwagandha, Ingwer, Kardamom',
            'vedic_season_stillness_foods': 'Warmes Kitchari, Nüsse, Datteln', 'vedic_season_stillness_herbs': 'Triphala, Zimt, Tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Schöpferin / Macherin', 'pagan_practice_creator': 'Forme, webe, bringe ins Sein.',
            'pagan_archetype_healer': 'Grüne Hexe', 'pagan_practice_healer': 'Arbeite mit Kräutern, pflege Wunden.',
            'pagan_archetype_warrior': 'Kriegerin', 'pagan_practice_warrior': 'Steh für das ein, was du liebst.',
            'pagan_archetype_sage': 'Alte Weise', 'pagan_practice_sage': 'Sprich die alte Weisheit klar aus.',
            'pagan_archetype_lover': 'Maikönigin', 'pagan_practice_lover': 'Feiere das Fleisch und die Erde.',
            'pagan_archetype_guardian': 'Herdwächterin', 'pagan_practice_guardian': 'Schütze Heim und Kreis.',
            'pagan_archetype_mystic': 'Orakel / Seherin', 'pagan_practice_mystic': 'Lausche dem Dazwischen.',
            'pagan_archetype_destroyer': 'Schattenarbeiterin', 'pagan_practice_destroyer': 'Lass los, kompostiere, verwandle.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Lache über das Heilige.',
            'pagan_archetype_magician': 'Hexe / Zauberweberin', 'pagan_practice_magician': 'Wille, Wort und Geste.',
            'pagan_archetype_empress': 'Erdmutter', 'pagan_practice_empress': 'Nähre alles, was wächst.',
            'pagan_archetype_emperor': 'Gehörnter Gott / König', 'pagan_practice_emperor': 'Regiere den Kreislauf mit Kraft.',
            'pagan_archetype_star': 'Sterngöttin', 'pagan_practice_star': 'Webe das Netz, führe den Weg.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Dunkler Mond', 'pagan_practice_new': 'Ruhe, träume, wirke keinen Zauber.',
            'pagan_moon_waxing_crescent': 'Zunehmende Sichel', 'pagan_practice_waxing_crescent': 'Beginne, pflanze, ziehe an.',
            'pagan_moon_first_quarter': 'Zunehmender Halbmond', 'pagan_practice_first_quarter': 'Durchbrich Hindernisse.',
            'pagan_moon_waxing_gibbous': 'Zunehmender Vollmond', 'pagan_practice_waxing_gibbous': 'Verfeinere und stärke.',
            'pagan_moon_full': 'Esbat (Vollmond)', 'pagan_practice_full': 'Ritual, aufladen, loslassen.',
            'pagan_moon_waning_gibbous': 'Abnehmender Vollmond', 'pagan_practice_waning_gibbous': 'Teile die Fülle.',
            'pagan_moon_last_quarter': 'Abnehmender Halbmond', 'pagan_practice_last_quarter': 'Schneide ab, was bindet.',
            'pagan_moon_waning_crescent': 'Balsamischer Mond', 'pagan_practice_waning_crescent': 'Stille, Ruhe, bereite dich vor.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Feuer',
            'pagan_element_water': 'Wasser',
            'pagan_element_earth': 'Erde',
            'pagan_element_air': 'Luft',
            'pagan_element_ether': 'Geist / Aether',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Spring über das Feuer, ehre die Sonne.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Verbrenne den Scheit, begrüße das Licht.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Pflanze Samen, balanciere Licht und Dunkel.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Danke, bewahre die Ernte.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Ziehe den Kreis, lade deine Werkzeuge.',
            'pagan_festival_new_moon': 'Neumondritual', 'pagan_practice_new_moon': 'Setze Absichten im Dunkeln.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Eier, Grünzeug, frühe Beeren', 'pagan_season_emergence_herbs': 'Brennnessel, Löwenzahn, Minze',
            'pagan_season_radiance_foods': 'Beeren, Mais, Tomaten', 'pagan_season_radiance_herbs': 'Lavendel, Kamille, Rosmarin',
            'pagan_season_release_foods': 'Äpfel, Kürbis, Getreide', 'pagan_season_release_herbs': 'Salbei, Zimt, Nelken',
            'pagan_season_stillness_foods': 'Wurzelgemüse, Nüsse, Eingemachtes', 'pagan_season_stillness_herbs': 'Kiefer, Zeder, Stechpalme',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Ordne das Chaos, beginne.',
            'mesopotamian_archetype_healer': 'Heiler der Gula', 'mesopotamian_practice_healer': 'Pflege Wunden, nutze die Kräuter.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Kämpfe für die Ernte.',
            'mesopotamian_archetype_sage': 'Nabu (Schreiber)', 'mesopotamian_practice_sage': 'Schreibe, zähle, halte fest.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Liebe kühn, feiere.',
            'mesopotamian_archetype_guardian': 'Torwächter des Schamasch', 'mesopotamian_practice_guardian': 'Bewache das Tor der Gerechtigkeit.',
            'mesopotamian_archetype_mystic': 'Seher des Enki', 'mesopotamian_practice_mystic': 'Tauche in die tiefen Wasser.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Führe Enden, räume Verfall.',
            'mesopotamian_archetype_fool': 'Hofnarr', 'mesopotamian_practice_fool': 'Verspotte die Mächtigen, sage die Wahrheit.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Zauberer)', 'mesopotamian_practice_magician': 'Sprich das Wort, das bindet.',
            'mesopotamian_archetype_empress': 'Königin des Himmels (Ishtar)', 'mesopotamian_practice_empress': 'Herrsche mit Strahlkraft.',
            'mesopotamian_archetype_emperor': 'Anu (König der Götter)', 'mesopotamian_practice_emperor': 'Halte die Himmel und das Gesetz.',
            'mesopotamian_archetype_star': 'Nanshe (Traumdeuterin)', 'mesopotamian_practice_star': 'Lies die Träume und Vorzeichen.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'Neumond (Arḫu)', 'mesopotamian_practice_new': 'Ruhe, warte, plane.',
            'mesopotamian_moon_waxing_crescent': 'Aufgehende Sichel', 'mesopotamian_practice_waxing_crescent': 'Beginne die Arbeit.',
            'mesopotamian_moon_first_quarter': 'Halbmond', 'mesopotamian_practice_first_quarter': 'Führe den Feldzug fort.',
            'mesopotamian_moon_waxing_gibbous': 'Zunehmender Vollmond', 'mesopotamian_practice_waxing_gibbous': 'Baue die Mauern, speichere Korn.',
            'mesopotamian_moon_full': 'Vollmond (Šapattu)', 'mesopotamian_practice_full': 'Ruhe von der Arbeit, feiere, ehre die Götter.',
            'mesopotamian_moon_waning_gibbous': 'Abnehmender Vollmond', 'mesopotamian_practice_waning_gibbous': 'Gleiche Rechnungen, teile.',
            'mesopotamian_moon_last_quarter': 'Abnehmender Halbmond', 'mesopotamian_practice_last_quarter': 'Schneide Schulden, schließe Aufgaben.',
            'mesopotamian_moon_waning_crescent': 'Dunkle Sichel', 'mesopotamian_practice_waning_crescent': 'Stille die Stadt, halte Wache.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Feuer des Girra',
            'mesopotamian_element_water': 'Wasser des Abzu (Ea)',
            'mesopotamian_element_earth': 'Erde der Ki',
            'mesopotamian_element_air': 'Winde des Enlil',
            'mesopotamian_element_ether': 'Himmel des Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Mittsommer-Akitu', 'mesopotamian_practice_summer_solstice': 'Ehre die Sonne auf ihrer Höhe.',
            'mesopotamian_festival_winter_solstice': 'Winter-Akitu', 'mesopotamian_practice_winter_solstice': 'Erneuere das Jahr im Dunkeln.',
            'mesopotamian_festival_spring_equinox': 'Akitu (Neujahr)', 'mesopotamian_practice_spring_equinox': 'Kröne den König, erneuere die Welt.',
            'mesopotamian_festival_autumn_equinox': 'Ernte des Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Trauere und danke dem sterbenden Gott.',
            'mesopotamian_festival_full_moon': 'Šapattu (Vollmond)', 'mesopotamian_practice_full_moon': 'Lege die Arbeit nieder, feiere.',
            'mesopotamian_festival_new_moon': 'Arḫu (Neumond)', 'mesopotamian_practice_new_moon': 'Markiere den Monat, warte auf die Sichel.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Gerste, Datteln, Grün', 'mesopotamian_season_emergence_herbs': 'Thymian, Kreuzkümmel, Koriander',
            'mesopotamian_season_radiance_foods': 'Feigen, Trauben, Gurken', 'mesopotamian_season_radiance_herbs': 'Minze, Sesam, Anis',
            'mesopotamian_season_release_foods': 'Datteln, Granatäpfel, Getreide', 'mesopotamian_season_release_herbs': 'Safran, Lorbeer, Sesam',
            'mesopotamian_season_stillness_foods': 'Gelagertes Korn, Trockendatteln, Linsen', 'mesopotamian_season_stillness_herbs': 'Wacholder, Weihrauch, Myrrhe',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Chnum', 'egyptian_practice_creator': 'Forme den Tag mit Absicht.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Übe Medizin, schreibe die Heilmittel.',
            'egyptian_archetype_warrior': 'Sachmet', 'egyptian_practice_warrior': 'Brenne heftig, schütze Ma\'at.',
            'egyptian_archetype_sage': 'Thot', 'egyptian_practice_sage': 'Zähle, schreibe, vermesse den Himmel.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Erfreue dich an Musik, Liebe und Fest.',
            'egyptian_archetype_guardian': 'Anubis / Wepwawet', 'egyptian_practice_guardian': 'Bewache die Schwellen des Wandels.',
            'egyptian_archetype_mystic': 'Isis (Zauberin)', 'egyptian_practice_mystic': 'Webe Sprüche des Schutzes und des Lebens.',
            'egyptian_archetype_destroyer': 'Seth (Verschlinger)', 'egyptian_practice_destroyer': 'Erschüttere das Starre, räume das Alte.',
            'egyptian_archetype_fool': 'Bes', 'egyptian_practice_fool': 'Tanze, trommle, bewache den Haushalt.',
            'egyptian_archetype_magician': 'Kheri-heb (Heka-Priester)', 'egyptian_practice_magician': 'Sprich die Worte der Macht.',
            'egyptian_archetype_empress': 'Isis / Mut', 'egyptian_practice_empress': 'Mutter alles, schütze den Thron.',
            'egyptian_archetype_emperor': 'Ra (Pharao)', 'egyptian_practice_emperor': 'Stehe mit der Sonne auf, ordne das Land.',
            'egyptian_archetype_star': 'Nut (Sternseherin)', 'egyptian_practice_star': 'Lies den Himmel, halte den kosmischen Rhythmus.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Dunkelheit des Nun', 'egyptian_practice_new': 'Ruhe in den Wassern des Anfangs.',
            'egyptian_moon_waxing_crescent': 'Sichel des Chons', 'egyptian_practice_waxing_crescent': 'Beginne die Reise.',
            'egyptian_moon_first_quarter': 'Wachsender Halbmond', 'egyptian_practice_first_quarter': 'Baue mit beiden Händen.',
            'egyptian_moon_waxing_gibbous': 'Zunehmender Vollmond', 'egyptian_practice_waxing_gibbous': 'Sammle Kraft und Korn.',
            'egyptian_moon_full': 'Auge des Chons (Voll)', 'egyptian_practice_full': 'Feiere, ehre den Mondgott.',
            'egyptian_moon_waning_gibbous': 'Abnehmender Vollmond', 'egyptian_practice_waning_gibbous': 'Gib zurück, zeichne auf, gleiche aus.',
            'egyptian_moon_last_quarter': 'Abnehmender Halbmond', 'egyptian_practice_last_quarter': 'Erleichtere die Last, reinige.',
            'egyptian_moon_waning_crescent': 'Abnehmende Sichel', 'egyptian_practice_waning_crescent': 'Ziehe dich zurück, träume, bereite die Wiedergeburt.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Feuer des Ra',
            'egyptian_element_water': 'Wasser des Nun',
            'egyptian_element_earth': 'Erde des Geb',
            'egyptian_element_air': 'Luft des Schu',
            'egyptian_element_ether': 'Himmel der Nut',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Sothis-Neujahr (Aufgang des Sirius)', 'egyptian_practice_summer_solstice': 'Markiere die Flut, beginne das Jahr.',
            'egyptian_festival_winter_solstice': 'Fest der verborgenen Sonne', 'egyptian_practice_winter_solstice': 'Ehre die Wiedergeburt der Sonne im Dunkeln.',
            'egyptian_festival_spring_equinox': 'Opet (Frühlingsaufgang)', 'egyptian_practice_spring_equinox': 'Prozession mit den Göttern, segne das Land.',
            'egyptian_festival_autumn_equinox': 'Fest des Thot', 'egyptian_practice_autumn_equinox': 'Ehre Schrift, Urteil und Gleichgewicht.',
            'egyptian_festival_full_moon': 'Fest des Vollmonds', 'egyptian_practice_full_moon': 'Halte Wache, opfere, feiere.',
            'egyptian_festival_new_moon': 'Fest des Neumonds', 'egyptian_practice_new_moon': 'Erneuere, reinige, beginne.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Getreide, Saubohnen, Grün', 'egyptian_season_emergence_herbs': 'Salat, Minze, Knoblauch',
            'egyptian_season_radiance_foods': 'Feigen, Trauben, Melone', 'egyptian_season_radiance_herbs': 'Kreuzkümmel, Dill, Zwiebel',
            'egyptian_season_release_foods': 'Datteln, Granatapfel, Weizen', 'egyptian_season_release_herbs': 'Weihrauch, Myrrhe, Anis',
            'egyptian_season_stillness_foods': 'Gelagertes Korn, Trockenfisch, Honig', 'egyptian_season_stillness_herbs': 'Thymian, Wacholder, Bockshornklee',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Schöpfer)', 'mayan_practice_creator': 'Webe den neuen Tag ins Sein.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Pflege den Körper, arbeite mit Kräutern.',
            'mayan_archetype_warrior': 'Jaguar-Krieger', 'mayan_practice_warrior': 'Bewege dich im Dunkeln, schütze den Stamm.',
            'mayan_archetype_sage': 'Tagwächter (Aj Q\'ij)', 'mayan_practice_sage': 'Zähle die Tage, lies die Zeichen.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Feiere die Liebe und die Nacht.',
            'mayan_archetype_guardian': 'Wächter des Chac', 'mayan_practice_guardian': 'Schütze Wasser, Regen und Wachstum.',
            'mayan_archetype_mystic': 'Schamane (Aj Q\'ij)', 'mayan_practice_mystic': 'Reise zwischen den Welten.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Führe Enden, pflege die Unterwelt.',
            'mayan_archetype_fool': 'Brüllaffe (Batz\')', 'mayan_practice_fool': 'Brülle, trommle, bastle, lache.',
            'mayan_archetype_magician': 'Zauberer (Gott D)', 'mayan_practice_magician': 'Verändere die Gestalt, sieh darüber hinaus.',
            'mayan_archetype_empress': 'Ix Chel (Mondmutter)', 'mayan_practice_empress': 'Nähre die Schöpfung, webe das Schicksal.',
            'mayan_archetype_emperor': 'Kinich Ahau (Sonnenherr)', 'mayan_practice_emperor': 'Stehe täglich auf, speise das Volk.',
            'mayan_archetype_star': 'Venus (Stern des Kukulkan)', 'mayan_practice_star': 'Folge dem Morgenstern, führe den Weg.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Dunkler Mond (Ik\')', 'mayan_practice_new': 'Ruhe, faste, lausche.',
            'mayan_moon_waxing_crescent': 'Wachsende Sichel', 'mayan_practice_waxing_crescent': 'Pflanze, beginne, wachse.',
            'mayan_moon_first_quarter': 'Halbmond', 'mayan_practice_first_quarter': 'Räume das Feld, handle.',
            'mayan_moon_waxing_gibbous': 'Zunehmender Vollmond', 'mayan_practice_waxing_gibbous': 'Ernte Kraft, verfeinere.',
            'mayan_moon_full': 'Vollmond (Nohoch)', 'mayan_practice_full': 'Feiere, danke, lass los.',
            'mayan_moon_waning_gibbous': 'Abnehmender Vollmond', 'mayan_practice_waning_gibbous': 'Teile, lehre, verteile.',
            'mayan_moon_last_quarter': 'Abnehmender Halbmond', 'mayan_practice_last_quarter': 'Lass los, verdünne, gib auf.',
            'mayan_moon_waning_crescent': 'Untergehende Sichel', 'mayan_practice_waning_crescent': 'Schlafe, träume, erneuere.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Feuer (K\'ak\')',
            'mayan_element_water': 'Wasser (Ha\')',
            'mayan_element_earth': 'Erde (Kab)',
            'mayan_element_air': 'Wind (Ik\')',
            'mayan_element_ether': 'Himmel (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Sonnenwendfest', 'mayan_practice_summer_solstice': 'Ehre die Sonne auf ihrer Höhe.',
            'mayan_festival_winter_solstice': 'Neues Feuer (Rückkehr der Sonne)', 'mayan_practice_winter_solstice': 'Entzünde das Feuer neu, erneuere den Kreislauf.',
            'mayan_festival_spring_equinox': 'Herabstieg des Kukulkan', 'mayan_practice_spring_equinox': 'Sieh die Schlange die Pyramide herabsteigen.',
            'mayan_festival_autumn_equinox': 'Aufstieg des Kukulkan', 'mayan_practice_autumn_equinox': 'Sieh die Schlange aufsteigen.',
            'mayan_festival_full_moon': 'Vollmondzeremonie', 'mayan_practice_full_moon': 'Chante, tanze, opfere.',
            'mayan_festival_new_moon': 'Neues-Feuer-Zeremonie', 'mayan_practice_new_moon': 'Faste, reinige, setze eine Absicht.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Mais, Bohnen, Grün', 'mayan_season_emergence_herbs': 'Epazote, Koriander, Minze',
            'mayan_season_radiance_foods': 'Mais, Tomaten, tropische Früchte', 'mayan_season_radiance_herbs': 'Achiote, Chaya, Limette',
            'mayan_season_release_foods': 'Kürbis, Maisernte, Avocado', 'mayan_season_release_herbs': 'Piment, Vanille, Kakao',
            'mayan_season_stillness_foods': 'Getrockneter Mais, Bohnen, Honig', 'mayan_season_stillness_herbs': 'Copal, Kakao, Sarsaparille',
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
            'action.capture': 'Capturer le moment',
            'action.capture.title':
                'Prendre une photo et la tamponner de ce moment Kairos',
            'action.share': 'Partager ce moment',
            'action.share.title':
                'Exporter ce moment en texte ou en image',
            'kst.solar_longitude': '🌞 Longitude solaire',
            'kst.lunar_age': '🌙 Âge lunaire',
            'kst.sidereal_time': '🌀 Temps sidéral',
            'kst.visible_star': '⭐ Étoile visible',
            'kst.celestial_season': '🌍 Saison céleste',
            'kst.planets': '🪐 Planètes',
            'seasonal.in_season': 'De saison',
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
            'config.time_system': '⏱️ Système horaire',
            'config.time_system_hint':
                'Lisez le même ciel avec une horloge en base 13 (13 h / 28 m / 13 s) '
                + 'ou le rythme de 26 heures — 13 heures de clarté + 13 heures de '
                + 'nuit (26 h / 28 m / 7 s). Le midi naturel est le midi solaire dans les deux.',
            'config.time_system_current': '🌍 Heure actuelle (24 h / 60 / 60)',
            'config.time_system_natural': '🌿 Temps naturel (13 h / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Naturel',
            'config.time_system_kairos_natural': '🌿 Kairos Naturel (26 h / 28 m / 7 s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Naturel',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Pas / 28 Battements / 7 Pulsations)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Afficher la lumière du soleil',
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
            'energy.archetype': 'Archétype',
            'energy.moon_mood': 'Humeur de la lune',
            'energy.element': '{glyph} Élément',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'De saison',
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
            'help.todays_energy': 'L\'énergie d\'aujourd\'hui',
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
            'season_button.Spring': 'Printemps',
            'season_button.Summer': 'Été',
            'season_button.Autumn': 'Automne',
            'season_button.Winter': 'Hiver',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Lentille calendaire',
            'config.energy_lens': '🌿 Lentille énergétique',
            'config.month_style': '📅 Noms des mois',
            'config.month_style_kairos': '🌿 Lunes Kairos (Lune des racines, etc.)',
            'config.month_style_zodiac': '♐ Vrai zodiaque (Capricorne, etc.)',
            'config.index_style': '🔢 Index d\'affichage',
            'config.index_style_zero': '🌿 Naturel (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Traditionnel (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Index d\'affichage réglé sur {style}',
            'obs.month_style_switched': 'Style de mois réglé sur {style}',
            'energy_lens_none': 'Aucune (Kairos pur)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoïste',
            'energy_lens_vedic': 'Védique',
            'energy_lens_pagan': 'Païen / Wicca',
            'energy_lens_mesopotamian': 'Mésopotamien',
            'energy_lens_egyptian': 'Égyptien',
            'energy_lens_mayan': 'Maya',
            'direction_north': 'Nord',
            'direction_south': 'Sud',
            'direction_east': 'Est',
            'direction_west': 'Ouest',
            'direction_center': 'Centre',
            'color_red': 'Rouge',
            'color_blue': 'Bleu',
            'color_green': 'Vert',
            'color_yellow': 'Jaune',
            'color_white': 'Blanc',
            'color_black': 'Noir',
            'obs.energy_switched': 'Lentille énergétique réglée sur {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Fabricant / Tisserand', 'curanderismo_practice_creator': 'Créez quelque chose de vos mains.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Prenez soin de vous ou des autres.',
            'curanderismo_archetype_warrior': 'Protecteur / Gardien', 'curanderismo_practice_warrior': 'Tenez-vous pour quelque chose de vrai.',
            'curanderismo_archetype_sage': 'Aîné / Gardien de la sagesse', 'curanderismo_practice_sage': 'Partagez le savoir ou écoutez en profondeur.',
            'curanderismo_archetype_lover': 'Danseur / Cueilleur', 'curanderismo_practice_lover': 'Connectez-vous, partagez, célébrez.',
            'curanderismo_archetype_guardian': 'Veilleur / Défenseur', 'curanderismo_practice_guardian': 'Protégez les faibles ou la terre.',
            'curanderismo_archetype_mystic': 'Rêveur / Voyant', 'curanderismo_practice_mystic': 'Méditez, rêvez, observez.',
            'curanderismo_archetype_destroyer': 'Transformateur / Gardien du feu', 'curanderismo_practice_destroyer': 'Brûlez ce qui ne sert plus.',
            'curanderismo_archetype_fool': 'Trickster / Corbeau', 'curanderismo_practice_fool': 'Riez, jouez, brisez le schéma.',
            'curanderismo_archetype_magician': 'Métamorphe', 'curanderismo_practice_magician': 'Changez de forme, essayez du nouveau.',
            'curanderismo_archetype_empress': 'Mère / Gardienne de la terre', 'curanderismo_practice_empress': 'Nourrissez, cultivez, recevez.',
            'curanderismo_archetype_emperor': 'Père / Gardien du ciel', 'curanderismo_practice_emperor': 'Menez, construisez, ordonnez.',
            'curanderismo_archetype_star': 'Astronome / Ouvreur de route', 'curanderismo_practice_star': 'Espoir, vision, guide.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Sombre / Attente', 'curanderismo_practice_new': 'Reposez-vous, plantez une graine (intention).',
            'curanderismo_moon_waxing_crescent': 'Croître / Naître', 'curanderismo_practice_waxing_crescent': 'Faites un premier pas.',
            'curanderismo_moon_first_quarter': 'Pousser / Émerger', 'curanderismo_practice_first_quarter': 'Brisez une barrière.',
            'curanderismo_moon_waxing_gibbous': 'Bâtir / Renforcer', 'curanderismo_practice_waxing_gibbous': 'Continuez, peaufinez.',
            'curanderismo_moon_full': 'Lumineux / Plein', 'curanderismo_practice_full': 'Festoyez, remerciez, lâchez prise.',
            'curanderismo_moon_waning_gibbous': 'Partager / Enseigner', 'curanderismo_practice_waning_gibbous': 'Offrez votre savoir.',
            'curanderismo_moon_last_quarter': 'Lâcher / Couper', 'curanderismo_practice_last_quarter': 'Lâchez ce qui est lourd.',
            'curanderismo_moon_waning_crescent': 'Reposer / Rêver', 'curanderismo_practice_waning_crescent': 'Dormez, rêvez, écoutez.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Feu',
            'curanderismo_element_water': 'Eau',
            'curanderismo_element_earth': 'Terre',
            'curanderismo_element_air': 'Air',
            'curanderismo_element_ether': 'Éther / Esprit',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Fête du soleil)', 'curanderismo_practice_summer_solstice': 'Rituel au lever du soleil, cérémonie du feu.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Fête de la lune)', 'curanderismo_practice_winter_solstice': 'Veillée nocturne, contes.',
            'curanderismo_festival_spring_equinox': 'Cérémonie des fleurs', 'curanderismo_practice_spring_equinox': 'Plantez des graines, offrez des fleurs.',
            'curanderismo_festival_autumn_equinox': 'Cérémonie des moissons', 'curanderismo_practice_autumn_equinox': 'Remerciez, partagez la nourriture.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Nuit des mères)', 'curanderismo_practice_full_moon': 'Dansez, chantez, lâchez prise.',
            'curanderismo_festival_new_moon': 'Cérémonie de la nuit noire', 'curanderismo_practice_new_moon': 'Jeûnez, méditez, fixez une intention.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Légumes frais, baies, œufs', 'curanderismo_season_emergence_herbs': 'Ortie, pissenlit, menthe',
            'curanderismo_season_radiance_foods': 'Maïs, tomates, poivrons, courge', 'curanderismo_season_radiance_herbs': 'Basilic, sauge, romarin',
            'curanderismo_season_release_foods': 'Citrouilles, racines, pommes', 'curanderismo_season_release_herbs': 'Cannelle, girofle, gingembre',
            'curanderismo_season_stillness_foods': 'Haricots, céréales, fruits secs', 'curanderismo_season_stillness_herbs': 'Eucalyptus, pin, cèdre',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Artisan', 'taoist_practice_creator': 'Façonnez quelque chose avec patience et savoir-faire.',
            'taoist_archetype_healer': 'Herboriste', 'taoist_practice_healer': 'Préparez des herbes, prenez soin du corps.',
            'taoist_archetype_warrior': 'Protecteur', 'taoist_practice_warrior': 'Tenez bon, protégez l\'équilibre.',
            'taoist_archetype_sage': 'Sage', 'taoist_practice_sage': 'Étudiez, puis enseignez clairement.',
            'taoist_archetype_lover': 'Harmonisateur', 'taoist_practice_lover': 'Entretenez les liens, partagez le thé.',
            'taoist_archetype_guardian': 'Gardien du seuil', 'taoist_practice_guardian': 'Tenez le seuil, maintenez l\'ordre.',
            'taoist_archetype_mystic': 'Immortel', 'taoist_practice_mystic': 'Asseyez-vous dans le silence, cultivez le qi.',
            'taoist_archetype_destroyer': 'Rénovateur', 'taoist_practice_destroyer': 'Débarrassez-vous du périmé, faites de la place.',
            'taoist_archetype_fool': 'Vagabond', 'taoist_practice_fool': 'Errez, riez, vivez simplement.',
            'taoist_archetype_magician': 'Alchimiste', 'taoist_practice_magician': 'Transformez le plomb intérieur en or.',
            'taoist_archetype_empress': 'Mère', 'taoist_practice_empress': 'Nourrissez la croissance, soyez généreux.',
            'taoist_archetype_emperor': 'Patriarche', 'taoist_practice_emperor': 'Guidez par la vertu, non par la force.',
            'taoist_archetype_star': 'Étoile polaire', 'taoist_practice_star': 'Restez fidèle, orientez les autres.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Yin sombre', 'taoist_practice_new': 'Reposez-vous, rassemblez le qi.',
            'taoist_moon_waxing_crescent': 'Germer', 'taoist_practice_waxing_crescent': 'Plantez la graine de l\'intention.',
            'taoist_moon_first_quarter': 'Croître', 'taoist_practice_first_quarter': 'Avancez, gagnez du terrain.',
            'taoist_moon_waxing_gibbous': 'Mûrir', 'taoist_practice_waxing_gibbous': 'Affinez votre travail.',
            'taoist_moon_full': 'Yang lumineux', 'taoist_practice_full': 'Célébrez, remerciez.',
            'taoist_moon_waning_gibbous': 'Partager', 'taoist_practice_waning_gibbous': 'Enseignez ce que vous savez.',
            'taoist_moon_last_quarter': 'Lâcher prise', 'taoist_practice_last_quarter': 'Lâchez, simplifiez.',
            'taoist_moon_waning_crescent': 'Retour', 'taoist_practice_waning_crescent': 'Retirez-vous, gardez, rêvez.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Feu (火)',
            'taoist_element_water': 'Eau (水)',
            'taoist_element_earth': 'Terre (土)',
            'taoist_element_air': 'Vent (风)',
            'taoist_element_ether': 'Vide (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Feu de mi-année (夏至)', 'taoist_practice_summer_solstice': 'Honorez le yang plein.',
            'taoist_festival_winter_solstice': 'Retour de la lumière (冬至)', 'taoist_practice_winter_solstice': 'Honorez le yang naissant.',
            'taoist_festival_spring_equinox': 'Équilibre du printemps (春分)', 'taoist_practice_spring_equinox': 'Plantez, commencez, équilibrez.',
            'taoist_festival_autumn_equinox': 'Équilibre de l\'automne (秋分)', 'taoist_practice_autumn_equinox': 'Récoltez, gardez, lâchez prise.',
            'taoist_festival_full_moon': 'Fête de la lune (望)', 'taoist_practice_full_moon': 'Rassemblez-vous, remerciez, contemplez la lune.',
            'taoist_festival_new_moon': 'Lune sombre (朔)', 'taoist_practice_new_moon': 'Reposez-vous, jeûnez, renouvelez.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Verdure de printemps, pousses de bambou, œufs', 'taoist_season_emergence_herbs': 'Menthe, chrysanthème, thé vert',
            'taoist_season_radiance_foods': 'Melon, concombre, verdure amère', 'taoist_season_radiance_herbs': 'Feuille de lotus, haricot mungo, menthe poivrée',
            'taoist_season_release_foods': 'Racines, courge, riz', 'taoist_season_release_herbs': 'Gingembre, goji, cannelle',
            'taoist_season_stillness_foods': 'Soupes chaudes, tofu, conserves', 'taoist_season_stillness_herbs': 'Astragale, thé noir, clous de girofle',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Commencez quelque chose de neuf avec clarté.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Servez la santé ; prenez soin du corps et de l\'esprit.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Protégez le dharma avec courage.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Apprenez, chantez, partagez la sagesse.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Réjouissez-vous de la connexion et du chant.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Gardez le seuil avec dévotion.',
            'vedic_archetype_mystic': 'Yogi', 'vedic_practice_mystic': 'Méditez, respirez, allez à l\'intérieur.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Dissolvez ce qui ne sert plus.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Jouez de la musique, errez, chantez.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Pratiquez l\'art jusqu\'à ce qu\'il devienne pouvoir.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Donnez et recevez l\'abondance.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Préservez l\'ordre avec grâce.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Soyez le point fixe du ciel qui tourne.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Lune sombre)', 'vedic_practice_new': 'Reposez-vous, jeûnez, fixez un sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Commencez la nouvelle entreprise.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Rassemblez la force, agissez.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Discipline, affinez, jeûnez doucement.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Remerciez, partagez, célébrez.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Réfléchissez, servez, simplifiez.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Relâchez les attachements, purifiez.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Retirez-vous, reposez-vous, rêvez.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Feu)',
            'vedic_element_water': 'Jala (Eau)',
            'vedic_element_earth': 'Prithvi (Terre)',
            'vedic_element_air': 'Vayu (Air)',
            'vedic_element_ether': 'Akasha (Éther)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Dakshinayana commence', 'vedic_practice_summer_solstice': 'Honorez le tournant du soleil.',
            'vedic_festival_winter_solstice': 'Uttarayana commence', 'vedic_practice_winter_solstice': 'Célébrez le retour de la lumière.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Vénérez la Mère, plantez à nouveau.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Honorez la déesse, partagez la récolte.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Méditez, donnez, célébrez.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Honorez les ancêtres, reposez-vous.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Verdure, pousses, mangue', 'vedic_season_emergence_herbs': 'Tulsi, curcuma, coriandre',
            'vedic_season_radiance_foods': 'Yaourt frais, concombre, lassi', 'vedic_season_radiance_herbs': 'Fenouil, menthe, rose',
            'vedic_season_release_foods': 'Céréales, ghee, racines', 'vedic_season_release_herbs': 'Ashwagandha, gingembre, cardamome',
            'vedic_season_stillness_foods': 'Kitchari chaud, noix, dattes', 'vedic_season_stillness_herbs': 'Triphala, cannelle, tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Créatrice / Fabriquante', 'pagan_practice_creator': 'Formez, tissez, faites advenir.',
            'pagan_archetype_healer': 'Sorcière verte', 'pagan_practice_healer': 'Travaillez avec les herbes, soignez les plaies.',
            'pagan_archetype_warrior': 'Guerrière', 'pagan_practice_warrior': 'Tenez-vous pour ce que vous aimez.',
            'pagan_archetype_sage': 'Vieille sage', 'pagan_practice_sage': 'Dites clairement la sagesse ancienne.',
            'pagan_archetype_lover': 'Reine de Mai', 'pagan_practice_lover': 'Célébrez la chair et la terre.',
            'pagan_archetype_guardian': 'Gardienne du foyer', 'pagan_practice_guardian': 'Protégez le foyer et le cercle.',
            'pagan_archetype_mystic': 'Oracle / Voyante', 'pagan_practice_mystic': 'Écoutez l\'entre-deux.',
            'pagan_archetype_destroyer': 'Travailleuse de l\'ombre', 'pagan_practice_destroyer': 'Relâchez, compostez, transformez.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Riez du sacré.',
            'pagan_archetype_magician': 'Sorcière / Tisseuse de sorts', 'pagan_practice_magician': 'Volonté, parole et geste.',
            'pagan_archetype_empress': 'Mère Terre', 'pagan_practice_empress': 'Nourrissez tout ce qui pousse.',
            'pagan_archetype_emperor': 'Dieu cornu / Roi', 'pagan_practice_emperor': 'Gouvernez le cycle avec force.',
            'pagan_archetype_star': 'Déesse étoilée', 'pagan_practice_star': 'Tissez la toile, guidez le chemin.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Lune sombre', 'pagan_practice_new': 'Reposez-vous, rêvez, ne jetez aucun sort.',
            'pagan_moon_waxing_crescent': 'Croissant croissant', 'pagan_practice_waxing_crescent': 'Commencez, plantez, attirez.',
            'pagan_moon_first_quarter': 'Demi-lune croissante', 'pagan_practice_first_quarter': 'Brisez les obstacles.',
            'pagan_moon_waxing_gibbous': 'Pleine croissante', 'pagan_practice_waxing_gibbous': 'Affinez et renforcez.',
            'pagan_moon_full': 'Esbat (Pleine lune)', 'pagan_practice_full': 'Rituel, chargez, relâchez.',
            'pagan_moon_waning_gibbous': 'Pleine décroissante', 'pagan_practice_waning_gibbous': 'Partagez l\'abondance.',
            'pagan_moon_last_quarter': 'Demi-lune décroissante', 'pagan_practice_last_quarter': 'Coupez ce qui lie.',
            'pagan_moon_waning_crescent': 'Balsamique / Assombrissant', 'pagan_practice_waning_crescent': 'Taisez-vous, reposez-vous, préparez.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Feu',
            'pagan_element_water': 'Eau',
            'pagan_element_earth': 'Terre',
            'pagan_element_air': 'Air',
            'pagan_element_ether': 'Esprit / Aether',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Sautez le feu, honorez le soleil.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Brûlez la bûche, accueillez la lumière.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Plantez des graines, équilibrez lumière et ombre.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Remerciez, conservez la récolte.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Tirez le cercle, chargez vos outils.',
            'pagan_festival_new_moon': 'Rituel de nouvelle lune', 'pagan_practice_new_moon': 'Fixez des intentions dans l\'obscurité.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Œufs, verdure, premières baies', 'pagan_season_emergence_herbs': 'Ortie, pissenlit, menthe',
            'pagan_season_radiance_foods': 'Baies, maïs, tomates', 'pagan_season_radiance_herbs': 'Lavande, camomille, romarin',
            'pagan_season_release_foods': 'Pommes, courge, céréales', 'pagan_season_release_herbs': 'Sauge, cannelle, girofle',
            'pagan_season_stillness_foods': 'Racines, noix, conserves', 'pagan_season_stillness_herbs': 'Pin, cèdre, houx',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Mettez de l\'ordre dans le chaos, commencez.',
            'mesopotamian_archetype_healer': 'Guérisseur de Gula', 'mesopotamian_practice_healer': 'Soignez les plaies, utilisez les herbes.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Combattez pour la récolte.',
            'mesopotamian_archetype_sage': 'Nabu (Scribe)', 'mesopotamian_practice_sage': 'Écrivez, comptez, consignez.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Aimez hardiment, célébrez.',
            'mesopotamian_archetype_guardian': 'Gardien de Shamash', 'mesopotamian_practice_guardian': 'Gardez la porte de la justice.',
            'mesopotamian_archetype_mystic': 'Voyant d\'Enki', 'mesopotamian_practice_mystic': 'Plongez dans les eaux profondes.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Menez les fins, éliminez la décomposition.',
            'mesopotamian_archetype_fool': 'Bouffon de la cour', 'mesopotamian_practice_fool': 'Moquez les puissants, dites la vérité.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Enchanteur)', 'mesopotamian_practice_magician': 'Prononcez la parole qui lie.',
            'mesopotamian_archetype_empress': 'Reine du ciel (Ishtar)', 'mesopotamian_practice_empress': 'Régnez avec éclat.',
            'mesopotamian_archetype_emperor': 'Anu (Roi des dieux)', 'mesopotamian_practice_emperor': 'Tenez les cieux et la loi.',
            'mesopotamian_archetype_star': 'Nanshe (Lectrice de rêves)', 'mesopotamian_practice_star': 'Lisez les rêves et les présages.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'Nouvelle lune (Arḫu)', 'mesopotamian_practice_new': 'Reposez-vous, attendez, planifiez.',
            'mesopotamian_moon_waxing_crescent': 'Croissant naissant', 'mesopotamian_practice_waxing_crescent': 'Commencez le travail.',
            'mesopotamian_moon_first_quarter': 'Demi-lune', 'mesopotamian_practice_first_quarter': 'Poursuivez la campagne.',
            'mesopotamian_moon_waxing_gibbous': 'Pleine croissante', 'mesopotamian_practice_waxing_gibbous': 'Bâtissez les murs, stockez le grain.',
            'mesopotamian_moon_full': 'Pleine lune (Šapattu)', 'mesopotamian_practice_full': 'Reposez-vous du travail, festoyez, honorez les dieux.',
            'mesopotamian_moon_waning_gibbous': 'Pleine décroissante', 'mesopotamian_practice_waning_gibbous': 'Réglez les comptes, partagez.',
            'mesopotamian_moon_last_quarter': 'Demi-lune décroissante', 'mesopotamian_practice_last_quarter': 'Coupez les dettes, terminez les tâches.',
            'mesopotamian_moon_waning_crescent': 'Croissant sombre', 'mesopotamian_practice_waning_crescent': 'Calmez la ville, veillez.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Feu de Girra',
            'mesopotamian_element_water': 'Eaux de l\'Abzu (Ea)',
            'mesopotamian_element_earth': 'Terre de Ki',
            'mesopotamian_element_air': 'Vents d\'Enlil',
            'mesopotamian_element_ether': 'Cieux d\'Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Akitu d\'été', 'mesopotamian_practice_summer_solstice': 'Honorez le soleil à son zénith.',
            'mesopotamian_festival_winter_solstice': 'Akitu d\'hiver', 'mesopotamian_practice_winter_solstice': 'Renouvelez l\'année dans l\'obscurité.',
            'mesopotamian_festival_spring_equinox': 'Akitu (Nouvel an)', 'mesopotamian_practice_spring_equinox': 'Couronnez le roi, renouvelez le monde.',
            'mesopotamian_festival_autumn_equinox': 'Moisson de Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Pleurez et remerciez le dieu mourant.',
            'mesopotamian_festival_full_moon': 'Šapattu (Pleine lune)', 'mesopotamian_practice_full_moon': 'Déposez le travail, festoyez.',
            'mesopotamian_festival_new_moon': 'Arḫu (Nouvelle lune)', 'mesopotamian_practice_new_moon': 'Marquez le mois, attendez le croissant.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Orge, dattes, verdure', 'mesopotamian_season_emergence_herbs': 'Thym, cumin, coriandre',
            'mesopotamian_season_radiance_foods': 'Figues, raisins, concombres', 'mesopotamian_season_radiance_herbs': 'Menthe, sésame, anis',
            'mesopotamian_season_release_foods': 'Dattes, grenades, céréales', 'mesopotamian_season_release_herbs': 'Safran, laurier, sésame',
            'mesopotamian_season_stillness_foods': 'Grain stocké, dattes séchées, lentilles', 'mesopotamian_season_stillness_herbs': 'Genévrier, encens, myrrhe',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Khnoum', 'egyptian_practice_creator': 'Façonnez le jour avec intention.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Pratiquez la médecine, écrivez les remèdes.',
            'egyptian_archetype_warrior': 'Sekhmet', 'egyptian_practice_warrior': 'Brûlez férocement, protégez Ma\'at.',
            'egyptian_archetype_sage': 'Thot', 'egyptian_practice_sage': 'Comptez, écrivez, mesurez le ciel.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Jouissez de la musique, de l\'amour et du festin.',
            'egyptian_archetype_guardian': 'Anubis / Oupouaout', 'egyptian_practice_guardian': 'Gardez les seuils du changement.',
            'egyptian_archetype_mystic': 'Isis (Enchanteresse)', 'egyptian_practice_mystic': 'Tissez des sortilèges de protection et de vie.',
            'egyptian_archetype_destroyer': 'Seth (Dévoreur)', 'egyptian_practice_destroyer': 'Bouleversez le rigide, éliminez le périmé.',
            'egyptian_archetype_fool': 'Bès', 'egyptian_practice_fool': 'Dansez, battez le tambour, gardez le foyer.',
            'egyptian_archetype_magician': 'Kheri-heb (prêtre de Heka)', 'egyptian_practice_magician': 'Prononcez les paroles de pouvoir.',
            'egyptian_archetype_empress': 'Isis / Mout', 'egyptian_practice_empress': 'Mère de tous, protégez le trône.',
            'egyptian_archetype_emperor': 'Rê (Pharaon)', 'egyptian_practice_emperor': 'Levez-vous avec le soleil, ordonnez la terre.',
            'egyptian_archetype_star': 'Nout (Lectrice d\'étoiles)', 'egyptian_practice_star': 'Lisez le ciel, gardez le rythme cosmique.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Ténèbres de Nou', 'egyptian_practice_new': 'Reposez-vous dans les eaux du commencement.',
            'egyptian_moon_waxing_crescent': 'Croissant de Khonsou', 'egyptian_practice_waxing_crescent': 'Commencez le voyage.',
            'egyptian_moon_first_quarter': 'Demi-lune croissante', 'egyptian_practice_first_quarter': 'Construisez des deux mains.',
            'egyptian_moon_waxing_gibbous': 'Pleine croissante', 'egyptian_practice_waxing_gibbous': 'Rassemblez force et grain.',
            'egyptian_moon_full': 'Œil de Khonsou (Pleine)', 'egyptian_practice_full': 'Festoyez, honorez le dieu lunaire.',
            'egyptian_moon_waning_gibbous': 'Pleine décroissante', 'egyptian_practice_waning_gibbous': 'Rendez, consignez, réglez.',
            'egyptian_moon_last_quarter': 'Demi-lune décroissante', 'egyptian_practice_last_quarter': 'Allégez la charge, purifiez.',
            'egyptian_moon_waning_crescent': 'Croissant décroissant', 'egyptian_practice_waning_crescent': 'Retirez-vous, rêvez, préparez la renaissance.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Feu de Rê',
            'egyptian_element_water': 'Eaux de Nou',
            'egyptian_element_earth': 'Terre de Geb',
            'egyptian_element_air': 'Air de Shou',
            'egyptian_element_ether': 'Ciel de Nout',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Nouvel an sothiaque (lever de Sirius)', 'egyptian_practice_summer_solstice': 'Marquez la crue, commencez l\'année.',
            'egyptian_festival_winter_solstice': 'Fête du soleil caché', 'egyptian_practice_winter_solstice': 'Honorez la renaissance du soleil dans l\'ombre.',
            'egyptian_festival_spring_equinox': 'Opet (Montée du printemps)', 'egyptian_practice_spring_equinox': 'Procession avec les dieux, bénissez la terre.',
            'egyptian_festival_autumn_equinox': 'Fête de Thot', 'egyptian_practice_autumn_equinox': 'Honorez l\'écriture, le jugement et l\'équilibre.',
            'egyptian_festival_full_moon': 'Fête de la pleine lune', 'egyptian_practice_full_moon': 'Veillez, offrez, célébrez.',
            'egyptian_festival_new_moon': 'Fête de la nouvelle lune', 'egyptian_practice_new_moon': 'Renouvelez, purifiez, commencez.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Grain, fèves, verdure', 'egyptian_season_emergence_herbs': 'Laitue, menthe, ail',
            'egyptian_season_radiance_foods': 'Figues, raisins, melon', 'egyptian_season_radiance_herbs': 'Cumin, aneth, oignon',
            'egyptian_season_release_foods': 'Dattes, grenade, blé', 'egyptian_season_release_herbs': 'Encens, myrrhe, anis',
            'egyptian_season_stillness_foods': 'Grains stockés, poisson séché, miel', 'egyptian_season_stillness_herbs': 'Thym, genévrier, fenugrec',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Créateur)', 'mayan_practice_creator': 'Tissez le nouveau jour dans l\'être.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Prenez soin du corps, travaillez avec les herbes.',
            'mayan_archetype_warrior': 'Guerrier jaguar', 'mayan_practice_warrior': 'Avancez dans l\'ombre, protégez la tribu.',
            'mayan_archetype_sage': 'Compteur de jours (Aj Q\'ij)', 'mayan_practice_sage': 'Comptez les jours, lisez les signes.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Célébrez l\'amour et la nuit.',
            'mayan_archetype_guardian': 'Gardien de Chac', 'mayan_practice_guardian': 'Protégez l\'eau, la pluie et la croissance.',
            'mayan_archetype_mystic': 'Chaman (Aj Q\'ij)', 'mayan_practice_mystic': 'Voyagez entre les mondes.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Guidez les fins, soignez le monde souterrain.',
            'mayan_archetype_fool': 'Singe hurleur (Batz\')', 'mayan_practice_fool': 'Hurlez, battez le tambour, créez, riez.',
            'mayan_archetype_magician': 'Enchanteur (Dieu D)', 'mayan_practice_magician': 'Changez de forme, voyez au-delà.',
            'mayan_archetype_empress': 'Ix Chel (Mère lune)', 'mayan_practice_empress': 'Nourrissez la création, tissez le destin.',
            'mayan_archetype_emperor': 'Kinich Ahau (Seigneur soleil)', 'mayan_practice_emperor': 'Levez-vous chaque jour, nourrissez le peuple.',
            'mayan_archetype_star': 'Vénus (Étoile de Kukulkan)', 'mayan_practice_star': 'Suivez l\'étoile du matin, guidez le chemin.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Lune sombre (Ik\')', 'mayan_practice_new': 'Reposez-vous, jeûnez, écoutez.',
            'mayan_moon_waxing_crescent': 'Croissant croissant', 'mayan_practice_waxing_crescent': 'Plantez, commencez, grandissez.',
            'mayan_moon_first_quarter': 'Demi-lune', 'mayan_practice_first_quarter': 'Défrichez le champ, agissez.',
            'mayan_moon_waxing_gibbous': 'Pleine croissante', 'mayan_practice_waxing_gibbous': 'Récoltez la force, affinez.',
            'mayan_moon_full': 'Pleine lune (Nohoch)', 'mayan_practice_full': 'Festoyez, remerciez, lâchez prise.',
            'mayan_moon_waning_gibbous': 'Pleine décroissante', 'mayan_practice_waning_gibbous': 'Partagez, enseignez, distribuez.',
            'mayan_moon_last_quarter': 'Demi-lune décroissante', 'mayan_practice_last_quarter': 'Lâchez, éclaircissez, relâchez.',
            'mayan_moon_waning_crescent': 'Croissant couchant', 'mayan_practice_waning_crescent': 'Dormez, rêvez, renouvelez.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Feu (K\'ak\')',
            'mayan_element_water': 'Eau (Ha\')',
            'mayan_element_earth': 'Terre (Kab)',
            'mayan_element_air': 'Vent (Ik\')',
            'mayan_element_ether': 'Ciel (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Solstice du soleil', 'mayan_practice_summer_solstice': 'Honorez le soleil à son zénith.',
            'mayan_festival_winter_solstice': 'Feu nouveau (retour du soleil)', 'mayan_practice_winter_solstice': 'Rallumez le feu, renouvelez le cycle.',
            'mayan_festival_spring_equinox': 'Descente de Kukulkan', 'mayan_practice_spring_equinox': 'Voyez le serpent descendre la pyramide.',
            'mayan_festival_autumn_equinox': 'Ascension de Kukulkan', 'mayan_practice_autumn_equinox': 'Voyez le serpent monter.',
            'mayan_festival_full_moon': 'Cérémonie de la pleine lune', 'mayan_practice_full_moon': 'Chantez, dansez, offrez.',
            'mayan_festival_new_moon': 'Cérémonie du feu nouveau', 'mayan_practice_new_moon': 'Jeûnez, purifiez, fixez une intention.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Maïs, haricots, verdure', 'mayan_season_emergence_herbs': 'Épazote, coriandre, menthe',
            'mayan_season_radiance_foods': 'Maïs, tomates, fruits tropicaux', 'mayan_season_radiance_herbs': 'Achiote, chaya, citron vert',
            'mayan_season_release_foods': 'Courge, récolte de maïs, avocat', 'mayan_season_release_herbs': 'Piment de la Jamaïque, vanille, cacao',
            'mayan_season_stillness_foods': 'Maïs séché, haricots, miel', 'mayan_season_stillness_herbs': 'Copal, cacao, salespareille',
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
            'action.capture': 'Capturar el momento',
            'action.capture.title':
                'Toma una foto y séllela con este momento Kairos',
            'action.share': 'Compartir este momento',
            'action.share.title':
                'Exporta este momento como texto o imagen',
            'kst.solar_longitude': '🌞 Longitud solar',
            'kst.lunar_age': '🌙 Edad lunar',
            'kst.sidereal_time': '🌀 Tiempo sideral',
            'kst.visible_star': '⭐ Estrella visible',
            'kst.celestial_season': '🌍 Estación celeste',
            'kst.planets': '🪐 Planetas',
            'seasonal.in_season': 'De temporada',
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
            'config.time_system': '⏱️ Sistema horario',
            'config.time_system_hint':
                'Lee el mismo cielo con un reloj en base 13 (13h / 28m / 13s) o el '
                + 'ritmo de 26 horas — 13 horas de luz + 13 de oscuridad '
                + '(26h / 28m / 7s). El mediodía natural es el mediodía solar en ambos.',
            'config.time_system_current': '🌍 Hora actual (24h / 60 / 60)',
            'config.time_system_natural': '🌿 Tiempo natural (13h / 28 / 13)',
            'config.time_system_natural_badge': '🌿 Natural',
            'config.time_system_kairos_natural': '🌿 Kairos Natural (26h / 28m / 7s)',
            'config.time_system_kairos_natural_badge': '🌿 Kairos Natural',
            'config.time_system_kairos_kepler': '🌿 Kairos Kepler (26 Pasos / 28 Latidos / 7 Pulsos)',
            'config.time_system_kairos_kepler_badge': '🌿 Kairos Kepler',
            'config.light_beam': '🌍 Mostrar luz solar',
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
            'energy.archetype': 'Arquetipo',
            'energy.moon_mood': 'Estado de ánimo lunar',
            'energy.element': '{glyph} Elemento',
            'energy.season': '🕯️ {season}',
            'energy.in_season': 'De temporada',
            'energy.festival': 'festival',
            'energy.food': 'alimento',
            'help.what_am_i_looking_at': '¿Qué estoy viendo?',
            'help.planets_now': '🪐 Los planetas ahora (notas esotéricas)',
            'help.planet_in': 'en {sign}',
            'help.planets_fallback':
                'Las posiciones planetarias provienen del motor celeste — '
                + 'con el servidor, Skyfield; sin conexión, un algoritmo '
                + 'compacto del navegador (web/planets.js).',
            'help.todays_energy': 'La energía de hoy',
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
            'season_button.Spring': 'Primavera',
            'season_button.Summer': 'Verano',
            'season_button.Autumn': 'Otoño',
            'season_button.Winter': 'Invierno',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 Lente del calendario',
            'config.energy_lens': '🌿 Lente de energía',
            'config.month_style': '📅 Nombres de los meses',
            'config.month_style_kairos': '🌿 Lunas Kairos (Luna de raíz, etc.)',
            'config.month_style_zodiac': '♐ Zodíaco real (Capricornio, etc.)',
            'config.index_style': '🔢 Índice de visualización',
            'config.index_style_zero': '🌿 Natural (00:00:00 – 25:28:06)',
            'config.index_style_one': '🌿 Tradicional (01:01:01 – 26:28:07)',
            'obs.index_style_switched': 'Índice de visualización configurado en {style}',
            'obs.month_style_switched': 'Estilo de mes configurado en {style}',
            'energy_lens_none': 'Ninguna (Kairos puro)',
            'energy_lens_curanderismo': 'Curanderismo',
            'energy_lens_taoist': 'Taoísta',
            'energy_lens_vedic': 'Védico',
            'energy_lens_pagan': 'Pagano / Wicca',
            'energy_lens_mesopotamian': 'Mesopotámico',
            'energy_lens_egyptian': 'Egipcio',
            'energy_lens_mayan': 'Maya',
            'direction_north': 'Norte',
            'direction_south': 'Sur',
            'direction_east': 'Este',
            'direction_west': 'Oeste',
            'direction_center': 'Centro',
            'color_red': 'Rojo',
            'color_blue': 'Azul',
            'color_green': 'Verde',
            'color_yellow': 'Amarillo',
            'color_white': 'Blanco',
            'color_black': 'Negro',
            'obs.energy_switched': 'Lente de energía configurada en {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': 'Creador / Tejedor', 'curanderismo_practice_creator': 'Crea algo con tus manos.',
            'curanderismo_archetype_healer': 'Curandero/a', 'curanderismo_practice_healer': 'Cuídate a ti o a los demás.',
            'curanderismo_archetype_warrior': 'Protector / Guardián', 'curanderismo_practice_warrior': 'Defiende algo verdadero.',
            'curanderismo_archetype_sage': 'Anciano / Guardián de la sabiduría', 'curanderismo_practice_sage': 'Comparte conocimiento o escucha en profundidad.',
            'curanderismo_archetype_lover': 'Bailarín / Recolector', 'curanderismo_practice_lover': 'Conecta, comparte comida, celebra.',
            'curanderismo_archetype_guardian': 'Vigilante / Defensor', 'curanderismo_practice_guardian': 'Protege a los débiles o la tierra.',
            'curanderismo_archetype_mystic': 'Soñador / Vidente', 'curanderismo_practice_mystic': 'Medita, sueña, observa.',
            'curanderismo_archetype_destroyer': 'Transformador / Guardián del fuego', 'curanderismo_practice_destroyer': 'Quema lo que ya no sirve.',
            'curanderismo_archetype_fool': 'Trickster / Cuervo', 'curanderismo_practice_fool': 'Ríe, juega, rompe el patrón.',
            'curanderismo_archetype_magician': 'Cambiaformas', 'curanderismo_practice_magician': 'Cambia tu forma, prueba algo nuevo.',
            'curanderismo_archetype_empress': 'Madre / Guardiana de la tierra', 'curanderismo_practice_empress': 'Nutre, crece, recibe.',
            'curanderismo_archetype_emperor': 'Padre / Guardián del cielo', 'curanderismo_practice_emperor': 'Lidera, construye, ordena.',
            'curanderismo_archetype_star': 'Astrónomo / Abridor de caminos', 'curanderismo_practice_star': 'Esperanza, visión, guía.',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': 'Oscuro / Espera', 'curanderismo_practice_new': 'Descansa, planta una semilla (intención).',
            'curanderismo_moon_waxing_crescent': 'Crecer / Nacer', 'curanderismo_practice_waxing_crescent': 'Da un primer paso.',
            'curanderismo_moon_first_quarter': 'Empujar / Emerger', 'curanderismo_practice_first_quarter': 'Rompe una barrera.',
            'curanderismo_moon_waxing_gibbous': 'Construir / Fortalecer', 'curanderismo_practice_waxing_gibbous': 'Sigue adelante, refina.',
            'curanderismo_moon_full': 'Brillante / Lleno', 'curanderismo_practice_full': 'Festeja, agradece, suelta.',
            'curanderismo_moon_waning_gibbous': 'Compartir / Enseñar', 'curanderismo_practice_waning_gibbous': 'Ofrece tu conocimiento.',
            'curanderismo_moon_last_quarter': 'Soltar / Cortar', 'curanderismo_practice_last_quarter': 'Suelta lo que pesa.',
            'curanderismo_moon_waning_crescent': 'Descansar / Soñar', 'curanderismo_practice_waning_crescent': 'Duerme, sueña, escucha.',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': 'Fuego',
            'curanderismo_element_water': 'Agua',
            'curanderismo_element_earth': 'Tierra',
            'curanderismo_element_air': 'Aire',
            'curanderismo_element_ether': 'Éter / Espíritu',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': 'Inti Raymi (Fiesta del sol)', 'curanderismo_practice_summer_solstice': 'Ritual al amanecer, ceremonia de fuego.',
            'curanderismo_festival_winter_solstice': 'Mama Quilla (Fiesta de la luna)', 'curanderismo_practice_winter_solstice': 'Vigilia nocturna, cuentos.',
            'curanderismo_festival_spring_equinox': 'Ceremonia de las flores', 'curanderismo_practice_spring_equinox': 'Planta semillas, ofrece flores.',
            'curanderismo_festival_autumn_equinox': 'Ceremonia de la cosecha', 'curanderismo_practice_autumn_equinox': 'Agradece, comparte comida.',
            'curanderismo_festival_full_moon': 'Teteo Innan (Noche de las madres)', 'curanderismo_practice_full_moon': 'Baila, canta, suelta.',
            'curanderismo_festival_new_moon': 'Ceremonia de la noche oscura', 'curanderismo_practice_new_moon': 'Ayuna, medita, fija una intención.',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': 'Verduras frescas, bayas, huevos', 'curanderismo_season_emergence_herbs': 'Ortiga, diente de león, menta',
            'curanderismo_season_radiance_foods': 'Maíz, tomates, pimientos, calabaza', 'curanderismo_season_radiance_herbs': 'Albahaca, salvia, romero',
            'curanderismo_season_release_foods': 'Calabazas, raíces, manzanas', 'curanderismo_season_release_herbs': 'Canela, clavo, jengibre',
            'curanderismo_season_stillness_foods': 'Frijoles, granos, fruta seca', 'curanderismo_season_stillness_herbs': 'Eucalipto, pino, cedro',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': 'Artesano', 'taoist_practice_creator': 'Da forma a algo con paciencia y destreza.',
            'taoist_archetype_healer': 'Herbolario', 'taoist_practice_healer': 'Prepara hierbas, cuida el cuerpo.',
            'taoist_archetype_warrior': 'Protector', 'taoist_practice_warrior': 'Mantente firme, protege el equilibrio.',
            'taoist_archetype_sage': 'Sabio', 'taoist_practice_sage': 'Estudia y luego enseña con claridad.',
            'taoist_archetype_lover': 'Armonizador', 'taoist_practice_lover': 'Cuida los vínculos, comparte té.',
            'taoist_archetype_guardian': 'Guardián del umbral', 'taoist_practice_guardian': 'Mantén el umbral, conserva el orden.',
            'taoist_archetype_mystic': 'Inmortal', 'taoist_practice_mystic': 'Siéntate en silencio, cultiva el qi.',
            'taoist_archetype_destroyer': 'Renovador', 'taoist_practice_destroyer': 'Despeja lo rancio, haz espacio.',
            'taoist_archetype_fool': 'Errante', 'taoist_practice_fool': 'Vaga, ríe, vive con sencillez.',
            'taoist_archetype_magician': 'Alquimista', 'taoist_practice_magician': 'Convierte el plomo interior en oro.',
            'taoist_archetype_empress': 'Madre', 'taoist_practice_empress': 'Nutre el crecimiento, sé generoso.',
            'taoist_archetype_emperor': 'Patriarca', 'taoist_practice_emperor': 'Guía con virtud, no con fuerza.',
            'taoist_archetype_star': 'Estrella polar', 'taoist_practice_star': 'Mantente fiel, orienta a otros.',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': 'Yin oscuro', 'taoist_practice_new': 'Descansa, reúne qi.',
            'taoist_moon_waxing_crescent': 'Germinar', 'taoist_practice_waxing_crescent': 'Planta la semilla de la intención.',
            'taoist_moon_first_quarter': 'Crecer', 'taoist_practice_first_quarter': 'Avanza, gana terreno.',
            'taoist_moon_waxing_gibbous': 'Madurar', 'taoist_practice_waxing_gibbous': 'Refina tu trabajo.',
            'taoist_moon_full': 'Yang brillante', 'taoist_practice_full': 'Celebra, agradece.',
            'taoist_moon_waning_gibbous': 'Compartir', 'taoist_practice_waning_gibbous': 'Enseña lo que sabes.',
            'taoist_moon_last_quarter': 'Soltar', 'taoist_practice_last_quarter': 'Suelta, simplifica.',
            'taoist_moon_waning_crescent': 'Retornar', 'taoist_practice_waning_crescent': 'Retírate, guarda, sueña.',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': 'Fuego (火)',
            'taoist_element_water': 'Agua (水)',
            'taoist_element_earth': 'Tierra (土)',
            'taoist_element_air': 'Viento (风)',
            'taoist_element_ether': 'Vacío (虚)',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': 'Fuego de mediados de año (夏至)', 'taoist_practice_summer_solstice': 'Honra el yang pleno.',
            'taoist_festival_winter_solstice': 'Retorno de la luz (冬至)', 'taoist_practice_winter_solstice': 'Honra el yang naciente.',
            'taoist_festival_spring_equinox': 'Equilibrio de primavera (春分)', 'taoist_practice_spring_equinox': 'Planta, comienza, equilibra.',
            'taoist_festival_autumn_equinox': 'Equilibrio de otoño (秋分)', 'taoist_practice_autumn_equinox': 'Cosecha, guarda, suelta.',
            'taoist_festival_full_moon': 'Fiesta de la luna (望)', 'taoist_practice_full_moon': 'Reúnete, agradece, contempla la luna.',
            'taoist_festival_new_moon': 'Luna oscura (朔)', 'taoist_practice_new_moon': 'Descansa, ayuna, renueva.',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': 'Verdura de primavera, brotes de bambú, huevos', 'taoist_season_emergence_herbs': 'Menta, crisantemo, té verde',
            'taoist_season_radiance_foods': 'Melón, pepino, verduras amargas', 'taoist_season_radiance_herbs': 'Hoja de loto, judía mungo, menta piperita',
            'taoist_season_release_foods': 'Raíces, calabaza, arroz', 'taoist_season_release_herbs': 'Jengibre, goji, canela',
            'taoist_season_stillness_foods': 'Sopas calientes, tofu, conservas', 'taoist_season_stillness_herbs': 'Astrágalo, té negro, clavo',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': 'Brahma', 'vedic_practice_creator': 'Comienza algo nuevo con claridad.',
            'vedic_archetype_healer': 'Dhanvantari', 'vedic_practice_healer': 'Sirve a la salud; cuida cuerpo y mente.',
            'vedic_archetype_warrior': 'Kshatriya', 'vedic_practice_warrior': 'Protege el dharma con valor.',
            'vedic_archetype_sage': 'Rishi', 'vedic_practice_sage': 'Aprende, canta, comparte sabiduría.',
            'vedic_archetype_lover': 'Krishna', 'vedic_practice_lover': 'Goza de la conexión y el canto.',
            'vedic_archetype_guardian': 'Dvarapala', 'vedic_practice_guardian': 'Guarda el umbral con devoción.',
            'vedic_archetype_mystic': 'Yogui', 'vedic_practice_mystic': 'Medita, respira, ve hacia dentro.',
            'vedic_archetype_destroyer': 'Shiva', 'vedic_practice_destroyer': 'Disuelve lo que ya no sirve.',
            'vedic_archetype_fool': 'Narada', 'vedic_practice_fool': 'Toca música, vaga, canta.',
            'vedic_archetype_magician': 'Siddha', 'vedic_practice_magician': 'Practica el arte hasta que sea poder.',
            'vedic_archetype_empress': 'Lakshmi', 'vedic_practice_empress': 'Da y recibe abundancia.',
            'vedic_archetype_emperor': 'Vishnu', 'vedic_practice_emperor': 'Preserva el orden con gracia.',
            'vedic_archetype_star': 'Dhruva', 'vedic_practice_star': 'Sé el punto fijo del cielo que gira.',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': 'Amavasya (Luna oscura)', 'vedic_practice_new': 'Descansa, ayuna, fija un sankalpa.',
            'vedic_moon_waxing_crescent': 'Shukla Pratipada', 'vedic_practice_waxing_crescent': 'Comienza la nueva empresa.',
            'vedic_moon_first_quarter': 'Shukla Ashtami', 'vedic_practice_first_quarter': 'Reúne fuerza, actúa.',
            'vedic_moon_waxing_gibbous': 'Shukla Ekadashi', 'vedic_practice_waxing_gibbous': 'Disciplina, refina, ayuna con suavidad.',
            'vedic_moon_full': 'Purnima', 'vedic_practice_full': 'Agradece, comparte, celebra.',
            'vedic_moon_waning_gibbous': 'Krishna Ekadashi', 'vedic_practice_waning_gibbous': 'Reflexiona, sirve, simplifica.',
            'vedic_moon_last_quarter': 'Krishna Ashtami', 'vedic_practice_last_quarter': 'Suelta apegos, purifica.',
            'vedic_moon_waning_crescent': 'Krishna Pratipada', 'vedic_practice_waning_crescent': 'Retírate, descansa, sueña.',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': 'Agni (Fuego)',
            'vedic_element_water': 'Jala (Agua)',
            'vedic_element_earth': 'Prithvi (Tierra)',
            'vedic_element_air': 'Vayu (Aire)',
            'vedic_element_ether': 'Akasha (Éter)',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': 'Comienza Dakshinayana', 'vedic_practice_summer_solstice': 'Honra el giro del sol.',
            'vedic_festival_winter_solstice': 'Comienza Uttarayana', 'vedic_practice_winter_solstice': 'Celebra el retorno de la luz.',
            'vedic_festival_spring_equinox': 'Vasanta Navaratri', 'vedic_practice_spring_equinox': 'Venera a la Madre, planta de nuevo.',
            'vedic_festival_autumn_equinox': 'Sharad Navaratri', 'vedic_practice_autumn_equinox': 'Honra a la diosa, comparte la cosecha.',
            'vedic_festival_full_moon': 'Purnima', 'vedic_practice_full_moon': 'Medita, da, celebra.',
            'vedic_festival_new_moon': 'Amavasya', 'vedic_practice_new_moon': 'Honra a los ancestros, descansa.',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': 'Verdura, brotes, mango', 'vedic_season_emergence_herbs': 'Tulsi, cúrcuma, cilantro',
            'vedic_season_radiance_foods': 'Yogur fresco, pepino, lassi', 'vedic_season_radiance_herbs': 'Hinojo, menta, rosa',
            'vedic_season_release_foods': 'Granos, ghee, raíces', 'vedic_season_release_herbs': 'Ashwagandha, jengibre, cardamomo',
            'vedic_season_stillness_foods': 'Kitchari caliente, nueces, dátiles', 'vedic_season_stillness_herbs': 'Triphala, canela, tulsi',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': 'Creadora / Hacedora', 'pagan_practice_creator': 'Forma, teje, trae a la existencia.',
            'pagan_archetype_healer': 'Bruja verde', 'pagan_practice_healer': 'Trabaja con hierbas, cura heridas.',
            'pagan_archetype_warrior': 'Doncella guerrera', 'pagan_practice_warrior': 'Defiende lo que amas.',
            'pagan_archetype_sage': 'Anciana', 'pagan_practice_sage': 'Di la vieja sabiduría con claridad.',
            'pagan_archetype_lover': 'Reina de Mayo', 'pagan_practice_lover': 'Celebra la carne y la tierra.',
            'pagan_archetype_guardian': 'Guardiana del hogar', 'pagan_practice_guardian': 'Protege el hogar y el círculo.',
            'pagan_archetype_mystic': 'Oráculo / Vidente', 'pagan_practice_mystic': 'Escucha el entremedio.',
            'pagan_archetype_destroyer': 'Trabajadora de sombras', 'pagan_practice_destroyer': 'Suelta, composta, transforma.',
            'pagan_archetype_fool': 'Trickster / Puck', 'pagan_practice_fool': 'Ríe de lo sagrado.',
            'pagan_archetype_magician': 'Bruja / Tejedora de hechizos', 'pagan_practice_magician': 'Voluntad, palabra y gesto.',
            'pagan_archetype_empress': 'Madre Tierra', 'pagan_practice_empress': 'Nutre todo lo que crece.',
            'pagan_archetype_emperor': 'Dios cornudo / Rey', 'pagan_practice_emperor': 'Gobierna el ciclo con fuerza.',
            'pagan_archetype_star': 'Diosa estelar', 'pagan_practice_star': 'Teje la red, guía el camino.',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': 'Luna oscura', 'pagan_practice_new': 'Descansa, sueña, no lances hechizos.',
            'pagan_moon_waxing_crescent': 'Cuarto creciente', 'pagan_practice_waxing_crescent': 'Comienza, planta, atrae.',
            'pagan_moon_first_quarter': 'Media luna creciente', 'pagan_practice_first_quarter': 'Atraviesa obstáculos.',
            'pagan_moon_waxing_gibbous': 'Llena creciente', 'pagan_practice_waxing_gibbous': 'Refina y fortalece.',
            'pagan_moon_full': 'Esbat (Luna llena)', 'pagan_practice_full': 'Ritual, carga, suelta.',
            'pagan_moon_waning_gibbous': 'Llena menguante', 'pagan_practice_waning_gibbous': 'Comparte la abundancia.',
            'pagan_moon_last_quarter': 'Media luna menguante', 'pagan_practice_last_quarter': 'Corta lo que ata.',
            'pagan_moon_waning_crescent': 'Balsámica / Oscureciendo', 'pagan_practice_waning_crescent': 'Calla, descansa, prepárate.',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': 'Fuego',
            'pagan_element_water': 'Agua',
            'pagan_element_earth': 'Tierra',
            'pagan_element_air': 'Aire',
            'pagan_element_ether': 'Espíritu / Éter',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': 'Litha', 'pagan_practice_summer_solstice': 'Salta el fuego, honra el sol.',
            'pagan_festival_winter_solstice': 'Yule', 'pagan_practice_winter_solstice': 'Quema el tronco, recibe la luz.',
            'pagan_festival_spring_equinox': 'Ostara', 'pagan_practice_spring_equinox': 'Planta semillas, equilibra luz y sombra.',
            'pagan_festival_autumn_equinox': 'Mabon', 'pagan_practice_autumn_equinox': 'Agradece, conserva la cosecha.',
            'pagan_festival_full_moon': 'Esbat', 'pagan_practice_full_moon': 'Traza el círculo, carga tus herramientas.',
            'pagan_festival_new_moon': 'Rito de luna nueva', 'pagan_practice_new_moon': 'Fija intenciones en la oscuridad.',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': 'Huevos, verdura, primeras bayas', 'pagan_season_emergence_herbs': 'Ortiga, diente de león, menta',
            'pagan_season_radiance_foods': 'Bayas, maíz, tomates', 'pagan_season_radiance_herbs': 'Lavanda, manzanilla, romero',
            'pagan_season_release_foods': 'Manzanas, calabaza, granos', 'pagan_season_release_herbs': 'Salvia, canela, clavo',
            'pagan_season_stillness_foods': 'Raíces, nueces, conservas', 'pagan_season_stillness_herbs': 'Pino, cedro, acebo',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': 'Marduk', 'mesopotamian_practice_creator': 'Ordena el caos, comienza.',
            'mesopotamian_archetype_healer': 'Sanador de Gula', 'mesopotamian_practice_healer': 'Cura heridas, usa las hierbas.',
            'mesopotamian_archetype_warrior': 'Ninurta', 'mesopotamian_practice_warrior': 'Lucha por la cosecha.',
            'mesopotamian_archetype_sage': 'Nabu (Escriba)', 'mesopotamian_practice_sage': 'Escribe, cuenta, registra.',
            'mesopotamian_archetype_lover': 'Ishtar', 'mesopotamian_practice_lover': 'Ama con audacia, celebra.',
            'mesopotamian_archetype_guardian': 'Guardián de Shamash', 'mesopotamian_practice_guardian': 'Guarda la puerta de la justicia.',
            'mesopotamian_archetype_mystic': 'Vidente de Enki', 'mesopotamian_practice_mystic': 'Sumérgete en las aguas profundas.',
            'mesopotamian_archetype_destroyer': 'Nergal', 'mesopotamian_practice_destroyer': 'Conduce los finales, limpia la decadencia.',
            'mesopotamian_archetype_fool': 'Bufón de la corte', 'mesopotamian_practice_fool': 'Búrlate de los poderosos, di la verdad.',
            'mesopotamian_archetype_magician': 'Ea / Enki (Encantador)', 'mesopotamian_practice_magician': 'Pronuncia la palabra que ata.',
            'mesopotamian_archetype_empress': 'Reina del cielo (Ishtar)', 'mesopotamian_practice_empress': 'Gobierna con resplandor.',
            'mesopotamian_archetype_emperor': 'Anu (Rey de los dioses)', 'mesopotamian_practice_emperor': 'Sostén los cielos y la ley.',
            'mesopotamian_archetype_star': 'Nanshe (Lectora de sueños)', 'mesopotamian_practice_star': 'Lee los sueños y presagios.',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': 'Luna nueva (Arḫu)', 'mesopotamian_practice_new': 'Descansa, espera, planifica.',
            'mesopotamian_moon_waxing_crescent': 'Creciente naciente', 'mesopotamian_practice_waxing_crescent': 'Comienza el trabajo.',
            'mesopotamian_moon_first_quarter': 'Media luna', 'mesopotamian_practice_first_quarter': 'Continúa la campaña.',
            'mesopotamian_moon_waxing_gibbous': 'Llena creciente', 'mesopotamian_practice_waxing_gibbous': 'Construye los muros, guarda grano.',
            'mesopotamian_moon_full': 'Luna llena (Šapattu)', 'mesopotamian_practice_full': 'Descansa del trabajo, festeja, honra a los dioses.',
            'mesopotamian_moon_waning_gibbous': 'Llena menguante', 'mesopotamian_practice_waning_gibbous': 'Liquida cuentas, comparte.',
            'mesopotamian_moon_last_quarter': 'Media luna menguante', 'mesopotamian_practice_last_quarter': 'Corta deudas, termina tareas.',
            'mesopotamian_moon_waning_crescent': 'Creciente oscuro', 'mesopotamian_practice_waning_crescent': 'Calla la ciudad, mantén vigilia.',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': 'Fuego de Girra',
            'mesopotamian_element_water': 'Aguas del Abzu (Ea)',
            'mesopotamian_element_earth': 'Tierra de Ki',
            'mesopotamian_element_air': 'Vientos de Enlil',
            'mesopotamian_element_ether': 'Cielos de Anu',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': 'Akitu de verano', 'mesopotamian_practice_summer_solstice': 'Honra el sol en su cénit.',
            'mesopotamian_festival_winter_solstice': 'Akitu de invierno', 'mesopotamian_practice_winter_solstice': 'Renueva el año en la oscuridad.',
            'mesopotamian_festival_spring_equinox': 'Akitu (Año nuevo)', 'mesopotamian_practice_spring_equinox': 'Corona al rey, renueva el mundo.',
            'mesopotamian_festival_autumn_equinox': 'Cosecha de Dumuzi', 'mesopotamian_practice_autumn_equinox': 'Llora y agradece al dios moribundo.',
            'mesopotamian_festival_full_moon': 'Šapattu (Luna llena)', 'mesopotamian_practice_full_moon': 'Depón el trabajo, festeja.',
            'mesopotamian_festival_new_moon': 'Arḫu (Luna nueva)', 'mesopotamian_practice_new_moon': 'Marca el mes, espera el creciente.',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': 'Cebada, dátiles, verdura', 'mesopotamian_season_emergence_herbs': 'Tomillo, comino, cilantro',
            'mesopotamian_season_radiance_foods': 'Higos, uvas, pepinos', 'mesopotamian_season_radiance_herbs': 'Menta, sésamo, anís',
            'mesopotamian_season_release_foods': 'Dátiles, granadas, granos', 'mesopotamian_season_release_herbs': 'Azafrán, laurel, sésamo',
            'mesopotamian_season_stillness_foods': 'Grano almacenado, dátiles secos, lentejas', 'mesopotamian_season_stillness_herbs': 'Enebro, incienso, mirra',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': 'Ptah / Khnum', 'egyptian_practice_creator': 'Moldea el día con intención.',
            'egyptian_archetype_healer': 'Imhotep', 'egyptian_practice_healer': 'Practica la medicina, escribe los remedios.',
            'egyptian_archetype_warrior': 'Sekhmet', 'egyptian_practice_warrior': 'Arde con fiereza, protege Ma\'at.',
            'egyptian_archetype_sage': 'Thoth', 'egyptian_practice_sage': 'Cuenta, escribe, mide el cielo.',
            'egyptian_archetype_lover': 'Hathor', 'egyptian_practice_lover': 'Goza de la música, el amor y el festín.',
            'egyptian_archetype_guardian': 'Anubis / Wepwawet', 'egyptian_practice_guardian': 'Guarda los umbrales del cambio.',
            'egyptian_archetype_mystic': 'Isis (Encantadora)', 'egyptian_practice_mystic': 'Teje hechizos de protección y vida.',
            'egyptian_archetype_destroyer': 'Seth (Devorador)', 'egyptian_practice_destroyer': 'Conmueve lo rígido, limpia lo rancio.',
            'egyptian_archetype_fool': 'Bes', 'egyptian_practice_fool': 'Baila, toca el tambor, guarda el hogar.',
            'egyptian_archetype_magician': 'Kheri-heb (sacerdote de Heka)', 'egyptian_practice_magician': 'Pronuncia las palabras de poder.',
            'egyptian_archetype_empress': 'Isis / Mut', 'egyptian_practice_empress': 'Madre de todo, protege el trono.',
            'egyptian_archetype_emperor': 'Ra (Faraón)', 'egyptian_practice_emperor': 'Levántate con el sol, ordena la tierra.',
            'egyptian_archetype_star': 'Nut (Lectora de estrellas)', 'egyptian_practice_star': 'Lee el cielo, mantén el ritmo cósmico.',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': 'Oscuridad de Nun', 'egyptian_practice_new': 'Descansa en las aguas del comienzo.',
            'egyptian_moon_waxing_crescent': 'Creciente de Khonsu', 'egyptian_practice_waxing_crescent': 'Comienza el viaje.',
            'egyptian_moon_first_quarter': 'Media luna creciente', 'egyptian_practice_first_quarter': 'Construye con ambas manos.',
            'egyptian_moon_waxing_gibbous': 'Llena creciente', 'egyptian_practice_waxing_gibbous': 'Reúne fuerza y grano.',
            'egyptian_moon_full': 'Ojo de Khonsu (Llena)', 'egyptian_practice_full': 'Festeja, honra al dios lunar.',
            'egyptian_moon_waning_gibbous': 'Llena menguante', 'egyptian_practice_waning_gibbous': 'Devuelve, registra, liquida.',
            'egyptian_moon_last_quarter': 'Media luna menguante', 'egyptian_practice_last_quarter': 'Aligera la carga, purifica.',
            'egyptian_moon_waning_crescent': 'Creciente menguante', 'egyptian_practice_waning_crescent': 'Retírate, sueña, prepárate para renacer.',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': 'Fuego de Ra',
            'egyptian_element_water': 'Aguas de Nun',
            'egyptian_element_earth': 'Tierra de Geb',
            'egyptian_element_air': 'Aire de Shu',
            'egyptian_element_ether': 'Cielo de Nut',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': 'Año nuevo sotíaco (salida de Sirio)', 'egyptian_practice_summer_solstice': 'Marca la inundación, comienza el año.',
            'egyptian_festival_winter_solstice': 'Fiesta del sol oculto', 'egyptian_practice_winter_solstice': 'Honra el renacimiento del sol en la sombra.',
            'egyptian_festival_spring_equinox': 'Opet (Ascenso de primavera)', 'egyptian_practice_spring_equinox': 'Procesión con los dioses, bendice la tierra.',
            'egyptian_festival_autumn_equinox': 'Fiesta de Thoth', 'egyptian_practice_autumn_equinox': 'Honra la escritura, el juicio y el equilibrio.',
            'egyptian_festival_full_moon': 'Fiesta de la luna llena', 'egyptian_practice_full_moon': 'Mantén vigilia, ofrece, celebra.',
            'egyptian_festival_new_moon': 'Fiesta de la luna nueva', 'egyptian_practice_new_moon': 'Renueva, purifica, comienza.',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': 'Grano, habas, verdura', 'egyptian_season_emergence_herbs': 'Lechuga, menta, ajo',
            'egyptian_season_radiance_foods': 'Higos, uvas, melón', 'egyptian_season_radiance_herbs': 'Comino, eneldo, cebolla',
            'egyptian_season_release_foods': 'Dátiles, granada, trigo', 'egyptian_season_release_herbs': 'Incienso, mirra, anís',
            'egyptian_season_stillness_foods': 'Granos almacenados, pescado seco, miel', 'egyptian_season_stillness_herbs': 'Tomillo, enebro, alholva',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': 'Itzamná (Creador)', 'mayan_practice_creator': 'Teje el nuevo día a la existencia.',
            'mayan_archetype_healer': 'Ix Chel', 'mayan_practice_healer': 'Cuida el cuerpo, trabaja con hierbas.',
            'mayan_archetype_warrior': 'Guerrero jaguar', 'mayan_practice_warrior': 'Muévete en la oscuridad, protege la tribu.',
            'mayan_archetype_sage': 'Contador de días (Aj Q\'ij)', 'mayan_practice_sage': 'Cuenta los días, lee los signos.',
            'mayan_archetype_lover': 'Ix Tab', 'mayan_practice_lover': 'Celebra el amor y la noche.',
            'mayan_archetype_guardian': 'Guardián de Chac', 'mayan_practice_guardian': 'Protege el agua, la lluvia y el crecimiento.',
            'mayan_archetype_mystic': 'Chamán (Aj Q\'ij)', 'mayan_practice_mystic': 'Viaja entre los mundos.',
            'mayan_archetype_destroyer': 'Ah Puch', 'mayan_practice_destroyer': 'Guía los finales, cuida el inframundo.',
            'mayan_archetype_fool': 'Mono aullador (Batz\')', 'mayan_practice_fool': 'Aúlla, toca el tambor, crea, ríe.',
            'mayan_archetype_magician': 'Encantador (Dios D)', 'mayan_practice_magician': 'Cambia de forma, mira más allá.',
            'mayan_archetype_empress': 'Ix Chel (Madre luna)', 'mayan_practice_empress': 'Amamanta la creación, teje el destino.',
            'mayan_archetype_emperor': 'Kinich Ahau (Señor sol)', 'mayan_practice_emperor': 'Levántate cada día, alimenta al pueblo.',
            'mayan_archetype_star': 'Venus (Estrella de Kukulkan)', 'mayan_practice_star': 'Sigue la estrella del alba, guía el camino.',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': 'Luna oscura (Ik\')', 'mayan_practice_new': 'Descansa, ayuna, escucha.',
            'mayan_moon_waxing_crescent': 'Creciente naciente', 'mayan_practice_waxing_crescent': 'Planta, comienza, crece.',
            'mayan_moon_first_quarter': 'Media luna', 'mayan_practice_first_quarter': 'Despeja el campo, actúa.',
            'mayan_moon_waxing_gibbous': 'Llena creciente', 'mayan_practice_waxing_gibbous': 'Cosecha fuerza, refina.',
            'mayan_moon_full': 'Luna llena (Nohoch)', 'mayan_practice_full': 'Festeja, agradece, suelta.',
            'mayan_moon_waning_gibbous': 'Llena menguante', 'mayan_practice_waning_gibbous': 'Comparte, enseña, distribuye.',
            'mayan_moon_last_quarter': 'Media luna menguante', 'mayan_practice_last_quarter': 'Suelta, aclara, libera.',
            'mayan_moon_waning_crescent': 'Creciente que se pone', 'mayan_practice_waning_crescent': 'Duerme, sueña, renueva.',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': 'Fuego (K\'ak\')',
            'mayan_element_water': 'Agua (Ha\')',
            'mayan_element_earth': 'Tierra (Kab)',
            'mayan_element_air': 'Viento (Ik\')',
            'mayan_element_ether': 'Cielo (Hunab Ku)',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': 'Solsticio del sol', 'mayan_practice_summer_solstice': 'Honra el sol en su cénit.',
            'mayan_festival_winter_solstice': 'Fuego nuevo (retorno del sol)', 'mayan_practice_winter_solstice': 'Reaviva el fuego, renueva el ciclo.',
            'mayan_festival_spring_equinox': 'Descenso de Kukulkan', 'mayan_practice_spring_equinox': 'Observa la serpiente descender la pirámide.',
            'mayan_festival_autumn_equinox': 'Ascenso de Kukulkan', 'mayan_practice_autumn_equinox': 'Observa la serpiente ascender.',
            'mayan_festival_full_moon': 'Ceremonia de luna llena', 'mayan_practice_full_moon': 'Canta, baila, ofrece.',
            'mayan_festival_new_moon': 'Ceremonia del fuego nuevo', 'mayan_practice_new_moon': 'Ayuna, purifica, fija una intención.',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': 'Maíz, frijoles, verdura', 'mayan_season_emergence_herbs': 'Epazote, cilantro, menta',
            'mayan_season_radiance_foods': 'Maíz, tomates, fruta tropical', 'mayan_season_radiance_herbs': 'Achiote, chaya, lima',
            'mayan_season_release_foods': 'Calabaza, cosecha de maíz, aguacate', 'mayan_season_release_herbs': 'Pimienta de Jamaica, vainilla, cacao',
            'mayan_season_stillness_foods': 'Maíz seco, frijoles, miel', 'mayan_season_stillness_herbs': 'Copal, cacao, zarzaparrilla',
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
            'action.capture': '捕捉瞬间',
            'action.capture.title': '拍照并盖上这个 Kairos 时刻的印章',
            'action.share': '分享这一刻',
            'action.share.title': '将此时刻导出为文本或图片',
            'kst.solar_longitude': '🌞 太阳黄经',
            'kst.lunar_age': '🌙 月龄',
            'kst.sidereal_time': '🌀 恒星时',
            'kst.visible_star': '⭐ 可见恒星',
            'kst.celestial_season': '🌍 天球季节',
            'kst.planets': '🪐 行星',
            'seasonal.in_season': '当季',
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
            'config.time_system': '⏱️ 时间系统',
            'config.time_system_hint':
                '用十三进制时钟阅读同一片天空（13小时/28分/13秒），或选择26小时节律'
                + '——13小时光明 + 13小时黑暗（26小时/28分/7秒）。两者中自然正午均为太阳正午。',
            'config.time_system_current': '🌍 当前时间（24小时 / 60 / 60）',
            'config.time_system_natural': '🌿 自然时间（13小时 / 28 / 13）',
            'config.time_system_natural_badge': '🌿 自然时间',
            'config.time_system_kairos_natural': '🌿 凯洛斯自然时间（26小时 / 28分 / 7秒）',
            'config.time_system_kairos_natural_badge': '🌿 凯洛斯自然时间',
            'config.time_system_kairos_kepler': '🌿 开普勒凯洛斯（26 步 / 28 拍 / 7 脉冲）',
            'config.time_system_kairos_kepler_badge': '🌿 开普勒凯洛斯',
            'config.light_beam': '🌍 显示阳光',
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
            'energy.archetype': '原型',
            'energy.moon_mood': '月亮情绪',
            'energy.element': '{glyph} 元素',
            'energy.season': '🕯️ {season}',
            'energy.in_season': '当季',
            'energy.festival': '节日',
            'energy.food': '食物',
            'help.what_am_i_looking_at': '我在看什么？',
            'help.planets_now': '🪐 现在的行星（秘传注解）',
            'help.planet_in': '位于 {sign}',
            'help.planets_fallback':
                '行星位置来自天体引擎——使用服务器时为 Skyfield；离线时'
                + '为紧凑的浏览器算法（web/planets.js）。',
            'help.todays_energy': '今日的能量',
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
            'season_button.Spring': '春',
            'season_button.Summer': '夏',
            'season_button.Autumn': '秋',
            'season_button.Winter': '冬',
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
            // ---- Energy Lens -------------------------------------------------
            'config.calendar_lens': '📅 历法透镜',
            'config.energy_lens': '🌿 能量透镜',
            'config.month_style': '📅 月份名称',
            'config.month_style_kairos': '🌿 凯洛斯之月（根月等）',
            'config.month_style_zodiac': '♐ 真实黄道（摩羯座等）',
            'config.index_style': '🔢 显示索引',
            'config.index_style_zero': '🌿 自然（00:00:00 – 25:28:06）',
            'config.index_style_one': '🌿 传统（01:01:01 – 26:28:07）',
            'obs.index_style_switched': '显示索引已设置为 {style}',
            'obs.month_style_switched': '月份样式已设置为 {style}',
            'energy_lens_none': '无（纯净凯罗斯）',
            'energy_lens_curanderismo': '库兰德罗主义',
            'energy_lens_taoist': '道家',
            'energy_lens_vedic': '吠陀',
            'energy_lens_pagan': '异教 / 威卡',
            'energy_lens_mesopotamian': '美索不达米亚',
            'energy_lens_egyptian': '埃及',
            'energy_lens_mayan': '玛雅',
            'direction_north': '北',
            'direction_south': '南',
            'direction_east': '东',
            'direction_west': '西',
            'direction_center': '中',
            'color_red': '红',
            'color_blue': '蓝',
            'color_green': '绿',
            'color_yellow': '黄',
            'color_white': '白',
            'color_black': '黑',
            'obs.energy_switched': '能量透镜已设置为 {lens}',
            // ---- Curanderismo archetypes ----------------------------------
            'curanderismo_archetype_creator': '创造者 / 织造者', 'curanderismo_practice_creator': '用双手创造些什么。',
            'curanderismo_archetype_healer': '疗愈者', 'curanderismo_practice_healer': '照顾自己或他人。',
            'curanderismo_archetype_warrior': '守护者 / 保护者', 'curanderismo_practice_warrior': '为真实之事挺身而出。',
            'curanderismo_archetype_sage': '长者 / 智慧守护者', 'curanderismo_practice_sage': '分享知识或深深倾听。',
            'curanderismo_archetype_lover': '舞者 / 采集者', 'curanderismo_practice_lover': '连接、分享食物、庆祝。',
            'curanderismo_archetype_guardian': '守卫 / 保卫者', 'curanderismo_practice_guardian': '保护弱者或土地。',
            'curanderismo_archetype_mystic': '梦想家 / 先知', 'curanderismo_practice_mystic': '冥想、做梦、观察。',
            'curanderismo_archetype_destroyer': '转化者 / 火焰守护者', 'curanderismo_practice_destroyer': '燃烧不再有用之物。',
            'curanderismo_archetype_fool': '捣蛋鬼 / 乌鸦', 'curanderismo_practice_fool': '欢笑、玩耍、打破模式。',
            'curanderismo_archetype_magician': '变形者', 'curanderismo_practice_magician': '改变形态，尝试新事物。',
            'curanderismo_archetype_empress': '母亲 / 大地守护者', 'curanderismo_practice_empress': '滋养、成长、接受。',
            'curanderismo_archetype_emperor': '父亲 / 天空守护者', 'curanderismo_practice_emperor': '领导、建造、整理。',
            'curanderismo_archetype_star': '观星者 / 开路者', 'curanderismo_practice_star': '希望、远见、指引。',
            // ---- Curanderismo moon moods -----------------------------------
            'curanderismo_moon_new': '黑暗 / 等待', 'curanderismo_practice_new': '休息，种下一粒种子（意图）。',
            'curanderismo_moon_waxing_crescent': '生长 / 诞生', 'curanderismo_practice_waxing_crescent': '迈出第一步。',
            'curanderismo_moon_first_quarter': '推进 / 浮现', 'curanderismo_practice_first_quarter': '突破障碍。',
            'curanderismo_moon_waxing_gibbous': '建造 / 加强', 'curanderismo_practice_waxing_gibbous': '继续前进，精进。',
            'curanderismo_moon_full': '明亮 / 圆满', 'curanderismo_practice_full': '盛宴、感恩、释放。',
            'curanderismo_moon_waning_gibbous': '分享 / 教导', 'curanderismo_practice_waning_gibbous': '奉献你的知识。',
            'curanderismo_moon_last_quarter': '释放 / 割断', 'curanderismo_practice_last_quarter': '放下沉重之事。',
            'curanderismo_moon_waning_crescent': '休憩 / 做梦', 'curanderismo_practice_waning_crescent': '睡眠、做梦、倾听。',
            // ---- Curanderismo elements --------------------------------------
            'curanderismo_element_fire': '火',
            'curanderismo_element_water': '水',
            'curanderismo_element_earth': '土',
            'curanderismo_element_air': '气',
            'curanderismo_element_ether': '以太 / 灵',
            // ---- Curanderismo festivals -------------------------------------
            'curanderismo_festival_summer_solstice': '印蒂·拉伊米（太阳节）', 'curanderismo_practice_summer_solstice': '日出仪式，火之庆典。',
            'curanderismo_festival_winter_solstice': '妈妈·奎拉（月亮节）', 'curanderismo_practice_winter_solstice': '守夜、讲故事。',
            'curanderismo_festival_spring_equinox': '鲜花仪式', 'curanderismo_practice_spring_equinox': '种下种子，献上花朵。',
            'curanderismo_festival_autumn_equinox': '丰收仪式', 'curanderismo_practice_autumn_equinox': '感恩、分享食物。',
            'curanderismo_festival_full_moon': '特特奥·因南（母亲之夜）', 'curanderismo_practice_full_moon': '跳舞、歌唱、释放。',
            'curanderismo_festival_new_moon': '暗夜仪式', 'curanderismo_practice_new_moon': '禁食、冥想、定下意图。',
            // ---- Curanderismo seasons ----------------------------------------
            'curanderismo_season_emergence_foods': '新鲜绿叶菜、浆果、鸡蛋', 'curanderismo_season_emergence_herbs': '荨麻、蒲公英、薄荷',
            'curanderismo_season_radiance_foods': '玉米、番茄、辣椒、南瓜', 'curanderismo_season_radiance_herbs': '罗勒、鼠尾草、迷迭香',
            'curanderismo_season_release_foods': '南瓜、根茎蔬菜、苹果', 'curanderismo_season_release_herbs': '肉桂、丁香、生姜',
            'curanderismo_season_stillness_foods': '豆类、谷物、干果', 'curanderismo_season_stillness_herbs': '桉树、松树、雪松',
            // ---- Taoist archetypes ------------------------------------------
            'taoist_archetype_creator': '工匠', 'taoist_practice_creator': '以耐心与技艺塑造某物。',
            'taoist_archetype_healer': '药师', 'taoist_practice_healer': '准备草药，照料身体。',
            'taoist_archetype_warrior': '护法', 'taoist_practice_warrior': '站稳立场，守护平衡。',
            'taoist_archetype_sage': '贤者', 'taoist_practice_sage': '研习，然后平实地传授。',
            'taoist_archetype_lover': '和合者', 'taoist_practice_lover': '滋养情谊，共饮一茶。',
            'taoist_archetype_guardian': '守门人', 'taoist_practice_guardian': '守住门坎，维持秩序。',
            'taoist_archetype_mystic': '仙人', 'taoist_practice_mystic': '静坐守寂，涵养真气。',
            'taoist_archetype_destroyer': '除旧者', 'taoist_practice_destroyer': '清除陈腐，腾出空间。',
            'taoist_archetype_fool': '云游者', 'taoist_practice_fool': '云游、欢笑、简朴生活。',
            'taoist_archetype_magician': '炼丹者', 'taoist_practice_magician': '把内在之铅炼成黄金。',
            'taoist_archetype_empress': '慈母', 'taoist_practice_empress': '滋养生长，慷慨大方。',
            'taoist_archetype_emperor': '师尊', 'taoist_practice_emperor': '以德引领，不以力强。',
            'taoist_archetype_star': '北辰', 'taoist_practice_star': '坚守本心，指引他人。',
            // ---- Taoist moon moods --------------------------------------------
            'taoist_moon_new': '太阴', 'taoist_practice_new': '休息，聚集真气。',
            'taoist_moon_waxing_crescent': '萌发', 'taoist_practice_waxing_crescent': '种下意图之种。',
            'taoist_moon_first_quarter': '生长', 'taoist_practice_first_quarter': '向前推进，占据优势。',
            'taoist_moon_waxing_gibbous': '成熟', 'taoist_practice_waxing_gibbous': '精进你的作品。',
            'taoist_moon_full': '阳盈', 'taoist_practice_full': '庆祝、感恩。',
            'taoist_moon_waning_gibbous': '分享', 'taoist_practice_waning_gibbous': '传授你所知。',
            'taoist_moon_last_quarter': '回收', 'taoist_practice_last_quarter': '放下、简化。',
            'taoist_moon_waning_crescent': '归藏', 'taoist_practice_waning_crescent': '退藏、储存、做梦。',
            // ---- Taoist elements -----------------------------------------------
            'taoist_element_fire': '火（火）',
            'taoist_element_water': '水（水）',
            'taoist_element_earth': '土（土）',
            'taoist_element_air': '风（风）',
            'taoist_element_ether': '虚（虚）',
            // ---- Taoist festivals ----------------------------------------------
            'taoist_festival_summer_solstice': '年中之火（夏至）', 'taoist_practice_summer_solstice': '礼赞圆满之阳。',
            'taoist_festival_winter_solstice': '光之回归（冬至）', 'taoist_practice_winter_solstice': '礼赞新生之阳。',
            'taoist_festival_spring_equinox': '春分', 'taoist_practice_spring_equinox': '种植、开始、平衡。',
            'taoist_festival_autumn_equinox': '秋分', 'taoist_practice_autumn_equinox': '收获、储存、放手。',
            'taoist_festival_full_moon': '望月', 'taoist_practice_full_moon': '相聚、感恩、仰望月亮。',
            'taoist_festival_new_moon': '朔月', 'taoist_practice_new_moon': '休息、禁食、更新。',
            // ---- Taoist seasons -------------------------------------------------
            'taoist_season_emergence_foods': '春蔬、竹笋、鸡蛋', 'taoist_season_emergence_herbs': '薄荷、菊花、绿茶',
            'taoist_season_radiance_foods': '甜瓜、黄瓜、苦菜', 'taoist_season_radiance_herbs': '荷叶、绿豆、薄荷油',
            'taoist_season_release_foods': '根茎、南瓜、米饭', 'taoist_season_release_herbs': '生姜、枸杞、肉桂',
            'taoist_season_stillness_foods': '热汤、豆腐、腌制品', 'taoist_season_stillness_herbs': '黄芪、红茶、丁香',
            // ---- Vedic archetypes ---------------------------------------------
            'vedic_archetype_creator': '梵天', 'vedic_practice_creator': '以清明开始新的事物。',
            'vedic_archetype_healer': '檀梵陀利', 'vedic_practice_healer': '服务健康；照料身心。',
            'vedic_archetype_warrior': '刹帝利', 'vedic_practice_warrior': '以勇气护持正法。',
            'vedic_archetype_sage': '仙人', 'vedic_practice_sage': '学习、唱诵、分享智慧。',
            'vedic_archetype_lover': '克里希纳', 'vedic_practice_lover': '享受连接与歌唱。',
            'vedic_archetype_guardian': '门神', 'vedic_practice_guardian': '以虔诚守护门坎。',
            'vedic_archetype_mystic': '瑜伽士', 'vedic_practice_mystic': '冥想、呼吸、向内而行。',
            'vedic_archetype_destroyer': '湿婆', 'vedic_practice_destroyer': '消融不再有用之物。',
            'vedic_archetype_fool': '那罗陀', 'vedic_practice_fool': '奏乐、云游、歌唱。',
            'vedic_archetype_magician': '悉达', 'vedic_practice_magician': '勤修技艺直至化为力量。',
            'vedic_archetype_empress': '吉祥天女', 'vedic_practice_empress': '给予并接纳丰盛。',
            'vedic_archetype_emperor': '毗湿奴', 'vedic_practice_emperor': '以优雅维系秩序。',
            'vedic_archetype_star': '北极星', 'vedic_practice_star': '做旋转天穹中的定点。',
            // ---- Vedic moon moods ----------------------------------------------
            'vedic_moon_new': '新月（阿摩婆娑）', 'vedic_practice_new': '休息、禁食、定下誓愿。',
            'vedic_moon_waxing_crescent': '白分初一', 'vedic_practice_waxing_crescent': '开始新的事业。',
            'vedic_moon_first_quarter': '白分初八', 'vedic_practice_first_quarter': '聚集力量，采取行动。',
            'vedic_moon_waxing_gibbous': '白分十一', 'vedic_practice_waxing_gibbous': '自律、精进、轻斋。',
            'vedic_moon_full': '满月', 'vedic_practice_full': '感恩、分享、庆祝。',
            'vedic_moon_waning_gibbous': '黑分十一', 'vedic_practice_waning_gibbous': '反省、服务、简化。',
            'vedic_moon_last_quarter': '黑分初八', 'vedic_practice_last_quarter': '放下执念，净化身心。',
            'vedic_moon_waning_crescent': '黑分初一', 'vedic_practice_waning_crescent': '退隐、休息、做梦。',
            // ---- Vedic elements ------------------------------------------------
            'vedic_element_fire': '阿耆尼（火）',
            'vedic_element_water': '水（水）',
            'vedic_element_earth': '地（土）',
            'vedic_element_air': '风（气）',
            'vedic_element_ether': '空（以太）',
            // ---- Vedic festivals ------------------------------------------------
            'vedic_festival_summer_solstice': '南行开始', 'vedic_practice_summer_solstice': '礼赞太阳的转向。',
            'vedic_festival_winter_solstice': '北行开始', 'vedic_practice_winter_solstice': '庆祝光的回归。',
            'vedic_festival_spring_equinox': '春季九夜节', 'vedic_practice_spring_equinox': '敬拜圣母，重新播种。',
            'vedic_festival_autumn_equinox': '秋季九夜节', 'vedic_practice_autumn_equinox': '礼赞女神，分享丰收。',
            'vedic_festival_full_moon': '满月', 'vedic_practice_full_moon': '冥想、布施、庆祝。',
            'vedic_festival_new_moon': '新月', 'vedic_practice_new_moon': '礼敬祖先，安歇。',
            // ---- Vedic seasons ---------------------------------------------------
            'vedic_season_emergence_foods': '绿叶菜、嫩芽、芒果', 'vedic_season_emergence_herbs': '圣罗勒、姜黄、香菜',
            'vedic_season_radiance_foods': '清凉酸奶、黄瓜、拉西', 'vedic_season_radiance_herbs': '茴香、薄荷、玫瑰',
            'vedic_season_release_foods': '谷物、酥油、根茎蔬菜', 'vedic_season_release_herbs': '南非醉茄、生姜、小豆蔻',
            'vedic_season_stillness_foods': '热豆饭、坚果、椰枣', 'vedic_season_stillness_herbs': '三果粉、肉桂、圣罗勒',
            // ---- Pagan archetypes ----------------------------------------------
            'pagan_archetype_creator': '创生者 / 制作者', 'pagan_practice_creator': '塑造、编织、使之诞生。',
            'pagan_archetype_healer': '绿巫', 'pagan_practice_healer': '以草药行医，护理创伤。',
            'pagan_archetype_warrior': '女战士', 'pagan_practice_warrior': '为你所爱之事挺身而出。',
            'pagan_archetype_sage': '老妪智者', 'pagan_practice_sage': '平实地讲述古老的智慧。',
            'pagan_archetype_lover': '五月女王', 'pagan_practice_lover': '礼赞肉身与大地。',
            'pagan_archetype_guardian': '炉火守护者', 'pagan_practice_guardian': '守护家园与圆环。',
            'pagan_archetype_mystic': '神谕者 / 先知', 'pagan_practice_mystic': '聆听幽微之处。',
            'pagan_archetype_destroyer': '暗影工作者', 'pagan_practice_destroyer': '释放、堆肥、转化。',
            'pagan_archetype_fool': '捣蛋鬼 / 帕克', 'pagan_practice_fool': '对神圣报以欢笑。',
            'pagan_archetype_magician': '女巫 / 咒语编织者', 'pagan_practice_magician': '意志、言词与手势。',
            'pagan_archetype_empress': '大地母亲', 'pagan_practice_empress': '滋养一切生长之物。',
            'pagan_archetype_emperor': '角神 / 国王', 'pagan_practice_emperor': '以力量统御轮回。',
            'pagan_archetype_star': '星辰女神', 'pagan_practice_star': '编织法网，指引道路。',
            // ---- Pagan moon moods ------------------------------------------------
            'pagan_moon_new': '暗月', 'pagan_practice_new': '休息、做梦、不施法术。',
            'pagan_moon_waxing_crescent': '渐盈娥眉月', 'pagan_practice_waxing_crescent': '开始、种植、吸引。',
            'pagan_moon_first_quarter': '上弦月', 'pagan_practice_first_quarter': '冲破障碍。',
            'pagan_moon_waxing_gibbous': '盈凸月', 'pagan_practice_waxing_gibbous': '精进与加强。',
            'pagan_moon_full': '满月祭（满月）', 'pagan_practice_full': '仪式、充能、释放。',
            'pagan_moon_waning_gibbous': '亏凸月', 'pagan_practice_waning_gibbous': '分享丰盛。',
            'pagan_moon_last_quarter': '下弦月', 'pagan_practice_last_quarter': '割断束缚。',
            'pagan_moon_waning_crescent': '香脂月 / 渐暗', 'pagan_practice_waning_crescent': '静默、休憩、准备。',
            // ---- Pagan elements --------------------------------------------------
            'pagan_element_fire': '火',
            'pagan_element_water': '水',
            'pagan_element_earth': '土',
            'pagan_element_air': '气',
            'pagan_element_ether': '灵 / 以太',
            // ---- Pagan festivals --------------------------------------------------
            'pagan_festival_summer_solstice': '利萨', 'pagan_practice_summer_solstice': '跃过火焰，礼赞太阳。',
            'pagan_festival_winter_solstice': '尤尔', 'pagan_practice_winter_solstice': '焚烧木柴，迎接光明。',
            'pagan_festival_spring_equinox': '奥斯塔拉', 'pagan_practice_spring_equinox': '播下种子，平衡光与暗。',
            'pagan_festival_autumn_equinox': '马邦', 'pagan_practice_autumn_equinox': '感恩，保存收成。',
            'pagan_festival_full_moon': '满月祭', 'pagan_practice_full_moon': '画圆结界，为法器充能。',
            'pagan_festival_new_moon': '新月仪式', 'pagan_practice_new_moon': '在黑暗中定下意图。',
            // ---- Pagan seasons -----------------------------------------------------
            'pagan_season_emergence_foods': '鸡蛋、绿叶菜、早春浆果', 'pagan_season_emergence_herbs': '荨麻、蒲公英、薄荷',
            'pagan_season_radiance_foods': '浆果、玉米、番茄', 'pagan_season_radiance_herbs': '薰衣草、洋甘菊、迷迭香',
            'pagan_season_release_foods': '苹果、南瓜、谷物', 'pagan_season_release_herbs': '鼠尾草、肉桂、丁香',
            'pagan_season_stillness_foods': '根茎蔬菜、坚果、腌渍品', 'pagan_season_stillness_herbs': '松树、雪松、冬青',
            // ---- Mesopotamian archetypes --------------------------------------
            'mesopotamian_archetype_creator': '马杜克', 'mesopotamian_practice_creator': '整顿混沌，开始创造。',
            'mesopotamian_archetype_healer': '古拉之医者', 'mesopotamian_practice_healer': '护理创伤，善用草药。',
            'mesopotamian_archetype_warrior': '尼努尔塔', 'mesopotamian_practice_warrior': '为丰收而战。',
            'mesopotamian_archetype_sage': '那布（书吏）', 'mesopotamian_practice_sage': '书写、计数、记录。',
            'mesopotamian_archetype_lover': '伊什塔尔', 'mesopotamian_practice_lover': '大胆去爱，尽情庆祝。',
            'mesopotamian_archetype_guardian': '沙玛什之门卫', 'mesopotamian_practice_guardian': '把守正义之门。',
            'mesopotamian_archetype_mystic': '恩基之先知', 'mesopotamian_practice_mystic': '潜入深水之中。',
            'mesopotamian_archetype_destroyer': '内尔伽勒', 'mesopotamian_practice_destroyer': '主导终结，清除衰败。',
            'mesopotamian_archetype_fool': '宫廷弄臣', 'mesopotamian_practice_fool': '嘲弄权贵，言说真相。',
            'mesopotamian_archetype_magician': '埃阿 / 恩基（巫师）', 'mesopotamian_practice_magician': '说出束缚之言。',
            'mesopotamian_archetype_empress': '天之女王（伊什塔尔）', 'mesopotamian_practice_empress': '以光芒统治。',
            'mesopotamian_archetype_emperor': '安努（众神之王）', 'mesopotamian_practice_emperor': '执掌天穹与律法。',
            'mesopotamian_archetype_star': '南舍（解梦者）', 'mesopotamian_practice_star': '解读梦境与预兆。',
            // ---- Mesopotamian moon moods ----------------------------------------
            'mesopotamian_moon_new': '新月（阿胡）', 'mesopotamian_practice_new': '休息、等待、规划。',
            'mesopotamian_moon_waxing_crescent': '初升新月', 'mesopotamian_practice_waxing_crescent': '开始工作。',
            'mesopotamian_moon_first_quarter': '半月', 'mesopotamian_practice_first_quarter': '继续推进。',
            'mesopotamian_moon_waxing_gibbous': '盈凸月', 'mesopotamian_practice_waxing_gibbous': '筑墙储粮。',
            'mesopotamian_moon_full': '满月（沙帕图）', 'mesopotamian_practice_full': '歇工、宴饮、礼敬诸神。',
            'mesopotamian_moon_waning_gibbous': '亏凸月', 'mesopotamian_practice_waning_gibbous': '结算账目，与人分享。',
            'mesopotamian_moon_last_quarter': '下弦月', 'mesopotamian_practice_last_quarter': '了结债务，完成事务。',
            'mesopotamian_moon_waning_crescent': '暗月牙', 'mesopotamian_practice_waning_crescent': '静默城市，守夜观望。',
            // ---- Mesopotamian elements ------------------------------------------
            'mesopotamian_element_fire': '吉拉之火',
            'mesopotamian_element_water': '阿普苏之水（埃阿）',
            'mesopotamian_element_earth': '基之大地',
            'mesopotamian_element_air': '恩利勒之风',
            'mesopotamian_element_ether': '安努之天',
            // ---- Mesopotamian festivals ------------------------------------------
            'mesopotamian_festival_summer_solstice': '仲夏阿基图', 'mesopotamian_practice_summer_solstice': '礼赞太阳之极。',
            'mesopotamian_festival_winter_solstice': '冬至阿基图', 'mesopotamian_practice_winter_solstice': '于黑暗中更新岁年。',
            'mesopotamian_festival_spring_equinox': '阿基图（新年）', 'mesopotamian_practice_spring_equinox': '加冕国王，更新世界。',
            'mesopotamian_festival_autumn_equinox': '杜牧兹之丰收', 'mesopotamian_practice_autumn_equinox': '哀悼并感恩垂死之神。',
            'mesopotamian_festival_full_moon': '沙帕图（满月）', 'mesopotamian_practice_full_moon': '放下工作，欢庆节日。',
            'mesopotamian_festival_new_moon': '阿胡（新月）', 'mesopotamian_practice_new_moon': '标记月份，静候月牙。',
            // ---- Mesopotamian seasons ---------------------------------------------
            'mesopotamian_season_emergence_foods': '大麦、椰枣、绿叶菜', 'mesopotamian_season_emergence_herbs': '百里香、孜然、香菜',
            'mesopotamian_season_radiance_foods': '无花果、葡萄、黄瓜', 'mesopotamian_season_radiance_herbs': '薄荷、芝麻、八角',
            'mesopotamian_season_release_foods': '椰枣、石榴、谷物', 'mesopotamian_season_release_herbs': '藏红花、月桂、芝麻',
            'mesopotamian_season_stillness_foods': '储粮、干椰枣、扁豆', 'mesopotamian_season_stillness_herbs': '杜松、乳香、没药',
            // ---- Egyptian archetypes -------------------------------------------
            'egyptian_archetype_creator': '普塔 / 赫努姆', 'egyptian_practice_creator': '以意图塑造今日。',
            'egyptian_archetype_healer': '伊姆霍特普', 'egyptian_practice_healer': '行医济世，书写药方。',
            'egyptian_archetype_warrior': '塞赫迈特', 'egyptian_practice_warrior': '猛烈燃烧，护持玛阿特。',
            'egyptian_archetype_sage': '透特', 'egyptian_practice_sage': '计数、书写、丈量天空。',
            'egyptian_archetype_lover': '哈索尔', 'egyptian_practice_lover': '沉醉于音乐、爱与盛宴。',
            'egyptian_archetype_guardian': '阿努比斯 / 乌普奥特', 'egyptian_practice_guardian': '守护变迁的门坎。',
            'egyptian_archetype_mystic': '伊西斯（女巫）', 'egyptian_practice_mystic': '编织守护与生命之咒。',
            'egyptian_archetype_destroyer': '赛特（吞噬者）', 'egyptian_practice_destroyer': '撼动僵固，清除陈腐。',
            'egyptian_archetype_fool': '贝斯', 'egyptian_practice_fool': '跳舞、击鼓、守护家宅。',
            'egyptian_archetype_magician': '赫卡祭司', 'egyptian_practice_magician': '念诵力量之言。',
            'egyptian_archetype_empress': '伊西斯 / 穆特', 'egyptian_practice_empress': '化育万物，守护王座。',
            'egyptian_archetype_emperor': '拉（法老）', 'egyptian_practice_emperor': '随日而起，治理国土。',
            'egyptian_archetype_star': '努特（观星者）', 'egyptian_practice_star': '阅读天象，守持宇宙节律。',
            // ---- Egyptian moon moods ---------------------------------------------
            'egyptian_moon_new': '努之幽暗', 'egyptian_practice_new': '于太初之水中安歇。',
            'egyptian_moon_waxing_crescent': '孔苏之月牙', 'egyptian_practice_waxing_crescent': '开始航程。',
            'egyptian_moon_first_quarter': '盈半月', 'egyptian_practice_first_quarter': '以双手建造。',
            'egyptian_moon_waxing_gibbous': '盈凸月', 'egyptian_practice_waxing_gibbous': '聚集力量与谷物。',
            'egyptian_moon_full': '孔苏之眼（满月）', 'egyptian_practice_full': '盛宴，礼赞月神。',
            'egyptian_moon_waning_gibbous': '亏凸月', 'egyptian_practice_waning_gibbous': '回馈、记录、结清。',
            'egyptian_moon_last_quarter': '下弦月', 'egyptian_practice_last_quarter': '减轻负担，净化身心。',
            'egyptian_moon_waning_crescent': '残月', 'egyptian_practice_waning_crescent': '退藏、做梦、准备重生。',
            // ---- Egyptian elements -----------------------------------------------
            'egyptian_element_fire': '拉之火',
            'egyptian_element_water': '努之水',
            'egyptian_element_earth': '盖布之大地',
            'egyptian_element_air': '舒之气',
            'egyptian_element_ether': '努特之天',
            // ---- Egyptian festivals -----------------------------------------------
            'egyptian_festival_summer_solstice': '天狼星新年（索提斯）', 'egyptian_practice_summer_solstice': '标记洪讯，开启新岁。',
            'egyptian_festival_winter_solstice': '隐阳之宴', 'egyptian_practice_winter_solstice': '于黑暗中礼赞太阳重生。',
            'egyptian_festival_spring_equinox': '奥佩特（春升）', 'egyptian_practice_spring_equinox': '与神同巡，祝福大地。',
            'egyptian_festival_autumn_equinox': '透特之宴', 'egyptian_practice_autumn_equinox': '礼赞书写、审判与平衡。',
            'egyptian_festival_full_moon': '满月之宴', 'egyptian_practice_full_moon': '守夜、献供、庆祝。',
            'egyptian_festival_new_moon': '新月之宴', 'egyptian_practice_new_moon': '更新、净化、开始。',
            // ---- Egyptian seasons --------------------------------------------------
            'egyptian_season_emergence_foods': '谷物、蚕豆、绿叶菜', 'egyptian_season_emergence_herbs': '生菜、薄荷、大蒜',
            'egyptian_season_radiance_foods': '无花果、葡萄、甜瓜', 'egyptian_season_radiance_herbs': '孜然、莳萝、洋葱',
            'egyptian_season_release_foods': '椰枣、石榴、小麦', 'egyptian_season_release_herbs': '乳香、没药、八角',
            'egyptian_season_stillness_foods': '储粮、干鱼、蜂蜜', 'egyptian_season_stillness_herbs': '百里香、杜松、葫芦巴',
            // ---- Mayan archetypes ---------------------------------------------
            'mayan_archetype_creator': '伊察姆纳（创造者）', 'mayan_practice_creator': '将新的一天编织为存在。',
            'mayan_archetype_healer': '伊克斯切尔', 'mayan_practice_healer': '照料身体，善用草药。',
            'mayan_archetype_warrior': '美洲虎战士', 'mayan_practice_warrior': '行于暗处，守护部族。',
            'mayan_archetype_sage': '历法守护者（阿赫·基赫）', 'mayan_practice_sage': '数算时日，解读征兆。',
            'mayan_archetype_lover': '伊克斯塔布', 'mayan_practice_lover': '礼赞爱情与夜晚。',
            'mayan_archetype_guardian': '恰克之守护者', 'mayan_practice_guardian': '守护雨水、水流与生长。',
            'mayan_archetype_mystic': '萨满（阿赫·基赫）', 'mayan_practice_mystic': '穿梭于诸界之间。',
            'mayan_archetype_destroyer': '阿赫普赫', 'mayan_practice_destroyer': '引导终结，照护冥界。',
            'mayan_archetype_fool': '吼猴（巴茨）', 'mayan_practice_fool': '嚎叫、击鼓、手作、欢笑。',
            'mayan_archetype_magician': '巫师（神D）', 'mayan_practice_magician': '变形易貌，洞见其外。',
            'mayan_archetype_empress': '伊克斯切尔（月母）', 'mayan_practice_empress': '哺育创生，编织命运。',
            'mayan_archetype_emperor': '基尼奇·阿豪（日主）', 'mayan_practice_emperor': '每日升起，养育万民。',
            'mayan_archetype_star': '金星（库库尔坎之星）', 'mayan_practice_star': '追随晨星，指引道路。',
            // ---- Mayan moon moods -----------------------------------------------
            'mayan_moon_new': '暗月（伊克）', 'mayan_practice_new': '休息、禁食、聆听。',
            'mayan_moon_waxing_crescent': '初升月牙', 'mayan_practice_waxing_crescent': '种植、开始、成长。',
            'mayan_moon_first_quarter': '半月', 'mayan_practice_first_quarter': '清理田地，采取行动。',
            'mayan_moon_waxing_gibbous': '盈凸月', 'mayan_practice_waxing_gibbous': '收获力量，精进。',
            'mayan_moon_full': '满月（诺霍奇）', 'mayan_practice_full': '盛宴、感恩、释放。',
            'mayan_moon_waning_gibbous': '亏凸月', 'mayan_practice_waning_gibbous': '分享、教导、分配。',
            'mayan_moon_last_quarter': '下弦月', 'mayan_practice_last_quarter': '放手、稀疏、释放。',
            'mayan_moon_waning_crescent': '将落之月牙', 'mayan_practice_waning_crescent': '睡眠、做梦、更新。',
            // ---- Mayan elements --------------------------------------------------
            'mayan_element_fire': '火（卡克）',
            'mayan_element_water': '水（哈）',
            'mayan_element_earth': '土（卡布）',
            'mayan_element_air': '风（伊克）',
            'mayan_element_ether': '天（胡纳布库）',
            // ---- Mayan festivals --------------------------------------------------
            'mayan_festival_summer_solstice': '太阳至日', 'mayan_practice_summer_solstice': '礼赞太阳之极。',
            'mayan_festival_winter_solstice': '新火（太阳回归）', 'mayan_practice_winter_solstice': '重燃圣火，更新轮回。',
            'mayan_festival_spring_equinox': '库库尔坎降临', 'mayan_practice_spring_equinox': '观看羽蛇降下金字塔。',
            'mayan_festival_autumn_equinox': '库库尔坎升天', 'mayan_practice_autumn_equinox': '观看羽蛇升腾。',
            'mayan_festival_full_moon': '满月仪式', 'mayan_practice_full_moon': '唱诵、舞蹈、献供。',
            'mayan_festival_new_moon': '新火仪式', 'mayan_practice_new_moon': '禁食、净化、定下意图。',
            // ---- Mayan seasons -----------------------------------------------------
            'mayan_season_emergence_foods': '玉米、豆类、绿叶菜', 'mayan_season_emergence_herbs': '荆芥、香菜、薄荷',
            'mayan_season_radiance_foods': '玉米、番茄、热带水果', 'mayan_season_radiance_herbs': '胭脂树、恰雅、青柠',
            'mayan_season_release_foods': '南瓜、玉米丰收、牛油果', 'mayan_season_release_herbs': '多香果、香草、可可',
            'mayan_season_stillness_foods': '干玉米、豆类、蜂蜜', 'mayan_season_stillness_herbs': '柯巴、可可、菝葜',
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



































