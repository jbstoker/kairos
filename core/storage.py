"""SQLite schema storage — data/kairos.db.

Persists the concentric ecosystem's own traces: orbital snapshots, travel-
drift log entries, and a tiny key/value settings store (home-longitude
anchor, eye-override state).

The schema is created idempotently; ``data/kairos.db`` ships with the repo so
the database is immediately queryable on a fresh clone.
"""

import os
import sqlite3
import threading
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(PROJECT_ROOT, "data", "kairos.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS orbit_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    sun_theta REAL NOT NULL,
    sun_radial REAL NOT NULL,
    moon_theta REAL NOT NULL,
    moon_radial REAL NOT NULL,
    longitude_deg REAL NOT NULL,
    drift_seconds INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS travel_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_longitude REAL NOT NULL,
    current_longitude REAL NOT NULL,
    drift_seconds INTEGER NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""

_write_lock = threading.Lock()


def connect(db_path=None):
    """Open a connection to kairos.db (creating the schema when missing)."""
    path = db_path or DEFAULT_DB_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _schema(conn):
    """Apply the schema to an open connection (idempotent, locked)."""
    with _write_lock:
        conn.executescript(_SCHEMA)
        conn.commit()


def ensure_schema(db_path=None):
    """Idempotently create all tables; returns the database path.

    The scratch connection is closed before returning so the file is never
    left locked (important on Windows).
    """
    path = db_path or DEFAULT_DB_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        _schema(conn)
    finally:
        conn.close()
    return path


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def record_orbit_snapshot(snapshot, db_path=None, conn=None):
    """Persist one orbital snapshot row; returns the new row id."""
    own = conn is None
    if own:
        conn = connect(db_path)
        _schema(conn)
    try:
        cur = conn.execute(
            "INSERT INTO orbit_snapshots"
            " (timestamp, sun_theta, sun_radial, moon_theta, moon_radial,"
            "  longitude_deg, drift_seconds, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                int(snapshot["timestamp"]),
                snapshot["sun"]["theta"],
                snapshot["sun"]["radial"],
                snapshot["moon"]["theta"],
                snapshot["moon"]["radial"],
                snapshot["travel"]["current_longitude"],
                snapshot["travel"]["drift_seconds"],
                _now_iso(),
            ),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        if own:
            conn.close()


def record_travel(home_longitude, current_longitude, drift_seconds, db_path=None, conn=None):
    """Persist one travel-drift log entry; returns the new row id."""
    own = conn is None
    if own:
        conn = connect(db_path)
        _schema(conn)
    try:
        cur = conn.execute(
            "INSERT INTO travel_log"
            " (home_longitude, current_longitude, drift_seconds, created_at)"
            " VALUES (?, ?, ?, ?)",
            (home_longitude, current_longitude, int(drift_seconds), _now_iso()),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        if own:
            conn.close()


def get_setting(key, default=None, db_path=None):
    """Read a settings value (as stored text) or ``default`` when absent."""
    conn = connect(db_path)
    try:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    finally:
        conn.close()
    return row["value"] if row is not None else default


def set_setting(key, value, db_path=None):
    """Upsert a settings value."""
    conn = connect(db_path)
    _schema(conn)
    try:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)"
            " ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, str(value)),
        )
        conn.commit()
    finally:
        conn.close()
