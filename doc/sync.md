# Google Drive を利用したデバイス間同期の設計

## 概要

今後 Google Drive を経由したデバイス間の同期を実装する予定であり、「同期のための最新状態管理テーブル」を別途用意します。
同期してから次の同期までのローカルでの変更内容を管理するテーブルと、最新の同期内容を管理するテーブルを用意します。

ローカルでの同期前の変更は sync_pending_changes テーブルで管理します。
同期時には sync_pending_changes テーブルの内容から前回同期との差分情報 JSON を作成して Google Drive 側にファイルとしてアップロードし、同期完了後にテーブル内容を削除します。

sync_states は肥大化を防ぐため、履歴ではなく最新状態のみを保持します。
ただしあくまで最終同期状態であり、その後のローカルでの変更内容は次の同期まで反映されません。
このようにすることで sync_states テーブルの最終同期状態と sync_pending_changes テーブルの内容を比較してプログラム側で変更差分を作成できます。

sync_pending_changes テーブルには table_name と record_id、変更後の内容を Upsert で保存します。
つまり、同期までに同じレコードが複数回変更された場合でも、最後の変更内容のみを保存します。
SQLite3 のトリガーを利用して自動的に各テーブル（後述する Command 用テーブル）の変更内容を記録します。

同期内容には以下を含みます。

- ファイル名に含める情報
  - どのデバイスが変更したか（device_id）
  - いつ同期したか（Google Drive 時刻のタイムスタンプ）
- ファイル内容に含める情報（配列）
    - どのテーブルの変更か
    - どのレコードの変更か（id=UUID）
    - レコードの変更差分内容（JSON）
    - その変更が物理削除かどうか
    - いつ変更したか（HLC タイムスタンプ）

## 目的

この設計にする目的は以下の通りです。

- デバイス間の同期を容易にする
    - 各デバイスはテーブルの更新内容を Google Drive 経由で共有し、他のデバイスの変更内容を取り込むことで同期を実現する
- 各テーブルでクエリに必要な項目以外は content カラムにJSONで保存することで、DBテーブルのスキーマ変更を最小限にする
    - マイグレーションによる影響を最小限に抑え、アプリのバージョンアップを容易にする
- sync_states 以外のDBテーブルを sync_states テーブルの内容から再構築できるようにすることで、以下のような利点がある
    - sync_states テーブル以外のテーブルのスキーマ変更が発生しても柔軟に対応できる
    - バックアップやリストアの際に sync_states テーブルを元に他のテーブルを再構築できる

同期が目的であるため、肥大化を防ぐために sync_states には履歴ではなく最新状態のみを保持します。
特に将来的にスマホアプリ対応も考えているため、デバイスのストレージ容量を圧迫しないようにする必要があります。

## 前提

同期対象の各テーブルは以下の条件を満たすものとします。

- 各テーブルの主キーは各デバイスで共通のものを利用（UUID など）
- 各テーブルに保存するオブジェクトの内容は content カラムに JSON で保存する
- content カラムには updated_at, deleted_at フィールドを含める
    - updated_at はオブジェクトが最後に変更された時刻で、上述する HLC タイムスタンプを保存する
    - deleted_at はオブジェクトが削除された時刻で、削除されていない場合は NULL を保存する（Soft Delete のため）

つまり同期対象は Command 用テーブルであり、Query 用テーブルではありません。

SQLite3 は 3.45.0 から JSONB 型をサポートしているので、それを利用します。
（OS が用意している SQLite3 を利用するのではなく、アプリに SQLite3 をリンクして組み込む想定）

### 現時点のテーブル設計

現状は Command 用テーブルと Query 用テーブルを分離するメリットが少ないため、以下のルールでテーブル設計します。

- 各テーブルの検索やソートに必要なフィールドは別途カラムとして用意する（ただしそれらの内容も content カラムに含める）

例: episode_groups テーブル

```sql
CREATE TABLE episode_groups (
    id TEXT PRIMARY KEY,
    parent_group_id TEXT,
    content JSONB NOT NULL,
    display_order INTEGER NOT NULL,
    group_type TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
```

content カラムには以下のような JSON を保存します。

```json
{
    "parent_group_id": null,
    "name": "value",
    "display_order": 1,
    "group_type": "folder",
    "updated_at": "2024-06-01T12:00:00Z",
    "deleted_at": null
}
```

