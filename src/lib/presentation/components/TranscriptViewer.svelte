<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import { Button, Textarea } from 'flowbite-svelte';
  import { SunOutline, CheckOutline, CloseOutline } from 'flowbite-svelte-icons';

  // --- Constants ---
  const SCROLL_DEBOUNCE_MS = 100; // スクロール処理のデバウンス時間
  const SMOOTH_SCROLL_DURATION_MS = 300; // スムーススクロールアニメーションの推定時間

  // --- Props ---
  interface Props {
    dialogues: readonly Dialogue[];
    currentTime: number; // ミリ秒単位
    canMine: boolean; // マイニング可能かどうか
    onSeek: (_time: number) => void;
    onMine: (_dialogue: Dialogue, _context: readonly Dialogue[]) => void;
    onSave: (details: { dialogueId: number; correctedText: string; originalText: string }) => void;
    contextBefore?: number; // 前の件数
    contextAfter?: number; // 後ろの件数
  }
  let {
    dialogues,
    currentTime,
    canMine,
    onSeek,
    onMine,
    onSave,
    contextBefore = 2,
    contextAfter = 2,
  }: Props = $props();

  // --- State ---
  let activeIndex = $state(-1);
  let previousActiveIndex = $state(-1);
  let isScrolling = $state(false);
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined = $state();
  let editingDialogueId: number | null = $state(null);
  let editText = $state('');
  let editingOriginalText = $state('');

  let containerEl: HTMLElement | undefined = $state();
  let itemEls: (HTMLElement | null)[] = [];

  // currentTimeが変更されたら、activeIndexとpreviousActiveIndexを更新し、該当要素までスクロールする$effect
  $effect(() => {
    //編集中は自動スクロールを無効
    if (editingDialogueId !== null) return;

    const newActiveIndex = dialogues.findIndex(
      (d) => currentTime >= d.startTimeMs && currentTime < d.endTimeMs
    );

    // activeIndexが実際に変更された場合のみ処理を実行
    if (newActiveIndex !== activeIndex) {
      previousActiveIndex = activeIndex;
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

  function getContext(index: number): readonly Dialogue[] {
    const start = Math.max(0, index - contextBefore);
    const end = Math.min(dialogues.length, index + contextAfter + 1);
    return dialogues.slice(start, end);
  }

  function handleDblClick(dialogue: Dialogue) {
    editingDialogueId = dialogue.id;
    editText = dialogue.correctedText || dialogue.originalText;
    editingOriginalText = dialogue.originalText;
  }

  function handleSave() {
    if (editingDialogueId === null) return;

    const dialogue = dialogues.find((d) => d.id === editingDialogueId);
    if (!dialogue) return;

    onSave({
      dialogueId: dialogue.id,
      correctedText: editText,
      originalText: dialogue.originalText,
    });

    editingDialogueId = null;
  }

  function handleCancel() {
    editingDialogueId = null;
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
  bind:this={containerEl}
  class="h-[50vh] space-y-1 overflow-y-auto scroll-smooth rounded-lg border bg-gray-50 p-4 lg:h-full dark:border-gray-700 dark:bg-gray-800"
>
  {#if dialogues.length > 0}
    <!--
      上下の余白（50% - 1.25rem）は、アクティブな項目が中央に来るように調整するためのものです。
      1.25rem は、p-3（0.75rem）と rounded-lg の境界付近の余白を考慮したおおよその値です。
    -->
    <div class="h-[calc(50%-1.25rem)]"></div>
    {#each dialogues as dialogue, index (dialogue.id)}
      <div
        bind:this={itemEls[index]}
        class="flex items-center justify-between rounded-lg p-3 transition-all"
        class:bg-primary-100={index === activeIndex && editingDialogueId === null}
        class:dark:bg-primary-900={index === activeIndex && editingDialogueId === null}
        class:bg-gray-200={index === previousActiveIndex &&
          index !== activeIndex &&
          editingDialogueId === null}
        class:dark:bg-gray-700={index === previousActiveIndex &&
          index !== activeIndex &&
          editingDialogueId === null}
        class:ring-2={editingDialogueId === dialogue.id}
        class:ring-primary-500={editingDialogueId === dialogue.id}
      >
        {#if editingDialogueId === dialogue.id}
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
            <div class="flex justify-end space-x-2">
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
        {:else}
          <div
            role="button"
            tabindex="0"
            class="flex-1 cursor-pointer"
            class:text-primary-800={index === activeIndex}
            class:dark:text-primary-200={index === activeIndex}
            onclick={() => onSeek(dialogue.startTimeMs)}
            ondblclick={() => handleDblClick(dialogue)}
            onkeydown={(e) => e.key === 'Enter' && onSeek(dialogue.startTimeMs)}
          >
            {dialogue.correctedText || dialogue.originalText}
          </div>

          <div class="w-24 text-right">
            {#if canMine && index === activeIndex}
              <Button size="xs" onclick={() => onMine(dialogue, getContext(index))}>
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
