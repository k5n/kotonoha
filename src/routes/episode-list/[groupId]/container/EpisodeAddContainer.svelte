<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { FileBasedEpisodeAddPayload } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
  import { fileBasedEpisodeAddStore } from '$lib/application/stores/FileBasedEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import {
    detectScriptLanguage,
    populateLearningTargetLanguages,
  } from '$lib/application/usecases/detectScriptLanguage';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import type { Episode } from '$lib/domain/entities/episode';
  import { assertNotNull } from '$lib/utils/assertion';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import EpisodeSourceSelectionModal from '../presentational/EpisodeSourceSelectionModal.svelte';
  import AudioScriptFileEpisodeAddModal from './AudioScriptFileEpisodeAddContainer.svelte';
  import TtsEpisodeAddModal from './TtsEpisodeAddContainer.svelte';
  import YoutubeEpisodeAddModal from './YoutubeEpisodeAddModal.svelte';

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
      const detected = await detectScriptLanguage(scriptFilePath);
      fileBasedEpisodeAddStore.completeLanguageDetection(detected, supportedLanguages);
    } catch (e) {
      console.error(`Failed to detect script language: ${e}`);
      fileBasedEpisodeAddStore.failedLanguageDetection(
        'components.fileEpisodeForm.errorDetectLanguage',
        supportedLanguages
      );
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

<AudioScriptFileEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'audio-script'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onDetectScriptLanguage={handleLanguageDetection}
/>

<TtsEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'script-tts'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onDetectScriptLanguage={handleLanguageDetection}
/>

<YoutubeEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'youtube'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
/>
