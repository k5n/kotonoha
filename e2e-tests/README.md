# E2E Tests

WebdriverIO + Mocha による E2E テスト環境。

## 環境分離

E2E テスト実行時は、リリース版や開発版とは別の環境を使用します：

| 項目             | リリース版               | 開発版                   | E2E テスト               |
| ---------------- | ------------------------ | ------------------------ | ------------------------ |
| データベース     | `app.db`                 | `dev_app.db`             | `e2e_app.db`             |
| メディアフォルダ | `media/`                 | `dev_media/`             | `e2e_media/`             |
| モデルフォルダ   | `models/`                | `dev_models/`            | `e2e_models/`            |
| 設定ファイル     | `settings.json`          | `dev_settings.json`      | `e2e_settings.json`      |
| Stronghold       | `salt.txt`, `vault.hold` | `salt.txt`, `vault.hold` | `salt.txt`, `vault.hold` |

**注意**: API キーを保存する Stronghold 関連ファイルは全環境で共有されます。E2E テストで API キーが必要な場合は、事前に開発環境 (`npm run dev`) で設定画面からAPIキーを設定してください。

## テストの実行

### 前提条件

1. リリースビルドを作成しておく：

   ```bash
   cd ..
   docker compose up
   ```

2. AppImage のパスを `wdio.conf.ts` の `capabilities[0]['tauri:options'].application` に設定する

3. (オプション) API キーが必要なテストを行う場合は、開発環境で API キーを設定：
   ```bash
   cd ..
   npm run dev
   # 設定画面でAPIキーを入力
   ```

### テスト実行

```bash
# 通常のテスト実行（前回のデータが残っている場合があります）
npm test

# データをクリーンアップしてからテスト実行（推奨）
npm run test:clean
```

### データのクリーンアップ

テストデータのみを削除したい場合：

```bash
./cleanup-e2e-data.sh
```

このスクリプトは以下のファイル・ディレクトリを削除します：

- `~/.local/share/com.k5-n.kotonoha.mining/e2e_app.db`
- `~/.local/share/com.k5-n.kotonoha.mining/e2e_media/`
- `~/.local/share/com.k5-n.kotonoha.mining/e2e_models/`
- `~/.local/share/com.k5-n.kotonoha.mining/e2e_settings.json`

## トラブルシューティング

### テストが失敗する

1. リリースビルドが最新かどうか確認
2. E2E データをクリーンアップしてから再実行：`npm run test:clean`
3. `tauri-driver` が正しくインストールされているか確認：`which tauri-driver`

### API キー関連のテストが失敗する

開発環境で API キーを設定してください：

```bash
cd ..
npm run dev
# 設定画面でAPIキーを入力
```

Stronghold ファイルは全環境で共有されるため、開発環境で設定した API キーが E2E テストでも利用されます。
