<script lang="ts">
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
  import { HomeOutline } from 'flowbite-svelte-icons';

  interface Props {
    path: readonly EpisodeGroup[];
    onNavigate: (_index: number | null) => void;
  }
  let { path, onNavigate }: Props = $props();
</script>

<Breadcrumb aria-label="File explorer breadcrumb">
  <BreadcrumbItem onclick={() => onNavigate(null)}>
    <HomeOutline class="me-2 h-4 w-4" />
    ホーム
  </BreadcrumbItem>

  {#each path as group, i (group.id)}
    <BreadcrumbItem onclick={() => onNavigate(i)}>
      {group.name}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>