各テーブルは Command 用（id と content）でありながら Query （検索に必要なフィールドだけカラムにも外出し）にも使われる形です。
現時点では特に集計機能などは存在せず、単にオブジェクトを取得する用途が主であるため、実際に CQRS にするのはオーバースペックであり、この形で問題ないと考えています。
ただし content カラムの JSON 内容と外出しするカラムで情報が重複するため、冗長性がある点には注意が必要です。情報が乖離しないようにアプリ側で整合性を保つ必要があります。

同期設計においては Query 用テーブルがどのように用意されているかは関係ありません。関係があるのは Command 用テーブルのみです。
概念上は Command 用テーブルと Query 用テーブルは分離されているが、現時点の実装では Command 用テーブルと Query 用テーブルが同一であるというだけです。

## 実装方針

最終的にデバイス間同期を実現する予定だが、まずはそれを想定したDBテーブル設計と実装を行う。
段階的に以下のステップで進める。

1. 既存のDBテーブルの見直しと最適化（ほぼ完了）
    - 各テーブルのスキーマを見直し、id と content を持つ Command テーブルとして機能しつつ、content 以外のカラムを Query に最適化する
    - 不要なカラムの削除や、JSON カラムの追加
2. sync_pending_changes, sync_states テーブルの設計と実装（← 現在これの計画段階）
    - 各テーブルの変更履歴を保存するためのスキーマ設計
    - デバイスIDの決定と管理方法の検討
    - 各操作（Insert, Update, Delete）時に sync_pending_changes テーブルにレコードを追加するロジックの用意（トリガー設定）
3. データベースの移行スクリプトの作成
    - 既存データを新テーブル設計に移行するためのスクリプト作成
    - 移行後のデータ整合性チェック
4. デバイス間同期の実装
    - Google Drive API を利用したファイルのダウンロード・アップロード機能の実装
    - ダウンロードしたファイルの内容を sync_states テーブルに取り込むロジックの実装
    - sync_states テーブルの内容を元に各テーブルを更新するロジックの実装
    - sync_pending_changes テーブルの内容を変更差分としてファイルにまとめてアップロードするロジックの実装
    - 自動テストできるものは自動テストを用意
5. テストと検証
    - 各種同期シナリオのテストケース作成
    - 複数デバイス間での同期動作の検証

## sync_pending_changes,  sync_states テーブルのスキーマ案

### sync_pending_changes テーブル

```sql
CREATE TABLE sync_pending_changes (
    id INTEGER PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    new_content JSONB,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL

    UNIQUE(table_name, record_id) -- UPSERT にするため
);
CREATE INDEX IF NOT EXISTS idx_sync_pending_changes_created_at ON sync_pending_changes(created_at);
```

sync_pending_changes テーブルは、ローカルデバイスでの同期後の変更履歴を保存します。
トリガーによる履歴を書き込む際は UPSERT を行います。つまり最後の変更内容のみを保存します。
肥大化を防ぐために未同期の変更のみを保存し、同期が完了したら削除します。

new_content カラムには、変更後の内容を JSON で保存します。
ただし DELETE の場合は new_content は DELETE 前の内容を保存します。削除されたかどうかは is_deleted カラムで判定します。
（現時点では Soft Delete しか行っていませんが、sync_pending_changes テーブルの仕様としては物理 DELETE された場合にも履歴を残すようにしておきます。）

created_at カラムは、変更が行われた時刻を保存します。
ここはローカルデバイスの時刻を使用します。ローカルでの変更順序が分かればよいためです。UTC でミリ秒単位まで含めた ISO 8601 形式の文字列で保存します。
（NOTE: 途中で OS の時刻同期が行われると順序が入れ替わる可能性はあります。しかしトリガーで自動的に記録したいので、ローカルデバイスの時刻を使用します。）

episode_groups テーブルの INSERT, UPDATE, DELETE 時のトリガー例：

