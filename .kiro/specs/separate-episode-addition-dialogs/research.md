# Research Document

## Summary

このプロジェクトは既存のエピソード追加ダイアログをリファクタリングし、ファイルとYouTube追加を独立したダイアログに分離する拡張プロジェクトです。現在の`EpisodeAddModal`は単一コンポーネント内でソースタイプの切り替えを行っているため、相互依存による複雑性が生じています。

### Discovery Type: Extension (Light Discovery)

既存のアーキテクチャパターンを維持しながら、コンポーネントとストアの分離を行うリファクタリングプロジェクトです。新しい外部依存関係や技術は必要なく、既存の Svelte 5 + Runes パターンに従った実装が可能です。

### Key Findings

1. **既存アーキテクチャの活用**: `fileEpisodeAddStore` と `youtubeEpisodeAddStore` は既に独立して実装されており、統合レイヤーとしての `episodeAddStore` のみが相互依存を作り出している
2. **分離可能な UI コンポーネント**: `FileEpisodeForm` と `YoutubeEpisodeForm` は既に分離されており、独立したモーダルとして昇格可能
3. **クリーンな削除パス**: 中間層（`EpisodeAddModal`、`episodeAddStore`）の削除により、アーキテクチャが簡素化される

## Research Log

### Current Architecture Analysis

**Investigation**: 既存のエピソード追加アーキテクチャの分析
**Source**: コードベース調査（`src/lib/application/stores/episodeAddStore/`、`src/lib/presentation/components/`）

**Findings**:
- `episodeAddStore.svelte.ts`: ファイルとYouTubeストアを統合する中間レイヤー
- `EpisodeAddModal.svelte`: ソースタイプ選択とフォーム表示を統合
- `fileEpisodeAddStore.svelte.ts`: 独立したファイル追加ロジック（TSV設定、TTS設定含む）
- `youtubeEpisodeAddStore.svelte.ts`: 独立したYouTube追加ロジック
- 使用箇所: `src/routes/episode-list/[groupId]/+page.svelte` からの `episodeAddStore.open()` 呼び出し

**Implications**: 
- 既存ストアは既に分離されており、統合層の削除により自然な分離が可能
- UI コンポーネントも既に分離されており、モーダル化が容易

### Component Dependency Mapping

**Investigation**: コンポーネント間の依存関係と影響範囲の調査
**Source**: Grep 調査による参照箇所の特定

**Findings**:
- `EpisodeAddModal` 参照: 主に `episode-list` ページからの使用
- `episodeAddStore` 参照: フォームコンポーネント内での状態管理
- TTS関連ストア: `ttsDownloadStore`、`ttsExecutionStore` は既存統合ストア経由で管理

**Implications**:
- 影響範囲は限定的で、主要な変更は `episode-list` ページの呼び出し部分のみ
- TTS関連機能は専用モーダル経由で既に分離されており、独立性確保済み

### Integration Points Assessment

**Investigation**: 既存ユースケースとの統合ポイント分析
**Source**: `src/lib/application/usecases/addNewEpisode.ts` の契約調査

**Findings**:
- `addNewEpisode` ユースケースは `EpisodeAddPayload` ユニオン型を受け入れ
- ペイロード構造は `FileEpisodeAddPayload | YoutubeEpisodeAddPayload`
- 既存APIは既に型によって処理を分岐しており、分離対応済み

**Implications**:
- ユースケース層での変更は不要
- 新しいダイアログは既存のペイロード型を再利用可能

## Architecture Pattern Evaluation

### Pattern: Modal Composition → Independent Modals

**Current Pattern**: 
単一の `EpisodeAddModal` 内でソースタイプによるフォーム切り替え

**Target Pattern**: 
事前選択ダイアログ + 独立した専用モーダル

**Benefits**:
- 各モーダルの単一責任原則
- 相互依存の除去
- 保守性とテスト容易性の向上
- 将来的な機能拡張時の独立性

**Risks & Mitigation**:
- ユーザビリティの変化: 事前選択により明確な操作フローを提供
- コード重複の可能性: 共通UI要素は既存コンポーネントで解決済み

## Implementation Boundary Design

### Component Boundaries

**EpisodeSourceSelectionModal**:
- 責任: ソース選択とルーティング
- 依存: なし（プレゼンテーション層のみ）

**FileEpisodeAddModal**:
- 責任: ファイルベースエピソード追加
- 依存: `fileEpisodeAddStore`、`FileEpisodeForm`

**YoutubeEpisodeAddModal**:
- 責任: YouTubeベースエピソード追加  
- 依存: `youtubeEpisodeAddStore`、`YoutubeEpisodeForm`

### Store Dependencies

既存ストアの独立性を維持:
- `fileEpisodeAddStore`: TSV、TTS設定を含む完全に独立したファイル追加状態
- `youtubeEpisodeAddStore`: YouTube メタデータとバリデーションを含む独立した状態

### Parallel Development Considerations

**Team-safe Boundaries**:
- 各モーダルは独立したファイルとして実装可能
- ストアは既に分離済みで並行開発対応
- テストファイルも独立して作成可能

**Task Parallelization**:
1. ソース選択ダイアログの作成
2. ファイル専用モーダルの作成
3. YouTube専用モーダルの作成
4. 統合ポイントの更新と旧コンポーネント削除

## Risk Assessment

### Low-Risk Factors
- 既存ストア architecture は分離対応済み
- UI コンポーネントは既に分割済み
- ユースケース層の変更不要

### Medium-Risk Factors
- TTS 関連モーダルとの連携（既存パターンで解決可能）
- i18n キーの整理が必要

### Mitigation Strategies
- 段階的な置換による影響範囲の限定
- 既存テストケースによる回帰検証
- 統合テストでの動作確認

## Technology Alignment

### Framework Compliance
- **Svelte 5**: Runes ベースの state 管理パターンに準拠
- **SvelteKit**: 既存の component 構造とルーティングパターンを維持
- **Flowbite-Svelte**: 既存 Modal コンポーネントのパターンを踏襲

### Code Quality Standards
- **TypeScript**: 既存の型定義を再利用、新規型定義は最小限
- **ESLint**: 既存ルールに準拠
- **Testing**: 既存テストパターン（Vitest Browser）を継続
