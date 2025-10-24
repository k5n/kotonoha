<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
  import { addSentenceCards } from '$lib/application/usecases/addSentenceCards';
  import { analyzeDialogueForMining } from '$lib/application/usecases/analyzeDialogueForMining';
  import { PLAYER_DIV_ID } from '$lib/application/usecases/mediaPlayer/youtubePlayer';
  import { softDeleteDialogue } from '$lib/application/usecases/softDeleteDialogue';
  import { undoSoftDeleteDialogue } from '$lib/application/usecases/undoSoftDeleteDialogue';
  import { updateDialogue } from '$lib/application/usecases/updateDialogue';
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import type {
    SentenceAnalysisItem,
    SentenceAnalysisResult,
  } from '$lib/domain/entities/sentenceAnalysisResult';
  import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
  import { keyboardShortcuts } from '$lib/presentation/actions/keyboardShortcuts';
  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import ConfirmModal from '$lib/presentation/components/ConfirmModal.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import SentenceMiningModal from '$lib/presentation/components/SentenceMiningModal.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';
  import { Alert, Button, Checkbox, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';
  import type { PageProps } from './$types';

  const contextBefore = 5; // コンテキストに含める注目セリフの前のセリフ件数
  const contextAfter = 3; // コンテキストに含める注目セリフの後のセリフ件数

  let { data }: PageProps = $props();

  // --- Component State ---
  let isModalOpen = $state(false);
  let miningTarget: Dialogue | null = $state(null);
  let analysisResult: SentenceAnalysisResult | null = $state(null);
  let isProcessingMining = $state(false);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let canMine = $derived(data.isApiKeySet || false);
  let showDeleted = $state(false);

  // Delete confirmation
  let isConfirmModalOpen = $state(false);
  let dialogueToDeleteId: number | null = $state(null);

  // --- Derived State ---
  const filteredDialogues = $derived(
    (data.dialogues ?? []).filter((d) => showDeleted || !d.deletedAt)
  );
  const hasDeletedDialogues = $derived(data.dialogues?.some((d) => d.deletedAt !== null) ?? false);
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
    const dialogue = data.dialogues?.find((d) => d.id === card.dialogueId);
    if (dialogue) {
      mediaPlayer?.seek(dialogue.startTimeMs);
    } else {
      console.error(
        `Dialogue not found for sentence card: ${card.id}, dialogueId: ${card.dialogueId}`
      );
    }
  }

  async function openMiningModal(dialogue: Dialogue, context: readonly Dialogue[]) {
    console.info(`Open mining modal for dialogue: ${dialogue.id}, context size: ${context.length}`);
    miningTarget = dialogue;
    isModalOpen = true;
    try {
      analysisResult = await analyzeDialogueForMining(dialogue, context);
    } catch (err) {
      console.error(`Error analyzing dialogue for mining: ${err}`);
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

  async function handleSaveDialogue(details: { dialogueId: number; correctedText: string }) {
    const { dialogueId, correctedText } = details;
    try {
      await updateDialogue(dialogueId, correctedText);
      await invalidateAll();
    } catch (err) {
      console.error(`Error updating dialogue: ${err}`);
      errorMessage = t('episodeDetailPage.errors.updateDialogueFailed');
    }
  }

  function handleDeleteRequest(dialogueId: number) {
    dialogueToDeleteId = dialogueId;
    isConfirmModalOpen = true;
  }

  async function handleDeleteConfirm() {
    if (dialogueToDeleteId === null) return;

    try {
      await softDeleteDialogue(dialogueToDeleteId);
      await invalidateAll();
    } catch (err) {
      console.error(`Error soft deleting dialogue: ${err}`);
      errorMessage = t('episodeDetailPage.errors.deleteDialogueFailed');
    } finally {
      isConfirmModalOpen = false;
      dialogueToDeleteId = null;
    }
  }

  async function handleUndoDelete(dialogueId: number) {
    try {
      await undoSoftDeleteDialogue(dialogueId);
      await invalidateAll();
    } catch (err) {
      console.error(`Error undoing soft delete for dialogue: ${err}`);
      errorMessage = t('episodeDetailPage.errors.undoDeleteDialogueFailed');
    }
  }
</script>

<div
  use:keyboardShortcuts={{
    mediaPlayer,
    dialogues: filteredDialogues,
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
    <Alert color="red">
      <ExclamationCircleOutline class="h-5 w-5" />
      <span class="font-medium">{t('episodeDetailPage.errorPrefix')}</span>
      {errorMessage}
    </Alert>
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
            <div id={PLAYER_DIV_ID} class="aspect-video h-full w-full"></div>
          {/if}
        </div>

        <div class="mt-6 flex flex-col lg:min-h-0 lg:flex-1">
          <div class="mb-3 flex items-center justify-between">
            <Heading tag="h2" class="text-xl font-semibold">
              {t('episodeDetailPage.scriptTitle')}
            </Heading>
            {#if hasDeletedDialogues}
              <Checkbox bind:checked={showDeleted}>{t('episodeDetailPage.showDeleted')}</Checkbox>
            {/if}
          </div>
          <TranscriptViewer
            dialogues={filteredDialogues}
            currentTime={mediaPlayerStore.currentTime}
            {canMine}
            {contextBefore}
            {contextAfter}
            onSeek={(time) => mediaPlayer?.seek(time)}
            onMine={openMiningModal}
            onSave={handleSaveDialogue}
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
  dialogue={miningTarget}
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
