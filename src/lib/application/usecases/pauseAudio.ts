import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

/**
 * オーディオを一時停止するユースケース
 */
export async function pauseAudio(): Promise<void> {
  await audioRepository.pause();
}
