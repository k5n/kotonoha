# 実装ギャップ分析

## 概要

**ファイルベースエピソード追加ダイアログの分離**機能における既存コードベースと要件間のギャップを分析し、実装戦略を提示します。

### 分析サマリー

- **スコープ**: EpisodeSourceSelectionModalの拡張と、FileEpisodeAddModalの2つの独立ダイアログへの分離
- **主要課題**: 既存の単一統合ダイアログを音声+スクリプトとTTS専用に分離し、ストア分割を実現
- **推奨アプローチ**: ハイブリッド戦略（既存コンポーネント拡張＋新規コンポーネント作成）
- **複雑度**: M（3-7日） - 既存パターンの再構成と新しい状態管理の導入
- **リスク**: Medium - 既存機能への影響と新しいダイアログ間の一貫性確保

## 現在の実装状況

### 既存アセット調査

#### 1. EpisodeSourceSelectionModal

**場所**: `src/lib/presentation/components/EpisodeSourceSelectionModal.svelte`

- **現在の機能**: 'file'と'youtube'の2択選択
- **拡張要件**: ファイル選択時にサブ選択画面の表示
- **再利用可能性**: 高 - 基本構造は維持可能

#### 2. FileEpisodeAddModal

**場所**: `src/lib/presentation/components/FileEpisodeAddModal.svelte`

- **現在の機能**: 音声+スクリプトファイル選択とTTS設定を単一ダイアログで提供
- **分離対象**: 音声ファイル付きエピソード追加 vs TTS音声生成エピソード追加
- **複雑性**: 高 - 条件分岐とTTS/音声ファイルの混在ロジック

#### 3. fileEpisodeAddStore

**場所**: `src/lib/application/stores/episodeAddStore/fileEpisodeAddStore/`

- **現在の構造**:
  - `fileEpisodeAddStore.svelte.ts`: メインストア
  - `tsvConfigStore.svelte.ts`: TSV設定管理
  - `ttsConfigStore.svelte.ts`: TTS設定管理
- **分離要件**: TTS関連とファイル関連を独立ストアに分割

#### 4. 共通コンポーネント

- **TsvConfigSection**: 再利用可能
- **TtsConfigSection**: 再利用可能
- **FileSelect**: 再利用可能
- **addNewEpisode usecase**: API契約維持要

### アーキテクチャパターン

#### 現在のフロー

```
EpisodeSourceSelectionModal -> FileEpisodeAddModal -> addNewEpisode usecase
```

#### 要求されるフロー

```
EpisodeSourceSelectionModal -> ファイル詳細選択 -> [AudioFileEpisodeAddModal | TtsEpisodeAddModal] -> addNewEpisode usecase
```

## 要件実現可能性分析

### 要件1: ファイル追加方法選択UI

**技術要件**:

- EpisodeSourceSelectionModalの拡張
- 新しい選択フローの実装
- 状態管理の追加

**ギャップ**:

- **Missing**: ファイル詳細選択画面（新規コンポーネント）
- **Missing**: 選択状態管理（新規ストア必要）
- **Extend**: EpisodeSourceSelectionModalのonSourceSelected API

### 要件2: 音声ファイル付きエピソード追加ダイアログ

**技術要件**:

- 音声ファイル選択専用UI
- TSV設定とスクリプト言語検出
- TTS要素の完全除外

**ギャップ**:

- **Missing**: 独立した音声ファイル専用ダイアログ
- **Missing**: 音声ファイル専用ストア
- **Reuse**: TsvConfigSection、FileSelect
- **Constraint**: 既存API契約維持

### 要件3: TTS音声生成エピソード追加ダイアログ

**技術要件**:

- スクリプトファイル選択のみ
- TTS設定セクション
- 音声ファイル要素の完全除外

**ギャップ**:

- **Missing**: TTS専用ダイアログ
- **Missing**: TTS専用ストア
- **Reuse**: TtsConfigSection、TsvConfigSection
- **Constraint**: 既存TTS実行フローとの互換性

### 要件4: ダイアログ間独立性確保

**技術要件**:

- 独立ストア実装
- 相互依存関係の除去
- エラー伝播の分離

**ギャップ**:

- **Missing**: 独立ストアアーキテクチャ
- **Refactor**: 現在の統合ストアの分解
- **Constraint**: 共通機能（TSV/TTS config）の再利用

### 要件5&6: 段階的移行と互換性維持

**技術要件**:

- 既存機能の無破損移行
- addNewEpisode API契約維持
- テストケース継続合格

**ギャップ**:

- **Strategy**: 既存FileEpisodeAddModalの段階的置換
- **Compatibility**: 既存ペイロード型維持
- **Testing**: 新ダイアログ用テスト追加

## 実装アプローチ オプション

### オプション A: 既存コンポーネント拡張

**適用範囲**: EpisodeSourceSelectionModalの拡張部分

**詳細**:

