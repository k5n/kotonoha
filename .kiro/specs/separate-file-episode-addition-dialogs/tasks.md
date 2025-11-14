# Implementation Plan

## Task List

- [ ] 1. EpisodeSourceSelectionModalにファイル詳細選択機能を追加
- [ ] 1.1 (P) ファイル追加方法選択UIの実装
  - 「ファイル追加」選択時にファイル詳細選択画面を表示する機能
  - 「音声+スクリプトファイル」と「スクリプトファイル+TTS生成」の2つのオプション提供
  - 各オプションの違いを分かりやすく説明するテキスト表示
  - キャンセル時の前画面戻り機能
  - _Requirements: 1.1_

- [ ] 1.2 (P) ファイル詳細選択のナビゲーション状態管理
  - 現在の表示状態（ソース選択/ファイル詳細選択）の管理
  - 選択されたファイルタイプ（audio-script/script-tts）の保持
  - 適切なイベントハンドリングとモーダル遷移制御
  - _Requirements: 1.1_

- [ ] 2. 音声ファイル付きエピソード追加ダイアログの実装
- [ ] 2.1 (P) AudioScriptFileEpisodeAddModalコンポーネントの作成
  - 音声ファイル選択とスクリプトファイル選択の入力要素
  - TSV設定セクションとスクリプト言語検出機能の統合
  - TTS関連UI要素の完全除外
  - 既存のFileSelectとTsvConfigSectionコンポーネントの再利用
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 (P) audioScriptFileEpisodeAddStoreの実装
  - 音声ファイルパス、スクリプトファイルパス、学習言語選択の状態管理
  - TSV設定サブストアの統合
  - TTS関連ストアへの依存関係完全排除
  - ペイロード構築とフォームバリデーション機能
  - _Requirements: 2.1, 4.1, 4.2_

- [ ] 3. TTS音声生成エピソード追加ダイアログの実装
- [ ] 3.1 (P) TtsEpisodeAddModalコンポーネントの作成
  - スクリプトファイル選択の入力要素（音声ファイル選択は除外）
  - TSV設定セクション、TTS設定セクション、言語検出機能の統合
  - 既存のTTS設定とTTS実行フローの再利用
  - TTS音声生成とエピソード作成の実行機能
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 (P) ttsEpisodeAddStoreの実装
  - スクリプトファイルパス、学習言語選択の状態管理
  - TSV設定とTTS設定サブストアの統合
  - 音声ファイル関連ストアへの依存関係完全排除
  - TTS生成ペイロード構築とフォームバリデーション機能
  - _Requirements: 3.1, 4.1, 4.2_

- [ ] 4. Episode List Pageのモーダル制御拡張
- [ ] 4.1 新しいモーダル状態管理の実装
  - audioScriptFileModalOpenとttsModalOpenの状態追加
  - selectedFileType（audio-script/script-tts）の管理
  - モーダル間遷移制御ロジックの実装
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 4.2 新しいダイアログとの統合
  - AudioScriptFileEpisodeAddModalとTtsEpisodeAddModalの表示制御
  - 各ダイアログからのペイロード受け取りとaddNewEpisodeユースケース呼び出し
  - エラーハンドリングと適切なメッセージ表示
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 6.1_

- [ ] 5. 既存FileEpisodeAddModalからの段階的移行
- [ ] 5.1 既存統合型コンポーネントの削除準備
  - FileEpisodeAddModal.svelteの使用箇所特定
  - fileEpisodeAddStore.svelte.tsの依存関係分析
  - 新しいダイアログへの切り替え前の最終確認
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 不要ファイルの削除と清理
  - FileEpisodeAddModal.svelteの削除
  - fileEpisodeAddStore.svelte.tsの削除
  - 関連インポートの修正と整理
  - _Requirements: 5.2, 5.4_

- [ ] 6. API契約とデータ互換性の確保
- [ ] 6.1 addNewEpisodeユースケースとの互換性検証
  - 新しいダイアログから生成されるペイロードの既存API契約との適合確認
  - AudioScriptFileEpisodeAddPayloadとTtsEpisodeAddPayloadの正確性検証
  - エピソードデータの既存形式との完全互換性確認
  - _Requirements: 6.1, 6.2_

- [ ] 6.2 (P) データベーススキーマとファイル保存形式の維持確認
  - 作成されるエピソードデータの既存形式との互換性検証
  - メディアファイル保存パスとファイル命名規則の一貫性確保
  - SQLiteスキーマへの影響がないことの確認
  - _Requirements: 6.2, 6.3_

- [ ] 7.* 既存テストケースの更新と新規テスト追加
- [ ] 7.1* episode-list.file.browser.test.tsの更新
  - 音声+スクリプトファイル選択フローのテストケース追加
  - TTS音声生成選択フローのテストケース追加
  - 既存ファイル選択テストの新仕様への適応
  - _Requirements: 5.3, 6.3_

- [ ] 7.2* 新規ダイアログコンポーネントのユニットテスト
  - AudioScriptFileEpisodeAddModalの基本機能テスト
  - TtsEpisodeAddModalの基本機能テスト
  - 各ストアのロジック検証テスト
  - _Requirements: 4.3, 6.3_