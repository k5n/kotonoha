<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import {
    Heading,
    Label,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  let displayHeaders = $derived.by(() => {
    const scriptPreview = episodeAddStore.scriptPreview;
    if (!scriptPreview || !scriptPreview.headers) return [];
    return scriptPreview.headers;
  });
</script>

{#if episodeAddStore.scriptPreview && episodeAddStore.scriptPreview.rows.length > 0}
  <div class="mb-4 rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
    <Heading tag="h3" class="mb-2 text-lg font-semibold">
      {t('components.episodeAddModal.tsvSettingsTitle')}
    </Heading>
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <Label for="startTimeColumn" class="mb-2 block">
          {t('components.episodeAddModal.startTimeColumnLabel')} *
        </Label>
        <Select
          id="startTimeColumn"
          value={episodeAddStore.tsvConfig.startTimeColumnIndex}
          onchange={(e) =>
            episodeAddStore.updateConfig('startTimeColumnIndex', parseInt(e.currentTarget.value))}
          items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
        />
      </div>
      <div>
        <Label for="textColumn" class="mb-2 block">
          {t('components.episodeAddModal.textColumnLabel')} *
        </Label>
        <Select
          id="textColumn"
          value={episodeAddStore.tsvConfig.textColumnIndex}
          onchange={(e) =>
            episodeAddStore.updateConfig('textColumnIndex', parseInt(e.currentTarget.value))}
          items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
        />
      </div>
      <div>
        <Label for="endTimeColumn" class="mb-2 block">
          {t('components.episodeAddModal.endTimeColumnLabel')}
        </Label>
        <Select
          id="endTimeColumn"
          value={episodeAddStore.tsvConfig.endTimeColumnIndex}
          onchange={(e) =>
            episodeAddStore.updateConfig('endTimeColumnIndex', parseInt(e.currentTarget.value))}
          items={[
            { value: -1, name: t('components.episodeAddModal.none') },
            ...displayHeaders.map((header, i) => ({ value: i, name: header })),
          ]}
        />
      </div>
    </div>
    <div class="overflow-x-auto">
      <Table>
        <TableHead>
          <TableHeadCell>
            {t('components.episodeAddModal.previewTable.rowNumber')}
          </TableHeadCell>
          {#each displayHeaders as header, i (i)}
            <TableHeadCell>{header}</TableHeadCell>
          {/each}
        </TableHead>
        <TableBody>
          {#each episodeAddStore.scriptPreview.rows as row, i (i)}
            <TableBodyRow>
              <TableBodyCell>{i + 1}</TableBodyCell>
              {#each row as cell, j (j)}
                <TableBodyCell>{cell}</TableBodyCell>
              {/each}
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </div>
{/if}
