<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { debug, error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  import { addSentenceCards } from '$lib/application/usecases/addSentenceCards';
  import { analyzeDialogueForMining } from '$lib/application/usecases/analyzeDialogueForMining';
  import { pauseAudio } from '$lib/application/usecases/pauseAudio';
  import { playAudio } from '$lib/application/usecases/playAudio';
  import { resumeAudio } from '$lib/application/usecases/resumeAudio';
  import { seekAudio } from '$lib/application/usecases/seekAudio';
  import { stopAudio } from '$lib/application/usecases/stopAudio';
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import type {
    SentenceAnalysisItem,
    SentenceAnalysisResult,
  } from '$lib/domain/entities/sentenceAnalysisResult';
  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import SentenceMiningModal from '$lib/presentation/components/SentenceMiningModal.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';

  const contextBefore = 5; // コンテキストに含める注目セリフの前のセリフ件数
  const contextAfter = 3; // コンテキストに含める注目セリフの後のセリフ件数

  let { data }: PageProps = $props();

  // Audio Player State
  let audioState = $state({
    isPlaying: false,
    currentTime: 0,
  });
  let timerId: ReturnType<typeof setInterval> | null = $state(null);

  // Sentence Mining State
  let isModalOpen = $state(false);
  let miningTarget: Dialogue | null = $state(null);
  let analysisResult: SentenceAnalysisResult | null = $state(null);
  let isProcessingMining = $state(false);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let canMine = $derived(data.isApiKeySet || false);

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      goto('/');
    }
  }

  // Audio Player Handlers
  function handlePlay() {
    const audioPath = data.episode?.audioPath;
    if (!audioPath) return;
    playAudio(audioPath);
    audioState.isPlaying = true;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (audioState.currentTime < (data.episode?.durationSeconds ?? 0)) {
        audioState.currentTime++;
      } else {
        handlePause();
      }
    }, 1000);
  }

  function handlePause() {
    pauseAudio();
    audioState.isPlaying = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function handleSeek(time: number) {
    seekAudio(time * 1000);
    audioState.currentTime = time;
  }

  function handleResume() {
    resumeAudio();
    audioState.isPlaying = true;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (audioState.currentTime < (data.episode?.durationSeconds ?? 0)) {
        audioState.currentTime++;
      } else {
        handlePause();
      }
    }, 1000);
  }

  function handleStop() {
    stopAudio();
    audioState.isPlaying = false;
    audioState.currentTime = 0;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
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
          <Heading tag="h1" class="mb-2 text-3xl font-bold">{data.episode.title}</Heading>
          <p class="mb-6 text-gray-500">
            {t('episodeDetailPage.playbackTime', {
              minutes: Math.floor((data.episode.durationSeconds ?? 0) / 60),
              seconds: Math.floor((data.episode.durationSeconds ?? 0) % 60),
            })}
          </p>
          <AudioPlayer
            isPlaying={audioState.isPlaying}
            currentTime={audioState.currentTime}
            duration={data.episode.durationSeconds}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onResume={handleResume}
            onStop={handleStop}
          />
        </div>

        <div class="mt-6 flex flex-col lg:min-h-0 lg:flex-1">
          <Heading tag="h2" class="mb-3 text-xl font-semibold">
            {t('episodeDetailPage.scriptTitle')}
          </Heading>
          <TranscriptViewer
            dialogues={data.dialogues}
            currentTime={audioState.currentTime}
            {canMine}
            {contextBefore}
            {contextAfter}
            onSeek={handleSeek}
            onMine={openMiningModal}
          />
        </div>
      </div>

      <div class="flex flex-col lg:col-span-1 lg:min-h-0">
        <Heading tag="h2" class="mb-3 text-xl font-semibold">
          {t('episodeDetailPage.sentenceCardsTitle')}
        </Heading>
        <SentenceCardList sentenceCards={data.sentenceCards} />
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
