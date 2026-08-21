"""SQLite MCP server (tools/sqlite_mcp.py) — stdio JSON-RPC handshake tests.

Spawns the server as a real subprocess and drives the Model Context
Protocol handshake: initialize → initialized notification → tools/list →
tools/call, against both the shipped data/kairos.db (read-only) and a
temporary database (writes).
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER = os.path.join(REPO_ROOT, "tools", "sqlite_mcp.py")
DB = os.path.join(REPO_ROOT, "data", "kairos.db")


def _rpc(proc, payload):
    proc.stdin.write(json.dumps(payload) + "\n")
    proc.stdin.flush()
    return json.loads(proc.stdout.readline())


def _spawn(db_path):
    return subprocess.Popen(
        [sys.executable, SERVER, "--db-path", db_path],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, cwd=REPO_ROOT)


class TestSqliteMcp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.proc = _spawn(DB)
        cls.initialize = _rpc(cls.proc, {
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                       "clientInfo": {"name": "test-harness", "version": "1"}},
        })
        cls.proc.stdin.write(
            json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        cls.proc.stdin.flush()

    @classmethod
    def tearDownClass(cls):
        try:
            cls.proc.stdin.close()
            cls.proc.terminate()
            cls.proc.wait(timeout=5)
        except Exception:  # noqa: BLE001
            pass

    def test_initialize_response(self):
        self.assertEqual(self.initialize["result"]["serverInfo"]["name"], "kairos-sqlite-mcp")
        self.assertIn("tools", self.initialize["result"]["capabilities"])
        self.assertEqual(self.initialize["result"]["protocolVersion"], "2024-11-05")

    def test_tools_list_has_exactly_three_tools(self):
        resp = _rpc(self.proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        names = {tool["name"] for tool in resp["result"]["tools"]}
        self.assertEqual(names, {"list_tables", "query", "execute"})

    def test_list_tables_on_shipped_db(self):
        resp = _rpc(self.proc, {"jsonrpc": "2.0", "id": 3, "method": "tools/call",
                                "params": {"name": "list_tables", "arguments": {}}})
        result = resp["result"]
        self.assertFalse(result["isError"])
        tables = json.loads(result["content"][0]["text"])["tables"]
        for expected in ("orbit_snapshots", "travel_log", "settings"):
            self.assertIn(expected, tables)

    def test_query_select_on_shipped_db(self):
        resp = _rpc(self.proc, {"jsonrpc": "2.0", "id": 4, "method": "tools/call",
                                "params": {"name": "query",
                                           "arguments": {
                                               "sql": "SELECT count(*) AS n FROM settings"}}})
        result = resp["result"]
        self.assertFalse(result["isError"])
        self.assertEqual(json.loads(result["content"][0]["text"])[0]["n"], 0)

    def test_query_rejects_non_select(self):
        resp = _rpc(self.proc, {"jsonrpc": "2.0", "id": 5, "method": "tools/call",
                                "params": {"name": "query",
                                           "arguments": {"sql": "DELETE FROM settings"}}})
        self.assertTrue(resp["result"]["isError"])

    def test_ping(self):
        resp = _rpc(self.proc, {"jsonrpc": "2.0", "id": 6, "method": "ping"})
        self.assertEqual(resp["result"], {})

    def test_execute_writes_to_temp_db(self):
        with tempfile.TemporaryDirectory() as tmp:
            proc = _spawn(os.path.join(tmp, "t.db"))
            try:
                _rpc(proc, {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
                resp = _rpc(proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                                   "params": {"name": "execute",
                                              "arguments": {"sql": "CREATE TABLE t(x INTEGER)"}}})
                self.assertFalse(resp["result"]["isError"])
                resp = _rpc(proc, {"jsonrpc": "2.0", "id": 3, "method": "tools/call",
                                   "params": {"name": "execute",
                                              "arguments": {"sql": "INSERT INTO t(x) VALUES (42)"}}})
                self.assertFalse(resp["result"]["isError"])
                self.assertEqual(json.loads(resp["result"]["content"][0]["text"])["changes"], 1)
                resp = _rpc(proc, {"jsonrpc": "2.0", "id": 4, "method": "tools/call",
                                   "params": {"name": "query",
                                              "arguments": {"sql": "SELECT x FROM t"}}})
                self.assertEqual(json.loads(resp["result"]["content"][0]["text"])[0]["x"], 42)
            finally:
                proc.stdin.close()
                proc.terminate()
                proc.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
