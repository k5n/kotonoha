<script lang="ts">
  // Props and Events
  type Props = {
    isPlaying: boolean;
    currentTime: number;
    duration: number | null;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (_time: number) => void;
    onResume: () => void;
    onStop: () => void;
  };
  let { isPlaying, currentTime, duration, onPlay, onPause, onSeek, onResume, onStop }: Props =
    $props();

  // 秒を MM:SS 形式にフォーマットするヘルパー関数
  function formatTime(seconds: number | null): string {
    if (seconds === null || isNaN(seconds) || seconds < 0) {
      return '00:00';
    }
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function handleSeek(event: Event) {
    const target = event.target as HTMLInputElement;
    onSeek(target.valueAsNumber);
  }
</script>

<div>
  {#if isPlaying}
    <button onclick={() => onPause()}>Pause</button>
  {:else}
    <button onclick={() => onPlay()}>Play</button>
  {/if}
  <button onclick={() => onResume()}>Resume</button>
  <button onclick={() => onStop()}>Stop</button>

  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>

  <input type="range" min="0" max={duration} value={currentTime} oninput={handleSeek} />
</div>
