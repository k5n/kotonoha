<script lang="ts">
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
  import { Dropdown, DropdownItem } from 'flowbite-svelte';
  import { DotsVerticalOutline, FolderOutline, ListOutline } from 'flowbite-svelte-icons';
  import { flip } from 'svelte/animate';

  interface Props {
    groups: readonly EpisodeGroup[];
    onGroupClick: (_group: EpisodeGroup) => void;
    onGroupNameChange: (_group: EpisodeGroup) => void;
    onGroupMove: (_group: EpisodeGroup) => void;
    onGroupDelete: (_group: EpisodeGroup) => void;
    onOrderChange: (_items: readonly EpisodeGroup[]) => void;
  }
  let {
    groups,
    onGroupClick,
    onGroupNameChange,
    onGroupMove,
    onGroupDelete,
    onOrderChange = () => {},
  }: Props = $props();

  function handleChangeName(e: Event, group: EpisodeGroup) {
    e.stopPropagation(); // 下のボタンへの伝播を停止
    onGroupNameChange(group);
  }

  function handleMoveGroup(e: Event, group: EpisodeGroup) {
    e.stopPropagation(); // 下のボタンへの伝播を停止
    onGroupMove(group);
  }

  function handleDeleteGroup(e: Event, group: EpisodeGroup) {
    e.stopPropagation();
    onGroupDelete(group);
  }

  function handleDrop(state: DragDropState<EpisodeGroup>, targetGroup: EpisodeGroup) {
    const { draggedItem } = state;
    if (!draggedItem || draggedItem.id === targetGroup.id) {
      return;
    }

    const newOrder = [...groups];
    const draggedIndex = newOrder.findIndex((g) => g.id === draggedItem.id);
    const targetIndex = newOrder.findIndex((g) => g.id === targetGroup.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    onOrderChange(newOrder);
  }
</script>

<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {#if groups.length > 0}
    {#each groups as group (group.id)}
      <div
        use:draggable={{ container: 'groups', dragData: group }}
        use:droppable={{
          container: 'groups',
          callbacks: {
            onDrop: (state: DragDropState<EpisodeGroup>) => handleDrop(state, group),
          },
        }}
        animate:flip={{ duration: 300 }}
        class={`relative rounded-lg border p-4 text-center transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800
    ${group.groupType === 'album' ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        tabindex="0"
        role="button"
        onclick={() => onGroupClick(group)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onGroupClick(group);
          }
        }}
      >
        {#if group.groupType === 'album'}
          <ListOutline class="mx-auto mb-2 h-10 w-10 text-blue-500 dark:text-blue-400" />
        {:else}
          <FolderOutline class="mx-auto mb-2 h-10 w-10 text-gray-500 dark:text-gray-400" />
        {/if}
        <span class="font-semibold text-gray-800 dark:text-gray-200">{group.name}</span>

        <div class="absolute top-2 right-2">
          <button
            type="button"
            id={`card-menu-button-${group.id}`}
            class="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:ring-2 focus:ring-gray-300 focus:outline-none"
            onclick={(e: MouseEvent) => {
              e.stopPropagation(); // イベント伝播を停止
            }}
            onkeydown={(e: KeyboardEvent) => {
              e.stopPropagation(); // キーボードイベントの伝播も停止
            }}
          >
            <DotsVerticalOutline class="h-5 w-5" />
          </button>

          <Dropdown simple triggeredBy={`#card-menu-button-${group.id}`}>
            <DropdownItem onclick={(e: MouseEvent) => handleChangeName(e, group)}
              >名前を変更</DropdownItem
            >
            <DropdownItem onclick={(e: MouseEvent) => handleMoveGroup(e, group)}>移動</DropdownItem>
            <DropdownItem
              onclick={(e: MouseEvent) => handleDeleteGroup(e, group)}
              class="text-red-600 dark:text-red-500">削除</DropdownItem
            >
          </Dropdown>
        </div>
      </div>
    {/each}
  {:else}
    <p class="col-span-full py-8 text-center text-gray-500">
      このフォルダーにはグループがありません。
    </p>
  {/if}
</div>
