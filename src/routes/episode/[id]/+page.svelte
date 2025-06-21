<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  function goBack() {
    // エピソード一覧画面へ戻る（グループIDが必要な場合は適宜修正）
    history.length > 1 ? history.back() : goto('/');
  }
</script>

<div class="p-4 md:p-6">
  <button
    class="mb-4 rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
    onclick={goBack}
  >
    ← エピソード一覧に戻る
  </button>
  {#if data.error}
    <div class="mb-4 font-bold text-red-600">{data.error}</div>
  {:else if data.episode}
    <h1 class="mb-2 text-2xl font-bold">{data.episode.title}</h1>
    <div class="mb-4 text-gray-600">
      エピソードID: {data.episode.id} ／ 再生時間: {data.episode.durationSeconds ?? '不明'}秒
    </div>
    <audio controls class="mb-6">
      <source src={data.episode.audioPath} type="audio/mpeg" />
      お使いのブラウザは audio タグをサポートしていません。
    </audio>
    <h2 class="mb-2 text-xl font-semibold">Sentence Cards</h2>
    {#if data.sentenceCards.length === 0}
      <div class="text-gray-500">このエピソードにはSentence Cardがありません。</div>
    {:else}
      <ul class="space-y-2">
        {#each data.sentenceCards as card}
          <li class="rounded border p-3">
            <div class="font-bold">{card.targetExpression}</div>
            <div class="mb-1 text-gray-700">{card.sentence}</div>
            <div class="text-sm text-gray-500">{card.definition}</div>
            <div class="mt-1 text-xs text-gray-400">
              作成日: {card.createdAt.toLocaleString?.() ?? card.createdAt}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <div class="text-gray-500">読み込み中...</div>
  {/if}
</div>
