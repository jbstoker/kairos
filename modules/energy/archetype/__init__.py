"""Archetype module — a ritual for each day's archetype."""

ARCHETYPE_RITUALS = {
    "Creator": "make something with your hands",
    "Healer": "rest, tend, listen",
    "Warrior": "stand for something",
    "Sage": "read, write, teach",
    "Lover": "connect, share, celebrate",
    "Guardian": "protect, prepare, defend",
    "Mystic": "meditate, dream, observe",
    "Destroyer": "release, let go, burn",
    "Fool": "play, wander, laugh",
    "Magician": "transform, manifest, practice",
    "Empress": "nurture, grow, receive",
    "Emperor": "lead, build, order",
    "Star": "hope, vision, guide"
}


def ritual_for_archetype(archetype):
    return ARCHETYPE_RITUALS.get(archetype, "observe, breathe, be")
