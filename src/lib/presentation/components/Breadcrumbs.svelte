<script lang="ts">
	import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
	import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
	import { HomeOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';

	// --- Props (Inputs) ---
	interface Props {
		path: readonly EpisodeGroup[];
	}
	let { path }: Props = $props();

	// --- Events (Outputs) ---
	const dispatch = createEventDispatcher();
</script>

<Breadcrumb aria-label="File explorer breadcrumb">
	<BreadcrumbItem onclick={() => dispatch('navigate', null)}>
		<HomeOutline class="w-4 h-4 me-2" />
		ホーム
	</BreadcrumbItem>

	{#each path as group, i (group.id)}
		<BreadcrumbItem onclick={() => dispatch('navigate', i)}>
			{group.name}
		</BreadcrumbItem>
	{/each}
</Breadcrumb>
