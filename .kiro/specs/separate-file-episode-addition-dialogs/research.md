# Research & Design Decisions

---

**Purpose**: Capture discovery findings, architectural investigations, and rationale that inform the technical design.

**Usage**:

- Log research activities and outcomes during the discovery phase.
- Document design decision trade-offs that are too detailed for `design.md`.
- Provide references and evidence for future audits or reuse.

---

## Summary

- **Feature**: `separate-file-episode-addition-dialogs`
- **Discovery Scope**: Extension / Component Separation
- **Key Findings**:
  - 既存のFileEpisodeAddModalは音声+TTS機能が密結合している
  - EpisodeSourceSelectionModalは拡張ポイントとして設計済み
  - 既存ストア分離により独立したダイアログが実装可能

## Research Log

### Current Architecture Analysis

- **Context**: 既存のファイル追加フローとコンポーネント間の依存関係を調査
- **Sources Consulted**:
  - `src/lib/presentation/components/FileEpisodeAddModal.svelte`
  - `src/lib/presentation/components/EpisodeSourceSelectionModal.svelte`
  - `src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/fileEpisodeAddStore.svelte.ts`
  - `src/lib/application/usecases/addNewEpisode.ts`
- **Findings**:
  - FileEpisodeAddModalは`shouldGenerateAudio`フラグで音声/TTS間を切り替え
  - TsvConfigStore と TtsConfigStoreは既に分離済み
  - `addNewEpisode`ユースケースは`FileEpisodeAddPayload`型で統一インターフェース
  - EpisodeSourceSelectionModalは`EpisodeSource`型で拡張可能
- **Implications**: コンポーネント分離は既存アーキテクチャに適合しやすい

### Store Architecture Patterns

- **Context**: 既存ストア構造から分離パターンを検討
- **Sources Consulted**:
  - `src/lib/application/stores/episodeAddStore/` フォルダ構造
  - `fileEpisodeAddStore.svelte.ts` の設計パターン
- **Findings**:
  - サブストアパターン（`tsv: tsvConfigStore`, `tts: ttsConfigStore`）が確立済み
  - ストアリセット機能と状態管理が標準化
  - Svelte 5 runesベースの$stateパターン
- **Implications**: 新しいストアは既存パターンを踏襲することで一貫性確保

### Component Integration Points

- **Context**: ダイアログ間の依存関係と再利用可能性を評価
- **Sources Consulted**:
  - `FileSelect.svelte`, `TsvConfigSection.svelte`, `TtsConfigSection.svelte`の実装
  - 既存コンポーネントのprops構造
- **Findings**:
  - TsvConfigSection と TtsConfigSectionは既に独立したコンポーネント
  - FileSelectコンポーネントは汎用的で再利用可能
  - 言語検出機能はストアに依存せずユースケース経由で実装可能
- **Implications**: 最小限のコンポーネント変更で機能分離が可能

## Architecture Pattern Evaluation

| Option                 | Description                     | Strengths                  | Risks / Limitations        | Notes                      |
| ---------------------- | ------------------------------- | -------------------------- | -------------------------- | -------------------------- |
| Single Enhanced Modal  | 既存ModalにUI状態を追加         | 変更量最小                 | UI複雑性継続、将来拡張困難 | 要件と矛盾                 |
| Two Independent Modals | 完全分離された専用ダイアログ    | 明確な責任分離、保守性向上 | 実装量増加、テスト範囲拡大 | 要件に適合、推奨アプローチ |
| Shared Component Base  | 共通基盤コンポーネント + 特化版 | コード重複最小化           | 抽象化複雑性、依存関係継続 | オーバーエンジニアリング   |

## Design Decisions

### Decision: Two Independent Dialog Approach

- **Context**: 音声+スクリプトファイルとTTS音声生成の明確な分離が必要
- **Alternatives Considered**:
  1. Enhanced FileEpisodeAddModal — 既存モーダルの拡張
  2. Two Independent Dialogs — 完全分離されたダイアログ
  3. Shared Base Component — 共通基盤からの継承
- **Selected Approach**: 完全に独立した2つのダイアログを実装
- **Rationale**: 要件4（ダイアログ間の独立性確保）と保守性を重視
- **Trade-offs**: コード量増加 vs 明確な責任分離と将来拡張性
- **Follow-up**: 共通UIコンポーネントの再利用で実装効率化

### Decision: Extended EpisodeSourceSelectionModal

- **Context**: ファイル追加方法の詳細選択が必要
- **Alternatives Considered**:
  1. New Intermediate Dialog — 新しい中間ダイアログ
  2. Extended Source Selection — 既存ダイアログの拡張
- **Selected Approach**: EpisodeSourceSelectionModalを段階的ナビゲーションで拡張
- **Rationale**: 既存フローとの一貫性、ユーザー混乱の最小化
- **Trade-offs**: ナビゲーション複雑化 vs 一貫したUX
- **Follow-up**: キャンセル・戻る操作のUI設計に注意

### Decision: Dedicated Store Separation

- **Context**: ダイアログ間の状態管理を独立化
- **Selected Approach**:
  - `audioScriptFileEpisodeAddStore`: 音声+スクリプトファイル両方提供専用
  - `ttsEpisodeAddStore`: TTS生成専用
  - 既存`fileEpisodeAddStore`からの段階的移行
- **Rationale**: 状態の相互汚染防止、テスト分離、並行開発可能性
- **Trade-offs**: ストア数増加 vs 明確な境界
- **Follow-up**: 移行期間中の既存ストア互換性維持

## Risks & Mitigations

- **UI一貫性の欠損** — 共通コンポーネント（FileSelect、TsvConfigSection）の再利用で軽減
- **移行期間中のバグ** — 段階的リリースと既存テストケース維持で対応
- **コード重複の発生** — 共通ヘルパー関数の抽出と再利用パターン確立

## References

- [Svelte 5 Stores Documentation](https://svelte.dev/docs/svelte-store) — runes-based state management
- [Flowbite-Svelte Modal Components](https://flowbite-svelte.com/components/modal) — UI consistency patterns
- 既存Kotonoha Architecture Guidelines — `.kiro/steering/structure.md`, `.kiro/steering/tech.md`
