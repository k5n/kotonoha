<script lang="ts">
  import type { Episode } from '$lib/domain/entities/episode';
  import { formatDate } from '$lib/presentation/utils/dateFormatter';
  import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
  import {
    Button,
    Dropdown,
    DropdownItem,
    Table,
    TableBody,
    TableBodyCell,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import { DotsHorizontalOutline } from 'flowbite-svelte-icons';
  import { flip } from 'svelte/animate';

  type Props = {
    episodes: readonly Episode[];
    onEpisodeClick: (episodeId: number) => void;
    onMoveEpisodeClick: (episode: Episode) => void;
    onOrderChange: (_items: readonly Episode[]) => void;
    // onDeleteEpisodeClick: (episodeId: number) => void; // TODO: 将来の削除機能のためにコメントアウト
  };

  let {
    episodes,
    onEpisodeClick,
    onMoveEpisodeClick,
    onOrderChange,
    // onDeleteEpisodeClick,
  }: Props = $props();

  function handleDrop(state: DragDropState<Episode>, targetEpisode: Episode) {
    const { draggedItem } = state;
    if (!draggedItem || draggedItem.id === targetEpisode.id) {
      return;
    }

    const newOrder = [...episodes];
    const draggedIndex = newOrder.findIndex((g) => g.id === draggedItem.id);
    const targetIndex = newOrder.findIndex((g) => g.id === targetEpisode.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    onOrderChange(newOrder);
  }
</script>

<div class="mt-6 overflow-hidden rounded-lg border">
  <Table hoverable={true}>
    <TableHead>
      <TableHeadCell>タイトル</TableHeadCell>
      <TableHeadCell>追加日</TableHeadCell>
      <TableHeadCell class="text-center">Cards</TableHeadCell>
      <TableHeadCell><span class="sr-only">Actions</span></TableHeadCell>
    </TableHead>
    <TableBody>
      {#each episodes as episode (episode.id)}
        <!-- TableBodyRow を利用すると、use:draggable がエラーとなるため、直接 <tr> を使用 -->
        <tr
          use:draggable={{ container: 'episodes', dragData: episode }}
          use:droppable={{
            container: 'episodes',
            callbacks: {
              onDrop: (state: DragDropState<Episode>) => handleDrop(state, episode),
            },
          }}
          animate:flip={{ duration: 300 }}
          class="cursor-pointer border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
          onclick={() => onEpisodeClick(episode.id)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEpisodeClick(episode.id);
            }
          }}
        >
          <TableBodyCell class="font-semibold">{episode.title}</TableBodyCell>
          <TableBodyCell>{formatDate(episode.createdAt)}</TableBodyCell>
          <TableBodyCell class="text-center">{episode.sentenceCardCount}</TableBodyCell>
          <TableBodyCell>
            <div class="flex justify-center">
              <Button
                size="xs"
                pill
                color="alternative"
                onclick={(e: MouseEvent) => {
                  e.stopPropagation(); // イベント伝播を停止
                }}
                onkeydown={(e: KeyboardEvent) => {
                  e.stopPropagation(); // キーボードイベントの伝播も停止
                }}
              >
                <DotsHorizontalOutline class="h-4 w-4" />
              </Button>
              <Dropdown simple>
                <DropdownItem
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    onMoveEpisodeClick(episode);
                  }}
                >
                  移動
                </DropdownItem>
              </Dropdown>
            </div>
          </TableBodyCell>
        </tr>
      {/each}
    </TableBody>
  </Table>
</div>
