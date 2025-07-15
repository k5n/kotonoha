import {
  BaseDirectory,
  exists,
  mkdir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { trace, warn } from '@tauri-apps/plugin-log';
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

function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'm4a':
      return 'audio/mp4';
    default:
      warn(`Unknown audio file extension: ${extension}. Falling back to application/octet-stream.`);
      // 不明な拡張子の場合は、ブラウザにMIMEタイプを推測させる
      return 'application/octet-stream';
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

  async getAudioBlobUrl(relativePath: string): Promise<string> {
    if (!(await this.fileExists(relativePath))) {
      warn(`Audio file not found at: ${relativePath}`);
      return '';
    }
    const audioData = await readFile(relativePath, { baseDir: BaseDirectory.AppLocalData });
    const mimeType = getMimeType(relativePath);
    const blob = new Blob([audioData], { type: mimeType });
    return URL.createObjectURL(blob);
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
