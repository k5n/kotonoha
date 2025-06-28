# AI Agent ガイドライン

## Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Test all**: `npx vitest run`
- **Test single file**: `npx vitest <path_to_test_file> run`（例: `npx vitest src/lib/domain/services/buildEpisodeGroupTree.test.ts run`）

## 作業共通ルール

- 最初は一切のファイル変更を行わない Plan mode に入って、作業方針と不明点をまとめて説明すること。この時点で一旦作業を終了すること。
- 作業開始を指示されてから、Plan mode を抜けてファイルの変更を伴う作業を開始すること。
- ファイルの作成・変更は１ファイルずつ行い、次のファイルの作成・変更に進む前に一旦作業を終了すること。
- ファイルを作成・編集した後は `npm run format` を実行してコードを整形すること。
- ファイルを作成・編集した後は `npm run lint` を実行してリンターエラーがないか確認すること。
- テストコードを作成したり修正した場合、まずテストコードの内容を説明し、テスト内容が正しいか承認を得てからテストの実行とテスト対象の修正を行うこと。

## プロジェクトの概要

- 要件を確認するには [要件定義書](doc/requirements_definition.md) を参照すること。
- 技術仕様を確認するには [技術仕様書](doc/technical_specification.md) を参照すること。

## Architecture Overview

- コードをどのようにファイル分割し、ファイルをどこに格納すべきか判断するには [アーキテクチャ解説](doc/architecture.md) を参照すること。

## Coding Rules

- `src/routes` 以下のファイル、`*.svelte` ファイル、 `*.svelte.ts` ファイルに対しては [Svelte/SvelteKitコーディングルール](doc/svelte_coding_rules.md) の規約に従うこと。
- ログ出力は Tauri の `log` プラグインを使用すること。
  - TypeScript 側では `import { info, warn, error } from '@tauri-apps/plugin-log';` を使用する。
    - ただし `src/lib/domain/services/*.ts` ファイルでは Vitest による単体テストを行うため、`@tauri-apps/plugin-log` を直接使用せず、ログ出力が必要な場合は `src/lib/domain/utils/logger.ts` の `Logger` インターフェースを渡すようにする。
    - `src/lib/domain/services/*.test.ts` ファイルでは、`src/lib/domain/utils/logger.ts` の `ConsoleLogger` をテスト対象に渡してコンソールにログを出力する。
  - Rust 側では `use tauri_plugin_log::log::{info, warn, error};` を使用する。

## Testing Guidelines

- テストを作成する際には `doc/testing_rules.md` のガイドラインに従うこと。
