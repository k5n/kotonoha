# Routes Layer AGENTS

This document provides guidelines specific to the routes layer in the Kotonoha project.

## Layer responsibilities

Routes are page-level components that compose UI parts and delegate business logic to usecases. Components are individual UI parts without business logic. Routes invoke usecases; components may access stores directly to avoid prop drilling.

## Pages/load conventions

- Use a `+page.ts` `load` function to fetch data and receive it in `+page.svelte` via `$props()`; use generated `./$types` types (e.g., `PageLoad`, `PageProps`).

## Related documents

- [Project root AGENTS.md](../AGENTS.md) - Overall project guidelines
- [Presentation layer AGENTS.md](../lib/presentation/AGENTS.md)
- [Application layer AGENTS.md](../lib/application/AGENTS.md)
- [Domain layer AGENTS.md](../lib/domain/AGENTS.md)
- [Infrastructure layer AGENTS.md](../lib/infrastructure/AGENTS.md)
