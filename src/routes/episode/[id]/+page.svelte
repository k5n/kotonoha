<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
  import { addSentenceCards } from '$lib/application/usecases/addSentenceCards';
  import { analyzeSubtitleLineForMining } from '$lib/application/usecases/analyzeSubtitleLineForMining';
  import { PLAYER_DIV_ID } from '$lib/application/usecases/mediaPlayer/youtubePlayer';
  import { softDeleteSubtitleLine } from '$lib/application/usecases/softDeleteSubtitleLine';
  import { undoSoftDeleteSubtitleLine } from '$lib/application/usecases/undoSoftDeleteSubtitleLine';
  import { updateSubtitleLine } from '$lib/application/usecases/updateSubtitleLine';
  import type {
    SentenceAnalysisItem,
    SentenceAnalysisResult,
  } from '$lib/domain/entities/sentenceAnalysisResult';
  import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
  import type { SubtitleLine } from '$lib/domain/entities/subtitleLine';
  import { keyboardShortcuts } from '$lib/presentation/actions/keyboardShortcuts';
  import ConfirmModal from '$lib/presentation/components/presentational/ConfirmModal.svelte';
  import LoadErrorAlert from '$lib/presentation/components/presentational/LoadErrorAlert.svelte';
  import { Alert, Button, Checkbox, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';
  import type { PageProps } from './$types';
  import AudioPlayer from './presentational/AudioPlayer.svelte';
  import SentenceCardList from './presentational/SentenceCardList.svelte';
  import SentenceMiningModal from './presentational/SentenceMiningModal.svelte';
  import TranscriptViewer from './presentational/TranscriptViewer.svelte';

  const contextBefore = 5; // コンテキストに含める注目セリフの前のセリフ件数
  const contextAfter = 3; // コンテキストに含める注目セリフの後のセリフ件数

  let { data }: PageProps = $props();

  // --- Component State ---
  let isModalOpen = $state(false);
  let miningTarget: SubtitleLine | null = $state(null);
  let analysisResult: SentenceAnalysisResult | null = $state(null);
  let isProcessingMining = $state(false);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let canMine = $derived(data.isApiKeySet || false);
  let showDeleted = $state(false);

  // Delete confirmation
  let isConfirmModalOpen = $state(false);
  let subtitleLineIdToDelete: number | null = $state(null);

  // --- Derived State ---
  const filteredSubtitleLines = $derived(
    (data.subtitleLines ?? []).filter((d) => showDeleted || !d.deletedAt)
  );
  const hasDeletedSubtitleLines = $derived(
    data.subtitleLines?.some((d) => d.deletedAt !== null) ?? false
  );
  const mediaPlayer = $derived(data.mediaPlayer);

  onMount(() => {
    const unlistenPromise = mediaPlayer?.listen();
    return () => {
      unlistenPromise?.then((unlisten) => {
        unlisten();
      });
    };
  });

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      goto('/');
    }
  }

  function handleCardClick(card: SentenceCard) {
    const subtitleLine = data.subtitleLines?.find((d) => d.id === card.dialogueId);
    if (subtitleLine) {
      mediaPlayer?.seek(subtitleLine.startTimeMs);
    } else {
      console.error(
        `Script segment not found for sentence card: ${card.id}, subtitleLineId: ${card.dialogueId}`
      );
    }
  }

  async function openMiningModal(subtitleLine: SubtitleLine, context: readonly SubtitleLine[]) {
    console.info(
      `Open mining modal for script segment: ${subtitleLine.id}, context size: ${context.length}`
    );
    miningTarget = subtitleLine;
    isModalOpen = true;
    try {
      analysisResult = await analyzeSubtitleLineForMining(subtitleLine, context);
    } catch (err) {
      console.error(`Error analyzing script segment for mining: ${err}`);
      errorMessage = t('episodeDetailPage.errors.analyzeFailed');
      resetMiningModalState();
    }
  }

  async function createMiningCards(selectedItems: readonly SentenceAnalysisItem[]) {
    if (!miningTarget) {
      console.warn('No mining target available.');
      isModalOpen = false;
      return;
    }
    isProcessingMining = true;

    try {
      const selectedCardIds = selectedItems.map((item) => item.id);
      await addSentenceCards(selectedCardIds);
    } catch (err) {
      console.error(`Error in createMiningCards: ${err}`);
      errorMessage = t('episodeDetailPage.errors.createCardsFailed');
    } finally {
      resetMiningModalState();
      invalidateAll();
    }
  }

  function resetMiningModalState() {
    isModalOpen = false;
    miningTarget = null;
    analysisResult = null;
    isProcessingMining = false;
  }

  async function handleSaveSubtitleLine(details: {
    subtitleLineId: number;
    correctedText: string;
  }) {
    const { subtitleLineId, correctedText } = details;
    try {
      await updateSubtitleLine(subtitleLineId, correctedText);
      await invalidateAll();
    } catch (err) {
      console.error(`Error updating script segment: ${err}`);
      errorMessage = t('episodeDetailPage.errors.updateDialogueFailed');
    }
  }

  function handleDeleteRequest(subtitleLineId: number) {
    subtitleLineIdToDelete = subtitleLineId;
    isConfirmModalOpen = true;
  }

  async function handleDeleteConfirm() {
    if (subtitleLineIdToDelete === null) return;

    try {
      await softDeleteSubtitleLine(subtitleLineIdToDelete);
      await invalidateAll();
    } catch (err) {
      console.error(`Error soft deleting script segment: ${err}`);
      errorMessage = t('episodeDetailPage.errors.deleteDialogueFailed');
    } finally {
      isConfirmModalOpen = false;
      subtitleLineIdToDelete = null;
    }
  }

  async function handleUndoDelete(subtitleLineId: number) {
    try {
      await undoSoftDeleteSubtitleLine(subtitleLineId);
      await invalidateAll();
    } catch (err) {
      console.error(`Error undoing soft delete for script segment: ${err}`);
      errorMessage = t('episodeDetailPage.errors.undoDeleteDialogueFailed');
    }
  }
