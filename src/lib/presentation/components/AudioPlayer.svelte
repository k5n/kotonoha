<script lang="ts">
  // --- Props ---
  type Props = {
    peaks: number[]; // 波形データの配列 (0.0 - 1.0)
    currentTime: number;
    duration: number;
    onPlay: () => void;
    onPause: () => void;
    onSeek: (_time: number) => void;
    onResume: () => void;
    onStop: () => void;
    initialIsPlaying?: boolean; // 初期再生状態（オプション）
  };

  let { peaks, currentTime, duration, onPlay, onPause, onSeek, onResume, onStop }: Props = $props();

  // --- Internal State ---
  let isPlaying = $state(false);
  let canvasWidth = $state(0);
  let canvasHeight = $state(0);
  let containerElement: HTMLDivElement;
  let canvasElement: HTMLCanvasElement;

  // --- Internal Constants ---
  const WAVE_COLOR = '#E2E8F0'; // gray-300
  const PROGRESS_COLOR = '#63B3ED'; // blue-400
  const BAR_WIDTH = 2;
  const BAR_GAP = 1;

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

  // --- Audio Control Handlers ---
  function handlePlayPause() {
    if (isPlaying) {
      onPause();
      isPlaying = false;
    } else {
      if (currentTime > 0) {
        onResume();
      } else {
        onPlay();
      }
      isPlaying = true;
    }
  }

  function handleStop() {
    onStop();
    isPlaying = false;
  }

  // --- Seeking Logic ---
  function handleCanvasClick(event: MouseEvent) {
    if (!canvasElement) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const newTime = (x / canvasWidth) * duration;

    onSeek(newTime);
    isPlaying = true;
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

<div class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
  <!-- Controls Section -->
  <div class="flex items-center gap-3">
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-all duration-200 hover:bg-blue-600 hover:shadow-md active:scale-95 sm:h-10 sm:w-10"
      onclick={handlePlayPause}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {#if isPlaying}
        <!-- Pause Icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="sm:h-5 sm:w-5">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      {:else}
        <!-- Play Icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="sm:h-5 sm:w-5">
          <path d="M8 5v14l11-7z" />
        </svg>
      {/if}
    </button>

    <button
      class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-500 text-white shadow-sm transition-all duration-200 hover:bg-slate-600 hover:shadow-md active:scale-95 sm:h-8 sm:w-8"
      onclick={handleStop}
      aria-label="Stop"
    >
      <!-- Stop Icon -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="sm:h-4 sm:w-4">
        <path d="M6 6h12v12H6z" />
      </svg>
    </button>

    <span class="ml-auto font-mono text-sm font-medium text-slate-600 sm:text-xs">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  </div>

  <!-- Waveform Section -->
  <div
    bind:this={containerElement}
    class="h-20 w-full overflow-hidden rounded-md border border-slate-200 bg-white sm:h-15"
  >
    <canvas
      width={canvasWidth}
      height={canvasHeight}
      bind:this={canvasElement}
      onclick={handleCanvasClick}
      class="block h-full w-full cursor-pointer hover:opacity-90"
    ></canvas>
  </div>
</div>
