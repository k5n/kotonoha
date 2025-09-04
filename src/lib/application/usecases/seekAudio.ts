import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

/**
 * オーディオの再生位置を変更するユースケース
 * @param positionMs - シーク先の時間（ミリ秒）。
 */
export async function seekAudio(positionMs: number): Promise<void> {
  await audioRepository.seek(positionMs);
}
