<script lang="ts">
  import type { Episode } from '$lib/domain/entities/episode';
  import { formatDate } from '$lib/presentation/utils/dateFormatter';
  import {
    Button,
    Dropdown,
    DropdownItem,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import { DotsHorizontalOutline } from 'flowbite-svelte-icons';

  type Props = {
    episodes: readonly Episode[];
    onEpisodeClick: (episodeId: number) => void;
    onMoveEpisodeClick: (episode: Episode) => void;
    // onDeleteEpisodeClick: (episodeId: number) => void; // TODO: 将来の削除機能のためにコメントアウト
  };

  let {
    episodes,
    onEpisodeClick,
    onMoveEpisodeClick,
    // onDeleteEpisodeClick,
  }: Props = $props();
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
        <TableBodyRow class="cursor-pointer" onclick={() => onEpisodeClick(episode.id)}>
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
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
