<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
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

  type Props = {
    scriptPreview: ScriptPreview;
    tsvConfig: {
      startTimeColumnIndex: number;
      textColumnIndex: number;
      endTimeColumnIndex: number;
    };
    onTsvConfigChange: (config: {
      startTimeColumnIndex: number;
      textColumnIndex: number;
      endTimeColumnIndex: number;
    }) => void;
  };

  let { scriptPreview, tsvConfig, onTsvConfigChange }: Props = $props();

  let displayHeaders = $derived.by(() => {
    if (!scriptPreview || !scriptPreview.headers) return [];
    return scriptPreview.headers;
  });

  function updateConfig(field: keyof typeof tsvConfig, value: number) {
    onTsvConfigChange({
      ...tsvConfig,
      [field]: value,
    });
  }
</script>

{#if scriptPreview && scriptPreview.rows.length > 0}
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
          value={tsvConfig.startTimeColumnIndex}
          onchange={(e) => updateConfig('startTimeColumnIndex', parseInt(e.currentTarget.value))}
          items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
        />
      </div>
      <div>
        <Label for="textColumn" class="mb-2 block">
          {t('components.episodeAddModal.textColumnLabel')} *
        </Label>
        <Select
          id="textColumn"
          value={tsvConfig.textColumnIndex}
          onchange={(e) => updateConfig('textColumnIndex', parseInt(e.currentTarget.value))}
          items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
        />
      </div>
      <div>
        <Label for="endTimeColumn" class="mb-2 block">
          {t('components.episodeAddModal.endTimeColumnLabel')}
        </Label>
        <Select
          id="endTimeColumn"
          value={tsvConfig.endTimeColumnIndex}
          onchange={(e) => updateConfig('endTimeColumnIndex', parseInt(e.currentTarget.value))}
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
          {#each scriptPreview.rows as row, i (i)}
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