```sql
CREATE TRIGGER trg_episode_groups_insert
AFTER INSERT ON episode_groups
BEGIN
    INSERT INTO sync_pending_changes (table_name, record_id, new_content, created_at)
    VALUES (
        'episode_groups', 
        NEW.id, 
        NEW.content, 
        STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
    )
    -- INSERT 時に既に存在することは通常ないが念のため UPSERT にしておく
    ON CONFLICT(table_name, record_id)
    DO UPDATE SET
        new_content = excluded.new_content,
        created_at = excluded.created_at;
END;

CREATE TRIGGER trg_episode_groups_update
AFTER UPDATE ON episode_groups
BEGIN
    INSERT INTO sync_pending_changes (table_name, record_id, new_content, created_at)
    VALUES (
        'episode_groups',
        NEW.id,
        NEW.content,
        STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
    )
    ON CONFLICT(table_name, record_id) 
    DO UPDATE SET
        new_content = excluded.new_content,
        created_at = excluded.created_at;
END;

CREATE TRIGGER trg_episode_groups_delete
AFTER DELETE ON episode_groups
BEGIN
    INSERT INTO sync_pending_changes (table_name, record_id, new_content, is_deleted, created_at)
    VALUES (
        'episode_groups', 
        OLD.id, 
        OLD.content,  -- DELETE の場合は new_content は削除前の内容を保存
        1,
        STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')
    )
    ON CONFLICT(table_name, record_id)
    DO UPDATE SET
        new_content = excluded.new_content,
        is_deleted = excluded.is_deleted,
        created_at = excluded.created_at;
END;
```

### sync_states テーブル

```sql
CREATE TABLE sync_states (
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    record_data JSONB NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT 0,
    device_id TEXT NOT NULL,
    synced_at TIMESTAMP,
    PRIMARY KEY (table_name, record_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_states_updated_at ON sync_states(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_states_table_name ON sync_states(table_name);
```

このテーブルは最後に同期した時点の最新状態を保存します。

このテーブルには常に最新の情報のみを保持すればよく、UPSERT を使用します。
record_data カラムには、レコード内容全体を JSON で保存します（SQLite3 は 3.45.0 から JSONB をサポート）。

updated_at の HLC タイムスタンプの仕様については後述します。
is_deleted カラムは、レコードが物理削除されたかどうかを示します。つまり同期データとしては Command テーブルから物理削除されても記録が残ります。
（Soft Delete の場合は record_data 内の deleted_at フィールドが設定されますが、is_deleted は false となります。）

device_id カラムには、最後に変更を行ったデバイスのIDを保存します。問題追跡用であり、同期ロジックには使用しません。
synced_at カラムには、そのレコードが最後に外部と同期された時刻を保存します。問題追跡用であり、同期ロジックには使用しません。

変更パッチの適用例： jsonb_patch 関数が利用できる

```sql
-- 他デバイスからの変更(new_patch)を、既存のデータ(record_data)にマージ
UPDATE sync_states 
SET record_data = jsonb_patch(record_data, :new_patch),
    updated_at = :new_updated_at,
    is_deleted = :new_is_deleted,
    device_id = :device_id,
    synced_at = CURRENT_TIMESTAMP
WHERE table_name = :table_name AND record_id = :record_id;
```

## 同期処理

### 同期タイミング

各デバイスはアプリ開始時、アプリ終了時、あるいはユーザーの手動操作で、利用者個人の Google Drive に前回同期からの変更内容をアップロード・ダウンロードします。
Google Drive API のアクセス上限に注意し、過度に頻繁に同期を行わないようにします。

### 同期の流れ

ダウンロードは

- 共有ストレージから他のデバイスがアップロードしたファイルのうち、
  自身が最後に同期したタイムスタンプ以降（バッファも持たせて少し前から）のファイルを取得
- 自身がまだ取り込んでいないレコードを抽出
- ローカルの sync_states テーブルに取り込み
- sync_states テーブルの内容を元に各テーブルを更新

という形で行います。

アップロードは

- ローカルの sync_pending_changes テーブルと sync_states テーブルから、前回同期以降の変更内容を作成
- 共有ストレージにアップロード
- sync_states テーブルの内容を更新
- sync_states テーブルの内容を元に各テーブルを更新
- sync_pending_changes テーブルの内容を削除

という形で行います。

先にダウンロードを行って外部の変更内容を取り込み、その後にアップロードを行います。
これがなぜなのかは後述します。

### アップロードファイルの形式

アップロードするファイルには sync_pending_changes テーブルに記録された変更内容を前回同期からの差分パッチに変換して１つのJSONファイルにまとめ、アップロードした時刻のタイムスタンプとデバイスIDをファイル名として含めます。

ファイルは gzip 圧縮してアップロードします。

- 例: patch_{timestamp}_{device_id}.json.gz

タイムスタンプの方がデバイスIDより前に来るのは、ファイル名でソートした際に時刻順に並ぶようにするためです。

