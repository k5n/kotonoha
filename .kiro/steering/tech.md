# Technology Stack

## Architecture

- デスクトップアプリ基盤は **Tauri 2**。Rust 側が LLM 呼び出し、Stronghold 秘密管理、音声処理、ファイル操作、SQLite へのアクセスを担当。
- フロントエンドは **Svelte 5 + SvelteKit (adapter-static)** を採用し、Svelte Runes とストアで UI 状態を管理。Tauri コマンドとはインフラ層のリポジトリ経由で通信。
- 3 層フロー (Presentation → Application → Infrastructure) にドメインエンティティ/サービスを共有し、ユースケース主導で処理を組み立てる。
- ブラウザモードでは Vite のエイリアスで Tauri/Plugin API を `src/lib/infrastructure/mocks` に差し替え、UI 開発やブラウザ統合テストを高速化。

## Core Technologies

- **Language**: TypeScript (strict モード) + Rust (Tauri コマンド)
- **Framework**: SvelteKit 2.x、Tailwind CSS 4.x、Flowbite-Svelte
- **Runtime**: Node.js 20+ (frontend tooling)、Rust 1.75+ (tauri-cli 2.7 系)
- **Database**: SQLite (Tauri SQL Plugin, 環境毎に dev/app/e2e ファイルを切替)

## Key Libraries

- UI & 状態: Svelte Runes、Flowbite-Svelte、Tailwind CSS、`@thisux/sveltednd` (ドラッグ操作)
- インフラ: `@tauri-apps/api` + プラグイン群 (store, stronghold, sql, dialog, fs, http, log)
- 国際化/テキスト: i18next、dompurify (リッチテキストサニタイズ)
- テスト: Vitest (nodejs & browser projects)、Playwright 経由の `vitest-browser-svelte`、WebdriverIO + Mocha (E2E)

## Development Standards

### Type Safety

- TypeScript `strict` + `noImplicitAny` 前提。
- ドメイン層は `entities/*.ts` の型を唯一の真実として共有し、ユースケースやストアはそれらを再利用。

### Code Quality

- ESLint 9 + `@vitest/eslint-plugin` + `eslint-plugin-svelte` で Svelte/TS を共通ルール化。
- Prettier + `prettier-plugin-organize-imports` + `prettier-plugin-tailwindcss` で整形。Tailwind クラス順序も自動調整。
- `npm run lint` / `npm run format:check` を CI 前提で使用。

### Testing

- `npm run test:nodejs`: ドメイン/アプリ層のユニットテスト (jsdom)。
- `npm run test:browser`: Vitest Browser + Playwright でページ/コンポーネント統合テスト (Tauri モック利用)。
- `e2e-tests/` 下の WebdriverIO でフルスタック検証 (AppImage ベース, Linux 対応)。
- `npm run test:all` でユニット+ブラウザテストを一括実行し、nyc でカバレッジを収集。

## Development Environment

### Required Tools

- Node.js 20+、npm 10+
- Rust toolchain + `tauri-cli`
- Docker / Docker Compose (Linux で AppImage ビルドする場合)
- Google Gemini API Key (LLM)、YouTube Data API Key (任意機能)

### Common Commands

```bash
npm run dev        # Tauri + SvelteKit 開発サーバ
npm run dev:browser # ブラウザモード (VITE_RUN_MODE=browser)
npm run build      # Tauri ビルド
npm run lint       # ESLint チェック
npm run check      # svelte-check + 型検証
npm run test       # Vitest (nodejs プロジェクト)
npm run test:browser # Vitest Browser (Playwright)
npm run test:all   # すべてのテスト + カバレッジ
```

## Key Technical Decisions

- **Desktop-first + Browser mocks**: ネイティブ連携を維持しつつ、ブラウザモードで素早く UI/テストを回せる二段構え。
- **Usecase-Oriented Application Layer**: Presentation 層はユースケースを呼び、直接リポジトリに触れない。ドメインエンティティがデータ契約を提供。
- **Repository Wrappers for Tauri**: すべての外部 I/O (DB、ファイル、LLM、TTS) を `src/lib/infrastructure/repositories/*` に集約し、テストとモック差し替えを容易にする。
- **Environment Isolation**: `PUBLIC_APP_ENV` により DB/メディア/TTS モデルのルートを dev/app/e2e で切り替え、データ汚染を防止。
- **Secret Handling via Stronghold**: API キーや資格情報は Stronghold に保存し、フロント側では露出させない。

---

_Document standards and patterns, not every dependency_
