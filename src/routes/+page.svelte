<script lang="ts">
  import { goto } from '$app/navigation';
  import { initializeApp } from '$lib/application/usecases/initializeApp';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
  import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
  import { groupPathStore } from '$lib/presentation/stores/groupPathStore.svelte';
  import { Button, Heading } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';

  // --- State Management ---
  let allGroups: readonly EpisodeGroup[] = $state([]);

  // --- Computed State ---
  let path = $derived(groupPathStore.path);
  let displayedGroups = $derived(
    groupPathStore.current === null
      ? allGroups.filter((g) => g.parentId === null)
      : groupPathStore.current.children
  );

  // --- Event Handlers ---
  const handleGroupClick = (selectedGroup: EpisodeGroup) => {
    if (selectedGroup.groupType == 'album') {
      goto(`/episode-list/${selectedGroup.id}`);
    } else {
      groupPathStore.pushGroup(selectedGroup);
    }
  };

  const handleBreadcrumbClick = (targetIndex: number | null) => {
    groupPathStore.popTo(targetIndex);
  };

  const handleAddNewEpisode = () => {
    // TODO: 新規追加処理
  };

  onMount(async () => {
    allGroups = await initializeApp();
    groupPathStore.reset();
  });
</script>

<div class="p-4 md:p-6">
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h1" class="text-2xl font-bold">グループ一覧</Heading>
    <Button onclick={handleAddNewEpisode}>
      <PlusOutline class="me-2 h-5 w-5" />
      新規追加
    </Button>
  </div>

  <div class="mb-6">
    <Breadcrumbs {path} onNavigate={handleBreadcrumbClick} />
  </div>

  <GroupGrid groups={displayedGroups} onGroupClick={handleGroupClick} />
</div>
