import { v4 as uuidV4 } from 'uuid';

/**
 * ファイル名から拡張子を抽出します。
 * @param filename ファイル名
 * @returns 拡張子（例: ".mp3"）、拡張子がなければ空文字列
 */
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx !== -1 ? filename.slice(idx) : '';
}

/**
 * 音声ファイル・字幕ファイルのファイル名を受け取り、
 * UUID v4 を生成し、拡張子を付与した新しいファイル名を返します。
 *
 * @param audioFilename 元の音声ファイル名
 * @param scriptFilename 元の字幕ファイル名
 * @returns 新しいファイル名とUUID
 */
export function generateEpisodeFilenames(
  audioFilename: string,
  scriptFilename: string
): { audio: string; script: string; uuid: string } {
  const uuid = uuidV4();
  const audioExt = getExtension(audioFilename);
  const scriptExt = getExtension(scriptFilename);
  return {
    audio: 'full' + audioExt,
    script: 'script' + scriptExt,
    uuid,
  };
}
