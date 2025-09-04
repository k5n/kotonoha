import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { trace } from '@tauri-apps/plugin-log';
import { getMediaDir } from '../config';

/**
 * 指定されたディレクトリが存在しなければ再帰的に作成
 */
async function ensureDirExists(dirPath: string, baseDir: BaseDirectory): Promise<void> {
  if (!(await exists(dirPath, { baseDir }))) {
    trace(`Directory does not exist, creating: ${dirPath}`);
    await mkdir(dirPath, { recursive: true, baseDir });
  }
}

export const fileRepository = {
  /**
   * 指定されたUUIDのディレクトリが `media/` 以下に存在するかどうかを確認します。
   * @param uuid 確認するUUID
   * @returns ディレクトリが存在すればtrue、しなければfalse
   */

  async uuidFileExists(uuid: string): Promise<boolean> {
    const dirPath = `${getMediaDir()}/${uuid}`;
    return await exists(dirPath, { baseDir: BaseDirectory.AppLocalData });
  },

  async saveAudioFile(file: File, uuid: string, filename: string): Promise<string> {
    const dir = `${getMediaDir()}/${uuid}/audios`;
    await ensureDirExists(dir, BaseDirectory.AppLocalData);
    const buffer = new Uint8Array(await file.arrayBuffer());
    const path = `${dir}/${filename}`;
    await writeFile(path, buffer, { baseDir: BaseDirectory.AppLocalData });
    return path;
  },

  async saveScriptFile(file: File, uuid: string, filename: string): Promise<string> {
    const dir = `${getMediaDir()}/${uuid}`;
    await ensureDirExists(dir, BaseDirectory.AppLocalData);
    const text = await file.text();
    const path = `${dir}/${filename}`;
    await writeTextFile(path, text, { baseDir: BaseDirectory.AppLocalData });
    return path;
  },

  async readScriptFile(relativePath: string): Promise<string> {
    return await readTextFile(relativePath, { baseDir: BaseDirectory.AppLocalData });
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
