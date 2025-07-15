<script lang="ts">
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import type {
    SentenceAnalysisItem,
    SentenceAnalysisResult,
  } from '$lib/domain/entities/sentenceAnalysisResult';
  import {
    Accordion,
    AccordionItem,
    Badge,
    Button,
    Checkbox,
    Modal,
    Spinner,
  } from 'flowbite-svelte';
  import { CheckOutline, CloseOutline } from 'flowbite-svelte-icons';

  // --- Props ---
  interface Props {
    openModal: boolean;
    dialogue: Dialogue | null;
    analysisResult: SentenceAnalysisResult | null;
    onCreate: (_selectedResults: readonly SentenceAnalysisItem[]) => void;
    isProcessing: boolean; // 処理中かどうかのフラグ
    onClose?: () => void; // キャンセル・クローズ時のコールバック
  }
  let {
    openModal = $bindable(),
    analysisResult,
    dialogue,
    onCreate,
    isProcessing,
    onClose = () => {},
  }: Props = $props();

  // --- State ---
  let isLoading = $derived(analysisResult === null);
  let selectedItemIds: number[] = $state([]);

  function handleCheckboxChange(itemId: number) {
    // チェックボックスの選択状態を更新
    if (selectedItemIds.includes(itemId)) {
      selectedItemIds = selectedItemIds.filter((id) => id !== itemId);
    } else {
      selectedItemIds = [...selectedItemIds, itemId];
    }
  }

  function handleCreate() {
    if (!analysisResult) return;
    // 選択されたIDに基づいて、元のオブジェクトの配列を生成する
    const selectedObjects = analysisResult.items.filter((item) =>
      selectedItemIds.includes(item.id)
    );
    onCreate(selectedObjects);
  }

  function handleCancel() {
    openModal = false;
    selectedItemIds = [];
    onClose();
  }
</script>

<Modal title="Sentence Mining" bind:open={openModal} onclose={handleCancel} size="lg">
  <div class="space-y-4">
    <p class="text-sm text-gray-500">以下の文から学習カードを作成します。</p>
    <blockquote
      class="border-s-4 border-gray-300 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-800"
    >
      <p class="text-base leading-relaxed font-medium text-gray-900 dark:text-white">
        {#if dialogue}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html dialogue.correctedText || dialogue.originalText}
        {/if}
      </p>
    </blockquote>

    {#if analysisResult}
      <Accordion>
        <AccordionItem>
          {#snippet header()}
            <span>翻訳と解説を表示</span>
          {/snippet}
          <div class="space-y-2">
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {analysisResult.translation}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{analysisResult.explanation}</p>
          </div>
        </AccordionItem>
      </Accordion>
    {/if}

    <div>
      {#if isLoading}
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <Spinner size="8" />
          <p class="mt-4 text-gray-500">AIが重要表現を抽出しています...</p>
        </div>
      {:else if analysisResult}
        <p class="mb-2 text-sm text-gray-500">カードにしたい単語・表現を選択してください。</p>
        <div class="space-y-3">
          {#each analysisResult.items as item (item.id)}
            <label
              class="flex w-full items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Checkbox
                checked={selectedItemIds.includes(item.id)}
                onchange={() => handleCheckboxChange(item.id)}
              />
              <div class="flex-1">
                <div class="flex items-center">
                  <span class="text-primary-700 dark:text-primary-400 text-lg font-bold"
                    >{item.expression}</span
                  >
                  <Badge color="gray" class="ms-2">{item.partOfSpeech}</Badge>
                </div>
                <div class="mt-1 space-y-1">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span
                      class="me-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      >文脈</span
                    >{item.contextualDefinition}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span
                      class="me-1 inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                      >コア</span
                    >{item.coreMeaning}
                  </p>
                </div>
              </div>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-end space-x-2">
    <Button color="alternative" onclick={handleCancel} disabled={isProcessing}>
      <CloseOutline class="me-2 h-5 w-5" />
      キャンセル
    </Button>
    <Button disabled={selectedItemIds.length === 0 || isProcessing} onclick={handleCreate}>
      {#if isProcessing}
        <Spinner size="5" class="me-2" />
        追加中...
      {:else}
        <CheckOutline class="me-2 h-5 w-5" />
        選択した {selectedItemIds.length} 件をカードに追加
      {/if}
    </Button>
  </div>
</Modal>
