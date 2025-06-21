<script lang="ts">
  import { goto } from '$app/navigation';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  import AudioPlayer from '$lib/presentation/components/AudioPlayer.svelte';
  import SentenceCardList from '$lib/presentation/components/SentenceCardList.svelte';
  import TranscriptViewer from '$lib/presentation/components/TranscriptViewer.svelte';

  let { data }: PageProps = $props();
  // オーディオプレイヤーと共有する状態
  let currentTime = $state(0); // 現在の再生時間（秒）

  function goBack() {
    history.length > 1 ? history.back() : goto('/');
  }

  function handleSeek(time: number) {
    // Transcriptから来たシーク要求をAudioPlayerに伝える
    // ここではAudioPlayerコンポーネントが持つであろうseek関数を呼び出すことを想定
    const player = document.getElementById('audio-player') as HTMLAudioElement | null;
    if (player) player.currentTime = time;
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

        <AudioPlayer src={data.episode.audioPath} bind:currentTime />

        <div class="mt-6">
          <Heading tag="h2" class="mb-3 text-xl font-semibold">スクリプト</Heading>
          <TranscriptViewer
            dialogues={data.episode.dialogues}
            {currentTime}
            onSeek={(e) => handleSeek(e)}
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
