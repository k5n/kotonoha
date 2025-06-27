# AI Agent ガイドライン

## Commands

- **Build**: `npm run build`
- **Lint**: `npm run check`
- **Format**: `npm run format`
- **Test all**: `npx vitest run`
- **Test single file**: `npx vitest <path_to_test_file> run`（例: `npx vitest src/lib/domain/services/buildEpisodeGroupTree.test.ts run`）

## 作業共通ルール

- ファイルを作成・編集した後は `npm run format` を実行してコードを整形すること。
- 一連の作業が終わったら `npx vitest run` を実行して全てのテストが通ることを確認すること。

## Architecture Overview

- コードをどのようにファイル分割し、ファイルをどこに格納すべきか判断するには `doc/architecture.md` を参照すること。

## Coding Rules

- `src/routes` 以下のファイル、`*.svelte` ファイル、 `*.svelte.ts` ファイルに対して `doc/svelte_coding_rules.md` の規約に従うこと。

## Testing Guidelines

- テストを作成する際には `doc/testing_rules.md` のガイドラインに従うこと。
