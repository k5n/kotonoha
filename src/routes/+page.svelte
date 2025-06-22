<script lang="ts">
  import { goto } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { addEpisodeGroup } from '$lib/application/usecases/addEpisodeGroup';
  import { initializeApp } from '$lib/application/usecases/initializeApp';
  import type { EpisodeGroup, EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import GroupAddModal from '$lib/presentation/components/GroupAddModal.svelte';
  import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
  import { error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';

  // --- State Management ---
  let allGroups: readonly EpisodeGroup[] = $state([]);
  let errorMessage = $state('');
  let isAddModalOpen = $state(false);
  let isSubmitting = $state(false);

  // --- Computed State ---
  let path = $derived(groupPathStore.path);
  let displayedGroups = $derived(
    groupPathStore.current === null
      ? allGroups.filter((g) => g.parentId === null)
      : groupPathStore.current.children
  );
  let currentGroupType = $derived(groupPathStore.current?.groupType ?? 'folder');

  // --- Event Handlers ---
  const handleGroupClick = (selectedGroup: EpisodeGroup) => {
    groupPathStore.pushGroup(selectedGroup);
    if (selectedGroup.groupType == 'album') {
      goto(`/episode-list/${selectedGroup.id}`);
    }
  };

  const handleBreadcrumbClick = (targetIndex: number | null) => {
    groupPathStore.popTo(targetIndex);
  };

  const handleAddNewEpisode = () => {
    isAddModalOpen = true;
  };

  const handleAddGroupSubmit = async (name: string, groupType: EpisodeGroupType) => {
    isSubmitting = true;
    try {
      const parentId = groupPathStore.current?.id ?? null;
      allGroups = await addEpisodeGroup({
        name,
        parentId,
        groupType,
        siblings: displayedGroups,
      });
      isAddModalOpen = false;
    } catch (err) {
      error(`Failed to add group: ${err}`);
    } finally {
      isSubmitting = false;
    }
  };

  onMount(async () => {
    try {
      allGroups = await initializeApp();
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      error(`Failed to initialize app: ${err}`);
    }
  });
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h1" class="text-3xl font-bold">グループ一覧</Heading>
    <Button onclick={handleAddNewEpisode} disabled={currentGroupType === 'album'}>
      <PlusOutline class="me-2 h-5 w-5" />
      新規追加
    </Button>
  </div>

  <div class="mb-6">
    <Breadcrumbs {path} onNavigate={handleBreadcrumbClick} />
  </div>

  {#if currentGroupType === 'album'}
    <div class="flex justify-center py-12">
      <!-- Show spinner until page navigation -->
      <Spinner size="16" />
    </div>
  {:else if errorMessage}
    <Alert color="red">
      <span class="font-medium">エラー:</span>
      {errorMessage}
    </Alert>
  {:else}
    <GroupGrid groups={displayedGroups} onGroupClick={handleGroupClick} />
  {/if}

  <GroupAddModal
    show={isAddModalOpen}
    {isSubmitting}
    onClose={() => (isAddModalOpen = false)}
    onSubmit={handleAddGroupSubmit}
  />
</div>
