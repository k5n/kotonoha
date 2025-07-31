<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import { deleteEpisode } from '$lib/application/usecases/deleteEpisode';
  import { fetchAlbumGroups } from '$lib/application/usecases/fetchAlbumGroups';
  import { moveEpisode } from '$lib/application/usecases/moveEpisode';
  import { updateEpisodeName } from '$lib/application/usecases/updateEpisodeName';
  import { updateEpisodesOrder } from '$lib/application/usecases/updateEpisodesOrder';
  import type { Episode } from '$lib/domain/entities/episode';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import ConfirmModal from '$lib/presentation/components/ConfirmModal.svelte';
  import EpisodeAddModal from '$lib/presentation/components/EpisodeAddModal.svelte';
  import EpisodeListTable from '$lib/presentation/components/EpisodeListTable.svelte';
  import EpisodeMoveModal from '$lib/presentation/components/EpisodeMoveModal.svelte';
  import EpisodeNameEditModal from '$lib/presentation/components/EpisodeNameEditModal.svelte';
  import { debug, error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ExclamationCircleOutline, FileOutline, PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let showEpisodeAddModal = $state(false);
  let showEpisodeMoveModal = $state(false);
  let showEpisodeNameEditModal = $state(false);
  let showDeleteConfirmModal = $state(false);
  let targetEpisode = $state<Episode | null>(null);
  let availableTargetGroups = $state<readonly EpisodeGroup[]>([]);
  let isSubmitting = $state(false);
  let errorMessage = $derived(data.error || '');
  let episodes = $derived(data.episodes);

  // === ページ遷移 ===

  function openEpisode(episodeId: number) {
    goto(`/episode/${episodeId}`);
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    debug(`Breadcrumb clicked: targetIndex=${targetIndex}`);
    if (groupPathStore.popTo(targetIndex)) {
      goto('/');
    }
  }

  // === エピソード追加 ===

  function openEpisodeAddModal() {
    showEpisodeAddModal = true;
  }

  async function handleEpisodeAddSubmit(
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
    showEpisodeAddModal = false;
  }

  // === エピソード移動 ===

  async function handleEpisodeMoveClick(episode: Episode) {
    try {
      const allAlbumGroups = await fetchAlbumGroups();
      availableTargetGroups = allAlbumGroups.filter((g) => g.id !== episode.episodeGroupId);
      targetEpisode = episode;
      showEpisodeMoveModal = true;
    } catch (e) {
      error(`Failed to fetch album groups: ${e}`);
      errorMessage = 'アルバムグループの取得に失敗しました';
    }
  }

  async function handleMoveEpisodeSubmit(targetGroupId: number) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await moveEpisode(targetEpisode.id, targetGroupId);
      await invalidateAll();
    } catch (e) {
      error(`Failed to move episode: ${e}`);
      errorMessage = 'エピソードの移動に失敗しました';
    } finally {
      showEpisodeMoveModal = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === エピソード削除 ===

  function handleEpisodeDeleteClick(episode: Episode) {
    targetEpisode = episode;
    showDeleteConfirmModal = true;
  }

  async function handleConfirmDelete() {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await deleteEpisode(targetEpisode);
      await invalidateAll();
    } catch (e) {
      error(`Failed to delete episode: ${e}`);
      errorMessage = 'エピソードの削除に失敗しました';
    } finally {
      showDeleteConfirmModal = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === エピソード名変更 ===

  function handleEpisodeRenameClick(episode: Episode) {
    targetEpisode = episode;
    showEpisodeNameEditModal = true;
  }

  async function handleEpisodeNameSubmit(newName: string) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await updateEpisodeName(targetEpisode.id, newName);
      await invalidateAll();
    } catch (e) {
      error(`Failed to update episode name: ${e}`);
      errorMessage = 'エピソード名の更新に失敗しました';
    } finally {
      showEpisodeNameEditModal = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  {#if errorMessage}
    <Alert color="red" class="mb-6">
      <ExclamationCircleOutline class="h-5 w-5" />
      <span class="font-medium">エラー:</span>
      {errorMessage}
    </Alert>
  {:else if data.episodeGroup}
    <div class="mb-4 flex items-center justify-between">
      <div>
        <Heading tag="h1" class="text-3xl font-bold">{data.episodeGroup.name}</Heading>
      </div>
      <Button onclick={openEpisodeAddModal}>
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
        <Button color="alternative" onclick={openEpisodeAddModal}>
          <PlusOutline class="me-2 h-5 w-5" />
          最初のエピソードを追加
        </Button>
      </div>
    {:else}
      <EpisodeListTable
        {episodes}
        onEpisodeClick={openEpisode}
        onEpisodeMoveClick={handleEpisodeMoveClick}
        onEpisodeDeleteClick={handleEpisodeDeleteClick}
        onEpisodeRenameClick={handleEpisodeRenameClick}
        onOrderChange={async (newOrder) => {
          episodes = newOrder;
          await updateEpisodesOrder(newOrder);
        }}
      />
    {/if}
  {:else}
    <div class="flex items-center justify-center py-20">
      <Spinner size="8" />
      <span class="ms-4 text-gray-500">読み込み中...</span>
    </div>
  {/if}
</div>

<EpisodeAddModal
  show={showEpisodeAddModal}
  onClose={() => (showEpisodeAddModal = false)}
  onSubmit={handleEpisodeAddSubmit}
/>

<EpisodeMoveModal
  show={showEpisodeMoveModal}
  {isSubmitting}
  episode={targetEpisode}
  {availableTargetGroups}
  onClose={() => {
    showEpisodeMoveModal = false;
    targetEpisode = null;
  }}
  onSubmit={handleMoveEpisodeSubmit}
/>

<EpisodeNameEditModal
  show={showEpisodeNameEditModal}
  {isSubmitting}
  initialName={targetEpisode?.title}
  onClose={() => {
    showEpisodeNameEditModal = false;
    targetEpisode = null;
  }}
  onSubmit={handleEpisodeNameSubmit}
/>

<ConfirmModal
  bind:show={showDeleteConfirmModal}
  title="エピソードの削除"
  message={`エピソード「${targetEpisode?.title}」を削除しますか？関連するデータも全て削除されます。`}
  {isSubmitting}
  onConfirm={handleConfirmDelete}
  onClose={() => {
    showDeleteConfirmModal = false;
    targetEpisode = null;
  }}
/>
