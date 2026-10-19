# Habits web (private check-in)

Mobile-first UI for logging habits against the same Obsidian vault files the [habits plugin](../src/) reads: `DATABASES/LIFE/Habits.md`, `Goals.base`, and daily notes under `DIARY/`.

Daily-note markers match the plugin’s **read** rules in `src/data.ts`: lines containing `[[habit]]` wiki links; `🔜` = todo; `❌` or `fail` = fail; otherwise success. Lines with `📝` are ignored. Logging **appends** an app-owned line `- [[Habit]]` (it does not edit your prose). Un-logging removes only that exact line; if the habit still appears in your own text, the API returns **409** and the file is unchanged.

## Run locally

**Preferred (repo root — matches Jeppe’s `npm run start:web`):**

```bash
cd web && npm install   # once
export VAULT_DIR=/home/forge/0_MIND   # default
export DAILY_NOTES_FOLDER=DIARY/      # default
export PORT=8795                      # default
cd .. && npm run start:web
```

Or from `web/` only: `npm start` (same server).

Open `http://127.0.0.1:8795` (bind is **127.0.0.1 only** — put Tailscale/Traefik auth in front; do not expose publicly).

| Variable | Default |
|----------|---------|
| `VAULT_DIR` | `/home/forge/0_MIND` |
| `DAILY_NOTES_FOLDER` | `DIARY/` |
| `HABITS_MD_PATH` | `DATABASES/LIFE/Habits.md` |
| `GOALS_BASE_PATH` | `Goals.base` |
| `PORT` | `8795` |
| `HOST` | `127.0.0.1` |
| `DAY_RANGE` | `14` |

## Tests

Uses a copy of fixture files under `test/fixtures/` (not the live vault):

```bash
npm test
```

## systemd example (Jeppe — habits.i-o.im)

Do **not** enable this from the repo; example unit only:

```ini
# /etc/systemd/system/habits-web.service
[Unit]
Description=Obsidian habits web check-in
After=network.target

[Service]
Type=simple
User=forge
WorkingDirectory=/home/forge/projects/obsidian-habit-systems
Environment=VAULT_DIR=/home/forge/0_MIND
Environment=DAILY_NOTES_FOLDER=DIARY/
Environment=PORT=8795
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/npm run start:web
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Traefik (or similar) on the host should route **habits.i-o.im** → `http://127.0.0.1:8795` with Tailscale-only access and its own auth — no auth is implemented in this app.
