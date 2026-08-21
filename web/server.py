# Kairos web server — serves the PWA and exposes the KST celestial API.

#     python web/server.py           # http://127.0.0.1:8000
#     python web/server.py --port 9000

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request, send_from_directory  # noqa: E402

from core.timekeeper import Kairos  # noqa: E402

WEB_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# Language for the Python-side snapshots (/api/now, /api/kst names). The PWA
# itself manages its own language via the in-app selector (web/i18n.js).
_default_lang = "en"


def _make_kairos(lang=""):
    from core.timekeeper import Kairos
    return Kairos(lang=lang or _default_lang)


_kairos = _make_kairos()


@app.route("/")
def index():
    """The main view — the radial planetary header + the classic Kairos body.

    ``web/index.html`` is a fully static page (the header gauge falls back to
    client-side radial computation in web/static/js/canvas.js when no backend
    is reachable), so the same file powers Flask, GitHub Pages, and offline.
    """
    return send_from_directory(WEB_DIR, "index.html")


@app.route("/api/radial")
def api_radial():
    """Raw radial distance factors for the header gauge.

    Computed by core/astronomy.CelestialRadialMetrics from the true
    astronomical anomaly equations; the raw floats are streamed straight to
    the front-end render loop (web/static/js/canvas.js). Query param ``ts``
    pins a unix timestamp for deterministic frames/testing.
    """
    import time as _time
    from datetime import datetime

    from core.astronomy import CelestialRadialMetrics

    ts = request.args.get("ts", None, type=float)
    ts = ts if ts is not None else _time.time()
    metrics = CelestialRadialMetrics()
    return jsonify({
        "timestamp": int(ts),
        "gregorian": datetime.now().strftime("%H:%M:%S"),
        "sun_radial": metrics.get_sun_distance_factor(ts),
        "moon_radial": metrics.get_moon_distance_factor(ts),
    })


@app.route("/<path:filename>")
def serve(filename="index.html"):
    return send_from_directory(WEB_DIR, filename)


@app.route("/api/kst")
def api_kst():
    lat = request.args.get("lat", 0.0, type=float)
    lon = request.args.get("lon", 0.0, type=float)
    try:
        return jsonify(_kairos.kst_now(latitude_deg=lat, longitude_deg=lon))
    except ImportError as exc:
        return jsonify({"error": str(exc)}), 503


@app.route("/api/seasonal", methods=["GET", "POST"])
def api_seasonal():
    from core.seasonal_data import add_item, get_items_for_season

    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        kind = body.get("kind", "produce")
        item = body.get("item") or body.get("data") or body
        if kind not in ("produce", "festival"):
            return jsonify({"error": f"unknown kind: {kind!r}"}), 400
        if "kind" in item and "item" in body:
            item = dict(item)
            item.pop("kind", None)
        try:
            item_id = add_item(item, "festivals" if kind == "festival" else "produce")
            return jsonify({"ok": True, "id": item_id, "kind": kind})
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 500

    season = request.args.get("season", "")
    tradition = request.args.get("tradition", "") or None
    region = request.args.get("region", "") or None
    category = request.args.get("category", "") or None
    try:
        return jsonify(get_items_for_season(season, category=category,
                                            tradition=tradition, region=region))
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/api/phytochemical")
def api_phytochemical():
    from core.phytochemical_data import load_phytochemical_data

    return jsonify(load_phytochemical_data())


@app.route("/api/phytochemical/<item_id>")
def api_phytochemical_item(item_id):
    from core.phytochemical_data import get_phytochemical_inventory

    entry = get_phytochemical_inventory(item_id)
    if entry is None:
        return jsonify({"error": f"no phytochemical inventory for {item_id!r}"}), 404
    return jsonify(entry)


@app.route("/api/phytochemical/<item_id>/note", methods=["GET", "POST"])
def api_phytochemical_note(item_id):
    from core.phytochemical_data import get_note, save_note

    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        note = (body.get("note") or "").strip()
        return jsonify({"ok": True, "item_id": item_id, "note": save_note(item_id, note)})
    return jsonify({"item_id": item_id, "note": get_note(item_id)})


@app.route("/api/now")
def api_now():
    lang = request.args.get("lang", "")
    kairos = _make_kairos(lang) if lang else _kairos
    return jsonify(kairos.now())


@app.route("/api/checksum")
def api_checksum():
    from core.checksum import (checksum_report, checksum_trend, current_earth_age_year,
                               precession_checksum, track_checksum)

    try:
        year = current_earth_age_year()
        track_checksum(year)                      # continuous self-check log
        result = precession_checksum(year)
        result["report"] = checksum_report(year)
        result["earth_age_year"] = year
        trend = checksum_trend()
        result["trend"] = {k: trend[k] for k in
                           ("count", "consistent_fraction", "worst_difference",
                            "stable", "spread_deg")}
        return jsonify(result)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kairos web server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--lang", default="en",
                        help="language for Python-side snapshots "
                             "(en, nl, fy, de, fr, es, zh)")
    args = parser.parse_args()
    _default_lang = args.lang
    _kairos = _make_kairos(args.lang)
    app.run(host=args.host, port=args.port, debug=args.debug)
