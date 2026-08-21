# MCP servers for Kairos

Three Model Context Protocol servers extend this workspace with minimal
token overhead. They are registered in **Cline's global MCP settings**:

```
%USERPROFILE%\.cline\data\settings\cline_mcp_settings.json
```

This is the one file the Cline IDE plugins (JetBrains/VS Code) and the CLI
actually read. **A project-level `.mcp.json` in the repo root is NOT read by
the JetBrains plugin** — the entries must live in the global file above
(the `mcpServers` object). After editing it, reload Cline's MCP servers
(MCP tab → refresh/restart, or restart the Cline panel/IDE).

The file is machine-specific (absolute paths + env refs) and lives outside
the repo. A backup is kept next to it (`cline_mcp_settings.json.bak`).

## Note: the `jetbrains-phpstorm` entry

Cline's JetBrains plugin registers the IDE itself as an MCP server over a
**dynamic per-session port**. The entry you may see pointing at an old
`http://127.0.0.1:<port>/sse` is a stale bridge (e.g. from a previous
PhpStorm run) and fails with `ECONNREFUSED`. It is unrelated to the
servers below and can be left `"disabled": true`.

## 1. Playwright — visual verification of the canvas

The only way to truly verify the de-textified concentric canvas (bead
positions, orbit breathing, the eye-override button) is a real browser.

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

- Browser already installed: `%LOCALAPPDATA%\ms-playwright\chromium-1234`
  (run `npx playwright install chromium` again to refresh).
- Add `"--headless"` to `args` for background runs without a visible window.
- The server communicates via structured accessibility snapshots — prefer
  screenshots (images) over dumping large DOM text to keep token use low.

## 2. GitHub — official binary (no Docker/Go needed)

GitHub's official `github-mcp-server` ships prebuilt Windows binaries;
this machine uses v1.10.1 at `C:\Users\jelme\.mcp\github-mcp-server\`.

```json
"github": {
  "command": "C:\\Users\\jelme\\.mcp\\github-mcp-server\\github-mcp-server.exe",
  "args": ["stdio"],
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
}
```

**One-time setup — create a Personal Access Token:**

1. GitHub → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → *Generate new token*.
2. Repository access: **jbstoker/kairos**.
3. Permissions (minimum needed for issue/PR/CI work):
   - Contents: **Read and write** · Actions: **Read** ·
     Issues: **Read and write** · Pull requests: **Read and write** ·
     Metadata: **Read** (auto).
4. Set it in your environment:
   - PowerShell (persistent): `setx GITHUB_PERSONAL_ACCESS_TOKEN "ghp_..."`
   - or VS Code `.vscode/mcp.json` uses `${env:GITHUB_PERSONAL_ACCESS_TOKEN}`.

Note: the git remote itself uses SSH, so a token is only needed for the
GitHub REST API used by this MCP server.

## 3. SQLite — minimal, stdlib-only server (repo tool)

The official npm SQLite server was removed from npm and community servers
either carry 30+ tools (token-heavy) or need Docker/uvx (absent here). So
`tools/sqlite_mcp.py` is a deliberately tiny MCP server — **3 tools**,
Python stdlib only, fully tested (`tests/test_sqlite_mcp.py`):

- `list_tables` — table names
- `query` — read-only SELECT (bounded to 200 rows, parameterised)
- `execute` — one write/DDL statement

```json
"sqlite": {
  "command": "C:\\Users\\jelme\\PycharmProjects\\Kairos\\.venv\\Scripts\\python.exe",
  "args": [
    "C:\\Users\\jelme\\PycharmProjects\\Kairos\\tools\\sqlite_mcp.py",
    "--db-path",
    "C:\\Users\\jelme\\PycharmProjects\\Kairos\\data\\kairos.db"
  ]
}
```

Smoke test: `python tools/sqlite_mcp.py --db-path data/kairos.db` then
send the JSON-RPC handshake (see `tests/test_sqlite_mcp.py`).

## Do we need a caching MCP too?

No. A caching/proxy MCP would add another layer and its tool schemas to
every request's context — the opposite of the token goal. The big token
levers are already covered:

1. **Provider prompt caching** is automatic and handles the repeated
   static context (system prompt, tool schemas).
2. **`hindsight` memory** already persists cross-session facts, so files
   are not re-read every time.
3. **Few, small tools** — this setup has 3 lean servers instead of dozens
   of tools, keeping per-request context small.
4. **Screenshots over DOM dumps** for Playwright results.
