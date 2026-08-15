MOON_EMOJI_TO_PHASE = {
    "🌑": 0, "🌒": 1, "🌓": 2, "🌔": 3,
    "🌕": 4, "🌖": 5, "🌗": 6, "🌘": 7
}

PHASE_NAMES = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
]

MOON_PHASE_TO_EMOJI = {idx: emoji for emoji, idx in MOON_EMOJI_TO_PHASE.items()}

# Mean synodic month (new moon to new moon), in days.
SYNODIC_MONTH_DAYS = 29.53058867


def phase_from_emoji(emoji):
    return MOON_EMOJI_TO_PHASE.get(emoji, None)


def moon_age_from_phase(phase_index):
    """Approximate moon age in days from an 8-phase index."""
    if phase_index is None:
        return None
    return (phase_index / 8) * SYNODIC_MONTH_DAYS


def moon_phase_name(phase_index):
    if phase_index is None or not (0 <= phase_index < 8):
        return None
    return PHASE_NAMES[phase_index]


def moon_emoji(phase_index):
    return MOON_PHASE_TO_EMOJI.get(phase_index, None)
