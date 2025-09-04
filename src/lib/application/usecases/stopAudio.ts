import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

/**
 * オーディオの再生を停止するユースケース
 */
export async function stopAudio(): Promise<void> {
  await audioRepository.stop();
}
