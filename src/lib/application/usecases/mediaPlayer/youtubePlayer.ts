// cSpell:words playsinline disablekb modestbranding
import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
import type { MediaPlayer } from '$lib/application/usecases/mediaPlayer/mediaPlayer';
import { extractYoutubeVideoId } from '$lib/domain/services/youtubeUrlValidator';

export const PLAYER_DIV_ID = 'youtube-player-div';

export class YoutubePlayer implements MediaPlayer {
  private videoId: string | null = null;
  private player: YT.Player | undefined;
  private timeUpdater: ReturnType<typeof setInterval> | undefined;

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
    this.videoId = extractYoutubeVideoId(path);
  }

  async play(): Promise<void> {
    this.player?.playVideo();
  }

  async pause(): Promise<void> {
    this.player?.pauseVideo();
  }

  async resume(): Promise<void> {
    this.player?.playVideo();
  }

  async stop(): Promise<void> {
    this.player?.stopVideo();
    mediaPlayerStore.stop();
    this.stopCurrentTimeUpdater();
  }

  async seek(positionMs: number): Promise<void> {
    this.player?.seekTo(positionMs / 1000, true); // Convert ms to s
    if (!mediaPlayerStore.isPlaying) {
      mediaPlayerStore.currentTime = positionMs;
    }
  }

  async listen(): Promise<() => void> {
    if (!this.videoId) {
      console.error('No video ID provided to create YouTube player.');
      return () => {};
    }

    this.player = new YT.Player(PLAYER_DIV_ID, {
      height: '100%',
      width: '100%',
      videoId: this.videoId,
      playerVars: {
        playsinline: 1,
        cc_load_policy: 1,
        disablekb: 1,
        iv_load_policy: 3,
        rel: 0,
      },
      events: {
        onReady: () => {
          mediaPlayerStore.isReady = true;
          console.info('YouTube Player is ready.');
        },
        onStateChange: (event) => this.onPlayerStateChange(event),
      },
    });

    return () => {
      this.stopCurrentTimeUpdater();
      this.player?.destroy();
      this.player = undefined;
      mediaPlayerStore.isReady = false;
    };
  }

  private onPlayerStateChange(event: YT.OnStateChangeEvent) {
    switch (event.data) {
      case YT.PlayerState.PLAYING:
        mediaPlayerStore.play();
        this.startCurrentTimeUpdater();
        break;
      case YT.PlayerState.PAUSED:
        mediaPlayerStore.pause();
        this.stopCurrentTimeUpdater();
        break;
      case YT.PlayerState.ENDED:
        mediaPlayerStore.stop();
        this.stopCurrentTimeUpdater();
        break;
    }
  }

  private startCurrentTimeUpdater() {
    if (this.timeUpdater) return;
    this.timeUpdater = setInterval(() => {
      if (this.player) {
        mediaPlayerStore.currentTime = this.player.getCurrentTime() * 1000; // Convert to ms
      }
    }, 250);
  }

  private stopCurrentTimeUpdater() {
    clearInterval(this.timeUpdater);
    this.timeUpdater = undefined;
  }
}
