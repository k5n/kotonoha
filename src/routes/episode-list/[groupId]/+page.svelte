<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { deleteEpisode } from '$lib/application/usecases/deleteEpisode';
  import { fetchAvailableTargetGroupsForEpisodeMove } from '$lib/application/usecases/fetchAvailableTargetGroupsForEpisodeMove';
  import { moveEpisode } from '$lib/application/usecases/moveEpisode';
  import { updateEpisodeName } from '$lib/application/usecases/updateEpisodeName';
  import { updateEpisodesOrder } from '$lib/application/usecases/updateEpisodesOrder';
  import type { Episode } from '$lib/domain/entities/episode';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/presentational/Breadcrumbs.svelte';
  import ConfirmModal from '$lib/presentation/components/presentational/ConfirmModal.svelte';
  import EmptyStateDisplay from '$lib/presentation/components/presentational/EmptyStateDisplay.svelte';
  import ErrorWarningToast from '$lib/presentation/components/presentational/ErrorWarningToast.svelte';
  import LoadErrorAlert from '$lib/presentation/components/presentational/LoadErrorAlert.svelte';
  import PageLoadingSpinner from '$lib/presentation/components/presentational/PageLoadingSpinner.svelte';
  import { Heading } from 'flowbite-svelte';
  import { FileOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';
  import EpisodeAddContainer from './container/EpisodeAddContainer.svelte';
  import EpisodeListTable from './presentational/EpisodeListTable.svelte';
  import EpisodeMoveModal from './presentational/EpisodeMoveModal.svelte';
  import EpisodeNameEditModal from './presentational/EpisodeNameEditModal.svelte';

  let { data }: PageProps = $props();
  let errorMessage = $state('');
  let isTransitioning = $state(false);
  let showEpisodeMove = $state(false);
  let showEpisodeNameEdit = $state(false);
  let showDeleteConfirm = $state(false);
  let targetEpisode = $state<Episode | null>(null);
  let availableTargetGroups = $state<readonly EpisodeGroup[]>([]);
  let isSubmitting = $state(false);
  let showAddEpisode = $state(false);

  let loadErrorMessage = $derived(data.errorKey ? t(data.errorKey) : '');
  let episodes = $derived(data.episodes);
  let currentGroupName = $derived(groupPathStore.current?.name ?? 'Home');

  // === Page transition ===

  function openEpisode(episodeId: number) {
    isTransitioning = true;
    goto(`/episode/${episodeId}`);
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    if (groupPathStore.popTo(targetIndex)) {
      goto(groupPathStore.url);
    }
  }

  // === Move episode ===

  async function handleEpisodeMoveClick(episode: Episode) {
    try {
      availableTargetGroups = await fetchAvailableTargetGroupsForEpisodeMove(
        episode.episodeGroupId
      );
      targetEpisode = episode;
      showEpisodeMove = true;
    } catch (e) {
      console.error(`Failed to fetch album groups: ${e}`);
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
      console.error(`Failed to move episode: ${e}`);
      errorMessage = t('episodeListPage.errors.moveEpisode');
    } finally {
      showEpisodeMove = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === Delete episode ===

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
      console.error(`Failed to delete episode: ${e}`);
      errorMessage = t('episodeListPage.errors.deleteEpisode');
    } finally {
      showDeleteConfirm = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }

  // === Rename episode ===

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
      console.error(`Failed to update episode name: ${e}`);
      errorMessage = t('episodeListPage.errors.updateName');
    } finally {
      showEpisodeNameEdit = false;
      isSubmitting = false;
      targetEpisode = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <Heading tag="h1" class="text-3xl font-bold">{currentGroupName}</Heading>
    </div>
    <EpisodeAddContainer
      bind:isOpen={showAddEpisode}
      episodeGroupId={data.episodeGroup?.id ?? 0}
      {episodes}
      disabled={data.errorKey !== null || isSubmitting}
      onError={(msg) => (errorMessage = msg)}
    />
  </div>

  <div class="mb-6">
    <Breadcrumbs path={groupPathStore.path} onNavigate={handleBreadcrumbClick} />
  </div>

  {#if errorMessage}
    <div class="mb-8">
      <ErrorWarningToast type="error" {errorMessage} />
    </div>
  {/if}

  <div class="mb-8">
    {#if loadErrorMessage}
      <LoadErrorAlert errorMessage={loadErrorMessage} />
    {:else if isTransitioning}
      <PageLoadingSpinner message={t('common.loading')} />
    {:else if episodes.length === 0}
      <EmptyStateDisplay
        title={t('episodeListPage.emptyState.title')}
        message={t('episodeListPage.emptyState.message')}
        buttonText={t('episodeListPage.emptyState.addButton')}
        Icon={FileOutline}
        onAdd={() => (showAddEpisode = true)}
      />
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
  </div>
</div>

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
