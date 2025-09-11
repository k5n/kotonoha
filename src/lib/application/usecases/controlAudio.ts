import { audioInfoCacheStore } from '$lib/application/stores/audioInfoCacheStore.svelte';
import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

export async function openAudio(path: string): Promise<void> {
  await audioRepository.open(path);
}

export async function analyzeAudio(path: string): Promise<AudioInfo> {
  const cachedAudioInfo = audioInfoCacheStore.get(path);
  if (cachedAudioInfo) {
    return cachedAudioInfo;
  }
  const audioInfo = await audioRepository.analyze();
  audioInfoCacheStore.set(path, audioInfo);
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

export async function listenPlaybackPosition(
  callback: (positionMs: number) => void
): Promise<() => void> {
  const unlisten = await audioRepository.listenPlaybackPosition(callback);
  return () => {
    audioInfoCacheStore.clear();
    unlisten();
  };
}
