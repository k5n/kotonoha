# 新データベーステーブル構造

```sql
CREATE TABLE episode_groups (
    id TEXT PRIMARY KEY,
    parent_group_id TEXT,
    content TEXT NOT NULL,  /* JSON formatted string */
    display_order INTEGER NOT NULL,
    group_type TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE episodes (
    id TEXT PRIMARY KEY,
    episode_group_id TEXT NOT NULL,
    content TEXT NOT NULL, /* JSON formatted string */
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE subtitle_lines (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    content TEXT NOT NULL, /* JSON formatted string */
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE sentence_cards (
    id TEXT PRIMARY KEY,
    subtitle_line_id TEXT NOT NULL,
    content TEXT NOT NULL, /* JSON formatted string */
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);

```

# 全テーブルの共通仕様

- id は UUID 形式の文字列に変更
- updated_at と deleted_at は ISO 8601 形式の文字列を格納する
- INSERT 時に updated_at を現在時刻に設定
- deleted_at は削除時に現在時刻を設定し、NULL でない場合は削除済みとみなす
- content カラムは JSON 形式の文字列を格納
- 外部キー制約は利用しない

SELECT 時に利用する項目以外は content カラムに辞書として格納する。
こうすることで将来的な拡張が容易になる。
将来的に Google Drive による複数デバイス間の同期を考慮し、テーブルのスキーマ変更を最小限に抑える目的もある。

外部キー制約は利用しない。
そもそもデフォルトで外部キー制約が無効になっているという話もある。
今は有効になっているかもしれないが、外部キー制約を付けているとテーブル名を変更するのが面倒になる。

# episode_groups テーブル

- content カラムは name を持つ辞書

# episodes テーブル

- created_at カラムを削除
- content カラムは title, mediaPath, learningLanguage, explanationLanguage を持つ辞書

# subtitle_lines テーブル（旧 dialogues テーブル）

- sequence_number カラムを追加（単純に start_time_ms 順で並べた際の 1 始まりの順番番号）
- content カラムは startTimeMs, endTimeMs, originalText, correctedText, translation, explanation, sentence, hidden を持つ辞書
  - hidden は現在の deletedAt に相当するが、deleted_at カラムとは別に管理する（deleted_at は削除扱いであり元に戻せない）

# sentence_cards テーブル

- dialogue_id カラムを subtitle_line_id カラムに名称変更
- content カラムは partOfSpeech, expression, sentence, contextualDefinition, coreMeaning, createdAt を持つ辞書
