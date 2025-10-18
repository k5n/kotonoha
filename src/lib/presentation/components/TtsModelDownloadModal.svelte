<script lang="ts">
  import { ttsDownloadStore } from '$lib/application/stores/episodeAddStore/ttsDownloadStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Button, Modal, Progressbar } from 'flowbite-svelte';

  type Props = {
    onCancel: () => void;
  };
  let { onCancel }: Props = $props();

  let show = $derived(ttsDownloadStore.showModal);
  let progress = $derived(ttsDownloadStore.progress);
  let isDownloading = $derived(ttsDownloadStore.isDownloading);
  let errorMessageKey = $derived(ttsDownloadStore.errorMessageKey);

  // Format bytes to human readable format
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
</script>

{#snippet footer()}
  {#if isDownloading}
    <Button color="gray" onclick={onCancel}>
      {t('common.cancel')}
    </Button>
  {:else}
    <Button onclick={ttsDownloadStore.closeModal}>
      {t('components.ttsModelDownloadModal.close')}
    </Button>
  {/if}
{/snippet}

<Modal bind:open={show} size="md" onclose={ttsDownloadStore.closeModal} {footer}>
  <!-- Header -->
  <div class="mb-4">
    <h2 class="text-lg font-semibold text-gray-900">
      {t('components.ttsModelDownloadModal.title')}
    </h2>
  </div>

  <!-- Progress info -->
  <div class="mb-4">
    <div class="mb-2 text-sm text-gray-600">
      {t('components.ttsModelDownloadModal.downloadingFile')}: {progress.fileName}
    </div>

    <Progressbar progress={Math.round(progress.progress)} class="mb-2" />

    <!-- Progress text -->
    <div class="flex justify-between text-sm text-gray-500">
      <span>{Math.round(progress.progress)}%</span>
      <span>
        {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
      </span>
    </div>
  </div>

  <!-- Error message -->
  {#if errorMessageKey}
    <div class="mb-4 rounded-md bg-red-50 p-3">
      <div class="text-sm text-red-700">{t(errorMessageKey)}</div>
    </div>
  {/if}

  <!-- Status message -->
  <div class="text-center text-sm text-gray-600">
    {t('components.ttsModelDownloadModal.pleaseWait')}
  </div>
</Modal>
