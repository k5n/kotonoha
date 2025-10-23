<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
  import { HomeOutline } from 'flowbite-svelte-icons';

  interface Props {
    path: readonly EpisodeGroup[];
    onNavigate: (_index: number | null) => void;
  }
  let { path, onNavigate }: Props = $props();
</script>

<Breadcrumb aria-label="Breadcrumb">
  <BreadcrumbItem onclick={() => onNavigate(null)}>
    <HomeOutline class="me-2 h-4 w-4" />
    {t('components.breadcrumbs.home')}
  </BreadcrumbItem>

  {#each path as group, i (group.id)}
    <BreadcrumbItem onclick={() => onNavigate(i)}>
      {group.name}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>
