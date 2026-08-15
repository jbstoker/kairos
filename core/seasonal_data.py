"""Dynamic seasonal produce & festivals — the user-editable seasonal layer.

Seasonal items live in ``data/seasonal_data.json`` (plain JSON, auditable by
hand) and can also be edited from the web app (``POST /api/seasonal``) —
family knowledge, local harvests, and regional celebrations can be added
without touching code.

Items are keyed by id:

- **produce**: name, category (fruit/vegetable/herb/fungus/meat/other),
  seasons (Kairos season names, e.g. "Radiance"), regions, traditions,
  description, uses, how_to_find, image.
- **festivals**: name, season, regions, traditions, description, activities,
  foods, image.

Matching is inclusive: a region/tradition of ``"global"`` matches any
request; an absent filter matches everything.
"""

import json
import os
import re

from core.constants import KAIROS_SEASON_NAMES
from core.utils import atomic_write_json

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "data")
SEASONAL_DATA_FILE = os.path.join(_DATA_DIR, "seasonal_data.json")


def load_seasonal_data():
    """Load the seasonal data file (empty structure when missing/broken)."""
    if not os.path.exists(SEASONAL_DATA_FILE):
        return {"produce": {}, "festivals": {}}
    try:
        with open(SEASONAL_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "produce": data.get("produce", {}) or {},
            "festivals": data.get("festivals", {}) or {},
        }
    except (ValueError, OSError):
        return {"produce": {}, "festivals": {}}


def save_seasonal_data(data):
    """Persist the full seasonal data file (atomic write)."""
    atomic_write_json(SEASONAL_DATA_FILE, data)


def resolve_season(season_name):
    """Map a tropical season (Spring/…) to its Kairos name (Radiance/…).

    Accepts either form; unknown names pass through unchanged.
    """
    return KAIROS_SEASON_NAMES.get(season_name, season_name)


def _matches(values, wanted):
    """True when the filter is empty, or the item carries it or ``global``."""
    if not wanted or wanted in ("all", "any"):
        return True
    return wanted in values or "global" in values


def get_items_for_season(season_name, category=None, tradition=None, region=None):
    """Return produce + festivals for a season, optionally filtered.

    ``season_name`` is a Kairos season name (or a tropical one; see
    ``resolve_season``). Filters are inclusive: an item with ``global`` in
    its regions/traditions always matches; an absent filter matches all.
    """
    season = resolve_season(season_name)
    data = load_seasonal_data()
    produce, festivals = [], []
    for item_id, item in data["produce"].items():
        if season not in item.get("seasons", []):
            continue
        if category and item.get("category") != category:
            continue
        if not _matches(item.get("traditions", []), tradition):
            continue
        if not _matches(item.get("regions", []), region):
            continue
        produce.append({**item, "id": item_id, "kind": "produce"})
    for item_id, item in data["festivals"].items():
        if item.get("season") != season:
            continue
        if not _matches(item.get("traditions", []), tradition):
            continue
        if not _matches(item.get("regions", []), region):
            continue
        festivals.append({**item, "id": item_id, "kind": "festival"})
    return {"season": season, "produce": produce, "festivals": festivals}


def add_item(item, kind="produce"):
    """Add (or replace, by slug id) a seasonal item and persist the file."""
    if kind not in ("produce", "festivals"):
        raise ValueError(f"unknown kind: {kind!r} (expected 'produce' or 'festivals')")
    data = load_seasonal_data()
    base = _slug(item.get("name", "item"))
    item_id = base
    counter = 2
    while item_id in data[kind]:
        item_id = f"{base}_{counter}"
        counter += 1
    data[kind][item_id] = item
    save_seasonal_data(data)
    return item_id


def _slug(name):
    slug = re.sub(r"[^a-z0-9]+", "_", str(name).lower()).strip("_")
    return slug or "item"