タイムスタンプは Google Drive 側の時刻を使用します。
時刻を取得してからファイルが作成されるまでの時間差は許容します。それを考慮して取得する側は少し余裕を持たせて取得します。
最終的に各変更項目を適用するかどうかは、ファイル内に含まれる updated_at タイムスタンプで判断されます。ファイル名のタイムスタンプはあくまでそのファイルを取得するかどうかの判断に使われます。

ファイルの内容は以下のような形式です。

```json
[
    {
        "table_name": "episode_groups",
        "record_id": "uuid-xxxx-xxxx",
        "patch": {...},
        "updated_at": "2024-06-01T12:00:00Z"
    },
    // ...
]
```

patch に格納する差分は jsonb_patch で適用される形式を想定しています。（配列は置換されることに注意。基本的に別テーブルにしてリレーションさせる設計にし、別テーブルを用意したくない単純な項目の場合は UUID をキーにした辞書として管理。）

また sync_pending_changes テーブル内に同じオブジェクト（同じ table_name と record_id）に対する複数の変更がある場合は、それらをマージして１つの差分パッチにまとめます。パッチファイルの肥大化を防ぐためです。

Google Drive 側のフォルダ内ファイル数が増えすぎないように、また対象ファイル数を絞れるようにするために、年月日単位でサブフォルダを作成し、その中にファイルをアップロードします。
アップロード処理中にアプリが強制終了した場合に備え、アップロード完了後に sync_pending_changes テーブルの内容を削除します。

削除の取り扱いについては後述します。

### テーブル更新のトランザクション

sync_states テーブルへの更新と、対象テーブルの更新は同一トランザクション内で行います。
これを怠ると「同期テーブルは更新されているが実データが変わっていない」といった不整合が発生し、同期の信頼性が崩れます。

また sync_pending_changes テーブルの内容を削除する処理も、sync_states テーブルへの反映を行う際に同一トランザクション内で行います。
この際、Google Drive へのアップロードが成功したことを確認してから sync_pending_changes テーブルの内容を削除します。

ファイルアップロードはトランザクションに含まれませんが、その後にトランザクションが失敗した場合にはアップロードしたファイルを削除することで整合性を保ちます。
もしその間に他のデバイスが同期にそのファイルを取り込んでしまったとしても、内容が間違っているわけではありませんし、その後に再度同様の内容をアップロードして重複したとしても、最終的なデータの整合性には影響しません。
sync_states テーブルの更新は HLC を利用した LLW（Last Writer Wins）方式で処理するためです。

sync_pending_changes テーブルへの書込みは各 Command テーブルのトリガー内で行うため、特に意識する必要はありません。
各 Command テーブルへの書込みのトランザクション管理はこの同期仕様のスコープ範囲外です。

### 物理削除の取り扱い

アプリは現時点では Soft Delete のみを行っています。
しかしこの同期仕様では将来的に物理削除が行われる可能性も考慮した仕様としています。

物理削除が行われた場合、sync_pending_changes テーブルでは new_content が削除前の内容、is_deleted が true となります。
is_deleted が true に設定される以外は、patch ルールは物理削除の場合も変わりません。sync_states テーブルに適用する patch と is_deleted=true の組み合わせで物理削除を表現します。
結果として、ローカルで行われた物理削除前の変更も削除前の最終内容として sync_states テーブルに反映されます。
ただしローカルでの変更が物理削除のみだった場合、new_content と最後の同期状態との差分は存在しないため、patch は空オブジェクト {} となります。

```json
{
    "table_name": "episode_groups",
    "record_id": "uuid-xxxx-xxxx",
    "patch": {...},  // 最後の同記事の内容と物理削除前の最後の内容の差分
    "is_deleted": true,
    "updated_at": "2024-06-01T12:00:00Z"
}
```

### updated_at に使うタイムスタンプ

複数デバイスでの同期では各デバイスで時刻がずれる可能性があります。
同期はリアルタイムに行われるわけではなく、どうやっても同期と同期の間に他のデバイスで行われた変更との競合が発生する可能性があります。
タイムスタンプで保証できるのは「そのデバイスが前回同期してから今回同期するまでの間に行われた変更かどうか？」のみであり、「その間に行われた各変更のタイムスタンプが正確どうか？」を保証できません。

その最低限の保証を行い、「ユーザーの責任」とする範囲を「同期と同期の間に複数デバイスで行われた同時編集による競合」に留めることを目標とします。

