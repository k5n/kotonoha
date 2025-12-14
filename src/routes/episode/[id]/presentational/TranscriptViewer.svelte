<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { SubtitleLine } from '$lib/domain/entities/subtitleLine';
  import { Button, Textarea } from 'flowbite-svelte';
  import {
    CheckOutline,
    CloseOutline,
    RedoOutline,
    SunOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';

  // --- Constants ---
  const SCROLL_DEBOUNCE_MS = 100; // スクロール処理のデバウンス時間
  const SMOOTH_SCROLL_DURATION_MS = 300; // スムーススクロールアニメーションの推定時間

  // --- Props ---
  interface Props {
    subtitleLines: readonly SubtitleLine[];
    currentTime: number; // ミリ秒単位
    canMine: boolean; // マイニング可能かどうか
    onSeek: (_time: number) => void;
    onMine: (_subtitleLine: SubtitleLine, _context: readonly SubtitleLine[]) => void;
    onSave: (details: { subtitleLineId: number; correctedText: string }) => void;
    onDelete: (_subtitleLineId: number) => void;
    onUndoDelete: (_subtitleLineId: number) => void;
    contextBefore?: number; // 前の件数
    contextAfter?: number; // 後ろの件数
  }
  let {
    subtitleLines,
    currentTime,
    canMine,
    onSeek,
    onMine,
    onSave,
    onDelete,
    onUndoDelete,
    contextBefore = 2,
    contextAfter = 2,
  }: Props = $props();

  // --- State ---
  let activeIndex = $state(-1);
  let previousActiveIndex = $state(-1);
  let isScrolling = $state(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined = $state();
  let editingSubtitleLineId: number | null = $state(null);
  let editText = $state('');
  let editingOriginalText = $state('');

  let containerEl: HTMLElement | undefined = $state();
  let itemEls: (HTMLElement | null)[] = $state([]);

  // currentTimeが変更されたら、activeIndexとpreviousActiveIndexを更新し、該当要素までスクロールする$effect
  $effect(() => {
    //編集中は自動スクロールを無効
    if (editingSubtitleLineId !== null) return;

    const newActiveIndex = subtitleLines.findIndex((d, i) => {
      if (d.endTimeMs !== null) {
        return currentTime >= d.startTimeMs && currentTime < d.endTimeMs;
      }

      const nextSubtitleLine = subtitleLines[i + 1];
      if (nextSubtitleLine) {
        return currentTime >= d.startTimeMs && currentTime < nextSubtitleLine.startTimeMs;
      } else {
        return currentTime >= d.startTimeMs;
      }
    });

    // activeIndexが実際に変更された場合のみ処理を実行
    if (newActiveIndex !== activeIndex) {
      if (newActiveIndex === -1) {
        previousActiveIndex = activeIndex;
      } else {
        previousActiveIndex = -1;
      }
      activeIndex = newActiveIndex;

      // スクロール処理をデバウンス（連続した変更を抑制）
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        if (activeIndex !== -1 && itemEls[activeIndex] && !isScrolling) {
          isScrolling = true;
          itemEls[activeIndex]?.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          });

          // スクロールアニメーション完了を待つ
          setTimeout(() => {
            isScrolling = false;
          }, SMOOTH_SCROLL_DURATION_MS);
        }
        scrollTimeout = undefined;
      }, SCROLL_DEBOUNCE_MS);
    }
  });

  function getContext(index: number): readonly SubtitleLine[] {
    const start = Math.max(0, index - contextBefore);
    const end = Math.min(subtitleLines.length, index + contextAfter + 1);
    return subtitleLines.slice(start, end);
  }

  function handleDblClick(subtitleLine: SubtitleLine) {
    if (subtitleLine.deletedAt) return;
    editingSubtitleLineId = subtitleLine.id;
    editText = subtitleLine.correctedText || subtitleLine.originalText;
    editingOriginalText = subtitleLine.originalText;
  }

  function handleSave() {
    if (editingSubtitleLineId === null) return;

    const subtitleLine = subtitleLines.find((d) => d.id === editingSubtitleLineId);
    if (!subtitleLine) return;

    onSave({
      subtitleLineId: subtitleLine.id,
      correctedText: editText,
    });

    editingSubtitleLineId = null;
  }

  function handleCancel() {
    editingSubtitleLineId = null;
  }

  function handleDelete() {
    if (editingSubtitleLineId === null) return;
    onDelete(editingSubtitleLineId);
    editingSubtitleLineId = null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSave();
    }
  }
