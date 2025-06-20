<script lang="ts">
	import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
	import { FolderOutline } from 'flowbite-svelte-icons';

	interface Props {
		groups: readonly EpisodeGroup[];
		onGroupClick: (group: EpisodeGroup) => void;
	}
	let { groups, onGroupClick }: Props = $props();
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
	{#if groups.length > 0}
		{#each groups as group (group.id)}
			<button
				type="button"
				class="border rounded-lg p-4 text-center hover:bg-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-gray-600 transition-all"
				onclick={() => onGroupClick(group)}
			>
				<FolderOutline class="w-10 h-10 mb-2 mx-auto text-gray-500 dark:text-gray-400" />
				<span class="font-semibold text-gray-800 dark:text-gray-200">{group.name}</span>
			</button>
		{/each}
	{:else}
		<p class="text-gray-500 col-span-full text-center py-8">このフォルダーにはグループがありません。</p>
	{/if}
</div>