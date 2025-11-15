# Implementation Plan

- [x] 1. SettingsComponent の作成
- [x] 1.1 SettingsComponent の基本構造を実装
  - SettingsComponentProps インターフェースに基づいてコンポーネントを作成
  - APIキー入力、言語選択、学習対象言語選択、説明言語選択のUI要素を実装
  - 内部状態管理で設定データの変更を処理
  - _Requirements: 1.1, 1.2, 1.4_
- [x] 1.2 SettingsComponent の保存機能を実装
  - 保存ボタンのクリックでonSaveコールバックを呼び出す
  - 設定データとAPIキーをまとめて親コンポーネントに渡す
  - _Requirements: 1.3_
- [x] 1.3 (P) SettingsComponent のユニットテストを実装

  - UIレンダリングとonSaveでのデータ渡しのテスト
  - _Requirements: 1.2, 1.3_

- [x] 2. AppInfoComponent の作成
- [x] 2.1 AppInfoComponent の基本構造を実装
  - AppInfoComponentProps インターフェースに基づいてコンポーネントを作成
  - アプリ名、バージョン、著作権、ライセンス、ホームページの情報を表示
  - データ取得ロジックを含まない純粋UIコンポーネントとして実装
  - _Requirements: 2.1, 2.2, 2.3_
- [x] 2.2 (P) AppInfoComponent のユニットテストを実装

  - データ表示のテスト
  - _Requirements: 2.2_

- [x] 3. +page.svelte のリファクタリング
- [x] 3.1 +page.svelte をコンポーネント利用に変更
  - SettingsComponent と AppInfoComponent をインポートして利用
  - 直接UI要素を実装せず、presentationalコンポーネントを組み合わせる
  - _Requirements: 3.1, 3.3_
- [x] 3.2 +page.svelte のユースケース橋渡しを実装
  - 設定保存が必要なイベントでsaveSettingsユースケースを呼び出す
  - UI状態管理とイベントハンドリングを担当
  - _Requirements: 3.2_
- [x] 3.3 (P) +page.svelte の統合テストを実装

  - コンポーネント統合と保存フローのテスト
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. 全体統合と検証
- [x] 4.1 設定ページ全体の機能確認
  - コンポーネントの統合動作を確認
  - エラーハンドリングを維持
  - _Requirements: 1.1, 2.1, 3.1_
- [x] 4.2 (P) E2Eテストで設定ページ全体の機能確認
  - フルスタック検証を実施
  - _Requirements: 1.2, 1.3, 2.2, 3.2_</content>
    <parameter name="filePath">/home/nakatani/Projects/k5n/kotonoha/.kiro/specs/refactor-settings-page-components/tasks.md
