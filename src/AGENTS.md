# Frontend

This document provides guidelines specific to the frontend (src/) in the Kotonoha project.

## Testing Guidelines

Two frontend test layers are provided:

### 1. Unit Tests (`*.test.ts`)

- **Location**: Next to the code being tested
- **Target**: Domain services, pure functions
- **Environment**: Node.js (jsdom)
- **Run**: `npm run test:unit`
- **Scope**: Small, focused tests (happy path + 1-2 edge cases)

### 2. Browser Mode Tests (`*.browser.test.ts`)

- **Location**:
  - Component tests: next to components
  - **Route integration tests** (primary focus): `src/integration-tests/`
- **Target**: Frontend integration, page-level workflows
- **Environment**: Real browser (Chromium via Playwright)
- **Run**: `npm run test:browser`
- **Mocking**: Tauri (Rust) modules mocked via Vitest's `vi.mock()`. Use shared factories from `src/integration-tests/lib/mockFactories.ts`.

**Requirements:**

- Import `$src/app.css` for styling
- Reset stores/mocks in `beforeEach`
- **Always** call `await page.screenshot()` at end of each test

## Browser-mode (Vite aliases and Tauri mocks)

For fast frontend iteration and browser-based testing, this repository supports a "browser-mode" which replaces Tauri and plugin imports with local mock modules via Vite aliasing.

- How to enable:
  - Run the browser dev script:
    ```bash
    npm run dev:browser
    ```
  - This sets `VITE_RUN_MODE=browser` which activates alias mappings in `vite.config.js`.
- What is mocked:
  - The Vite config maps many Tauri imports to `src/lib/infrastructure/mocks/*`. Examples include:
    - `@tauri-apps/plugin-store`
    - `@tauri-apps/api/app`
    - `@tauri-apps/plugin-stronghold`
    - `@tauri-apps/api/core`
    - `@tauri-apps/api/event`
    - `@tauri-apps/api/path`
    - `@tauri-apps/plugin-log`
    - `@tauri-apps/plugin-sql`
    - `@tauri-apps/plugin-fs`
    - `@tauri-apps/plugin-http`
    - `@tauri-apps/plugin-dialog`
  - See `vite.config.js` for the exact mapping.
- Where to look / extend:
  - Mock implementations live under `src/lib/infrastructure/mocks/`. They provide minimal, frontend-friendly APIs used by the app. If a UI needs extra behavior, extend the mock file accordingly.
- Agent guidance and limitations:
  - Do not assume native Tauri behavior (secure Stronghold storage, native file system access, audio device control, OS-level dialogs) in browser-mode. These are stubbed or emulated.
  - Use browser-mode for UI development, layout, and component tests. For features that require Rust/Tauri integration (LLM proxying, real DB access, secure key storage, native audio), run the full Tauri environment (`npm run dev`) or use integration tests that exercise the Rust side.

## TypeScript coding style

- Imports
  - Always import project code under `src/lib` using the `$lib` alias (e.g. `import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';`). Do not use relative paths like `../../lib/...`.
- Functions and declarations
  - Top-level functions: use `function` declarations for main/utility functions for clarity and hoisting.
  - Callbacks and short anonymous helpers: use `const fn = (...) => {}` arrow functions.
  - Group related methods in an object literal and use normal method syntax when exposing a feature set (repositories, services, stores).
- Naming
  - Use camelCase for function and variable names. Event/callback props use `on` prefix (camelCase) when exposed in components.
- Immutability
  - Prefer `readonly` on entity/type properties and `readonly` arrays in signatures and return types. Treat data as immutable: return new objects/arrays when updating (spread, map, filter).
  - If mutation is necessary, operate on a local copy (e.g. `const copy = [...items]`) and return an immutable value.
- Types and examples (short)
  - Prefer explicit types on public APIs. Example patterns:
    - `type Episode = { readonly id: number; readonly title: string; }`
    - `function getEpisodes(): Promise<readonly Episode[]> { ... }`
- Style and errors
  - Keep functions small and focused. Prefer clear names and explicit typing on boundaries. Follow repository linting and formatting rules.

When producing or validating TypeScript in this repo follow these rules.

## Svelte / SvelteKit coding rules

The following is a compact, machine-friendly summary of the project's Svelte and SvelteKit conventions. Agents should follow these when reading or producing frontend code in this repository.

- Use Svelte 5 runes for reactivity: prefer `$state`, `$derived`, `$effect` instead of `$:` labels or ad-hoc `let` reactivity.
- Event handlers: use native DOM attributes like `onclick` / `onchange` (not `on:click`). Name component callback props in camelCase with an `on` prefix (e.g., `onGroupClick`).
- Two-way binding: declare objects with `$state` and bind properties directly (`bind:value={form.name}`).
- Bindable props: expose parent-bindable props by using `$props()` with `$bindable()` as the default (child example: `let { open = $bindable() } = $props();`).
- Side effects and lifecycle: use `$effect` only for DOM or external side-effects; return cleanup functions when needed. Prefer declarative approaches where possible.
- Reusable render fragments: prefer `{#snippet}` / `@render` patterns over legacy `slot` usage for passing renderable fragments.
- DOM refs: create a `$state(null)` variable and use `bind:this={el}` to capture element references.
- Pages/load: use a `+page.ts` `load` function to fetch data and receive it in `+page.svelte` via `$props()`; use generated `./$types` types (e.g., `PageLoad`, `PageProps`).
- Stores: implement stores with Svelte runes; export an object with getters and operation methods (e.g., `counterStore.value`, `counterStore.increment()`). Use filename extension `*.svelte.ts` for stores.
- Naming: event handler props use camelCase with `on` prefix and follow `on<Target><Action>` (e.g., `onGroupNameChange`).