- 「自デバイスが前回同期してから今回同期するまでの間」に他デバイスで行われた変更については古いデータで上書きされることを完全には防げない
- それ以外の期間に他デバイスで行われた変更については古いデータで上書きすることを防止する

そのために HLC（Hybrid Logical Clock）の考え方を取り入れます。
ここで timestamp はミリ秒単位まで含めた ISO 8601 形式の文字列を、ミリ秒単位の整数値に変換したものとします。
実際にフィールドに格納する際には UTC でミリ秒単位まで含めた ISO 8601 形式の文字列に変換して保存します。

```
timestamp = max(system_timestamp, max_seen_timestamp + i + 1)
```

system_timestamp は各デバイスのローカル時刻を使用します。つまり sync_pending_changes テーブルの created_at から算出します。
max_seen_timestamp は sync_states テーブル内の updated_at で最大の時刻の timestamp 値です。
i は sync_pending_changes テーブルを created_at の昇順で処理する際のインデックス（0から始まる連番）です。

sync_pending_changes テーブルの内容から差分情報を作成する際に、上記の方法で timestamp を決定し、created_at (system_timestamp) を updated_at (HLC timestamp) に変換して設定します。

例: sync_pending_changes テーブルのレコード
```json
[
    {
        "table_name": "episode_groups",
        "record_id": "uuid-xxxx-xxxx",
        "new_content": { ... },
        "created_at": "2024-06-01T12:00:00.000Z" // system_timestamp => UTC ISO 8601
    },
    {
        "table_name": "episodes",
        "record_id": "uuid-xxxx-xxxx",
        "new_content": { ... },
        "created_at": "2024-06-01T12:00:10.000Z" // system_timestamp => UTC ISO 8601
    }
]
```

例: 変換後の差分情報（max_seen_timestamp の元になったのが "2024-06-01T12:10:00.000Z" の場合）
```json
[
    {
        "table_name": "episode_groups",
        "record_id": "uuid-xxxx-xxxx",
        "patch": { ... },
        "updated_at": "2024-06-01T12:10:00.001Z" // HLC timestamp => UTC ISO 8601
    },
    {
        "table_name": "episodes",
        "record_id": "uuid-xxxx-xxxx",
        "new_content": { ... },
        "created_at": "2024-06-01T12:10:00.002Z" // HLC timestamp => UTC ISO 8601
    }
]
```

これにより、もしそのデバイスのローカル時刻がずれていても、少なくとも過去に見た max_seen_timestamp よりは大きい値がタイムスタンプとして設定されます。
そのデバイスが最後に同期した後の変更であることだけは保証できます。

### タイムスタンプの未来へのズレの可能性

この方法では system_timestamp が未来に大きくズレている場合に、timestamp が不自然に大きくなることを防げません。
（例えば Linux と Windows のデュアルブートのマシンで、互いの OS の RTC 仕様が異なっているために、OS が時刻を同期するまで日本では９時間時間がズレることがあります）
このことが他のデバイスでの max_seen_timestamp にも影響を与え、連鎖的に timestamp が実際の時刻より大きくなってしまう可能性があります。

しかし HLC の単調増加のルールを守り、時刻が未来になる可能性は許容する方針とします。
回避策として以下が考えられますが、実装の複雑さの追加に対して得られるメリットが小さいと判断しました。

#### Google Drive 側の時刻を参照して未来へのズレを制限する方法（案として記載しておくが**採用しない**）

同期のアップロード直前に１度 Google Drive 側にアクセスして時刻を参照し、 その時刻より未来にならないように制限を加えます。

```
timestamp = min(timestamp, google_drive_timestamp)
```

これにより以下が保証されます。

- デバイスのローカル時刻が過去にズレている場合、少なくとも max_seen_timestamp（自デバイス/他デバイスの最終 timestamp） よりは大きい timestamp が設定される
- デバイスのローカル時刻が未来にズレている場合、少なくとも次に同期した際の Google Drive 側の時刻よりは大きくならない

### ダウンロードを先に行う理由

先にアップロードしてからダウンロードする場合、以下のようなケースが考えられます。

デバイスAの変更:
```json
{
    "parent_group_id": null,
    "name": "valueA1",   // 変更されたフィールド
    "display_order": 1,
    "group_type": "folder",
    "updated_at": "2024-06-01T12:00:00Z",  // こちらの方が古い
    "deleted_at": null
}
```

