"""Minimal stdlib-only SQLite MCP server for Kairos (data/kairos.db).

A deliberately tiny tool surface (3 tools) keeps the model context lean:

    - list_tables  → table names in the database
    - query        → read-only SELECT (parameterised, bounded rows)
    - execute      → one INSERT/UPDATE/DELETE/DDL statement (read-write)

Speaks the Model Context Protocol over stdio (newline-delimited JSON-RPC
2.0), so it works with any MCP client (Cline, VS Code, Claude, ...) with no
pip/npm/docker dependencies — Python's built-in ``sqlite3`` is all it uses.

Usage:
    python tools/sqlite_mcp.py --db-path data/kairos.db
"""

import argparse
import json
import os
import sqlite3
import sys

PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "kairos-sqlite-mcp"
SERVER_VERSION = "0.1.0"
MAX_ROWS = 200


def _readline():
    line = sys.stdin.buffer.readline()
    if not line:
        return None
    return json.loads(line.decode("utf-8"))


def _send(message):
    sys.stdout.buffer.write((json.dumps(message) + "\n").encode("utf-8"))
    sys.stdout.buffer.flush()


def _result(msg_id, result):
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


def _error(msg_id, message, code=-32601, data=None):
    return {"jsonrpc": "2.0", "id": msg_id,
            "error": {"code": code, "message": message, "data": data}}


def _tools_schema():
    return [
        {
            "name": "list_tables",
            "description": "List the table names in the Kairos database.",
            "inputSchema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "query",
            "description": "Run a read-only SELECT and return the rows as JSON text.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "A SELECT statement."},
                    "params": {"type": "array", "description": "Optional bound parameters.",
                               "items": {}},
                },
                "required": ["sql"],
            },
        },
        {
            "name": "execute",
            "description": "Run one INSERT/UPDATE/DELETE/DDL statement. Returns affected "
                           "row count and last insert row id.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "A single write statement."},
                    "params": {"type": "array", "description": "Optional bound parameters.",
                               "items": {}},
                },
                "required": ["sql"],
            },
        },
    ]


def _call_tool(conn, name, arguments):
    if name == "list_tables":
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        return json.dumps({"tables": [row["name"] for row in rows]}, indent=2), False

    if name == "query":
        sql = str(arguments.get("sql", "")).strip()
        params = arguments.get("params") or []
        if not sql.upper().startswith("SELECT"):
            return "Only SELECT statements are allowed in query().", True
        try:
            rows = conn.execute(sql, params).fetchmany(MAX_ROWS)
            return json.dumps([dict(row) for row in rows], indent=2, default=str), False
        except sqlite3.Error as exc:
            return "SQLite error: %s" % exc, True

    if name == "execute":
        sql = str(arguments.get("sql", "")).strip()
        params = arguments.get("params") or []
        if sql.upper().startswith("SELECT"):
            return "execute() is for writes; use query() for SELECT.", True
        try:
            cur = conn.execute(sql, params)
            conn.commit()
            return json.dumps({"changes": cur.rowcount, "lastrowid": cur.lastrowid},
                              indent=2), False
        except sqlite3.Error as exc:
            return "SQLite error: %s" % exc, True

    return "Unknown tool: %s" % name, True


def main():
    parser = argparse.ArgumentParser(description="Minimal SQLite MCP server for Kairos")
    parser.add_argument(
        "--db-path",
        default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                             "data", "kairos.db"),
        help="Path to the SQLite database (default: data/kairos.db)",
    )
    args = parser.parse_args()

    conn = sqlite3.connect(args.db_path)
    conn.row_factory = sqlite3.Row

    while True:
        try:
            msg = _readline()
        except (ValueError, UnicodeDecodeError):
            continue
        except Exception:  # noqa: BLE001 — stdin closed / protocol hiccup
            break
        if msg is None:
            break

        method = msg.get("method")
        msg_id = msg.get("id")

        if method == "initialize":
            _send(_result(msg_id, {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            }))
        elif method == "ping":
            _send(_result(msg_id, {}))
        elif method == "tools/list":
            _send(_result(msg_id, {"tools": _tools_schema()}))
        elif method == "tools/call":
            params = msg.get("params") or {}
            text, is_error = _call_tool(conn, params.get("name"),
                                        params.get("arguments") or {})
            _send({"jsonrpc": "2.0", "id": msg_id,
                   "result": {"content": [{"type": "text", "text": text}],
                              "isError": is_error}})
        elif method.startswith("notifications/"):
            continue  # notifications never get a response
        else:
            _send(_error(msg_id, "Unknown method: %s" % method))

    conn.close()


if __name__ == "__main__":
    main()
