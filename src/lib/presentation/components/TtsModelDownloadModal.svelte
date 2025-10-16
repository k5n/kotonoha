<script lang="ts">
  import { ttsDownloadStore } from '$lib/application/stores/episodeAddStore/ttsDownloadStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Progressbar } from 'flowbite-svelte';

  let show = $derived(ttsDownloadStore.showModal);
  let progress = $derived(ttsDownloadStore.progress);

  // Format bytes to human readable format
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
</script>

{#if show}
  <!-- Modal backdrop -->
  <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
    <!-- Modal content -->
    <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          {t('components.ttsModelDownloadModal.title')}
        </h2>
        <button
          onclick={ttsDownloadStore.closeModal}
          class="text-gray-400 transition-colors hover:text-gray-600"
          aria-label={t('components.ttsModelDownloadModal.cancel')}
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
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

      <!-- Status message -->
      <div class="text-center text-sm text-gray-600">
        {t('components.ttsModelDownloadModal.pleaseWait')}
      </div>

      <!-- Cancel button -->
      <div class="mt-6 flex justify-end">
        <button
          onclick={ttsDownloadStore.closeModal}
          class="rounded-md bg-gray-100 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-200"
        >
          {t('components.ttsModelDownloadModal.cancel')}
        </button>
      </div>
    </div>
  </div>
{/if}
