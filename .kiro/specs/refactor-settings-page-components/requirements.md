# Requirements Document

## Introduction

settings画面には設定用のものとアプリ情報表示用のものが混ざっている。これをそれぞれ別コンポーネントにしてrouts/settings/presentationalに格納し、+page.svelteはこれらを利用することとユースケースへの橋渡しをするだけにしたい。

このリファクタリングにより、コードの保守性と再利用性を向上させ、プレゼンテーション層の構造を明確にする。

## Requirements

### Requirement 1: 設定用コンポーネントの作成と配置

**Objective:** 開発者として、設定関連のUI要素を別コンポーネントに分離したい、コードの保守性と再利用性を高めるため

#### Acceptance Criteria

1. When 設定ページが読み込まれるとき、Kotonohaアプリは設定用コンポーネントをroutes/settings/presentationalに配置されたファイルから読み込むこと
2. While 設定用コンポーネントがレンダリングされる間、KotonohaアプリはAPIキー入力、言語選択、学習対象言語選択、説明言語選択のUI要素を表示すること
3. If 保存ボタンがクリックされたとき、Kotonohaアプリは設定保存ユースケースを呼び出すこと
4. The Kotonohaアプリは設定用コンポーネントをpresentationalコンポーネントとして実装し、ユースケース呼び出しを含まないこと

### Requirement 2: アプリ情報表示用コンポーネントの作成と配置

**Objective:** 開発者として、アプリ情報表示のUI要素を別コンポーネントに分離したい、コードの保守性と再利用性を高めるため

#### Acceptance Criteria

1. When 設定ページが読み込まれるとき、Kotonohaアプリはアプリ情報表示用コンポーネントをroutes/settings/presentationalに配置されたファイルから読み込むこと
2. While アプリ情報表示用コンポーネントがレンダリングされる間、Kotonohaアプリはアプリ名、バージョン、著作権、ライセンス、ホームページの情報を表示すること
3. The Kotonohaアプリはアプリ情報表示用コンポーネントをpresentationalコンポーネントとして実装し、データ取得ロジックを含まないこと

### Requirement 3: +page.svelteのリファクタリング

**Objective:** 開発者として、+page.svelteをコンポーネント利用とユースケース橋渡しに限定したい、プレゼンテーション層の責務分離を明確にするため

#### Acceptance Criteria

1. When 設定ページが読み込まれるとき、Kotonohaアプリは設定用コンポーネントとアプリ情報表示用コンポーネントを+page.svelte内で利用すること
2. If 設定保存が必要なイベントが発生したとき、Kotonohaアプリは+page.svelteから設定保存ユースケースを呼び出すこと
3. The Kotonohaアプリは+page.svelteが直接UI要素を実装せず、presentationalコンポーネントを組み合わせること
