# Implementation Plan

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only

- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} _(Include details only when needed. If the task stands alone, omit bullet items.)_
  - _Requirements: {{REQUIREMENT_IDS}}_

### Major + Sub-task structure

- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ _(IDs only; do not add descriptions or parentheses.)_

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel. Omit the marker when running in `--sequential` mode.
>
> **Optional test coverage**: When a sub-task is deferrable test work tied to acceptance criteria, mark the checkbox as `- [ ]*` and explain the referenced requirements in the detail bullets.

## Tasks

- [ ] 1. plugin-store のステートフル・モックを実装

  - `src/integration-tests/lib/mockFactories.ts` に内部状態（Map）を保持する `createStatefulStore`（または `createMockStore` 拡張）を追加。
  - `get/set/save` が内部状態を反映。`save` をテストから切替可能にして失敗シナリオを注入できるようにする。
  - 既存 `settings.browser.test.ts` は互換維持。新ファイルではステートフル版を使用。
  - _Requirements: R1.5 R1.6 R2.4 R4.1 R4.2_

- [ ] 2. 再描画ヘルパ（invalidateAll→rerender）を導入

  - `$app/navigation` をモックし、`invalidateAll` 実装で `load()`→`renderResult.rerender()` を実行。
  - Episode 系の実装パターンを流用し重複ロジックを最小化。
  - _Requirements: R1.6 R2.4_

- [ ]\* 3. アクセシビリティ属性の最小追加（必要時）

  - `src/routes/settings/+page.svelte` の言語バッジ削除ボタンに `aria-label` を付与（例: `Remove English`）。
  - 保存ボタンのテキスト/`data-testid` をテストで安定取得できるよう確認。
  - _Requirements: R1.4 R2.3_（テスト安定化のための補助）

- [ ] 4. 設定ページ: 言語カスタマイズ統合テスト新規追加

  - `src/integration-tests/settings.languages.browser.test.ts` を作成し、`vitest-browser-svelte` 構成で `+page`/`+page.svelte` を読み込む。
  - `$app/navigation.invalidateAll` を用いた `load()`→`rerender()` の再描画を使用。
  - _Requirements: R1.1 R1.2 R1.3 R1.4 R1.5 R1.6 R2.1 R2.2 R2.3 R2.4 R3.1 R4.1 R4.2_

- [ ] 4.1 学習対象言語: 表示/追加/検索/削除/保存/再読込（TC1）

  - 初期 `learningTargetLanguages=[]`。プレースホルダ表示を検証。
  - モーダルを開き `jap` で検索→`Japanese` を選択→バッジ追加を検証（重複無し）。
  - `Save` 実行でボタン `disabled`/スピナー表示→`invalidateAll` 経由の `load()` 後も `Japanese` が表示継続。
  - _Requirements: R1.1 R1.2 R1.3 R1.4 R1.5 R1.6_

- [ ] 4.2 学習対象言語: 削除の持続性（TC2）

  - 初期 `learningTargetLanguages=["ja","en"]`。`Remove English` で `en` を削除。
  - 保存→再取得後も `en` が復活しないことを検証。
  - _Requirements: R1.4 R1.6_

- [ ] 4.3 説明言語: 表示/追加/削除/保存/再読込（TC3）

  - 初期 `explanationLanguages=["en"]`。`Japanese` を追加、重複無しを検証。
  - 保存→再取得で `en, ja` が表示維持。
  - _Requirements: R2.1 R2.2 R2.3 R2.4_

- [ ] 4.4 名称の一貫性（TC4）

  - バッジ表示名が `bcp47ToLanguageName(code)` と一致することを検証。
  - モーダル内表示は i18n 翻訳キー（存在時）を利用可能であることを補助確認。
  - _Requirements: R3.1 R3.2_

- [ ] 4.5 保存失敗 UI（TC5）

  - `plugin-store.save` を一時的に `Promise.reject` に設定。
  - トースト `settings.notifications.saveError`、スピナー停止、`Save` の `disabled` 解除を検証。
  - _Requirements: R4.1_

- [ ] 4.6 読込失敗 UI（TC6）

  - 初回 `storeLoad` を `Promise.reject` に設定して `load()` 失敗を誘発。
  - `settings.notifications.loadError` が表示されることを検証。
  - _Requirements: R4.2_
