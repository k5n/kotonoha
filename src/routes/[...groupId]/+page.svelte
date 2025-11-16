<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { addEpisodeGroup } from '$lib/application/usecases/addEpisodeGroup';
  import { deleteGroupRecursive } from '$lib/application/usecases/deleteGroupRecursive';
  import { fetchAvailableParentGroups } from '$lib/application/usecases/fetchAvailableParentGroups';
  import { moveEpisodeGroup } from '$lib/application/usecases/moveEpisodeGroup';
  import { updateEpisodeGroupName } from '$lib/application/usecases/updateEpisodeGroupName';
  import { updateEpisodeGroupsOrder } from '$lib/application/usecases/updateEpisodeGroupsOrder';
  import type { EpisodeGroup, EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/presentational/Breadcrumbs.svelte';
  import ConfirmModal from '$lib/presentation/components/presentational/ConfirmModal.svelte';
  import { Alert, Button, Heading, Spinner, Toast } from 'flowbite-svelte';
  import { CogOutline, ExclamationCircleSolid, PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';
  import GroupAddModal from './presentational/GroupAddModal.svelte';
  import GroupGrid from './presentational/GroupGrid.svelte';
  import GroupMoveModal from './presentational/GroupMoveModal.svelte';
  import GroupNameEditModal from './presentational/GroupNameEditModal.svelte';

  // --- ページデータ受け取り ---
  let { data }: PageProps = $props();
  let displayedGroups = $derived(data.groups);
  let loadErrorMessage = $derived(data.errorKey ? t(data.errorKey) : '');

  // --- State Management ---
  let errorMessage = $state('');
  let showGroupAdd = $state(false);
  let showGroupNameEdit = $state(false);
  let showGroupMove = $state(false);
  let showConfirm = $state(false);
  let isSubmitting = $state(false);
  let editingGroup: EpisodeGroup | null = $state<EpisodeGroup | null>(null);
  let availableParentGroupsTree: readonly EpisodeGroup[] = $state([]);

  // --- Computed State ---
  let path = $derived(groupPathStore.path);
  let currentGroupType = $derived(groupPathStore.current?.groupType ?? 'folder');

  // --- Event Handlers ---

  // === ページ遷移 ===

  function handleGroupClick(selectedGroup: EpisodeGroup) {
    groupPathStore.pushGroup(selectedGroup);
    if (selectedGroup.groupType == 'album') {
      goto(`/episode-list/${selectedGroup.id}`);
    } else {
      goto(groupPathStore.url);
    }
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    if (groupPathStore.popTo(targetIndex)) {
      goto(groupPathStore.url);
    }
  }

  async function handleGroupOrderChange(items: readonly EpisodeGroup[]) {
    try {
      await updateEpisodeGroupsOrder(items);
      await invalidateAll();
    } catch (err) {
      console.error(`Failed to update group order: ${err}`);
      errorMessage = t('groupPage.errors.updateOrder');
    }
  }

  // === グループ追加 ===

  function handleAddNewGroup() {
    showGroupAdd = true;
  }

  async function handleAddGroupSubmit(name: string, groupType: EpisodeGroupType) {
    isSubmitting = true;
    try {
      const parentId = groupPathStore.current?.id ?? null;
      await addEpisodeGroup({
        name,
        parentId,
        groupType,
        siblings: displayedGroups,
      });
      await invalidateAll();
      showGroupAdd = false;
    } catch (err) {
      console.error(`Failed to add group: ${err}`);
      errorMessage = t('groupPage.errors.addGroup');
    } finally {
      isSubmitting = false;
    }
  }

  // === グループ名編集 ===

  function handleChangeGroupName(group: EpisodeGroup) {
    editingGroup = group;
    showGroupNameEdit = true;
  }

  async function handleEditGroupNameSubmit(newName: string) {
    if (!editingGroup) return;
    isSubmitting = true;
    try {
      await updateEpisodeGroupName({
        group: editingGroup,
        newName,
      });
      await invalidateAll();
      showGroupNameEdit = false;
      editingGroup = null;
    } catch (err) {
      console.error(`Failed to update group: ${err}`);
      errorMessage = t('groupPage.errors.updateName');
    } finally {
      isSubmitting = false;
    }
  }

  // === グループ移動 ===

  async function handleMoveGroup(group: EpisodeGroup) {
    editingGroup = group;
    try {
      availableParentGroupsTree = await fetchAvailableParentGroups(group);
      showGroupMove = true;
    } catch (err) {
      console.error(`Failed to fetch available parent groups: ${err}`);
      errorMessage = t('groupPage.errors.fetchParents');
    }
  }

  async function handleMoveGroupSubmit(newParentId: number | null) {
    if (!editingGroup) return;
    isSubmitting = true;
    errorMessage = ''; // Clear previous errors
    try {
      await moveEpisodeGroup({
        group: editingGroup,
        newParentId,
      });
      await invalidateAll();
    } catch (err) {
      console.error(`Failed to move group: ${err}`);
      errorMessage = t('groupPage.errors.moveGroup');
    } finally {
      showGroupMove = false;
      isSubmitting = false;
      editingGroup = null;
    }
  }

  // === グループ削除 ===

  function handleDeleteGroup(group: EpisodeGroup) {
    editingGroup = group;
    showConfirm = true;
  }

  async function handleDeleteConfirm() {
    if (!editingGroup) return;
    isSubmitting = true;
    errorMessage = '';
    try {
      await deleteGroupRecursive(editingGroup);
      await invalidateAll(); // Refresh data
    } catch (err) {
      console.error(`Failed to delete group: ${err}`);
      errorMessage = t('groupPage.errors.deleteGroup');
    } finally {
      showConfirm = false;
      isSubmitting = false;
      editingGroup = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h1" class="text-3xl font-bold">{t('groupPage.title')}</Heading>
    <div class="flex items-center space-x-2">
      <Button onclick={handleAddNewGroup} disabled={currentGroupType === 'album'}>
        <PlusOutline class="me-2 h-5 w-5" />
        {t('groupPage.addNewButton')}
      </Button>
      <a href="/settings" class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
        <CogOutline
          class="h-6 w-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        />
      </a>
    </div>
  </div>

  <div class="mb-6">
    <Breadcrumbs {path} onNavigate={handleBreadcrumbClick} />
  </div>

  {#if errorMessage}
    <Toast color={undefined} class="bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200">
      {#snippet icon()}
        <ExclamationCircleSolid class="h-5 w-5" />
      {/snippet}
      {errorMessage}
    </Toast>
  {/if}

  {#if currentGroupType === 'album'}
    <div class="flex justify-center py-12">
      <!-- Show spinner until page navigation -->
      <Spinner size="16" />
    </div>
  {:else if loadErrorMessage}
    <Alert color="red">
      <span class="font-medium">{t('groupPage.errorPrefix')}</span>
      {loadErrorMessage}
    </Alert>
  {:else}
    <GroupGrid
      groups={displayedGroups}
      onGroupClick={handleGroupClick}
      onGroupNameChange={handleChangeGroupName}
      onGroupMove={handleMoveGroup}
      onGroupDelete={handleDeleteGroup}
      onOrderChange={handleGroupOrderChange}
      onAddGroup={handleAddNewGroup}
    />
  {/if}

  <GroupAddModal
    show={showGroupAdd}
    {isSubmitting}
    onClose={() => (showGroupAdd = false)}
    onSubmit={handleAddGroupSubmit}
  />

  <GroupNameEditModal
    show={showGroupNameEdit}
    {isSubmitting}
    initialName={editingGroup ? editingGroup.name : ''}
    onClose={() => {
      showGroupNameEdit = false;
      editingGroup = null;
    }}
    onSubmit={handleEditGroupNameSubmit}
  />

  <GroupMoveModal
    show={showGroupMove}
    {isSubmitting}
    currentGroup={editingGroup}
    availableParentGroups={availableParentGroupsTree}
    onClose={() => {
      showGroupMove = false;
      editingGroup = null;
    }}
    onSubmit={handleMoveGroupSubmit}
  />

  <ConfirmModal
    bind:show={showConfirm}
    {isSubmitting}
    message={t('groupPage.confirmDelete.message', { groupName: editingGroup?.name })}
    onClose={() => {
      showConfirm = false;
      editingGroup = null;
    }}
    onConfirm={handleDeleteConfirm}
  />
</div>
