# Kotonoha

## Overview

Kotonoha is a desktop application that helps language learners transform audio/video and transcript content into context-rich study materials using AI-powered "sentence mining". Users import pairs of audio/video files and corresponding transcripts. The app highlights sentences in their original context, lets learners mark sentences or expressions to analyze, and uses an LLM to extract key vocabulary, idioms, and explanatory notes which are saved as study cards (Anki-friendly CSV export supported).

## Technical summary

- Tech stack & architecture: Frontend (Svelte 5 + SvelteKit, TypeScript), Desktop framework (Tauri with Rust backend), DB (SQLite).
- Frontend guidelines: Testing, browser-mode, dependencies, and coding style. See [src/AGENTS.md](src/AGENTS.md) for details.
- Layered architecture: Four-layer structure (Presentation → Application → Infrastructure, with shared Domain). See [src/AGENTS.md](src/AGENTS.md) for details.
- Key Tauri commands: LLM, Stronghold, Audio, Download, TTS, YouTube, Language Detection. See [src-tauri/AGENTS.md](src-tauri/AGENTS.md) for details.
- Database overview: Tables for episode_groups, episodes, subtitle_lines, sentence_cards. See [src-tauri/migrations/0001-initial-tables.sql](src-tauri/migrations/0001-initial-tables.sql) for details.
- JSONB content policy: Store entity data in JSONB using camelCase keys that match TypeScript entity definitions.
- File & media storage policy: Media stored under Tauri AppLocalData in media/{UUID}/. See [src/AGENTS.md](src/AGENTS.md) for details.
- Data & state strategy: Avoid long-lived caches; fetch from DB via repositories. See [src/AGENTS.md](src/AGENTS.md) for details.
- Security notes: API keys via Tauri Stronghold. See [src-tauri/AGENTS.md](src-tauri/AGENTS.md) for details.
- Where to find full details: Use `doc/technical_specifications.md` for exhaustive DB schemas, mermaid diagrams, and full command descriptions. This summary is meant to be a compact reference for AI agents.

## AI Agent Guidelines

Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Check: `npm run check`
- Format: `npm run format`
- Format & Lint & Check: `npm run format-lint-check`
- Test unit: `npm run test`
- Test browser: `npm run test:browser`
- Test all (unit + browser): `npm run test:all`
- Test single nodejs test file: `npm run test:nodejs -- <path_to_test_file>` (example: `npm run test -- src/lib/domain/services/buildEpisodeGroupTree.test.ts`)
- Test single browser test file: `npm run test:browser -- <path_to_test_file>` (example: `npm run test:browser -- src/integration-tests/episode-list.file.browser.test.ts`)

Work rules for tasks

- After creating or editing files under `src/`, run `npm run format-lint-check`.
- When setting up a fresh Git worktree environment as an AI agent, install dependencies with `npm ci` (not `npm install`) to keep `package-lock.json` unchanged.

Additional Coding rules

- Use console for logging output in frontend code.
  - In TypeScript, use console.log, console.info, console.warn, console.error.
  - In `src/lib/domain/services/*.ts` files, avoid logging so unit tests under Vitest remain clean.
  - In Rust code, use: `use log::{info, warn, error};`.

Special notes

- Svelte/SvelteKit rules: avoid using legacy event binding notation like `on:click`; use native `onclick` in Svelte 5.
