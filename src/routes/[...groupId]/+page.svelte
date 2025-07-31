<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { groupPathStore } from '$lib/application/stores/groupPathStore.svelte';
  import { addEpisodeGroup } from '$lib/application/usecases/addEpisodeGroup';
  import { deleteGroupRecursive } from '$lib/application/usecases/deleteGroupRecursive';
  import { fetchAvailableParentGroups } from '$lib/application/usecases/fetchAvailableParentGroups';
  import { moveEpisodeGroup } from '$lib/application/usecases/moveEpisodeGroup';
  import { updateEpisodeGroupName } from '$lib/application/usecases/updateEpisodeGroupName';
  import { updateEpisodeGroupsOrder } from '$lib/application/usecases/updateEpisodeGroupsOrder';
  import type { EpisodeGroup, EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import ConfirmModal from '$lib/presentation/components/ConfirmModal.svelte';
  import GroupAddModal from '$lib/presentation/components/GroupAddModal.svelte';
  import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
  import GroupMoveModal from '$lib/presentation/components/GroupMoveModal.svelte';
  import GroupNameEditModal from '$lib/presentation/components/GroupNameEditModal.svelte';
  import { error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Heading, Spinner } from 'flowbite-svelte';
  import { CogOutline, PlusOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  // --- ページデータ受け取り ---
  let { data }: PageProps = $props();
  let displayedGroups = $derived(data.groups);

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

  // --- Functions ---
  function transition() {
    const pathStr = groupPathStore.path.map((g) => g.id).join('/');
    goto(`/${pathStr}`);
  }

  // --- Event Handlers ---

  // === ページ遷移 ===

  function handleGroupClick(selectedGroup: EpisodeGroup) {
    groupPathStore.pushGroup(selectedGroup);
    if (selectedGroup.groupType == 'album') {
      goto(`/episode-list/${selectedGroup.id}`);
    } else {
      transition();
    }
  }

  function handleBreadcrumbClick(targetIndex: number | null) {
    groupPathStore.popTo(targetIndex);
    transition();
  }

  async function handleGroupOrderChange(items: readonly EpisodeGroup[]) {
    try {
      await updateEpisodeGroupsOrder(items);
      await invalidateAll();
    } catch (err) {
      error(`Failed to update group order: ${err}`);
      errorMessage = err instanceof Error ? err.message : 'グループの並び替えに失敗しました。';
    }
  }

  // === グループ追加 ===

  function handleAddNewEpisode() {
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
      error(`Failed to add group: ${err}`);
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
      error(`Failed to update group: ${err}`);
      errorMessage = err instanceof Error ? err.message : 'グループ名の更新に失敗しました。';
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
      error(`Failed to fetch available parent groups: ${err}`);
      errorMessage = err instanceof Error ? err.message : '移動先グループの取得に失敗しました。';
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
      error(`Failed to move group: ${err}`);
      errorMessage = err instanceof Error ? err.message : 'グループの移動に失敗しました。';
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
      error(`Failed to delete group: ${err}`);
      errorMessage = err instanceof Error ? err.message : 'グループの削除に失敗しました。';
    } finally {
      showConfirm = false;
      isSubmitting = false;
      editingGroup = null;
    }
  }
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h1" class="text-3xl font-bold">グループ一覧</Heading>
    <div class="flex items-center space-x-2">
      <Button onclick={handleAddNewEpisode} disabled={currentGroupType === 'album'}>
        <PlusOutline class="me-2 h-5 w-5" />
        新規追加
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
      onGroupNameChange={handleChangeGroupName}
      onGroupMove={handleMoveGroup}
      onGroupDelete={handleDeleteGroup}
      onOrderChange={handleGroupOrderChange}
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
    message={`グループ「${editingGroup?.name}」を削除しますか？このグループの子グループやエピソード、センテンスマイニングしたカードも全て削除され、この操作は元に戻せません。`}
    onClose={() => {
      showConfirm = false;
      editingGroup = null;
    }}
    onConfirm={handleDeleteConfirm}
  />
</div>
