<script lang="ts">
  import { goto } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { addEpisodeGroup } from '$lib/application/usecases/addEpisodeGroup';
  import { updateEpisodeGroupName } from '$lib/application/usecases/updateEpisodeGroupName';
  import type { EpisodeGroup, EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import GroupAddModal from '$lib/presentation/components/GroupAddModal.svelte';
  import GroupEditModal from '$lib/presentation/components/GroupEditModal.svelte';
  import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
  import { error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  // --- ページデータ受け取り ---
  let { data }: PageProps = $props();
  let displayedGroups: readonly EpisodeGroup[] = $derived(data.groups);

  // --- State Management ---
  let errorMessage = $state('');
  let isAddModalOpen = $state(false);
  let isEditModalOpen = $state(false);
  let isSubmitting = $state(false);
  let editingGroup: EpisodeGroup | null = $state(null);

  // --- Computed State ---
  let path = $derived(groupPathStore.path);
  let currentGroupType = $derived(groupPathStore.current?.groupType ?? 'folder');

  // --- Functions ---
  function transition() {
    const pathStr = groupPathStore.path.map((g) => g.id).join('/');
    goto(`/${pathStr}`);
  }

  // --- Event Handlers ---
  const handleGroupClick = (selectedGroup: EpisodeGroup) => {
    groupPathStore.pushGroup(selectedGroup);
    if (selectedGroup.groupType == 'album') {
      goto(`/episode-list/${selectedGroup.id}`);
    } else {
      transition();
    }
  };

  const handleBreadcrumbClick = (targetIndex: number | null) => {
    groupPathStore.popTo(targetIndex);
    transition();
  };

  const handleAddNewEpisode = () => {
    isAddModalOpen = true;
  };

  const handleAddGroupSubmit = async (name: string, groupType: EpisodeGroupType) => {
    isSubmitting = true;
    try {
      const parentId = groupPathStore.current?.id ?? null;
      displayedGroups = await addEpisodeGroup({
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

  const handleChangeGroupName = (group: EpisodeGroup) => {
    editingGroup = group;
    isEditModalOpen = true;
  };

  const handleEditGroupSubmit = async (newName: string) => {
    if (!editingGroup) return;
    isSubmitting = true;
    try {
      displayedGroups = await updateEpisodeGroupName({
        group: editingGroup,
        newName,
      });
      isEditModalOpen = false;
      editingGroup = null;
    } catch (err) {
      error(`Failed to update group: ${err}`);
    } finally {
      isSubmitting = false;
    }
  };
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
    <GroupGrid
      groups={displayedGroups}
      onGroupClick={handleGroupClick}
      onChangeName={handleChangeGroupName}
    />
  {/if}

  <GroupAddModal
    show={isAddModalOpen}
    {isSubmitting}
    onClose={() => (isAddModalOpen = false)}
    onSubmit={handleAddGroupSubmit}
  />

  <GroupEditModal
    show={isEditModalOpen}
    {isSubmitting}
    initialName={editingGroup ? editingGroup.name : ''}
    onClose={() => {
      isEditModalOpen = false;
      editingGroup = null;
    }}
    onSubmit={handleEditGroupSubmit}
  />
</div>
