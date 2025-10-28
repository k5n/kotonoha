#!/bin/bash
# E2Eテストデータのクリーンアップスクリプト
# テスト実行前にE2E環境用のデータを削除してクリーンな状態にします

set -e

# アプリのローカルデータディレクトリを取得
# Linux: ~/.local/share/com.k5-n.kotonoha.mining
APP_DATA_DIR="$HOME/.local/share/com.k5-n.kotonoha.mining"

echo "Cleaning up E2E test data..."

# E2E用のデータベースファイルを削除
if [ -f "$APP_DATA_DIR/e2e_app.db" ]; then
  echo "Removing e2e_app.db..."
  rm "$APP_DATA_DIR/e2e_app.db"
fi

if [ -f "$APP_DATA_DIR/e2e_app.db-shm" ]; then
  rm "$APP_DATA_DIR/e2e_app.db-shm"
fi

if [ -f "$APP_DATA_DIR/e2e_app.db-wal" ]; then
  rm "$APP_DATA_DIR/e2e_app.db-wal"
fi

# E2E用のメディアフォルダを削除
if [ -d "$APP_DATA_DIR/e2e_media" ]; then
  echo "Removing e2e_media directory..."
  rm -rf "$APP_DATA_DIR/e2e_media"
fi

# E2E用の設定ファイルを削除
if [ -f "$APP_DATA_DIR/e2e_settings.json" ]; then
  echo "Removing e2e_settings.json..."
  rm "$APP_DATA_DIR/e2e_settings.json"
fi

# E2E用のモデルフォルダを削除
if [ -d "$APP_DATA_DIR/e2e_models" ]; then
  echo "Removing e2e_models directory..."
  rm -rf "$APP_DATA_DIR/e2e_models"
fi

echo "E2E test data cleanup completed."
