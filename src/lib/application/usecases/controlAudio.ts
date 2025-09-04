import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

export async function openAudio(path: string): Promise<AudioInfo> {
  const audioInfo = await audioRepository.open(path);
  return audioInfo;
}

export async function playAudio(): Promise<void> {
  await audioRepository.play();
}

export async function stopAudio(): Promise<void> {
  await audioRepository.stop();
}

export async function pauseAudio(): Promise<void> {
  await audioRepository.pause();
}

export async function resumeAudio(): Promise<void> {
  await audioRepository.resume();
}

export async function seekAudio(positionMs: number): Promise<void> {
  await audioRepository.seek(positionMs);
}
