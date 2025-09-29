import { audioInfoCacheStore } from '$lib/application/stores/audioInfoCacheStore.svelte';
import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';
import { playerStore } from '../stores/playerStore.svelte';

async function openAudio(path: string): Promise<void> {
  await audioRepository.open(path);
}

async function analyzeAudio(path: string): Promise<AudioInfo> {
  const cachedAudioInfo = audioInfoCacheStore.get(path);
  if (cachedAudioInfo) {
    return cachedAudioInfo;
  }
  const audioInfo = await audioRepository.analyze(path);
  audioInfoCacheStore.set(path, audioInfo);
  return audioInfo;
}

async function playAudio(): Promise<void> {
  await audioRepository.play();
  playerStore.play();
}

async function stopAudio(): Promise<void> {
  await audioRepository.stop();
  playerStore.stop();
}

async function pauseAudio(): Promise<void> {
  await audioRepository.pause();
  playerStore.pause();
}

async function resumeAudio(): Promise<void> {
  await audioRepository.resume();
  playerStore.resume();
}

async function seekAudio(positionMs: number): Promise<void> {
  await audioRepository.seek(positionMs);
}

async function listenPlaybackPosition(): Promise<() => void> {
  const unlisten = await audioRepository.listenPlaybackPosition((positionMs) => {
    playerStore.currentTime = positionMs;
  });
  return () => {
    stopAudio();
    audioInfoCacheStore.clear();
    unlisten();
  };
}

export const audioController = {
  open: openAudio,
  analyze: analyzeAudio,
  play: playAudio,
  stop: stopAudio,
  pause: pauseAudio,
  resume: resumeAudio,
  seek: seekAudio,
  listenPlaybackPosition: listenPlaybackPosition,
};
