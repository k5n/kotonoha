<script lang="ts">
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import { Button } from 'flowbite-svelte';
  import { SunOutline } from 'flowbite-svelte-icons';

  // --- Props ---
  interface Props {
    dialogues: readonly Dialogue[];
    currentTime: number; // 秒単位
    onSeek: (time: number) => void;
    onMine: (dialogue: Dialogue, context: readonly Dialogue[]) => void;
    contextBefore?: number; // 前の件数
    contextAfter?: number; // 後ろの件数
  }
  let {
    dialogues,
    currentTime,
    onSeek,
    onMine,
    contextBefore = 2,
    contextAfter = 2,
  }: Props = $props();

  // --- State ---
  let activeIndex = $state(-1);
  let previousActiveIndex = $state(-1);

  let containerEl: HTMLElement | undefined = $state();
  let itemEls: (HTMLElement | null)[] = [];

  // currentTimeが変更されたら、activeIndexとpreviousActiveIndexを更新し、該当要素までスクロールする$effect
  $effect(() => {
    const newActiveIndex = dialogues.findIndex(
      (d) => currentTime * 1000 >= d.startTimeMs && currentTime * 1000 < d.endTimeMs
    );

    if (newActiveIndex !== activeIndex) {
      previousActiveIndex = activeIndex;
      activeIndex = newActiveIndex;
    }

    if (activeIndex !== -1 && itemEls[activeIndex]) {
      itemEls[activeIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });

  function getContext(index: number): readonly Dialogue[] {
    const start = Math.max(0, index - contextBefore);
    const end = Math.min(dialogues.length, index + contextAfter + 1);
    return dialogues.slice(start, end);
  }
</script>

<div
  bind:this={containerEl}
  class="h-[400px] space-y-1 overflow-y-auto scroll-smooth rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
>
  {#if dialogues.length > 0}
    <div class="h-[calc(50%-1.25rem)]"></div>
    {#each dialogues as dialogue, index (dialogue.id)}
      <div
        bind:this={itemEls[index]}
        class="flex items-center justify-between rounded-lg p-3 transition-all"
        class:bg-primary-100={index === activeIndex}
        class:dark:bg-primary-900={index === activeIndex}
        class:bg-gray-200={index === previousActiveIndex && index !== activeIndex}
        class:dark:bg-gray-700={index === previousActiveIndex && index !== activeIndex}
      >
        <div
          role="button"
          tabindex="0"
          class="flex-1 cursor-pointer"
          class:text-primary-800={index === activeIndex}
          class:dark:text-primary-200={index === activeIndex}
          onclick={() => onSeek(dialogue.startTimeMs / 1000)}
          onkeydown={(e) => e.key === 'Enter' && onSeek(dialogue.startTimeMs / 1000)}
        >
          {dialogue.correctedText || dialogue.originalText}
        </div>

        <div class="w-24 text-right">
          {#if index === activeIndex}
            <Button size="xs" onclick={() => onMine(dialogue, getContext(index))}>
              <SunOutline class="me-1 h-4 w-4" />
              Mine
            </Button>
          {/if}
        </div>
      </div>
    {/each}
    <div class="h-[calc(50%-1.25rem)]"></div>
  {:else}
    <p class="text-center text-gray-500">スクリプトがありません。</p>
  {/if}
</div>