デバイスBの変更:
```json
{
    "parent_group_id": null,
    "name": "value",
    "display_order": 2,  // 変更されたフィールド
    "group_type": "folder",
    "updated_at": "2024-06-01T12:10:00Z",  // こちらの方が新しい
    "deleted_at": null
}
```

デバイスBが Google Drive と先に同期したとします。
デバイスBの変更内容がアップロードされて sync_states テーブルにも反映され、updated_at は "2024-06-01T12:10:00Z" になります。

その後デバイスAが同期を行った場合、デバイスAの変更内容は updated_at が "2024-06-01T12:00:00Z" であるため、それをデバイスBが次の同期で取り込んだとしても sync_states テーブルの内容は更新されません。

ここでは `git pull --rebase` と同様の、「自分の変更（未同期）は、他人の変更（同期済み）よりも常に『後』に行われたものとして再定義する」という考え方を採用します。

先にダウンロードを行うことで、他のデバイスで行われた変更が常に先に取り込まれます。この時点で max_seen_timestamp は他のデバイスで行われた変更内容に更新されます。
その後に自分の変更をアップロードすることで、HLC タイムスタンプは必ず max_seen_timestamp より大きくなり、自分の変更が常に同期時の他人の変更よりも後に行われたものとして扱われます。

上記の例であればデバイスBが同期した内容が先に取り込まれ、デバイスAが後から同期する際には自身の変更はそれより後に行われたものとして扱われ、sync_states テーブルの内容に反映されます。
デバイスBから見ても、次に同期した際にデバイスAの変更は自身が最後に同期した際よりも後に行われたものとして記録されているので、sync_states テーブルの内容に反映されます。

同じフィールドに対して変更内容に衝突が発生する可能性はありますが、その際は後に同期した方の変更内容が優先されます。
実際の操作時間での順番保証ができない以上、最後に同期した内容が優先されるのは直感的にも理解しやすい挙動であると考えます。

## Google Drive 側のスナップショット作成と同期内容ログの肥大化対策

Google Drive 側にアップロードされる更新内容ログも肥大化するため、一定期間経過したものはマージする処理が必要です。
その月の最初に Google Drive に同期したデバイスは、現在の sync_states テーブルの内容を現時点のスナップショットとしてアップロードし、過去のログをまとめて削除します。

ファイル名にはスナップショットを作成したタイムスタンプとデバイスIDを含めます。

- 例: snapshot_{device_id}_{timestamp}.json

このファイルも年月日でわけられたサブフォルダに保存します。

「その月の最初に」ですが、Google Drive は分散システムで結果整合性を採用しているため、厳密に１台のデバイスだけがその月の最初にスナップショットを作成することを保証できません。
ほとんどの場合は事前に「既にその月のスナップショットがあるか」を確認することで防げるものの、同時に複数のデバイスがスナップショットを作成する可能性はあります。
しかし複数のスナップショットが存在しても問題ありません。ダウンロードする際に最新のスナップショットを取得すればよいためです。

スナップショットを作成したら、そのスナップショットのファイル名に利用したタイムスタンプより前の月のログファイルを全て削除します。
この処理も複数デバイスが同時に行う可能性がありますが、

- あるファイルの削除に失敗しても続けて処理を行う

ことで問題ありません。

このルールは単に複数デバイスが過去ログの削除処理を行う場合だけでなく、削除処理を行うデバイスが１つだけで「既に削除済み」以外の理由で削除に失敗した場合にも適用されます。
それらは削除できなくても容量を圧迫するだけであり、同期の整合性には影響しないためです。また次回の削除処理でまた削除対象になってリトライされます。

通常のファイルシステムであれば、ファイルを利用したロック機構を用意することも考えられますが、Google Drive が分散システムで結果整合性の傾向を持つ（ファイル操作がアトミックでない）ことを考慮すると確実性に欠けるため、ロック機構を用意するより結果整合性で問題ないように設計しました。

### ファイルの完全削除

Google Drive では通常の削除をしてもゴミ箱に残るため、容量を圧迫します。Google Drive API で削除する際は files.delete (完全に削除) を利用します。
権限不足などで完全削除ができなかった場合は、通常の削除を行います。

## 初期同期

始めて利用するデバイスでは、最新のスナップショットとそれ以降の更新ログを全て取り込む形で初期同期を行います。

## 免責事項

