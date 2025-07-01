<script lang="ts">
  import { goto } from '$app/navigation';
  import { debug } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import SentenceMiningModal from '$lib/presentation/components/SentenceMiningModal.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';

  let { data }: PageProps = $props();
  let currentTime = $state(0); // 現在の再生時間（秒）
  let isModalOpen = $state(false); // モーダルの開閉状態
  let miningTarget: Dialogue | null = $state(null);

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

  function openMiningModal(dialogue: Dialogue) {
    debug(`Open mining modal for dialogue: ${dialogue.id}`);
    miningTarget = dialogue;
    isModalOpen = true;
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
  onCreate={(e) => {
    debug(`Create cards: ${e}`); // TODO: カード作成処理
  }}
/>
