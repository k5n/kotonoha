<script lang="ts">
  import { goto } from '$app/navigation';
  import { debug } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import type { SentenceAnalysisItem } from '$lib/domain/entities/sentenceAnalysisResult';
  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import SentenceMiningModal from '$lib/presentation/components/SentenceMiningModal.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';

  const contextBefore = 5; // コンテキストに含める注目セリフの前のセリフ件数
  const contextAfter = 3; // コンテキストに含める注目セリフの後のセリフ件数

  let { data }: PageProps = $props();
  let currentTime = $state(0); // 現在の再生時間（秒）
  let isModalOpen = $state(false); // モーダルの開閉状態
  let miningTarget: Dialogue | null = $state(null);
  let sentenceAnalysisItems: readonly SentenceAnalysisItem[] = $state([]); // セリフの分析結果
  let isProcessingMining = $state(false); // マイニング処理中かどうかのフラグ

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      goto('/');
    }
  }

  function handleSeek(time: number) {
    currentTime = time;
  }

  async function openMiningModal(dialogue: Dialogue, context: readonly Dialogue[]) {
    debug(`Open mining modal for dialogue: ${dialogue.id}, context size: ${context.length}`);
    miningTarget = dialogue;
    sentenceAnalysisItems = [
      {
        expression: 'take off',
        definition: '（飛行機が）離陸する；（衣服などを）脱ぐ；（事業などが）軌道に乗る',
        partOfSpeech: 'Phrasal verb',
        exampleSentence: 'The plane will <b>take off</b> in 10 minutes.',
      },
      {
        expression: 'immediately',
        definition: 'すぐに、即座に',
        partOfSpeech: 'Adjective',
        exampleSentence: 'Please respond <b>immediately</b> to the emergency.',
      },
      {
        expression: 'on track',
        definition: '順調に進んで、予定通りで',
        partOfSpeech: 'Idiom',
        exampleSentence: 'The project is <b>on track</b> to finish by the deadline.',
      },
    ];
    isModalOpen = true;
  }

  async function createMiningCards(selectedResults: readonly SentenceAnalysisItem[]) {
    if (!miningTarget || sentenceAnalysisItems.length === 0) {
      debug('No mining target or analysis items available.');
      isModalOpen = false;
      return;
    }
    isProcessingMining = true;
    debug(`Creating mining cards for dialogue: ${miningTarget.id}`);
    // TODO: Implement the logic to create mining cards based on selectedResults
    await new Promise((resolve) => setTimeout(resolve, 1000));
    isModalOpen = false;
    isProcessingMining = false;
  }
</script>

<div class="p-4 md:p-6">
  <Button color="light" class="mb-4" onclick={goBack}>
    <ArrowLeftOutline class="me-2 h-5 w-5" />
    戻る
  </Button>

  {#if data.error}
    <Alert color="red">
      <ExclamationCircleOutline class="h-5 w-5" />
      <span class="font-medium">エラー:</span>
      {data.error}
    </Alert>
  {:else if data.episode}
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <Heading tag="h1" class="mb-2 text-3xl font-bold">{data.episode.title}</Heading>
        <p class="mb-6 text-gray-500">
          再生時間: {Math.floor((data.episode.durationSeconds ?? 0) / 60)}分 {Math.floor(
            (data.episode.durationSeconds ?? 0) % 60
          )}秒
        </p>

        <AudioPlayer src={data.audioBlobUrl} bind:currentTime />

        <div class="mt-6">
          <Heading tag="h2" class="mb-3 text-xl font-semibold">スクリプト</Heading>
          <TranscriptViewer
            dialogues={data.dialogues}
            {currentTime}
            {contextBefore}
            {contextAfter}
            onSeek={(e) => handleSeek(e)}
            onMine={openMiningModal}
          />
        </div>
      </div>

      <div class="lg:col-span-1">
        <Heading tag="h2" class="mb-3 text-xl font-semibold">Sentence Cards</Heading>
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
  {sentenceAnalysisItems}
  onCreate={createMiningCards}
  isProcessing={isProcessingMining}
/>
