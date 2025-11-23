<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { ttsExecutionStore } from '$lib/application/stores/ttsExecutionStore.svelte';
  import { Button, Modal, Progressbar } from 'flowbite-svelte';

  type Props = {
    onCancel: () => void;
  };
  let { onCancel }: Props = $props();

  let show = $derived(ttsExecutionStore.showModal);
  let progress = $derived(ttsExecutionStore.progress);
  let contextLines = $derived(ttsExecutionStore.contextLines);
  let isExecuting = $derived(ttsExecutionStore.isExecuting);
  let errorMessageKey = $derived(ttsExecutionStore.errorMessageKey);
</script>

{#snippet footer()}
  {#if isExecuting}
    <Button data-testid="tts-execution-cancel-button" color="gray" onclick={onCancel}>
      {t('common.cancel')}
    </Button>
  {:else}
    <Button data-testid="tts-execution-close-button" onclick={ttsExecutionStore.closeModal}>
      {t('components.ttsExecutionModal.close')}
    </Button>
  {/if}
{/snippet}

<Modal open={show} size="md" onclose={ttsExecutionStore.closeModal} {footer}>
  <!-- Header -->
  <div class="mb-4">
    <h2 class="text-lg font-semibold text-gray-900">
      {t('components.ttsExecutionModal.title')}
    </h2>
  </div>

  <!-- Progress info -->
  <div class="mb-4">
    <Progressbar progress={Math.round(progress)} class="mb-4" />

    <!-- Progress text -->
    <div class="mb-4 text-center text-sm text-gray-500">
      {Math.round(progress)}%
    </div>

    <!-- Context lines -->
    {#if contextLines.length > 0}
      <div class="mb-4">
        <div class="mb-2 text-sm font-medium text-gray-700">
          {t('components.ttsExecutionModal.currentlyProcessing')}:
        </div>
        <div class="rounded-md bg-gray-50 p-3">
          {#each contextLines as line, index (index)}
            <div
              class="mb-1 text-sm {line.isCurrentLine
                ? 'rounded bg-blue-50 px-2 py-1 font-medium text-blue-700'
                : 'text-gray-600'}"
            >
              {line.text}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Error message -->
  {#if errorMessageKey}
    <div class="mb-4 rounded-md bg-red-50 p-3">
      <div class="text-sm text-red-700">{t(errorMessageKey)}</div>
    </div>
  {/if}

  <!-- Status message -->
  {#if isExecuting}
    <div class="text-center text-sm text-gray-600">
      {t('components.ttsExecutionModal.pleaseWait')}
    </div>
  {:else if progress === 100 && !errorMessageKey}
    <div class="text-center text-sm text-green-600">
      {t('components.ttsExecutionModal.completed')}
    </div>
  {/if}
</Modal>
