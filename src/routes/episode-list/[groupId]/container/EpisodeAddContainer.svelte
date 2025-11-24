<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import {
    audioScriptFileEpisodeAddStore,
    type AudioScriptFileEpisodeAddPayload,
  } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TtsEpisodeAddPayload } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import { ttsEpisodeAddStore } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import {
    detectScriptLanguage,
    type LanguageDetectionStore,
  } from '$lib/application/usecases/detectScriptLanguage';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import type { Episode } from '$lib/domain/entities/episode';
  import { assertNotNull } from '$lib/utils/assertion';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import EpisodeSourceSelectionModal from '../presentational/EpisodeSourceSelectionModal.svelte';
  import AudioScriptFileEpisodeAddModal from './AudioScriptFileEpisodeAddModal.svelte';
  import TtsEpisodeAddModal from './TtsEpisodeAddModal.svelte';
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

  async function handleEpisodeSubmit(
    payload:
      | AudioScriptFileEpisodeAddPayload
      | TtsEpisodeAddPayload
      | YoutubeEpisodeAddPayload
      | null
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
  onSubmitRequested={handleEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleAudioScriptLanguageDetection}
/>

<TtsEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'script-tts'}
  onClose={handleEpisodeModalClose}
  onSubmitRequested={handleEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleTtsLanguageDetection}
  onTtsEnabled={handleTtsSetup}
/>

<YoutubeEpisodeAddModal
  open={isOpen && selectedEpisodeType === 'youtube'}
  onClose={handleEpisodeModalClose}
  onSubmitRequested={handleEpisodeSubmit}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
/>