- EpisodeSourceSelectionModalにファイル詳細選択機能追加
- 既存の2択選択からネストした選択フローへ拡張
- onSourceSelected APIを拡張して詳細選択肢をサポート

**トレードオフ**:

- ✅ 既存パターンとの一貫性
- ✅ 最小限のファイル追加
- ❌ ダイアログの複雑度増加
- ❌ 責任の肥大化リスク

### オプション B: 新規コンポーネント作成

**適用範囲**: 分離ダイアログとストア

**詳細**:

- `AudioFileEpisodeAddModal.svelte`: 音声+スクリプト専用
- `TtsEpisodeAddModal.svelte`: TTS生成専用
- `FileSelectionDetailModal.svelte`: ファイル詳細選択
- 独立ストア: `audioFileEpisodeAddStore`、`ttsEpisodeAddStore`

**統合ポイント**:

- 既存のTsvConfigSection、TtsConfigSectionの再利用
- addNewEpisode usecaseの同一API使用
- 共通のFileSelectコンポーネント活用

**責任境界**:

- AudioFileEpisodeAddModal: 音声+スクリプトファイル選択とTSV設定のみ
- TtsEpisodeAddModal: スクリプトファイル選択、TSV設定、TTS設定
- FileSelectionDetailModal: ファイル追加方法の詳細選択

**トレードオフ**:

- ✅ 明確な責任分離
- ✅ 独立テスト可能
- ✅ 将来拡張の柔軟性
- ❌ ファイル数の増加
- ❌ 統合インターフェース設計の複雑性

### オプション C: ハイブリッドアプローチ ⭐ 推奨

**組合戦略**:

- **既存拡張部分**: EpisodeSourceSelectionModalにファイル詳細選択追加
- **新規作成部分**: 分離ダイアログとストア
- **段階実装**: まず新ダイアログ作成 → 既存統合ダイアログ置換

**フェーズ実装**:

1. **フェーズ1**: 新規ダイアログとストアの作成
2. **フェーズ2**: EpisodeSourceSelectionModalの拡張
3. **フェーズ3**: 既存FileEpisodeAddModalの削除

**リスク軽減**:

- 段階的ロールアウトで影響最小化
- 既存機能保持しながら新機能追加
- テストスイート段階的更新

**トレードオフ**:

- ✅ バランスの取れた複雑性管理
- ✅ 段階的リスク軽減
- ✅ 既存パターン尊重と新アーキテクチャ導入の両立
- ❌ 実装計画の複雑性
- ❌ 一時的なコード重複

## 実装複雑性 & リスク評価

### 工数見積り: M (3-7日)

**理由**:

- 新規コンポーネント3個の作成（各1-2日）
- ストア分割とリファクタリング（1-2日）
- 統合テストとデバッグ（1日）
- 既存パターンの踏襲で大きな学習コストなし

### リスク: Medium

**理由**:

- **技術リスク**: 既知のパターンとライブラリの活用で軽減
- **統合リスク**: addNewEpisode API契約維持で最小化
- **UXリスク**: 既存フローの分割による一貫性確保必要
- **保守リスク**: 明確な責任分離で軽減

### 主要リスク要因

1. **ストア状態管理の複雑性**

   - 既存の`fileEpisodeAddStore`からTSV/TTS共通ロジック分離
   - 新しい独立ストア間でのデータフロー管理

2. **UI/UX一貫性**

   - 3つのダイアログ間でのルック&フィール統一
   - エラーハンドリングの一貫した実装

3. **既存機能への影響**
   - FileEpisodeAddModal削除時の影響範囲管理
   - テストケース更新の網羅性

## 設計フェーズ推奨事項

### 優先アプローチ

**ハイブリッドアプローチ（オプションC）**を推奨します。段階的実装により既存機能を保護しながら新アーキテクチャを導入できます。

### 重要設計決定事項

1. **ストアアーキテクチャ**:

   - TSV/TTS共通機能の抽出方法
   - 各ダイアログストアの責任境界定義
   - 共通状態（言語検出、エラー状態）の管理

2. **コンポーネントインターフェース**:

   - 各ダイアログの props 契約設計
   - ファイル詳細選択ダイアログの統合方法
   - エラーハンドリングの統一

3. **移行戦略**:
   - フィーチャーフラグ活用の検討
   - 既存テストケース移行計画
   - パフォーマンス影響の最小化

### 要研究項目

1. **ストア分割戦略**: TSV/TTS設定の共有方法とスコープ管理
2. **ダイアログ統合パターン**: 3つのダイアログ間のナビゲーションUX設計
3. **エラー状態管理**: 独立ダイアログでのエラー境界とユーザーフィードバック

## 次ステップ

分析完了しました。設計フェーズに進むことを推奨します：

- **通常進行**: `/prompt kiro-spec-design separate-file-episode-addition-dialogs` でテクニカル設計実施
- **高速進行**: `/prompt kiro-spec-design separate-file-episode-addition-dialogs -y` で要件承認と設計を同時実行

この分析内容が設計フェーズでの詳細技術仕様策定に活用されます。