</script>

<div
  data-testid="transcript-viewer"
  bind:this={containerEl}
  class="h-[50vh] space-y-1 overflow-y-auto scroll-smooth rounded-lg border bg-gray-50 p-4 lg:h-full dark:border-gray-700 dark:bg-gray-800"
>
  {#if subtitleLines.length > 0}
    <!--
      上下の余白（50% - 1.25rem）は、アクティブな項目が中央に来るように調整するためのものです。
      1.25rem は、p-3（0.75rem）と rounded-lg の境界付近の余白を考慮したおおよその値です。
    -->
    <div class="h-[calc(50%-1.25rem)]"></div>
    {#each subtitleLines as subtitleLine, index (subtitleLine.id)}
      <div
        bind:this={itemEls[index]}
        class="flex items-center justify-between rounded-lg p-3 transition-all"
        class:bg-primary-100={index === activeIndex &&
          editingSubtitleLineId === null &&
          !subtitleLine.deletedAt}
        class:dark:bg-primary-900={index === activeIndex &&
          editingSubtitleLineId === null &&
          !subtitleLine.deletedAt}
        class:bg-gray-200={index === previousActiveIndex &&
          index !== activeIndex &&
          editingSubtitleLineId === null &&
          !subtitleLine.deletedAt}
        class:dark:bg-gray-700={index === previousActiveIndex &&
          index !== activeIndex &&
          editingSubtitleLineId === null &&
          !subtitleLine.deletedAt}
        class:ring-2={editingSubtitleLineId === subtitleLine.id}
        class:ring-primary-500={editingSubtitleLineId === subtitleLine.id}
        class:bg-red-100={!!subtitleLine.deletedAt}
        class:dark:bg-red-900={!!subtitleLine.deletedAt}
        class:dark:bg-opacity-50={!!subtitleLine.deletedAt}
      >
        {#if editingSubtitleLineId === subtitleLine.id}
          <div class="flex w-full flex-col space-y-2">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <strong class="font-semibold">{t('components.transcriptViewer.original')}:</strong>
              {editingOriginalText}
            </div>
            <Textarea
              bind:value={editText}
              onkeydown={handleKeyDown}
              rows={3}
              autofocus
              class="w-full"
            />
            <div class="flex items-center justify-between">
              <Button size="xs" color="red" onclick={handleDelete}>
                <TrashBinOutline class="me-1 h-4 w-4" />
                {t('common.delete')}
              </Button>
              <div class="flex space-x-2">
                <Button size="xs" color="alternative" onclick={handleCancel}>
                  <CloseOutline class="me-1 h-4 w-4" />
                  {t('common.cancel')}
                </Button>
                <Button size="xs" onclick={handleSave}>
                  <CheckOutline class="me-1 h-4 w-4" />
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </div>
        {:else}
          <div
            role="button"
            tabindex="0"
            class="flex-1"
            class:cursor-pointer={!subtitleLine.deletedAt}
            class:text-primary-800={index === activeIndex && !subtitleLine.deletedAt}
            class:dark:text-primary-200={index === activeIndex && !subtitleLine.deletedAt}
            class:line-through={!!subtitleLine.deletedAt}
            class:text-gray-500={!!subtitleLine.deletedAt}
            onclick={() => !subtitleLine.deletedAt && onSeek(subtitleLine.startTimeMs)}
            ondblclick={() => handleDblClick(subtitleLine)}
            onkeydown={(e) =>
              e.key === 'Enter' && !subtitleLine.deletedAt && onSeek(subtitleLine.startTimeMs)}
          >
            {subtitleLine.correctedText || subtitleLine.originalText}
          </div>

          <div class="w-24 text-right">
            {#if subtitleLine.deletedAt}
              <Button size="xs" color="alternative" onclick={() => onUndoDelete(subtitleLine.id)}>
                <RedoOutline class="me-1 h-4 w-4" />
                {t('common.undo')}
              </Button>
            {:else if canMine && index === activeIndex}
              <Button size="xs" onclick={() => onMine(subtitleLine, getContext(index))}>
                <SunOutline class="me-1 h-4 w-4" />
                {t('components.transcriptViewer.mine')}
              </Button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
    <div class="h-[calc(50%-1.25rem)]"></div>
  {:else}
    <p class="text-center text-gray-500">{t('components.transcriptViewer.noScript')}</p>
  {/if}
</div>
