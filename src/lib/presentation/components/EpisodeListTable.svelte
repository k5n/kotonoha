<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
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
    onEpisodeMoveClick: (episode: Episode) => void;
    onOrderChange: (_items: readonly Episode[]) => void;
    onEpisodeDeleteClick: (episode: Episode) => void;
    onEpisodeRenameClick: (episode: Episode) => void;
  };

  let {
    episodes,
    onEpisodeClick,
    onEpisodeMoveClick,
    onOrderChange,
    onEpisodeDeleteClick,
    onEpisodeRenameClick,
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
      <TableHeadCell>{t('components.episodeListTable.title')}</TableHeadCell>
      <TableHeadCell>{t('components.episodeListTable.addDate')}</TableHeadCell>
      <TableHeadCell class="text-center">{t('components.episodeListTable.cards')}</TableHeadCell>
      <TableHeadCell
        ><span class="sr-only">{t('components.episodeListTable.actions')}</span></TableHeadCell
      >
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
                    onEpisodeRenameClick(episode);
                  }}
                >
                  {t('components.episodeListTable.rename')}
                </DropdownItem>
                <DropdownItem
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    onEpisodeMoveClick(episode);
                  }}
                >
                  {t('components.episodeListTable.move')}
                </DropdownItem>
                <DropdownItem
                  class="text-red-600"
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    onEpisodeDeleteClick(episode);
                  }}
                >
                  {t('common.delete')}
                </DropdownItem>
              </Dropdown>
            </div>
          </TableBodyCell>
        </tr>
      {/each}
    </TableBody>
  </Table>
</div>