</script>

<div
  use:keyboardShortcuts={{
    mediaPlayer,
    subtitleLines: filteredSubtitleLines,
  }}
  class="p-4 md:p-6 lg:flex lg:h-full lg:flex-col"
>
  <div>
    <Button color="light" class="mb-4" onclick={goBack}>
      <ArrowLeftOutline class="me-2 h-5 w-5" />
      {t('episodeDetailPage.backButton')}
    </Button>
  </div>

  {#if errorMessage}
    <LoadErrorAlert {errorMessage} />
  {:else if data.episode}
    <div class="grid grid-cols-1 gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
      <div class="flex flex-col lg:col-span-2 lg:min-h-0">
        <div>
          <Heading tag="h1" class="mb-6 text-3xl font-bold">{data.episode.title}</Heading>
          {#if data.audioInfo}
            {#await data.audioInfo}
              <div class="flex items-center justify-center py-8">
                <Spinner size="8" />
              </div>
            {:then audioInfo}
              <AudioPlayer
                peaks={audioInfo.peaks}
                currentTime={mediaPlayerStore.currentTime}
                duration={audioInfo.duration}
                isPlaying={mediaPlayerStore.isPlaying}
                onPlay={() => mediaPlayer?.play()}
                onPause={() => mediaPlayer?.pause()}
                onSeek={(time) => mediaPlayer?.seek(time)}
                onResume={() => mediaPlayer?.resume()}
                onStop={() => mediaPlayer?.stop()}
              />
            {:catch}
              <Alert color="red">
                <ExclamationCircleOutline class="h-5 w-5" />
                <span class="font-medium">{t('episodeDetailPage.errorPrefix')}</span>
                {t('episodeDetailPage.errors.audioLoadFailed')}
              </Alert>
            {/await}
          {:else}
            <!-- YouTube Player Container -->
            <div
              data-testid="youtube-player"
              id={PLAYER_DIV_ID}
              class="aspect-video h-full w-full"
            ></div>
          {/if}
        </div>

        <div class="mt-6 flex flex-col lg:min-h-0 lg:flex-1">
          <div class="mb-3 flex items-center justify-between">
            <Heading tag="h2" class="text-xl font-semibold">
              {t('episodeDetailPage.scriptTitle')}
            </Heading>
            {#if hasDeletedSubtitleLines}
              <Checkbox bind:checked={showDeleted}>{t('episodeDetailPage.showDeleted')}</Checkbox>
            {/if}
          </div>
          <TranscriptViewer
            subtitleLines={filteredSubtitleLines}
            currentTime={mediaPlayerStore.currentTime}
            {canMine}
            {contextBefore}
            {contextAfter}
            onSeek={(time) => mediaPlayer?.seek(time)}
            onMine={openMiningModal}
            onSave={handleSaveSubtitleLine}
            onDelete={handleDeleteRequest}
            onUndoDelete={handleUndoDelete}
          />
        </div>
      </div>

      <div class="flex flex-col lg:col-span-1 lg:min-h-0">
        <Heading tag="h2" class="mb-3 text-xl font-semibold">
          {t('episodeDetailPage.sentenceCardsTitle')}
        </Heading>
        <SentenceCardList sentenceCards={data.sentenceCards} onCardClick={handleCardClick} />
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center py-20">
      <Spinner size="8" />
    </div>
  {/if}
</div>

<SentenceMiningModal
  bind:openModal={isModalOpen}
  subtitleLine={miningTarget}
  {analysisResult}
  onCreate={createMiningCards}
  isProcessing={isProcessingMining}
  onClose={resetMiningModalState}
/>

<ConfirmModal
  bind:show={isConfirmModalOpen}
  title={t('episodeDetailPage.deleteConfirm.title')}
  message={t('episodeDetailPage.deleteConfirm.message')}
  onConfirm={handleDeleteConfirm}
  onClose={() => (isConfirmModalOpen = false)}
/>
