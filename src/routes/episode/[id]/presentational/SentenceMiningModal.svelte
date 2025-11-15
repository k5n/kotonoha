<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
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
    selectedItemIds = [];
  }

  function handleCancel() {
    openModal = false;
    selectedItemIds = [];
    onClose();
  }
</script>

<Modal
  title={t('components.sentenceMiningModal.title')}
  bind:open={openModal}
  onclose={handleCancel}
  size="lg"
>
  <div class="space-y-4">
    <p class="text-sm text-gray-500">{t('components.sentenceMiningModal.description')}</p>
    <blockquote
      class="border-s-4 border-gray-300 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-800"
    >
      <p class="text-base leading-relaxed font-medium text-gray-900 dark:text-white">
        {#if analysisResult?.sentence}
          <!-- Use LLM-generated sentence when available -->
          {analysisResult.sentence}
        {:else if dialogue}
          <!-- Fallback to original dialogue text if no LLM sentence -->
          {dialogue.correctedText || dialogue.originalText}
        {/if}
      </p>
    </blockquote>

    {#if analysisResult}
      <Accordion>
        <AccordionItem>
          {#snippet header()}
            <span>{t('components.sentenceMiningModal.showTranslation')}</span>
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
          <p class="mt-4 text-gray-500">{t('components.sentenceMiningModal.loading')}</p>
        </div>
      {:else if analysisResult}
        <p class="mb-2 text-sm text-gray-500">{t('components.sentenceMiningModal.selectPrompt')}</p>
        <div class="space-y-3">
          {#each analysisResult.items as item (item.id)}
            {@const isDisabled = item.status === 'active' || item.status === 'suspended'}
            <label
              class:cursor-not-allowed={isDisabled}
              class:opacity-50={isDisabled}
              class="flex w-full items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Checkbox
                checked={isDisabled || selectedItemIds.includes(item.id)}
                onchange={() => handleCheckboxChange(item.id)}
                disabled={isDisabled}
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
                      >{t('components.sentenceMiningModal.contextLabel')}</span
                    >{item.contextualDefinition}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span
                      class="me-1 inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                      >{t('components.sentenceMiningModal.coreMeaningLabel')}</span
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
      {t('common.cancel')}
    </Button>
    <Button disabled={selectedItemIds.length === 0 || isProcessing} onclick={handleCreate}>
      {#if isProcessing}
        <Spinner size="5" class="me-2" />
        {t('components.sentenceMiningModal.submitting')}
      {:else}
        <CheckOutline class="me-2 h-5 w-5" />
        {t('components.sentenceMiningModal.submit', { count: selectedItemIds.length })}
      {/if}
    </Button>
  </div>
</Modal>
