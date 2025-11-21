<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { AudioScriptFileEpisodeAddPayload } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { audioScriptFileEpisodeAddStore } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TtsEpisodeAddPayload } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import { ttsEpisodeAddStore } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import {
    detectScriptLanguage,
    type LanguageDetectionStore,
  } from '$lib/application/usecases/detectScriptLanguage';
  import {
    cancelTtsModelDownload,
    downloadTtsModel,
  } from '$lib/application/usecases/downloadTtsModel';
  import { cancelTtsExecution, executeTts } from '$lib/application/usecases/executeTts';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import type { Episode } from '$lib/domain/entities/episode';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import AudioScriptFileEpisodeAddModal from '../presentational/AudioScriptFileEpisodeAddModal.svelte';
  import EpisodeSourceSelectionModal from '../presentational/EpisodeSourceSelectionModal.svelte';
  import TtsEpisodeAddModal from '../presentational/TtsEpisodeAddModal.svelte';
  import TtsExecutionModal from '../presentational/TtsExecutionModal.svelte';
  import TtsModelDownloadModal from '../presentational/TtsModelDownloadModal.svelte';
  import YoutubeEpisodeAddModal from '../presentational/YoutubeEpisodeAddModal.svelte';

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

  async function runLanguageDetection(
    store: LanguageDetectionStore,
    context: string
  ): Promise<void> {
    try {
      await detectScriptLanguage(store);
    } catch (e) {
      console.error(`Failed to detect script language for ${context}: ${e}`);
    }
  }

  async function handleAudioScriptLanguageDetection(): Promise<void> {
    await runLanguageDetection(audioScriptFileEpisodeAddStore, 'audio-script');
  }

  async function handleTtsLanguageDetection(): Promise<void> {
    await runLanguageDetection(ttsEpisodeAddStore, 'script-tts');
  }

  async function handleTtsSetup(): Promise<void> {
    try {
      await fetchTtsVoices(ttsEpisodeAddStore);
    } catch (e) {
      console.error(`Failed to prepare TTS voices: ${e}`);
    }
  }

  function buildAudioScriptPayload(
    payload: AudioScriptFileEpisodeAddPayload | null
  ): AudioScriptFileEpisodeAddPayload {
    const finalPayload = payload ?? audioScriptFileEpisodeAddStore.buildPayload();
    if (!finalPayload) {
      throw new Error('Audio-script episode payload is not ready');
    }
    return finalPayload;
  }

  async function ensureTtsEpisodePayload(
    payload: TtsEpisodeAddPayload | null
  ): Promise<TtsEpisodeAddPayload> {
    if (payload) {
      return payload;
    }

    if (!ttsEpisodeAddStore.scriptFilePath) {
      throw new Error('Script file path is required before generating TTS audio');
    }

    console.info('TTS audio generation required for the new episode');
    await downloadTtsModel();
    await executeTts(ttsEpisodeAddStore);

    const finalPayload = ttsEpisodeAddStore.buildPayload();
    if (!finalPayload) {
      throw new Error('TTS episode payload is not ready');
    }
    return finalPayload;
  }

  async function handleAudioScriptEpisodeSubmit(
    payload: AudioScriptFileEpisodeAddPayload | null
  ): Promise<void> {
    if (!episodeGroupId) {
      throw new Error('No group ID found, cannot add episode');
    }

    let finalPayload: AudioScriptFileEpisodeAddPayload;
    try {
      finalPayload = buildAudioScriptPayload(payload);
    } catch (e) {
      console.error(`Failed to prepare audio+script episode payload: ${e}`);
      throw e;
    }

    isSubmitting = true;
    try {
      await addNewEpisode(finalPayload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add file-based episode: ${e}`);
      onError(t('episodeListPage.errors.addEpisode'));
      throw e;
    } finally {
      isSubmitting = false;
    }
  }

  async function handleTtsEpisodeSubmit(payload: TtsEpisodeAddPayload | null): Promise<void> {
    if (!episodeGroupId) {
      throw new Error('No group ID found, cannot add episode');
    }

    let finalPayload: TtsEpisodeAddPayload;
    try {
      finalPayload = await ensureTtsEpisodePayload(payload);
    } catch (e) {
      console.error(`Failed to prepare TTS episode payload: ${e}`);
      throw e;
    }

    isSubmitting = true;
    try {
      await addNewEpisode(finalPayload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add TTS-based episode: ${e}`);
      onError(t('episodeListPage.errors.addEpisode'));
      throw e;
    } finally {
      isSubmitting = false;
    }
  }

  async function handleYoutubeEpisodeSubmit(payload: YoutubeEpisodeAddPayload): Promise<void> {
    if (!episodeGroupId) {
      throw new Error('No group ID found, cannot add episode');
    }

    isSubmitting = true;
    try {
      await addNewEpisode(payload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add YouTube episode: ${e}`);
      onError(t('episodeListPage.errors.addEpisode'));
      throw e;
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
  onSubmitRequested={handleAudioScriptEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleAudioScriptLanguageDetection}
/>

<TtsEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'script-tts'}
  onClose={handleEpisodeModalClose}
  onSubmitRequested={handleTtsEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleTtsLanguageDetection}
  onTtsEnabled={handleTtsSetup}
/>

<YoutubeEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'youtube'}
  onClose={handleEpisodeModalClose}
  onSubmitRequested={handleYoutubeEpisodeSubmit}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
/>

<TtsModelDownloadModal onCancel={cancelTtsModelDownload} />

<TtsExecutionModal onCancel={cancelTtsExecution} />
