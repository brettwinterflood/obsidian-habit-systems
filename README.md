# Obsidian habit systems

Obsidian plugin for habit and goal tracking (`src/`), plus a private web check-in app in [`web/`](web/README.md).

## Plugin

See `build.sh` and `manifest.json`. Default daily-notes folder in plugin settings is `MISC/diary/`; Brett’s vault uses `DIARY/` — align plugin settings with the vault.

## Web app

From the repo root (Jeppe’s hosting entrypoint):

```bash
cd web && npm install   # once
export VAULT_DIR=/home/forge/0_MIND
npm run start:web       # 127.0.0.1:8795 by default
```

Details, env vars, tests, and a **systemd example** for `habits.i-o.im` → `127.0.0.1:8795` are in [web/README.md](web/README.md).
