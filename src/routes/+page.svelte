<script lang="ts">
	import { initializeApp } from '$lib/application/usecases/initializeApp';
	import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
	import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
	import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	// --- State Management ---
	let allGroups: readonly EpisodeGroup[] = $state([]);
	let path: readonly EpisodeGroup[] = $state([]);

	// --- Computed State ---
	let displayedGroups: readonly EpisodeGroup[] = $derived.by(() => {
		if (path.length === 0) {
			return allGroups.filter((g) => g.parentId === null);
		} else {
			const currentGroup = path[path.length - 1];
			return currentGroup.children;
		}
	});

	// --- Event Handlers ---
	const handleGroupClick = (selectedGroup: EpisodeGroup) => {
		path = [...path, selectedGroup];
	};

	const handleBreadcrumbClick = (targetIndex: number | null) => {
		if (targetIndex === null) {
			path = [];
		} else {
			path = path.slice(0, targetIndex + 1);
		}
	};

	const handleAddNewEpisode = () => {
		// TODO: 新規追加処理
	};

	onMount(async () => {
		allGroups = await initializeApp();
	});
</script>

<div class="p-4 md:p-6">
	<div class="flex justify-between items-center mb-4">
		<Heading tag="h1" class="text-2xl font-bold">エピソード一覧</Heading>
		<Button onclick={handleAddNewEpisode}>
			<PlusOutline class="w-5 h-5 me-2" />
			新規追加
		</Button>
	</div>

	<div class="mb-6">
		<Breadcrumbs {path} onNavigate={handleBreadcrumbClick} />
	</div>

	<GroupGrid groups={displayedGroups} onGroupClick={handleGroupClick} />
</div>