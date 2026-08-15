"""Honest phytochemical inventory for the seasonal produce layer.

Data lives in ``data/phytochemical_data.json`` (plain JSON, auditable by
hand) and is bundled into the PWA by ``tools/sync_phytochemical.py``. The
file carries:

- a **data disclaimer** — shown at the bottom of every phytochemical
  inventory in the web app. Values are approximations from USDA FoodData
  Central and other public references, *not* lab-verified measurements;
- a **source link** (USDA FoodData Central, fdc.nal.usda.gov);
- a ``values_are_approximate`` flag (all numbers are ballpark ranges);
- per-item **compound lists** for the plant foods already present in
  ``data/seasonal_data.json``. Animal products carry an empty list and an
  honest note instead of fabricated numbers.

User notes (\"this matches my local variety\", …) are kept separately in
``data/phytochemical_notes.json``; the web app mirrors its localStorage copy
here when a server is reachable, exactly like seasonal additions.
"""

import json
import os

from core.utils import atomic_write_json

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "data")
PHYTOCHEMICAL_DATA_FILE = os.path.join(_DATA_DIR, "phytochemical_data.json")
NOTES_FILE = os.path.join(_DATA_DIR, "phytochemical_notes.json")

_EMPTY = {
    "schema_version": 1,
    "values_are_approximate": True,
    "disclaimer": "",
    "source": {},
    "items": {},
}


def load_phytochemical_data():
    """Load the inventory (the empty structure when missing or broken)."""
    if not os.path.exists(PHYTOCHEMICAL_DATA_FILE):
        return dict(_EMPTY)
    try:
        with open(PHYTOCHEMICAL_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (ValueError, OSError):
        return dict(_EMPTY)
    return {
        "schema_version": data.get("schema_version", 1),
        "values_are_approximate": bool(data.get("values_are_approximate", True)),
        "disclaimer": data.get("disclaimer", ""),
        "source": data.get("source", {}) or {},
        "items": data.get("items", {}) or {},
    }


def get_disclaimer():
    """The data disclaimer shown at the bottom of the inventory modal."""
    return load_phytochemical_data().get("disclaimer", "")


def get_source():
    """The source block ``{label, url}`` for the clickable source link."""
    return load_phytochemical_data().get("source", {})


def get_phytochemical_inventory(item_id):
    """The inventory entry for a seasonal item id, or ``None``.

    Entries carry ``name``, optional ``fdc_id`` / ``note``, and a
    ``compounds`` list: ``{name, value|None, unit, note?}``. Animal products
    have an empty ``compounds`` list and an honest note.
    """
    return load_phytochemical_data()["items"].get(item_id)


# ---- User notes (persisted per item, mirrored from the web app) -----------


def load_notes():
    """Return the ``{item_id: note}`` mapping (empty when missing/broken)."""
    if not os.path.exists(NOTES_FILE):
        return {}
    try:
        with open(NOTES_FILE, "r", encoding="utf-8") as f:
            notes = json.load(f)
        return notes if isinstance(notes, dict) else {}
    except (ValueError, OSError):
        return {}


def get_note(item_id):
    """The stored user note for a seasonal item id (empty string when none)."""
    return load_notes().get(item_id, "")


def save_note(item_id, note):
    """Save (or clear, when empty) a user note, then return the stored note."""
    notes = load_notes()
    if note:
        notes[item_id] = note
    else:
        notes.pop(item_id, None)
    atomic_write_json(NOTES_FILE, notes)
    return get_note(item_id)
