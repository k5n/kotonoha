# Product Overview

Kotonoha は音声/動画とスクリプトを組み合わせた「センテンス・マイニング」を高速化するデスクトップアプリです。学習者が任意のセンテンスを選ぶだけで、AI が語彙・表現・文脈メモを抽出し、元のメディアと並べて理解を深められます。

## Core Capabilities

- **Context-Aware Sentence Mining**: LLM (Google Gemini) に文脈全体とターゲット文を渡し、語彙・表現・注釈を一括抽出してカード化します。
- **Multi-Source Episode Ingestion**: ローカル音声+字幕、字幕のみ+Piper TTS、YouTube URL + 自動字幕など、複数入力チャネルを同じワークフローで扱います。
- **Episode & Group Management**: アルバム/フォルダ階層で素材を整理し、エピソード単位でメディア・字幕・言語設定を管理します。
- **Interactive Transcript Study**: 同期スクロールするトランスクリプトビューアとメディアプレーヤーから、任意の行をクリックして解析・編集できます。
- **Card Export Readiness**: 解析結果は Anki 互換 CSV などの学習カードにシリアライズでき、後続の SRS ワークフローに直結します。

## Target Use Cases

- **没入型学習者**: ドラマ/ポッドキャスト等の長尺素材から気になる文を抜き出し、文脈付きで語彙を固めたい個人学習者。
- **試験準備/教材作成**: TOEIC 等の試験対策で公式音源や模試を取り込み、重要表現を AI に要約させたい受験者や講師。
- **教師・コミュニティ運営者**: 教材エピソードを整理し、学習者に配布するためのカードセットや解説ノートを作成する指導者。

## Value Proposition

- 元メディアの音声/字幕コンテキストを保ったまま AI 解析とカード化を一気通貫で行える点。
- ローカル素材・TTS・YouTube など異なる入力チャネルを統一 UI で扱える柔軟性。
- デスクトップ (Tauri) ベースのため OS ネイティブ機能やストレージを活用しつつ、ブラウザモードで高速 UI 開発も可能。
- SQLite + Stronghold を用いたローカルデータ/秘匿情報管理で、クラウド依存を最小化しつつプライバシーを担保。

---

_Focus on patterns and purpose, not exhaustive feature lists_
