@doc/requirements_definition.md
@doc/technical_specifications.md
@doc/architecture.md
@doc/svelte_coding_rules.md
@doc/typescript_coding_style.md
@doc/testing_rules.md
@doc/dependency-graph.md

# AI Agent ガイドライン

## Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Check**: `npm run check`
- **Format**: `npm run format`
- **Test all**: `npx vitest run`
- **Test single file**: `npx vitest <path_to_test_file> run`（例: `npx vitest src/lib/domain/services/buildEpisodeGroupTree.test.ts run`）

## 作業共通ルール

- 最初は一切のファイル変更を行わない Plan mode に入って、作業方針と不明点をまとめて説明すること。この時点で一旦作業を終了すること。
- 作業開始を指示されてから、Plan mode を抜けてファイルの変更を伴う作業を開始すること。
- ファイルを作成・編集した後は `npm run format` を実行してコードを整形すること。
- ファイルを作成・編集した後は `npm run lint` を実行してリンターエラーがないか確認すること。
- ファイルを作成・編集した後は `npm run check` を実行してSvelteKitによるチェックエラーがないか確認すること。
- テストコードを作成したり修正した場合、まずテストコードの作成・修正内容を説明して、テストは実行せずに一旦作業を終了すること。

## プロジェクトの概要

- 要件を確認するには [要件定義書](doc/requirements_definition.md) を参照すること。
- [技術仕様書](doc/technical_specification.md) に沿って実装すること。

## Architecture Overview

- コードをどのようにファイル分割し、ファイルをどこに格納すべきか判断するには [アーキテクチャ解説](doc/architecture.md) を参照すること。

## Coding Rules

- `src/routes` 以下のファイル、`src/lib/presentation/components/*.svelte` ファイル、`src/lib/application/stores/*.svelte.ts` ファイルに対しては [Svelte/SvelteKitコーディングルール](doc/svelte_coding_rules.md) の規約に従うこと。
- TypeScript のコードに対しては [TypeScriptコーディングルール](doc/typescript_coding_style.md) の規約に従うこと。
- ログ出力は Tauri の `log` プラグインを使用すること。
  - TypeScript 側では `import { info, warn, error } from '@tauri-apps/plugin-log';` を使用する。
  - ただし `src/lib/domain/services/*.ts` ファイルでは Vitest による単体テストを行うため、ログ出力は行わない。
  - Rust 側では `use tauri_plugin_log::log::{info, warn, error};` を使用する。

## Testing Guidelines

- テストを作成する際には [テスト作成ルール](doc/testing_rules.md) に従うこと。

## 特記事項

Svelte/SvelteKit コーディングルールに記載しているにも関わらず、`on:click` にような古い記述を提示することが多くあります。
Svelte5 では `onclick` のように記述してください。
