<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { debug, error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { onDestroy, onMount } from 'svelte';
  import type { PageProps } from './$types';

  import { addSentenceCards } from '$lib/application/usecases/addSentenceCards';
  import { analyzeDialogueForMining } from '$lib/application/usecases/analyzeDialogueForMining';
  import {
    listenPlaybackPosition,
    pauseAudio,
    playAudio,
    resumeAudio,
    seekAudio,
    stopAudio,
  } from '$lib/application/usecases/controlAudio';
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import type {
    SentenceAnalysisItem,
    SentenceAnalysisResult,
  } from '$lib/domain/entities/sentenceAnalysisResult';
  import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import SentenceMiningModal from '$lib/presentation/components/SentenceMiningModal.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';

  const contextBefore = 5; // コンテキストに含める注目セリフの前のセリフ件数
  const contextAfter = 3; // コンテキストに含める注目セリフの後のセリフ件数

  let { data }: PageProps = $props();

  // Audio Player State
  let currentTime = $state(0);

  // Sentence Mining State
  let isModalOpen = $state(false);
  let miningTarget: Dialogue | null = $state(null);
  let analysisResult: SentenceAnalysisResult | null = $state(null);
  let isProcessingMining = $state(false);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let canMine = $derived(data.isApiKeySet || false);

  let unlisten: (() => void) | undefined;

  onMount(async () => {
    unlisten = await listenPlaybackPosition((positionMs) => {
      currentTime = positionMs;
    });
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    stopAudio();
  });

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      goto('/');
    }
  }

  async function handlePlay() {
    const audioPath = data.episode?.audioPath;
    if (!audioPath) return;
    await playAudio();
  }

  function handleStop() {
    stopAudio();
    currentTime = 0;
  }

  function handleCardClick(card: SentenceCard) {
    const dialogue = data.dialogues?.find((d) => d.id === card.dialogueId);
    if (dialogue) {
      seekAudio(dialogue.startTimeMs);
    } else {
      error(`Dialogue not found for sentence card: ${card.id}, dialogueId: ${card.dialogueId}`);
    }
  }

  async function openMiningModal(dialogue: Dialogue, context: readonly Dialogue[]) {
    debug(`Open mining modal for dialogue: ${dialogue.id}, context size: ${context.length}`);
    miningTarget = dialogue;
    isModalOpen = true;
    try {
      analysisResult = await analyzeDialogueForMining(dialogue, context);
    } catch (err) {
      error(`Error analyzing dialogue for mining: ${err}`);
      errorMessage = t('episodeDetailPage.errors.analyzeFailed');
      resetMiningModalState();
    }
  }

  async function createMiningCards(selectedItems: readonly SentenceAnalysisItem[]) {
    if (!miningTarget) {
      debug('No mining target available.');
      isModalOpen = false;
      return;
    }
    isProcessingMining = true;

    try {
      const selectedCardIds = selectedItems.map((item) => item.id);
      await addSentenceCards(selectedCardIds);
    } catch (err) {
      error(`Error in createMiningCards: ${err}`);
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
</script>

<div class="p-4 md:p-6 lg:flex lg:h-full lg:flex-col">
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
          {#await data.audioInfo}
            <div class="flex items-center justify-center py-8">
              <Spinner size="8" />
            </div>
          {:then audioInfo}
            <AudioPlayer
              peaks={audioInfo.peaks}
              {currentTime}
              duration={audioInfo.duration}
              onPlay={handlePlay}
              onPause={pauseAudio}
              onSeek={seekAudio}
              onResume={resumeAudio}
              onStop={handleStop}
            />
          {:catch}
            <Alert color="red">
              <ExclamationCircleOutline class="h-5 w-5" />
              <span class="font-medium">{t('episodeDetailPage.errorPrefix')}</span>
              {t('episodeDetailPage.errors.audioLoadFailed')}
            </Alert>
          {/await}
        </div>

        <div class="mt-6 flex flex-col lg:min-h-0 lg:flex-1">
          <Heading tag="h2" class="mb-3 text-xl font-semibold">
            {t('episodeDetailPage.scriptTitle')}
          </Heading>
          <TranscriptViewer
            dialogues={data.dialogues}
            {currentTime}
            {canMine}
            {contextBefore}
            {contextAfter}
            onSeek={seekAudio}
            onMine={openMiningModal}
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
