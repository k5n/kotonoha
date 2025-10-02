import { audioInfoCacheStore } from '$lib/application/stores/audioInfoCacheStore.svelte';
import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
import type { MediaPlayer } from '$lib/application/usecases/mediaPlayer/mediaPlayer';
import type { AudioInfo } from '$lib/domain/entities/audioInfo';
import { audioRepository } from '$lib/infrastructure/repositories/audioRepository';

export async function analyzeAudio(path: string): Promise<AudioInfo> {
  const cachedAudioInfo = audioInfoCacheStore.get(path);
  if (cachedAudioInfo) {
    return cachedAudioInfo;
  }
  const audioInfo = await audioRepository.analyze(path);
  audioInfoCacheStore.set(path, audioInfo);
  return audioInfo;
}

export class AudioPlayer implements MediaPlayer {
  get currentTime(): number {
    return mediaPlayerStore.currentTime;
  }

  get isPlaying(): boolean {
    return mediaPlayerStore.isPlaying;
  }

  get hasStarted(): boolean {
    return mediaPlayerStore.hasStarted;
  }

  get isReady(): boolean {
    return mediaPlayerStore.isReady;
  }

  async open(path: string): Promise<void> {
    await audioRepository.open(path);
    mediaPlayerStore.isReady = true;
  }

  async play(): Promise<void> {
    await audioRepository.play();
    mediaPlayerStore.play();
  }

  async pause(): Promise<void> {
    await audioRepository.pause();
    mediaPlayerStore.pause();
  }

  async resume(): Promise<void> {
    await audioRepository.resume();
    mediaPlayerStore.resume();
  }

  async stop(): Promise<void> {
    await audioRepository.stop();
    mediaPlayerStore.stop();
  }

  async seek(positionMs: number): Promise<void> {
    await audioRepository.seek(positionMs);
  }

  async listen(): Promise<() => void> {
    const unlisten = await audioRepository.listenPlaybackPosition((positionMs) => {
      mediaPlayerStore.currentTime = positionMs;
    });
    return () => {
      this.stop();
      audioInfoCacheStore.clear();
      unlisten();
      mediaPlayerStore.isReady = false;
    };
  }
}
