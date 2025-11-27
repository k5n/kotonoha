<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { FileBasedEpisodeAddPayload } from '$lib/application/stores/fileBasedEpisodeAddStore.svelte';
  import { fileBasedEpisodeAddStore } from '$lib/application/stores/fileBasedEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import {
    detectScriptLanguage,
    populateLearningTargetLanguages,
  } from '$lib/application/usecases/detectScriptLanguage';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import type { Episode } from '$lib/domain/entities/episode';
  import { assertNotNull } from '$lib/utils/assertion';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import EpisodeSourceSelectionModal from '../presentational/EpisodeSourceSelectionModal.svelte';
  import AudioScriptFileEpisodeAddContainer from './AudioScriptFileEpisodeAddContainer.svelte';
  import TtsEpisodeAddContainer from './TtsEpisodeAddContainer.svelte';
  import YoutubeEpisodeAddContainer from './YoutubeEpisodeAddContainer.svelte';

  interface Props {
    episodeGroupId: number;
    episodes: readonly Episode[];
    disabled?: boolean;
    isOpen?: boolean;
    onError: (message: string) => void;
  }

  let {
    episodeGroupId,
    episodes,
    disabled = false,
    isOpen = $bindable(false),
    onError,
  }: Props = $props();

  let isSubmitting = $state(false);
  type EpisodeType = 'none' | 'audio-script' | 'script-tts' | 'youtube';
  let selectedEpisodeType = $state<EpisodeType>('none');

  // === Add episode ===

  function handleAddEpisodeClick() {
    isOpen = true;
    selectedEpisodeType = 'none';
  }

  function handleEpisodeSourceSelected(source: 'youtube' | 'audio-script' | 'script-tts') {
    selectedEpisodeType = source;
  }

  function handleEpisodeModalClose() {
    isOpen = false;
    selectedEpisodeType = 'none';
  }

  async function handleLanguageDetection(): Promise<void> {
    const supportedLanguages = await populateLearningTargetLanguages();
    try {
      const scriptFilePath = fileBasedEpisodeAddStore.scriptFilePath;
      assertNotNull(scriptFilePath, 'Script file path is null during language detection');
      const detected = await detectScriptLanguage(scriptFilePath, tsvConfigStore.tsvConfig);
      fileBasedEpisodeAddStore.completeLanguageDetection(detected, supportedLanguages);
    } catch (e) {
      console.error(`Failed to detect script language: ${e}`);
      fileBasedEpisodeAddStore.failedLanguageDetection(
        'components.fileEpisodeForm.errorDetectLanguage',
        supportedLanguages
      );
    }
  }

  async function handleTsvScriptFilePreview(filePath: string) {
    tsvConfigStore.startScriptPreviewFetching();
    try {
      const preview = await previewScriptFile(filePath);
      tsvConfigStore.completeScriptPreviewFetching(preview);
    } catch (e) {
      console.error(`Failed to preview TSV script file: ${e}`);
      tsvConfigStore.failedScriptPreviewFetching('components.fileEpisodeForm.errorTsvParse');
    }
  }

  async function handleEpisodeSubmit(
    payload: FileBasedEpisodeAddPayload | YoutubeEpisodeAddPayload | null
  ): Promise<void> {
    isSubmitting = true;
    try {
      assertNotNull(payload, 'Episode payload is not ready');
      await addNewEpisode(payload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add episode: ${e}`);
      onError(t('episodeListPage.errors.addEpisode'));
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Button onclick={handleAddEpisodeClick} disabled={disabled || isSubmitting}>
  <PlusOutline class="me-2 h-5 w-5" />
  {t('episodeListPage.addNewButton')}
</Button>

<EpisodeSourceSelectionModal
  open={isOpen && selectedEpisodeType === 'none'}
  onClose={handleEpisodeModalClose}
  onSourceSelected={handleEpisodeSourceSelected}
/>

<AudioScriptFileEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'audio-script'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onTsvScriptFileSelected={handleTsvScriptFilePreview}
  onDetectScriptLanguage={handleLanguageDetection}
/>

<TtsEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'script-tts'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onTsvScriptFileSelected={handleTsvScriptFilePreview}
  onDetectScriptLanguage={handleLanguageDetection}
/>

<YoutubeEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'youtube'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
/>
