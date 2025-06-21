<script lang="ts">
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import { Button } from 'flowbite-svelte';
  import { SunOutline } from 'flowbite-svelte-icons';

  // --- Props ---
  interface Props {
    dialogues: readonly Dialogue[];
    currentTime: number; // 秒単位
    onSeek: (time: number) => void;
    onMine: (dialogue: Dialogue) => void;
  }
  let { dialogues, currentTime, onSeek, onMine }: Props = $props();

  // --- State ---
  let activeIndex = $derived(
    dialogues.findIndex(
      (d) => currentTime * 1000 >= d.startTimeMs && currentTime * 1000 < d.endTimeMs
    )
  );

  let containerEl: HTMLElement | undefined = $state();
  let itemEls: (HTMLElement | null)[] = [];

  // activeIndexが変更されたら、該当要素までスクロールする$effect
  $effect(() => {
    if (activeIndex !== -1 && containerEl && itemEls[activeIndex]) {
      const containerHeight = containerEl.clientHeight;
      const targetEl = itemEls[activeIndex] as HTMLElement;
      const targetOffsetTop = targetEl.offsetTop;
      const targetHeight = targetEl.clientHeight;

      // 要素がコンテナの中央に来るようにスクロール位置を計算
      const newScrollTop = targetOffsetTop - containerHeight / 2 + targetHeight / 2;

      // tweenedストアを使わず、直接scrollTopを設定する。
      // scroll-smoothクラスが指定されているため、ブラウザが滑らかにスクロールさせる。
      containerEl.scrollTop = newScrollTop;
    }
  });
</script>

<div
  bind:this={containerEl}
  class="h-[400px] space-y-1 overflow-y-auto scroll-smooth rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
>
  {#if dialogues.length > 0}
    <div class="h-[calc(50%-1.25rem)]"></div>
    {#each dialogues as dialogue, index (dialogue.id)}
      <div
        class="relative rounded-lg p-3 transition-all"
        class:bg-primary-100={index === activeIndex}
        class:dark:bg-primary-900={index === activeIndex}
      >
        <div
          role="button"
          tabindex="0"
          class="cursor-pointer"
          class:text-primary-800={index === activeIndex}
          class:dark:text-primary-200={index === activeIndex}
          onclick={() => onSeek(dialogue.startTimeMs / 1000)}
          onkeydown={(e) => e.key === 'Enter' && onSeek(dialogue.startTimeMs / 1000)}
        >
          {dialogue.correctedText || dialogue.originalText}
        </div>

        {#if index === activeIndex}
          <div class="absolute top-1/2 right-2 -translate-y-1/2">
            <Button size="xs" onclick={() => onMine(dialogue)}>
              <SunOutline class="me-1 h-4 w-4" />
              Mine
            </Button>
          </div>
        {/if}
      </div>
    {/each}
    <div class="h-[calc(50%-1.25rem)]"></div>
  {:else}
    <p class="text-center text-gray-500">スクリプトがありません。</p>
  {/if}
</div>
