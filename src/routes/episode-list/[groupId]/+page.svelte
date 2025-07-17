<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import { fetchAlbumGroups } from '$lib/application/usecases/fetchAlbumGroups';
  import { moveEpisode } from '$lib/application/usecases/moveEpisode';
  import type { Episode } from '$lib/domain/entities/episode';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import EpisodeAddModal from '$lib/presentation/components/EpisodeAddModal.svelte';
  import EpisodeMoveModal from '$lib/presentation/components/EpisodeMoveModal.svelte';
  import { formatDate } from '$lib/presentation/utils/dateFormatter';
  import { debug, error } from '@tauri-apps/plugin-log';
  import {
    Alert,
    Button,
    Dropdown,
    DropdownItem,
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
    DotsHorizontalOutline,
    ExclamationCircleOutline,
    FileOutline,
    PlusOutline,
  } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let showAddEpisodeModal = $state(false);
  let showMoveEpisodeModal = $state(false);
  let targetEpisode = $state<Episode | null>(null);
  let availableTargetGroups = $state<readonly EpisodeGroup[]>([]);
  let isSubmitting = $state(false);

  let episodes = $derived(data.episodes);

  // エピソード詳細ページへ遷移
  function openEpisode(episodeId: number) {
    goto(`/episode/${episodeId}`);
  }

  // 新規エピソード追加ダイアログを開く
  function openAddEpisodeModal() {
    showAddEpisodeModal = true;
  }

  // エピソード移動モーダルを開く
  async function handleMoveClick(event: MouseEvent, episode: Episode) {
    event.stopPropagation();
    try {
      const allAlbumGroups = await fetchAlbumGroups();
      availableTargetGroups = allAlbumGroups.filter((g) => g.id !== episode.episodeGroupId);
      targetEpisode = episode;
      showMoveEpisodeModal = true;
    } catch (e) {
      error(`Failed to fetch album groups: ${e}`);
    }
  }

  async function handleAddEpisodeSubmit(
    title: string,
    audioFile: File,
    srtFile: File,
    duration: number
  ) {
    debug(`title: ${title}, audio: ${audioFile.name}, script: ${srtFile.name}`);
    const groupId = data.episodeGroup?.id;
    if (!groupId) {
      debug('No group ID found, cannot add episode');
      return;
    }
    const maxDisplayOrder = episodes.reduce((max, ep) => Math.max(max, ep.displayOrder || 0), 0);
    await addNewEpisode({
      episodeGroupId: groupId,
      displayOrder: maxDisplayOrder + 1,
      title,
      audioFile,
      scriptFile: srtFile,
      durationSeconds: duration,
    });
    await invalidateAll();
    showAddEpisodeModal = false;
  }

  async function handleMoveEpisodeSubmit(targetGroupId: number) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await moveEpisode(targetEpisode.id, targetGroupId);
      await invalidateAll();
    } catch (e) {
      error(`Failed to move episode: ${e}`);
    } finally {
      showMoveEpisodeModal = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  const handleBreadcrumbClick = (targetIndex: number | null) => {
    debug(`Breadcrumb clicked: targetIndex=${targetIndex}`);
    if (groupPathStore.popTo(targetIndex)) {
      goto('/');
    }
  };
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
      <Button onclick={openAddEpisodeModal}>
        <PlusOutline class="me-2 h-5 w-5" />
        エピソードを追加
      </Button>
    </div>

    <div class="mb-6">
      <Breadcrumbs path={groupPathStore.path} onNavigate={handleBreadcrumbClick} />
    </div>

    {#if episodes.length === 0}
      <div class="mt-8 rounded-lg border-2 border-dashed px-6 py-16 text-center">
        <FileOutline class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <Heading tag="h3" class="mb-2 text-xl font-semibold">エピソードがありません</Heading>
        <p class="mb-4 text-gray-500">このコレクションに最初のエピソードを追加しましょう。</p>
        <Button color="alternative" onclick={openAddEpisodeModal}>
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
            <TableHeadCell class="text-center">Cards</TableHeadCell>
            <TableHeadCell><span class="sr-only">Actions</span></TableHeadCell>
          </TableHead>
          <TableBody>
            {#each episodes as episode (episode.id)}
              <TableBodyRow class="cursor-pointer" onclick={() => openEpisode(episode.id)}>
                <TableBodyCell class="font-semibold">{episode.title}</TableBodyCell>
                <TableBodyCell>{formatDate(episode.createdAt)}</TableBodyCell>
                <TableBodyCell class="text-center">{episode.sentenceCardCount}</TableBodyCell>
                <TableBodyCell>
                  <div class="flex justify-center">
                    <Button
                      size="xs"
                      pill
                      color="alternative"
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation(); // イベント伝播を停止
                      }}
                      onkeydown={(e: KeyboardEvent) => {
                        e.stopPropagation(); // キーボードイベントの伝播も停止
                      }}
                    >
                      <DotsHorizontalOutline class="h-4 w-4" />
                    </Button>
                    <Dropdown simple>
                      <DropdownItem onclick={(e: MouseEvent) => handleMoveClick(e, episode)}>
                        移動
                      </DropdownItem>
                    </Dropdown>
                  </div>
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

<EpisodeAddModal
  show={showAddEpisodeModal}
  onClose={() => (showAddEpisodeModal = false)}
  onSubmit={handleAddEpisodeSubmit}
/>

<EpisodeMoveModal
  show={showMoveEpisodeModal}
  {isSubmitting}
  episode={targetEpisode}
  {availableTargetGroups}
  onClose={() => {
    showMoveEpisodeModal = false;
    targetEpisode = null;
  }}
  onSubmit={handleMoveEpisodeSubmit}
/>
