# E2E Tests

This document provides guidelines specific to the E2E tests in the Kotonoha project.

## E2E Tests (`*.e2e.ts`)

For integration testing of the complete Tauri application, this repository provides an E2E test environment using WebdriverIO + Mocha.

- **Location**: `e2e-tests/specs/`
- **Target**: Full app stack (frontend + Tauri backend + Rust commands)
- **Environment**: Real Tauri application
- **Details**: See `e2e-tests/README.md`

## Related documents

- [Project root AGENTS.md](../AGENTS.md) - Overall project guidelines