デバイス間の同期に関しては、競合解決をどのように行うかが重要なポイントとなります。
基本的にはタイムスタンプが一番新しいものを適用していく方針ですが、タイムスタンプをサーバー管理していないため、各デバイスで時刻がずれる可能性があります。

現時点では、各デバイスのローカル時刻を信頼する形で実装を進める予定です。
デバイスの時刻同期はユーザーの責任とします。
デバイスの時刻が合っていないために古いデータで上書きされてしまうリスクはありますが、最終的にはユーザーが手動で修正することを想定しています。
同期はあくまでユーザーの所有するデバイス同士で行われるものに限定され、最低限「同期と同期の間に複数デバイスで行われた同時編集による競合」のみに影響を留めるように設計しており、大きな問題にはならないと考えています。

同期はリアルタイムで行われるわけではないため、同じユーザーが別のデバイスで同時に操作を行うと、タイムスタンプが正確だとしてもデータの不整合が発生する可能性があります。
つまりデータの変更操作は現在のデータの状態に依存して行われるため、あるデバイスで一連の変更操作を行った最終結果と、別のデバイスで同時に行われた変更操作の結果が、例えタイムスタンプが正しかったとして全てが最新のデータになったとしても、最終的なデータ状態が意図しないものになる可能性があります（蓋然性は低）。
この点もユーザーの責任とし、ユーザーが手動で修正することを想定しています。
アプリとしては複数デバイスでの同時操作はサポートせず、避けるように注意喚起を行う予定です。

現実的には Google Drive の保存場所を複数ユーザーで共有される場所に設定することで、複数ユーザーで同じデータを共有することも可能ですが、そういった使い方はサポート対象外とします。

## その他の懸念事項

sync_states テーブルには物理削除されたレコードも残るため、将来的に Soft Delete でなく物理削除を取り入れたとしても、肥大化する可能性があります。

途中で OS の時刻同期が行われてローカルデバイスの時刻が変更されると、ローカルでの変更順序が入れ替わる可能性があります。

## 設計案の変遷

### 全変更履歴を記録

最初は過去の変更履歴を全て保存する Event Sourcing 的な設計を検討しました（ただし保存するのはドメインイベントではなく DB テーブルの変更履歴）。
しかし肥大化の問題があり、明らかにやりたいことに対して過剰な設計であると判断しました。

### 最新状態のみを保持

肥大化の問題や実装の複雑化を避けるために、sync_states テーブルに最新状態のみを保持する設計に変更しました。

しかし sync_states に最終状態（全データ内容）を持たせるだけだと、同期と同期の間にデバイスAであるフィールドを変更し、デバイスBで別のフィールドを変更した場合に、新しい方の全内容だけが採用されてどちらかの変更が失われてしまう問題があります。

デバイスAの変更:
```json
{
    "parent_group_id": null,
    "name": "valueA1",   // 変更されたフィールド
    "display_order": 1,
    "group_type": "folder",
    "updated_at": "2024-06-01T12:00:00Z",
    "deleted_at": null
}
```

デバイスBの変更:
```json
{
    "parent_group_id": null,
    "name": "value",
    "display_order": 2,  // 変更されたフィールド
    "group_type": "folder",
    "updated_at": "2024-06-01T12:10:00Z",
    "deleted_at": null
}
```

上記例では後で更新されたデバイスBの内容が sync_states に保存され、デバイスAの name フィールドの変更が失われてしまいます。

そのため同期してから次の同期までの途中変化を変化パッチとして記録する sync_pending_changes テーブルを追加しました。

### 最終同期状態と途中変更履歴を合わせて最新状態を再構築可能に

同期後のローカルでの Command テーブルの変更では、sync_states テーブルの内容は更新する必要がないと考えました。
つまり sync_states テーブルには最終同期状態を保持し、sync_pending_changes テーブルに途中変更履歴を保存し、sync_states に sync_pending_changes の内容を適用することで最新状態を再構築できる形にします。

この形にすることで SQLite3 のトリガーを利用して自動的に変更内容を記録する仕組みを実装しやすくなります。
テーブルに自動的に変更内容を保存するトリガーを各テーブルに設定する形にすれば、アプリ側は通常のDB操作のみを行えばよく、同期用の履歴保存処理を意識する必要がなくなります。

このトリガーを利用した方法では変化差分だけを保存することができません。
しかし sync_states テーブルが最終同期状態を保持ししているので、sync_pending_changes テーブルの new_content と最終同期状態からの差分をアプリ側が同期処理時に算出できます。
