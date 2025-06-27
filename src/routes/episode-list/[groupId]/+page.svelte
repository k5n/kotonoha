<script lang="ts">
  import { goto } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import { debug } from '@tauri-apps/plugin-log';
  import {
    Alert,
    Button,
    Heading,
    Spinner,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import {
    ChevronRightOutline,
    ExclamationCircleOutline,
    FileOutline,
    PlusOutline,
  } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // エピソード詳細ページへ遷移
  function openEpisode(episodeId: number) {
    goto(`/episode/${episodeId}`);
  }

  // 新規エピソード追加ダイアログを開く（ダミー）
  function addNewEpisode() {
    alert('新規エピソード追加ダイアログを開きます。');
  }

  const handleBreadcrumbClick = (targetIndex: number | null) => {
    debug(`Breadcrumb clicked: targetIndex=${targetIndex}`);
    if (groupPathStore.popTo(targetIndex)) {
      goto('/');
    }
  };

  function formatDate(date: Date) {
    try {
      // TODO: 日付フォーマットをカスタマイズ
      return date.toLocaleDateString();
    } catch {
      return '----/--/--';
    }
  }
</script>

<div class="p-4 md:p-6">
  {#if data.error}
    <Alert color="red" class="mb-6">
      <ExclamationCircleOutline class="h-5 w-5" />
      <span class="font-medium">エラー:</span>
      {data.error}
    </Alert>
  {:else if data.episodeGroup}
    <div class="mb-4 flex items-center justify-between">
      <div>
        <Heading tag="h1" class="text-3xl font-bold">{data.episodeGroup.name}</Heading>
      </div>
      <Button onclick={addNewEpisode}>
        <PlusOutline class="me-2 h-5 w-5" />
        エピソードを追加
      </Button>
    </div>

    <div class="mb-6">
      <Breadcrumbs path={groupPathStore.path} onNavigate={handleBreadcrumbClick} />
    </div>

    {#if data.episodes.length === 0}
      <div class="mt-8 rounded-lg border-2 border-dashed px-6 py-16 text-center">
        <FileOutline class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <Heading tag="h3" class="mb-2 text-xl font-semibold">エピソードがありません</Heading>
        <p class="mb-4 text-gray-500">このコレクションに最初のエピソードを追加しましょう。</p>
        <Button color="alternative" onclick={addNewEpisode}>
          <PlusOutline class="me-2 h-5 w-5" />
          最初のエピソードを追加
        </Button>
      </div>
    {:else}
      <div class="mt-6 overflow-hidden rounded-lg border">
        <Table hoverable={true}>
          <TableHead>
            <TableHeadCell>タイトル</TableHeadCell>
            <TableHeadCell>追加日</TableHeadCell>
            <TableHeadCell class="text-center">Sentence Cards</TableHeadCell>
            <TableHeadCell><span class="sr-only">開く</span></TableHeadCell>
          </TableHead>
          <TableBody>
            {#each data.episodes as episode (episode.id)}
              <TableBodyRow class="cursor-pointer" onclick={() => openEpisode(episode.id)}>
                <TableBodyCell class="font-semibold">{episode.title}</TableBodyCell>
                <TableBodyCell>{formatDate(episode.createdAt)}</TableBodyCell>
                <!-- TODO: Sentence Mining 数の表示 -->
                <TableBodyCell class="text-center">0</TableBodyCell>
                <TableBodyCell>
                  <ChevronRightOutline class="h-5 w-5 text-gray-500" />
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  {:else}
    <div class="flex items-center justify-center py-20">
      <Spinner size="8" />
      <span class="ms-4 text-gray-500">読み込み中...</span>
    </div>
  {/if}
</div>
