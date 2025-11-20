<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import type { AudioScriptFileEpisodeAddPayload } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { audioScriptFileEpisodeAddStore } from '$lib/application/stores/audioScriptFileEpisodeAddStore.svelte';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TtsEpisodeAddPayload } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import { ttsEpisodeAddStore } from '$lib/application/stores/ttsEpisodeAddStore.svelte';
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import { deleteEpisode } from '$lib/application/usecases/deleteEpisode';
  import {
    detectScriptLanguage,
    type LanguageDetectionStore,
  } from '$lib/application/usecases/detectScriptLanguage';
  import {
    cancelTtsModelDownload,
    downloadTtsModel,
  } from '$lib/application/usecases/downloadTtsModel';
  import { cancelTtsExecution, executeTts } from '$lib/application/usecases/executeTts';
  import { fetchAvailableTargetGroupsForEpisodeMove } from '$lib/application/usecases/fetchAvailableTargetGroupsForEpisodeMove';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import { moveEpisode } from '$lib/application/usecases/moveEpisode';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import { updateEpisodeName } from '$lib/application/usecases/updateEpisodeName';
  import { updateEpisodesOrder } from '$lib/application/usecases/updateEpisodesOrder';
  import type { Episode } from '$lib/domain/entities/episode';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/presentational/Breadcrumbs.svelte';
  import ConfirmModal from '$lib/presentation/components/presentational/ConfirmModal.svelte';
  import EmptyStateDisplay from '$lib/presentation/components/presentational/EmptyStateDisplay.svelte';
  import ErrorWarningToast from '$lib/presentation/components/presentational/ErrorWarningToast.svelte';
  import LoadErrorAlert from '$lib/presentation/components/presentational/LoadErrorAlert.svelte';
  import { Button, Heading, Spinner } from 'flowbite-svelte';
  import { FileOutline, PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';
  import AudioScriptFileEpisodeAddModal from './presentational/AudioScriptFileEpisodeAddModal.svelte';
  import EpisodeListTable from './presentational/EpisodeListTable.svelte';
  import EpisodeMoveModal from './presentational/EpisodeMoveModal.svelte';
  import EpisodeNameEditModal from './presentational/EpisodeNameEditModal.svelte';
  import EpisodeSourceSelectionModal from './presentational/EpisodeSourceSelectionModal.svelte';
  import TtsEpisodeAddModal from './presentational/TtsEpisodeAddModal.svelte';
  import TtsExecutionModal from './presentational/TtsExecutionModal.svelte';
  import TtsModelDownloadModal from './presentational/TtsModelDownloadModal.svelte';
  import YoutubeEpisodeAddModal from './presentational/YoutubeEpisodeAddModal.svelte';

  let { data }: PageProps = $props();
  let errorMessage = $state('');
  let isTransitioning = $state(false);
  let showEpisodeMove = $state(false);
  let showEpisodeNameEdit = $state(false);
  let showDeleteConfirm = $state(false);
  let targetEpisode = $state<Episode | null>(null);
  let availableTargetGroups = $state<readonly EpisodeGroup[]>([]);
  let isSubmitting = $state(false);
  type FileDetailType = 'audio-script' | 'script-tts';
  type EpisodeModalType = 'none' | 'source-selection' | 'youtube';
  type EpisodeSourceSelectionEvent = 'file' | 'youtube' | FileDetailType;
  let activeEpisodeModal = $state<EpisodeModalType>('none');
  let showAudioScriptFileModal = $state(false);
  let showTtsEpisodeModal = $state(false);
  let showSourceSelectionModal = $derived(activeEpisodeModal === 'source-selection');
  let showYoutubeEpisodeModal = $derived(activeEpisodeModal === 'youtube');

  let loadErrorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let episodes = $derived(data.episodes);
  let currentGroupName = $derived(groupPathStore.current?.name ?? 'Home');

  // === Page transition ===

  function openEpisode(episodeId: number) {
    isTransitioning = true;
    goto(`/episode/${episodeId}`);
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    if (groupPathStore.popTo(targetIndex)) {
      goto(groupPathStore.url);
    }
  }

  // === Add episode ===

  function handleAddEpisodeClick() {
    showAudioScriptFileModal = false;
    showTtsEpisodeModal = false;
    activeEpisodeModal = 'source-selection';
  }

  function handleEpisodeSourceSelected(source: EpisodeSourceSelectionEvent) {
    if (source === 'audio-script') {
      showAudioScriptFileModal = true;
      showTtsEpisodeModal = false;
      activeEpisodeModal = 'none';
      return;
    }
    if (source === 'script-tts') {
      showTtsEpisodeModal = true;
      showAudioScriptFileModal = false;
      activeEpisodeModal = 'none';
      return;
    }
    activeEpisodeModal = source === 'youtube' ? 'youtube' : 'source-selection';
  }

  function handleEpisodeModalClose() {
    activeEpisodeModal = 'none';
  }

  function handleAudioScriptModalClose() {
    showAudioScriptFileModal = false;
  }

  function handleTtsEpisodeModalClose() {
    showTtsEpisodeModal = false;
  }

  async function runLanguageDetection(
    store: LanguageDetectionStore,
    context: FileDetailType
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
    const episodeGroupId = data.episodeGroup?.id;
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

    try {
      await addNewEpisode(finalPayload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add file-based episode: ${e}`);
      errorMessage = t('episodeListPage.errors.addEpisode');
      throw e;
    }
  }

  async function handleTtsEpisodeSubmit(payload: TtsEpisodeAddPayload | null): Promise<void> {
    const episodeGroupId = data.episodeGroup?.id;
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

    try {
      await addNewEpisode(finalPayload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add TTS-based episode: ${e}`);
      errorMessage = t('episodeListPage.errors.addEpisode');
      throw e;
    }
  }

  async function handleYoutubeEpisodeSubmit(payload: YoutubeEpisodeAddPayload): Promise<void> {
    const episodeGroupId = data.episodeGroup?.id;
    if (!episodeGroupId) {
      throw new Error('No group ID found, cannot add episode');
    }

    try {
      await addNewEpisode(payload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add YouTube episode: ${e}`);
      errorMessage = t('episodeListPage.errors.addEpisode');
      throw e;
    }
  }

  // === Move episode ===

  async function handleEpisodeMoveClick(episode: Episode) {
    try {
      availableTargetGroups = await fetchAvailableTargetGroupsForEpisodeMove(
        episode.episodeGroupId
      );
      targetEpisode = episode;
      showEpisodeMove = true;
    } catch (e) {
      console.error(`Failed to fetch album groups: ${e}`);
      errorMessage = t('episodeListPage.errors.fetchAlbumGroups');
    }
  }

  async function handleMoveEpisodeSubmit(targetGroupId: number) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await moveEpisode(targetEpisode.id, targetGroupId);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to move episode: ${e}`);
      errorMessage = t('episodeListPage.errors.moveEpisode');
    } finally {
      showEpisodeMove = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === Delete episode ===

  function handleEpisodeDeleteClick(episode: Episode) {
    targetEpisode = episode;
    showDeleteConfirm = true;
  }

  async function handleConfirmDelete() {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await deleteEpisode(targetEpisode);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to delete episode: ${e}`);
      errorMessage = t('episodeListPage.errors.deleteEpisode');
    } finally {
      showDeleteConfirm = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === Rename episode ===

  function handleEpisodeRenameClick(episode: Episode) {
    targetEpisode = episode;
    showEpisodeNameEdit = true;
  }

  async function handleEpisodeNameSubmit(newName: string) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await updateEpisodeName(targetEpisode.id, newName);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to update episode name: ${e}`);
      errorMessage = t('episodeListPage.errors.updateName');
    } finally {
      showEpisodeNameEdit = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <Heading tag="h1" class="text-3xl font-bold">{currentGroupName}</Heading>
    </div>
    <Button onclick={handleAddEpisodeClick} disabled={data.errorKey !== null || isSubmitting}>
      <PlusOutline class="me-2 h-5 w-5" />
      {t('episodeListPage.addNewButton')}
    </Button>
  </div>

  <div class="mb-6">
    <Breadcrumbs path={groupPathStore.path} onNavigate={handleBreadcrumbClick} />
  </div>

  {#if errorMessage}
    <div class="mb-8">
      <ErrorWarningToast type="error" {errorMessage} />
    </div>
  {/if}

  <div class="mb-8">
    {#if loadErrorMessage}
      <LoadErrorAlert errorMessage={loadErrorMessage} />
    {:else if isTransitioning}
      <div class="flex items-center justify-center py-20">
        <Spinner size="8" />
        <span class="ms-4 text-gray-500">{t('episodeListPage.loading')}</span>
      </div>
    {:else if episodes.length === 0}
      <EmptyStateDisplay
        title={t('episodeListPage.emptyState.title')}
        message={t('episodeListPage.emptyState.message')}
        buttonText={t('episodeListPage.emptyState.addButton')}
        Icon={FileOutline}
        onAdd={handleAddEpisodeClick}
      />
    {:else}
      <EpisodeListTable
        {episodes}
        onEpisodeClick={openEpisode}
        onEpisodeMoveClick={handleEpisodeMoveClick}
        onEpisodeDeleteClick={handleEpisodeDeleteClick}
        onEpisodeRenameClick={handleEpisodeRenameClick}
        onOrderChange={async (newOrder) => {
          episodes = newOrder;
          await updateEpisodesOrder(newOrder);
        }}
      />
    {/if}
  </div>
</div>

<EpisodeSourceSelectionModal
  open={showSourceSelectionModal}
  onClose={handleEpisodeModalClose}
  onSourceSelected={handleEpisodeSourceSelected}
/>

<AudioScriptFileEpisodeAddModal
  open={showAudioScriptFileModal}
  onClose={handleAudioScriptModalClose}
  onSubmitRequested={handleAudioScriptEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleAudioScriptLanguageDetection}
/>

<TtsEpisodeAddModal
  open={showTtsEpisodeModal}
  onClose={handleTtsEpisodeModalClose}
  onSubmitRequested={handleTtsEpisodeSubmit}
  onTsvFileSelected={previewScriptFile}
  onDetectScriptLanguage={handleTtsLanguageDetection}
  onTtsEnabled={handleTtsSetup}
/>

<YoutubeEpisodeAddModal
  open={showYoutubeEpisodeModal}
  onClose={handleEpisodeModalClose}
  onSubmitRequested={handleYoutubeEpisodeSubmit}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
/>

<EpisodeMoveModal
  show={showEpisodeMove}
  {isSubmitting}
  episode={targetEpisode}
  {availableTargetGroups}
  onClose={() => {
    showEpisodeMove = false;
    targetEpisode = null;
  }}
  onSubmit={handleMoveEpisodeSubmit}
/>

<EpisodeNameEditModal
  show={showEpisodeNameEdit}
  {isSubmitting}
  initialName={targetEpisode?.title}
  onClose={() => {
    showEpisodeNameEdit = false;
    targetEpisode = null;
  }}
  onSubmit={handleEpisodeNameSubmit}
/>

<ConfirmModal
  bind:show={showDeleteConfirm}
  title={t('episodeListPage.confirmDelete.title')}
  message={t('episodeListPage.confirmDelete.message', { episodeTitle: targetEpisode?.title })}
  {isSubmitting}
  onConfirm={handleConfirmDelete}
  onClose={() => {
    showDeleteConfirm = false;
    targetEpisode = null;
  }}
/>

<TtsModelDownloadModal onCancel={cancelTtsModelDownload} />

<TtsExecutionModal onCancel={cancelTtsExecution} />
