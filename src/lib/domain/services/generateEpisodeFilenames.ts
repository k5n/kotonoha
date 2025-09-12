import { v4 as uuidV4 } from 'uuid';

/**
 * パスからファイル名部分のみを抽出する（Node.jsのbasenameの代替）
 * @param path ファイルパスまたはファイル名
 * @returns ファイル名
 */
function basename(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : path;
}

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
 * 音声ファイル・字幕ファイルのファイルパスまたはファイル名を受け取り、
 * UUID v4 を生成し、拡張子を付与した新しいファイル名を返します。
 *
 * @param audioPathOrName 元の音声ファイルパスまたはファイル名
 * @param scriptPathOrName 元の字幕ファイルパスまたはファイル名
 * @returns 新しいファイル名とUUID
 */
export function generateEpisodeFilenames(
  audioPathOrName: string,
  scriptPathOrName: string
): { readonly audio: string; readonly script: string; readonly uuid: string } {
  const uuid = uuidV4();
  const audioFilename = basename(audioPathOrName);
  const scriptFilename = basename(scriptPathOrName);
  const audioExt = getExtension(audioFilename);
  const scriptExt = getExtension(scriptFilename);
  return {
    audio: 'full' + audioExt,
    script: 'script' + scriptExt,
    uuid,
  };
}
