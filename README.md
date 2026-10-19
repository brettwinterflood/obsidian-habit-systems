# Obsidian habit systems

Obsidian plugin for habit and goal tracking (`src/`), plus a private web check-in app in [`web/`](web/README.md).

## Plugin

See `build.sh` and `manifest.json`. Default daily-notes folder in plugin settings is `MISC/diary/`; Brett’s vault uses `DIARY/` — align plugin settings with the vault.

## Web app

Run from `web/` with `VAULT_DIR` pointing at the vault. Details, env vars, tests, and a **systemd example** for `habits.i-o.im` → `127.0.0.1:8795` are in [web/README.md](web/README.md).
