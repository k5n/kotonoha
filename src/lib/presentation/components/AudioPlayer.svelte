<script lang="ts">
  // --- Props ---
  type Props = {
    peaks: number[]; // 波形データの配列 (0.0 - 1.0)
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (_time: number) => void;
    onResume: () => void;
    onStop: () => void;
  };

  let {
    peaks,
    isPlaying,
    currentTime,
    duration,
    onPlay,
    onPause,
    onSeek,
    onResume,
    onStop,
  }: Props = $props();

  // --- Internal Constants ---
  const WAVE_COLOR = '#E2E8F0'; // gray-300
  const PROGRESS_COLOR = '#63B3ED'; // blue-400
  const BAR_WIDTH = 2;
  const BAR_GAP = 1;

  // --- Internal State ---
  let canvasWidth = $state(0);
  let canvasHeight = $state(0);
  let containerElement: HTMLDivElement;
  let canvasElement: HTMLCanvasElement;

  // --- Responsive Sizing ---
  $effect(() => {
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasWidth = entry.contentRect.width;
        canvasHeight = entry.contentRect.height;
      }
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  });

  // --- Drawing Logic ---
  $effect(() => {
    if (!canvasElement || canvasWidth === 0) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const progressRatio = currentTime / duration;
    const barsToDraw = Math.floor(canvasWidth / (BAR_WIDTH + BAR_GAP));
    const progressIndex = Math.floor(progressRatio * barsToDraw);

    for (let i = 0; i < barsToDraw; i++) {
      // Use a peak from the dummy data, wrapping around if needed
      const peak = peaks[i % peaks.length];
      const barHeight = peak * canvasHeight;
      const x = i * (BAR_WIDTH + BAR_GAP);
      const y = (canvasHeight - barHeight) / 2;

      ctx.fillStyle = i < progressIndex ? PROGRESS_COLOR : WAVE_COLOR;
      ctx.fillRect(x, y, BAR_WIDTH, barHeight);
    }
  });

  // --- Seeking Logic ---
  function handleCanvasClick(event: MouseEvent) {
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const newTime = (x / canvasWidth) * duration;
    onSeek(newTime);
  }

  // Helper function to format time in MM:SS
  function formatTime(milliseconds: number | null): string {
    if (milliseconds === null || isNaN(milliseconds) || milliseconds < 0) {
      return '00:00';
    }
    const min = Math.floor(milliseconds / 60000);
    const sec = Math.floor((milliseconds % 60000) / 1000);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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

  <!-- Wrapper div for responsive sizing -->
  <div bind:this={containerElement} style="width: 100%; height: 80px;">
    <canvas
      width={canvasWidth}
      height={canvasHeight}
      bind:this={canvasElement}
      onclick={handleCanvasClick}
      style="cursor: pointer;"
    ></canvas>
  </div>
</div>
