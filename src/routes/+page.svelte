<script lang="ts">
	import { initializeApp } from '$lib/application/usecases/initializeApp';
	import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
	import Breadcrumbs from '$lib/presentation/components/Breadcrumbs.svelte';
	import GroupGrid from '$lib/presentation/components/GroupGrid.svelte';
	import { Button, Heading } from 'flowbite-svelte';
	import { PlusOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	// --- State Management ---
	let allGroups: readonly EpisodeGroup[] = $state([]); // 全てのグループデータ
	
	// 現在の階層を示すパンくずリスト用のパス
	let path: readonly EpisodeGroup[] = $state([]);

	// --- Computed State ---
	// 現在表示すべきグループ一覧
	let displayedGroups: readonly EpisodeGroup[] = $derived.by(() => {
		if (path.length === 0) {
			// ルート階層の場合、親がいないグループを表示
			return allGroups.filter((g) => g.parentId === null);
		} else {
			// 子階層の場合、現在地の子供たちを表示
			const currentGroup = path[path.length - 1];
			return currentGroup.children;
		}
	});

	// --- Event Handlers ---
	const handleGroupClick = (event: CustomEvent<EpisodeGroup>) => {
		const selectedGroup = event.detail;
		// クリックされたグループをパスに追加して階層を深くする
		path = [...path, selectedGroup];
	};

	const handleBreadcrumbClick = (event: CustomEvent<number | null>) => {
		const targetIndex = event.detail;
		if (targetIndex === null) {
			// 'ホーム'がクリックされたらパスを空にする
			path = [];
		} else {
			// 指定された階層までパスを短くする
			path = path.slice(0, targetIndex + 1);
		}
	};
	
	const handleAddNewEpisode = () => {
		// TODO: 新規追加処理
	};

	onMount(async () => {
		// initializeAppはダミーです。実際にはバックエンドと通信します。
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
		<Breadcrumbs {path} on:navigate={handleBreadcrumbClick} />
	</div>

	<GroupGrid groups={displayedGroups} on:groupclick={handleGroupClick} />

</div>