/**
 * Fileオブジェクトから音声ファイルの再生時間を取得します。
 * @param file 音声ファイルを表すFileオブジェクト
 * @returns Promise<number> 再生時間（秒）
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener('error', (e) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load audio file: ${e.message}`));
    });

    audio.src = url;
  });
}
