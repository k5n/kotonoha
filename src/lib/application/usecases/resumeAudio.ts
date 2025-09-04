import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

/**
 * オーディオの再生を再開するユースケース
 */
export async function resumeAudio(): Promise<void> {
  await audioRepository.resume();
}
