# Project Structure

## Organization Philosophy

プレゼンテーション → アプリケーション → インフラの 3 層を基本とし、共通のドメインエンティティ/サービスを全層で共有します。Svelte ルートは UI 組み立てに専念し、ビジネスフローは必ずユースケース (`usecases/*.ts`) に閉じ込めます。外部 I/O はリポジトリ経由で抽象化し、ブラウザモードでも同じ API 契約を保ちます。

## Directory Patterns

### Route Shells

**Location**: `src/routes/`
**Purpose**: ページ単位の UI コンテナ。ロード関数でストアを初期化し、アプリ層ユースケースを呼び出します。
**Example**: `src/routes/(app)/episodes/+page.svelte` がエピソード一覧 UI を構築し、`fetchEpisodes` ユースケースを起動。

### Presentation Components

**Location**: `src/lib/presentation/components/`
**Purpose**: 再利用可能な UI ピース。ビジネスロジックを持たず、ストアと i18n から表示専用データを取得。
**Example**: `EpisodeAddModal.svelte` が `episodeAddStore` と i18n テキストをバインド。

### Application Layer

**Location**: `src/lib/application/`
**Purpose**: `usecases/` でワークフローをオーケストレーションし、`stores/*.svelte.ts` で UI 状態を集中管理。
**Example**: `usecases/addNewEpisode.ts` がファイルリポジトリ・YouTube リポジトリ・ドメインサービスを連鎖呼び出し。`episodeAddStore.svelte.ts` がモーダルの入力状態を保持。

### Domain Layer

**Location**: `src/lib/domain/`
**Purpose**: `entities/*.ts` で純粋データ型、`services/*.ts` で副作用のない変換/解析ロジックを定義し、`entities` は全層が参照。`services` はアプリ層ユースケースから呼び出し。
**Example**: `entities/dialogue.ts`、`services/parseScriptToDialogues.ts`。

### Infrastructure Repositories

**Location**: `src/lib/infrastructure/repositories/`
**Purpose**: Tauri コマンド、SQLite、ファイルシステム、LLM/TTS など外部 I/O を 1 箇所に閉じ込める。
**Example**: `episodeRepository.ts` が `@tauri-apps/plugin-sql` 経由で CRUD を担当。ブラウザモードでは `src/lib/infrastructure/mocks/` を介して同じ関数シグネチャを模倣。

### Utilities & Tests

**Location**: `src/lib/utils/`, `src/integration-tests/`, `e2e-tests/`
**Purpose**: 共通フォーマット変換や言語ヘルパー、ブラウザモード統合テスト、WebdriverIO E2E を分離配置。
**Example**: `utils/language.ts` が言語コードヘルパーを提供。`integration-tests/lib` が Tauri モック工場を共有。

## Naming Conventions

- **Svelte components**: PascalCase (`SentenceMiningModal.svelte`)
- **Stores**: `<feature>Store.svelte.ts` で Svelte store + rune を表現
- **Usecases**: `verbNoun.ts` (`addEpisodeGroup.ts`, `fetchEpisodes.ts`)
- **Entities/Services**: 単数形 + ドメイン名 (`episode.ts`, `parseScriptPreview.ts`)
- **Test files**: `*.test.ts` / `*.browser.test.ts` を対象コードと同ディレクトリに配置

## Import Organization

```typescript
import { fetchEpisodes } from '$lib/application/usecases/fetchEpisodes';
import EpisodeListTable from '$lib/presentation/components/EpisodeListTable.svelte';
import { deriveLanguageLabel } from '$lib/utils/language';
import { onMount } from 'svelte';
```

- `$lib/` は `src/lib` を指す SvelteKit 既定エイリアス。
- ブラウザモードで Tauri プラグインを参照する場合、`VITE_RUN_MODE=browser` 時のみ Vite の `resolve.alias` が `src/lib/infrastructure/mocks` を指す。
- 相対パス (`./`, `../`) は同層ファイル限定に留め、レイヤーを跨ぐ参照は `$lib` から開始して依存方向を明示。

## Code Organization Principles

- プレゼンテーション層はユースケース/ストアのみを呼び出し、直接リポジトリやドメインサービスを触れない。
- プレゼンテーション層でユースケースを呼び出せるのは `src/routes` 以下のみ。
- ストアは UI 状態を保持してもビジネスロジックは禁止。副作用はユースケースかインフラ層で実施。
- ドメインサービスは純粋関数 (副作用なし) を徹底し、テスト容易性を担保。
- リポジトリは外部システムごとに分割し、Tauri コマンド名や DB スキーマを一元化。
- 新しい機能は「ルート → ユースケース → リポジトリ → Tauri」という依存方向を崩さないこと。

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
