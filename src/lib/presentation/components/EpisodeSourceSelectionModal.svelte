<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Button, Heading, Modal } from 'flowbite-svelte';

  type EpisodeSource = 'file' | 'youtube';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSourceSelected: (source: EpisodeSource) => void;
  };

  let { open, onClose, onSourceSelected }: Props = $props();

  function handleClose() {
    onClose();
  }

  function handleSourceClick(source: EpisodeSource) {
    onSourceSelected(source);
  }
</script>

<Modal {open} onclose={handleClose} size="md">
  <div class="p-6">
    <Heading tag="h2" class="mb-2 text-xl font-bold"
      >{t('components.episodeSourceSelectionModal.title')}</Heading
    >
    <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
      {t('components.episodeSourceSelectionModal.description')}
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        class="hover:border-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500 dark:hover:border-primary-400 rounded-lg border border-gray-200 bg-white p-4 text-left transition focus:outline-none focus-visible:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
        aria-label={t('components.episodeSourceSelectionModal.fileOptionLabel')}
        onclick={() => handleSourceClick('file')}
      >
        <span class="block text-base font-semibold text-gray-900 dark:text-white">
          {t('components.episodeSourceSelectionModal.fileOptionTitle')}
        </span>
        <span class="mt-1 block text-sm text-gray-500 dark:text-gray-300">
          {t('components.episodeSourceSelectionModal.fileOptionDescription')}
        </span>
      </button>

      <button
        type="button"
        class="hover:border-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500 dark:hover:border-primary-400 rounded-lg border border-gray-200 bg-white p-4 text-left transition focus:outline-none focus-visible:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
        aria-label={t('components.episodeSourceSelectionModal.youtubeOptionLabel')}
        onclick={() => handleSourceClick('youtube')}
      >
        <span class="block text-base font-semibold text-gray-900 dark:text-white">
          {t('components.episodeSourceSelectionModal.youtubeOptionTitle')}
        </span>
        <span class="mt-1 block text-sm text-gray-500 dark:text-gray-300">
          {t('components.episodeSourceSelectionModal.youtubeOptionDescription')}
        </span>
      </button>
    </div>

    <div class="mt-6 flex justify-end">
      <Button color="gray" onclick={handleClose}>
        {t('common.cancel')}
      </Button>
    </div>
  </div>
</Modal>