When generating or validating Svelte code for this project, produce concise code that follows these rules and the repository's TypeScript style. Keep comments brief and avoid long paragraphs.

## Layered Architecture

- Structure: Four-layer architecture with specific flow: Presentation → Application → Infrastructure. Domain layer (entities/services) is shared across all layers.
- Layer responsibilities:
  - **Presentation** (routes, components, actions): Routes are page-level components that compose container components and delegate business logic. Container components invoke usecases and compose presentational components. Extract logic to `container/*.svelte.ts` if components become bloated or share logic. Presentational components are pure UI parts without business logic. Do not access stores (except i18n). Use Svelte 5 context to avoid prop drilling. Actions (`actions/`) encapsulate DOM element logic (Svelte actions).
  - **Application** (usecases, stores): Usecases orchestrate workflows by calling domain services and infrastructure repositories. Stores manage cross-component UI state only (no business logic, no usecase invocation). Usecases may access stores directly to avoid prop drilling, but not vice versa.
  - **Domain** (entities, services): Entities are pure data types (no logic). Services are pure functions depending only on entities. Only usecases invoke services.
  - **Infrastructure** (repositories): Handles external system communication: Tauri commands, DB operations, file system access, HTTP requests, etc. Repositories consolidate external system communication.
- Dependency flow: While labeled as four layers, the actual processing hierarchy is three-tier (Presentation → Application → Infrastructure). All layers depend on Domain entities; only usecases depend on Domain services. No dependency inversion is used - repositories are called directly by usecases (not Clean Architecture style).
- Rationale: Keeps UI separate from business rules and infrastructure, makes domain logic testable, and allows backend evolution independent of frontend UI.

## Directory Structure

- `src/lib/presentation/`: UI components. Shared components in `components/container/` and `components/presentational/`. Svelte actions in `actions/`.
- `src/lib/application/`: Usecases in `usecases/`, stores in `stores/`, and localization files in `locales/`.
- `src/lib/domain/`: Entities in `entities/`, services in `services/`.
- `src/lib/infrastructure/`: Repositories in `repositories/`.
- `src/routes/`: SvelteKit pages with `+page.svelte` and `+page.ts`, and route-specific components. Route-specific components in `routes/[route]/container/` and `routes/[route]/presentational/`.

## Data & state strategy

Avoid long-lived client-side caches. Components and stores should fetch authoritative data from the DB (via infrastructure repositories / Tauri commands) when needed. Stores manage ephemeral UI state only.

## Tauri commands

Infrastructure repositories wrap Tauri commands to interact with the Rust backend.

See: [src-tauri/AGENTS.md](../src-tauri/AGENTS.md) for full details.

## Database overview

- Tables:
  - `episode_groups`: hierarchical groups (self-referential `parent_group_id` nullable). Key fields: `id` (PK), `name`, `display_order`, `parent_group_id`, `group_type` (`album`|`folder`). Root default group: name="Default", `group_type`=`album`.
  - `episodes`: one row per episode (audio + transcript). Key fields: `id`, `episode_group_id` (FK), `display_order`, `title`, `media_path` (relative path under app data), `learning_language`, `explanation_language`, `created_at`, `updated_at`.
  - `dialogues`: transcript lines. Key fields: `id`, `episode_id` (FK), `start_time_ms`, `end_time_ms` (nullable), `original_text`, `corrected_text` (nullable), `translation` (nullable), `explanation` (nullable), `sentence` (nullable), `deleted_at` (nullable).
  - `sentence_cards`: results of sentence-mining. Key fields: `id`, `dialogue_id` (FK), `part_of_speech`, `expression`, `sentence`, `contextual_definition`, `core_meaning`, `status` (`active`|`suspended`|`cache`), `created_at`.
- Note: types above are compact hints; timestamps use ISO 8601 strings. Use DB as single source of truth; front-end stores should be transient UI state only.

See: [src-tauri/migrations/] for full DB schema details.

## File & media storage policy

- Store episode media under Tauri `BaseDirectory.AppLocalData` in `media/{UUID}/`.
- Fixed filename convention: audio stored at `media/{UUID}/full.mp3` (or other audio extension). `episodes.media_path` stores the relative path from AppLocalData.
- UUID uniqueness: generate and check `media/{UUID}` existence; regenerate on collision.
- Deletion: `deleteEpisode` must remove the DB record first, then recursively delete `media/{UUID}` directory on success.

## Security notes

- API keys are persisted via Tauri Stronghold plugin. Agents should never print or hard-code secrets. Stronghold uses a salt generated on first run and stored under app local data.

## Related documents

- [Project root AGENTS.md](../AGENTS.md) - Overall project guidelines
- [E2E Tests AGENTS.md](../e2e-tests/AGENTS.md)
- [Tauri AGENTS.md](../src-tauri/AGENTS.md)
