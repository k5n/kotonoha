<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { addNewEpisode } from '$lib/application/usecases/addNewEpisode';
  import { deleteEpisode } from '$lib/application/usecases/deleteEpisode';
  import { downloadTtsModel } from '$lib/application/usecases/downloadTtsModel';
  import { fetchAlbumGroups } from '$lib/application/usecases/fetchAlbumGroups';
  import { fetchTtsVoices } from '$lib/application/usecases/fetchTtsVoices';
  import { fetchYoutubeMetadata } from '$lib/application/usecases/fetchYoutubeMetadata';
  import { moveEpisode } from '$lib/application/usecases/moveEpisode';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
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
  import TtsModelDownloadModal from '$lib/presentation/components/TtsModelDownloadModal.svelte';
  import { debug, error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { ExclamationCircleOutline, FileOutline, PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let showEpisodeMove = $state(false);
  let showEpisodeNameEdit = $state(false);
  let showDeleteConfirm = $state(false);
  let targetEpisode = $state<Episode | null>(null);
  let availableTargetGroups = $state<readonly EpisodeGroup[]>([]);
  let isSubmitting = $state(false);

  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let episodes = $derived(data.episodes);

  // === ページ遷移 ===

  function openEpisode(episodeId: number) {
    goto(`/episode/${episodeId}`);
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    debug(`Breadcrumb clicked: targetIndex=${targetIndex}`);
    if (groupPathStore.popTo(targetIndex)) {
      goto(groupPathStore.url);
    }
  }

  // === エピソード追加 ===

  async function handleEpisodeAddSubmit() {
    try {
      const episodeGroupId = data.episodeGroup?.id;
      if (!episodeGroupId) {
        error('No group ID found, cannot add episode (this should not happen)');
        return;
      }

      // Check if TTS is required
      if (episodeAddStore.isTtsRequired()) {
        debug('TTS is required for the new episode');
        // Download TTS model if needed
        await downloadTtsModel();

        // TODO: TTS execution and episode creation
        console.log('TTS処理は今回スコープ外');
        return;
      }

      // Normal episode creation (when TTS is not required)
      await addNewEpisode(episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      error(`Failed to add new episode: ${e}`);
      errorMessage = t('episodeListPage.errors.addEpisode');
    }
  }

  // === エピソード移動 ===

  async function handleEpisodeMoveClick(episode: Episode) {
    try {
      const allAlbumGroups = await fetchAlbumGroups();
      availableTargetGroups = allAlbumGroups.filter((g) => g.id !== episode.episodeGroupId);
      targetEpisode = episode;
      showEpisodeMove = true;
    } catch (e) {
      error(`Failed to fetch album groups: ${e}`);
      errorMessage = t('episodeListPage.errors.fetchAlbumGroups');
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
      errorMessage = t('episodeListPage.errors.moveEpisode');
    } finally {
      showEpisodeMove = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === エピソード削除 ===

  function handleEpisodeDeleteClick(episode: Episode) {
    targetEpisode = episode;
    showDeleteConfirm = true;
  }

  async function handleConfirmDelete() {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await deleteEpisode(targetEpisode);
      await invalidateAll();
    } catch (e) {
      error(`Failed to delete episode: ${e}`);
      errorMessage = t('episodeListPage.errors.deleteEpisode');
    } finally {
      showDeleteConfirm = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === エピソード名変更 ===

  function handleEpisodeRenameClick(episode: Episode) {
    targetEpisode = episode;
    showEpisodeNameEdit = true;
  }

  async function handleEpisodeNameSubmit(newName: string) {
    if (!targetEpisode) return;
    isSubmitting = true;
    try {
      await updateEpisodeName(targetEpisode.id, newName);
      await invalidateAll();
    } catch (e) {
      error(`Failed to update episode name: ${e}`);
      errorMessage = t('episodeListPage.errors.updateName');
    } finally {
      showEpisodeNameEdit = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  {#if errorMessage}
    <Alert color="red" class="mb-6">
      <ExclamationCircleOutline class="h-5 w-5" />
      <span class="font-medium">{t('episodeListPage.errorPrefix')}</span>
      {errorMessage}
    </Alert>
  {/if}
  {#if data.episodeGroup}
    <div class="mb-4 flex items-center justify-between">
      <div>
        <Heading tag="h1" class="text-3xl font-bold">{data.episodeGroup.name}</Heading>
      </div>
      <Button onclick={episodeAddStore.open}>
        <PlusOutline class="me-2 h-5 w-5" />
        {t('episodeListPage.addNewButton')}
      </Button>
    </div>

    <div class="mb-6">
      <Breadcrumbs path={groupPathStore.path} onNavigate={handleBreadcrumbClick} />
    </div>

    {#if episodes.length === 0}
      <div class="mt-8 rounded-lg border-2 border-dashed px-6 py-16 text-center">
        <FileOutline class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <Heading tag="h3" class="mb-2 text-xl font-semibold"
          >{t('episodeListPage.emptyState.title')}</Heading
        >
        <p class="mb-4 text-gray-500">{t('episodeListPage.emptyState.message')}</p>
        <Button color="alternative" onclick={episodeAddStore.open}>
          <PlusOutline class="me-2 h-5 w-5" />
          {t('episodeListPage.emptyState.addButton')}
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
      <span class="ms-4 text-gray-500">{t('episodeListPage.loading')}</span>
    </div>
  {/if}
</div>

<EpisodeAddModal
  onTsvFileSelected={previewScriptFile}
  onYoutubeUrlChanged={fetchYoutubeMetadata}
  onSubmit={handleEpisodeAddSubmit}
  onTtsEnabled={fetchTtsVoices}
/>

<EpisodeMoveModal
  show={showEpisodeMove}
  {isSubmitting}
  episode={targetEpisode}
  {availableTargetGroups}
  onClose={() => {
    showEpisodeMove = false;
    targetEpisode = null;
  }}
  onSubmit={handleMoveEpisodeSubmit}
/>

<EpisodeNameEditModal
  show={showEpisodeNameEdit}
  {isSubmitting}
  initialName={targetEpisode?.title}
  onClose={() => {
    showEpisodeNameEdit = false;
    targetEpisode = null;
  }}
  onSubmit={handleEpisodeNameSubmit}
/>

<ConfirmModal
  bind:show={showDeleteConfirm}
  title={t('episodeListPage.confirmDelete.title')}
  message={t('episodeListPage.confirmDelete.message', { episodeTitle: targetEpisode?.title })}
  {isSubmitting}
  onConfirm={handleConfirmDelete}
  onClose={() => {
    showDeleteConfirm = false;
    targetEpisode = null;
  }}
/>

<TtsModelDownloadModal />
