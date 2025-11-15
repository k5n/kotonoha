# Research & Design Decisions

## Summary

- **Feature**: refactor-settings-page-components
- **Discovery Scope**: Extension
- **Key Findings**:
  - 既存のpresentationalコンポーネントはprops経由でコールバックを受け取り、UIのみを担当
  - settingsページのUIを2つのコンポーネントに分割可能
  - 外部依存なし、内部リファクタリングのみ

## Research Log

### 既存presentationalパターン分析

- **Context**: コンポーネント設計パターンを確認するため
- **Sources Consulted**: 既存コード (EpisodeListTable.svelte等)
- **Findings**: presentationalコンポーネントは純粋UI専用、イベントはコールバックprops経由で親に委譲
- **Implications**: 新コンポーネントも同様のパターンに従う

## Design Decisions

### Decision: コンポーネント分割

- **Context**: settingsページのUIを整理するため
- **Alternatives Considered**:
  1. 単一コンポーネント維持 — 保守性低下
  2. 複数コンポーネント分割 — 採用
- **Selected Approach**: SettingsComponentとAppInfoComponentに分割
- **Rationale**: 責務分離が明確になり、再利用性向上
- **Trade-offs**: ファイル数増加 vs 保守性向上
- **Follow-up**: 実装後UIテストで確認

## Risks & Mitigations

- 既存機能破壊 — ユニットテストで検証
- UIレイアウト崩れ — ブラウザテストで確認
