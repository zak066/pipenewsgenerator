# AGENTS.md

## Commands

- `npm run dev` — starts Vite (port 5173) + Electron concurrently; waits for Vite before launching Electron
- `npm run build` — Vite build only (`dist/`)
- `npm run build:win` — Vite build + electron-builder --win (portable exe to `release/`)
- `npm run build:linux` — Vite build + electron-builder --linux (AppImage to `release/`)
- `npm run rebuild` — rebuild native modules (better-sqlite3) after Node/Electron version changes

## Architecture

- **Electron backend**: `electron/main.cjs` entry point; IPC handlers in same file; preload at `electron/preload.cjs`
- **Frontend**: React 19 + TypeScript in `src/`; Vite dev server on port 5173; alias `@/` → `src/`
- **Database**: SQLite via better-sqlite3; created in Electron user data folder at runtime, not in repo
- **Build output**: `release/` (gitignored); asar enabled with better-sqlite3 unpacked (native module)

## Quirks

- better-sqlite3 is native — run `npm run rebuild` after switching Node/Electron versions
- Dev mode sets `NODE_ENV=development` — Electron loads `http://localhost:5173`; production loads `dist/index.html`
- Auto-updater points to GitHub `zak066/pipenewsgenerator` — requires tag format `v*.*.*` (e.g., `v1.0.47`)
- Windows build target is `portable` (not nsis default); Linux is `AppImage`; macOS is `dmg`
- No test/lint/typecheck scripts configured — TypeScript config is type-check only (`noEmit: true`)
- `repository/` directory is included in builds (per `files` in package.json)

## Release Workflow

1. Update `version` in `package.json`
2. Run platform build (e.g., `npm run build:win`)
3. Tag with `v` prefix: `git tag -a "v1.0.47" -m "Release v1.0.47"`
4. Push tag: `git push origin "v1.0.47"`
5. Create GitHub release with build artifact (or use `build-and-publish.bat` / `build-and-publish.sh`)
