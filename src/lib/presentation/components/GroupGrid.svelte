<script lang="ts">
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { FolderOutline, ListOutline } from 'flowbite-svelte-icons';

  interface Props {
    groups: readonly EpisodeGroup[];
    onGroupClick: (group: EpisodeGroup) => void;
  }
  let { groups, onGroupClick }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {#if groups.length > 0}
    {#each groups as group (group.id)}
      <button
        type="button"
        class={`rounded-lg border p-4 text-center transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800
    ${group.groupType === 'album' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onclick={() => onGroupClick(group)}
      >
        {#if group.groupType === 'album'}
          <ListOutline class="mx-auto mb-2 h-10 w-10 text-blue-500 dark:text-blue-400" />
        {:else}
          <FolderOutline class="mx-auto mb-2 h-10 w-10 text-gray-500 dark:text-gray-400" />
        {/if}
        <span class="font-semibold text-gray-800 dark:text-gray-200">{group.name}</span>
      </button>
    {/each}
  {:else}
    <p class="col-span-full py-8 text-center text-gray-500">
      このフォルダーにはグループがありません。
    </p>
  {/if}
</div>
