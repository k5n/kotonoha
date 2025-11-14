<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Button, Heading, Modal } from 'flowbite-svelte';

  type EpisodeSource = 'file' | 'youtube';
  type FileDetailType = 'audio-script' | 'script-tts';
  type SourceSelectionEvent = EpisodeSource | FileDetailType;
  type ModalView = 'source-selection' | 'file-detail-selection';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSourceSelected: (source: SourceSelectionEvent) => void;
  };

  type FileDetailOption = {
    readonly type: FileDetailType;
    readonly titleKey: string;
    readonly descriptionKey: string;
    readonly helperKey: string;
    readonly labelKey: string;
  };

  const detailOptions: readonly FileDetailOption[] = [
    {
      type: 'audio-script',
      titleKey: 'components.episodeSourceSelectionModal.audioScriptOptionTitle',
      descriptionKey: 'components.episodeSourceSelectionModal.audioScriptOptionDescription',
      helperKey: 'components.episodeSourceSelectionModal.audioScriptOptionHelper',
      labelKey: 'components.episodeSourceSelectionModal.audioScriptOptionLabel',
    },
    {
      type: 'script-tts',
      titleKey: 'components.episodeSourceSelectionModal.scriptTtsOptionTitle',
      descriptionKey: 'components.episodeSourceSelectionModal.scriptTtsOptionDescription',
      helperKey: 'components.episodeSourceSelectionModal.scriptTtsOptionHelper',
      labelKey: 'components.episodeSourceSelectionModal.scriptTtsOptionLabel',
    },
  ];

  const optionButtonBaseClasses =
    'hover:border-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500 dark:hover:border-primary-400 rounded-lg border border-gray-200 bg-white p-4 text-left transition focus:outline-none focus-visible:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600';
  const optionSelectedClasses =
    'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30';

  let { open, onClose, onSourceSelected }: Props = $props();
  let currentView = $state<ModalView>('source-selection');
  let selectedFileType = $state<FileDetailType | null>(null);
  const isDetailView = $derived(currentView === 'file-detail-selection');

  function resetView() {
    currentView = 'source-selection';
    selectedFileType = null;
  }

  function handleClose() {
    resetView();
    onClose();
  }

  function handleSourceClick(source: EpisodeSource) {
    if (source === 'file') {
      currentView = 'file-detail-selection';
      selectedFileType = null;
      return;
    }
    onSourceSelected(source);
  }

  function handleFileDetailClick(type: FileDetailType) {
    selectedFileType = type;
    onSourceSelected(type);
  }

  function handleCancel() {
    if (isDetailView) {
      resetView();
      return;
    }
    handleClose();
  }

  $effect(() => {
    if (!open) {
      resetView();
    }
  });
</script>

<Modal {open} onclose={handleClose} size="md">
  <div class="p-6">
    <Heading tag="h2" class="mb-2 text-xl font-bold">
      {#if !isDetailView}
        {t('components.episodeSourceSelectionModal.title')}
      {:else}
        {t('components.episodeSourceSelectionModal.fileDetailTitle')}
      {/if}
    </Heading>
    <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
      {#if !isDetailView}
        {t('components.episodeSourceSelectionModal.description')}
      {:else}
        {t('components.episodeSourceSelectionModal.fileDetailDescription')}
      {/if}
    </p>

    {#if !isDetailView}
      <div class="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          class={optionButtonBaseClasses}
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
          class={optionButtonBaseClasses}
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
    {:else}
      <div class="grid gap-4 sm:grid-cols-2">
        {#each detailOptions as option}
          <button
            type="button"
            class={`${optionButtonBaseClasses} ${selectedFileType === option.type ? optionSelectedClasses : ''}`}
            aria-label={t(option.labelKey)}
            aria-pressed={selectedFileType === option.type}
            onclick={() => handleFileDetailClick(option.type)}
          >
            <span class="block text-base font-semibold text-gray-900 dark:text-white">
              {t(option.titleKey)}
            </span>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-300">
              {t(option.descriptionKey)}
            </span>
            <span class="mt-2 block text-xs text-gray-400 dark:text-gray-400">
              {t(option.helperKey)}
            </span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="mt-6 flex justify-end">
      <Button color="gray" onclick={handleCancel}>
        {t('common.cancel')}
      </Button>
    </div>
  </div>
</Modal>
