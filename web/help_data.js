// Kairos — reference & esoteric data for the help panel.
// Bundled with the PWA so it works fully offline.

// ---- What the KST numbers mean -----------------------------------------
const KST_HELP = {
    wheel: {
        title: "🌞 The Cosmic Wheel",
        text: "The wheel is the Sun's path through the year. Its colour is the celestial season; the sun marker rotates to the Sun's current ecliptic longitude — the same measure ancient sky-watchers used to mark the turning year."
    },
    solarLongitude: {
        title: "🌞 Solar Longitude",
        text: "The Sun's position in degrees along its yearly path (0–360°). 0° = spring equinox, 90° = summer solstice, 180° = autumn equinox, 270° = winter solstice. It is the oldest calendar there is — the Sun's address among the stars."
    },
    lunarAge: {
        title: "🌙 Lunar Age",
        text: "Days since the last new moon (the ~29.53-day synodic month). 0 = new moon, ~7.4 = first quarter, ~14.8 = full moon, ~22.1 = last quarter. Every culture's month once began with the reappearance of this slender crescent."
    },
    sidereal: {
        title: "🌀 Sidereal Time",
        text: "The sky's own clock. Local sidereal time tells you which stars are on your meridian right now — 24 sidereal hours for one full rotation of the fixed stars. Wall clocks tell you what the Sun is doing; sidereal time tells you what the sky is doing."
    },
    star: {
        title: "⭐ Visible Star",
        text: "The most prominent key star above the horizon at dawn (if several are up, Kairos shows '+N more'). Sirius, the Pleiades and Orion marked harvests and floods in many cultures. If none are up, Kairos says so — and hints which star to watch for next."
    },
    season: {
        title: "🌍 Season",
        text: "The tropical season from solar longitude (a Northern-hemisphere frame). The wheel changes colour with it — Spring blue, Summer green, Autumn gold, Winter grey."
    }
};

// ---- Zodiac glyphs ------------------------------------------------------
const ZODIAC_GLYPHS = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
};

// ---- The 13-day archetype wheel ------------------------------------------
// Mirrors core/traditions/mystical/planetary_hours.py archetype_of_day().
const ARCHETYPE_WHEEL = ["Creator", "Healer", "Warrior", "Sage", "Lover",
    "Guardian", "Mystic", "Destroyer", "Fool", "Magician", "Empress",
    "Emperor", "Star"];

const ARCHETYPE_MEANINGS = {
    "Creator":   "the impulse to bring new things into being. Ritual: make something with your hands.",
    "Healer":    "the energy of repair and care. Ritual: rest, tend, listen.",
    "Warrior":   "focused will in service of a cause. Ritual: stand for something.",
    "Sage":      "knowledge shared with patience. Ritual: read, write, teach.",
    "Lover":     "the bonds that make life sweet. Ritual: connect, share, celebrate.",
    "Guardian":  "steadiness in service of others. Ritual: protect, prepare, defend.",
    "Mystic":    "direct contact with the unseen. Ritual: meditate, dream, observe.",
    "Destroyer": "the clearing that makes room. Ritual: release, let go, burn.",
    "Fool":      "open curiosity without a plan. Ritual: play, wander, laugh.",
    "Magician":  "will made effective. Ritual: transform, manifest, practice.",
    "Empress":   "abundance and care. Ritual: nurture, grow, receive.",
    "Emperor":   "structure that serves. Ritual: lead, build, order.",
    "Star":      "the promise that orients the way. Ritual: hope, vision, guide."
};

// ---- Moon moods (mirrors modules/energy/mood) -----------------------------
const MOON_MOOD_MEANINGS = {
    "New Moon":          "quiet, introspective, seeding — the dark before the light.",
    "Waxing Crescent":   "hopeful, curious, growing — a promise taking shape.",
    "First Quarter":     "driven, decisive, active — momentum and choice.",
    "Waxing Gibbous":    "refining, focused, productive — polishing the work.",
    "Full Moon":         "luminous, expressive, expansive — the peak of the tide.",
    "Waning Gibbous":    "reflective, grateful, sharing — giving back what overflowed.",
    "Last Quarter":      "releasing, honest, clearing — cutting what no longer serves.",
    "Waning Crescent":   "resting, dreaming, surrendering — the seed settles."
};

// ---- Elemental cycle (mirrors traditions/mystical/elemental_cycles) -------
const ELEMENT_CYCLE = ["Light", "Shadow", "Stone", "Wind", "Void"];

const ELEMENT_MEANINGS = {
    "Light":  "clarity, beginnings, vision — what is revealed.",
    "Shadow": "stillness, depth, rest — what waits beneath.",
    "Stone":  "structure, patience, form — what endures.",
    "Wind":   "movement, change, voice — what carries.",
    "Void":   "release, space, mystery — what makes room."
};

// ---- Festivals by season (mirrors modules/energy/festival) ----------------
const SEASON_FESTIVAL_MEANINGS = {
    "Spring": ["rebirth rituals", "seed blessings", "equinox gatherings"],
    "Summer": ["solstice fires", "long-day feasts", "honoring the sun"],
    "Autumn": ["harvest festivals", "ancestor remembrance", "gratitude feasts"],
    "Winter": ["light ceremonies", "solstice vigils", "new year fires"]
};

// ---- Seasonal foods (mirrors modules/food/seasonal) -----------------------
const SEASONAL_FOODS = {
    "Spring": ["asparagus", "peas", "radishes", "spinach", "strawberries"],
    "Summer": ["tomatoes", "zucchini", "berries", "corn", "peppers"],
    "Autumn": ["squash", "apples", "mushrooms", "root vegetables", "pumpkin"],
    "Winter": ["cabbage", "potatoes", "carrots", "citrus", "leeks"]
};

// ---- Esoteric meanings of the five wandering stars -----------------------
const PLANET_MEANINGS = {
    mercury: {
        glyph: "☿", name: "Mercury",
        meaning: "the messenger — mind, speech, movement, exchange. The quick energy that connects one thing to another."
    },
    venus: {
        glyph: "♀", name: "Venus",
        meaning: "the attractor — love, beauty, harmony, worth. What draws us together and makes life worth savouring."
    },
    mars: {
        glyph: "♂", name: "Mars",
        meaning: "the warrior — drive, courage, desire, action. Focused will, for better or worse."
    },
    jupiter: {
        glyph: "♃", name: "Jupiter",
        meaning: "the expander — luck, meaning, growth, generosity. The sense that things are opening up."
    },
    saturn: {
        glyph: "♄", name: "Saturn",
        meaning: "the gatekeeper — structure, time, discipline, boundary. The slow teacher of limits."
    }
};
