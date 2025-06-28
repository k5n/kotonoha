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
import { trace } from '@tauri-apps/plugin-log';

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
  async saveAudioFile(file: File, filename: string): Promise<string> {
    const dir = 'media/audios';
    await ensureDirExists(dir, BaseDirectory.AppLocalData);
    const buffer = new Uint8Array(await file.arrayBuffer());
    const path = `${dir}/${filename}`;
    await writeFile(path, buffer, { baseDir: BaseDirectory.AppLocalData });
    return path;
  },

  async saveScriptFile(file: File, filename: string): Promise<string> {
    const dir = 'media/scripts';
    await ensureDirExists(dir, BaseDirectory.AppLocalData);
    const text = await file.text();
    const path = `${dir}/${filename}`;
    await writeTextFile(path, text, { baseDir: BaseDirectory.AppLocalData });
    return path;
  },

  async readAudioFile(relativePath: string): Promise<Uint8Array> {
    return await readFile(relativePath, { baseDir: BaseDirectory.AppLocalData });
  },

  async readScriptFile(relativePath: string): Promise<string> {
    return await readTextFile(relativePath, { baseDir: BaseDirectory.AppLocalData });
  },

  async deleteFile(relativePath: string): Promise<void> {
    await remove(relativePath, { baseDir: BaseDirectory.AppLocalData });
  },

  async fileExists(relativePath: string): Promise<boolean> {
    return await exists(relativePath, { baseDir: BaseDirectory.AppLocalData });
  },
};
