import { invoke } from '@tauri-apps/api/core';
import { BaseDirectory, exists, remove } from '@tauri-apps/plugin-fs';
import { getMediaDir } from '../config';

export const fileRepository = {
  /**
   * 絶対パスで指定されたテキストファイルの内容を読み出します。
   * @param absolutePath ファイルの絶対パス
   * @returns ファイル内容（文字列）
   */
  async readTextFileByAbsolutePath(absolutePath: string): Promise<string> {
    return await invoke<string>('read_text_file', { path: absolutePath });
  },

  /**
   * 指定されたUUIDのディレクトリが `media/` 以下に存在するかどうかを確認します。
   * @param uuid 確認するUUID
   * @returns ディレクトリが存在すればtrue、しなければfalse
   */
  async uuidFileExists(uuid: string): Promise<boolean> {
    const dirPath = `${getMediaDir()}/${uuid}`;
    return await exists(dirPath, { baseDir: BaseDirectory.AppLocalData });
  },

  async saveAudioFile(absoluteFilePath: string, uuid: string, filename: string): Promise<string> {
    const dir = `${getMediaDir()}/${uuid}`;
    const appLocalDataRelativePath = `${dir}/${filename}`;
    await invoke('copy_audio_file', { src: absoluteFilePath, dest: appLocalDataRelativePath });
    return appLocalDataRelativePath;
  },

  /**
   * 指定されたUUIDに関連するエピソードのディレクトリ全体を削除します。
   * @param uuid 削除するエピソードのUUID
   */
  async deleteEpisodeData(uuid: string): Promise<void> {
    const dirPath = `${getMediaDir()}/${uuid}`;
    if (await this.uuidFileExists(uuid)) {
      await remove(dirPath, { baseDir: BaseDirectory.AppLocalData, recursive: true });
    }
  },

  async fileExists(relativePath: string): Promise<boolean> {
    return await exists(relativePath, { baseDir: BaseDirectory.AppLocalData });
  },
};
