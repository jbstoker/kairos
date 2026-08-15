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
_kairos = Kairos()


@app.route("/")
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


@app.route("/api/now")
def api_now():
    return jsonify(_kairos.now())


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
    args = parser.parse_args()
    app.run(host=args.host, port=args.port, debug=args.debug)
