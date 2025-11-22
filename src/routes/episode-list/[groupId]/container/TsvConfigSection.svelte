<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { tsvConfigStore } from '$lib/application/stores/tsvConfigStore.svelte';
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
    onDetectScriptLanguage: () => Promise<void>;
  };

  let { onDetectScriptLanguage }: Props = $props();

  let displayHeaders = $derived.by(() => {
    const scriptPreview = tsvConfigStore.scriptPreview;
    if (!scriptPreview || !scriptPreview.headers) return [];
    return scriptPreview.headers;
  });

  let columnOptions = $derived(displayHeaders.map((header, i) => ({ value: i, name: header })));

  let endTimeColumnOptions = $derived([
    { value: -1, name: t('components.tsvConfigSection.none') },
    ...columnOptions,
  ]);

  async function handleStartTimeColumnChange(e: Event) {
    tsvConfigStore.updateConfig(
      'startTimeColumnIndex',
      parseInt((e.currentTarget as HTMLSelectElement).value)
    );
  }

  async function handleTextColumnChange(e: Event) {
    tsvConfigStore.updateConfig(
      'textColumnIndex',
      parseInt((e.currentTarget as HTMLSelectElement).value)
    );
    await onDetectScriptLanguage();
  }

  function handleEndTimeColumnChange(e: Event) {
    tsvConfigStore.updateConfig(
      'endTimeColumnIndex',
      parseInt((e.currentTarget as HTMLSelectElement).value)
    );
  }
</script>

{#if tsvConfigStore.scriptPreview && tsvConfigStore.scriptPreview.rows.length > 0}
  <div
    class={'mb-4 rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800' +
      (tsvConfigStore.isValid ? ' border-green-600' : '')}
  >
    <Heading tag="h3" class="mb-2 text-lg font-semibold">
      {t('components.tsvConfigSection.tsvSettingsTitle')}
    </Heading>
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <Label for="startTimeColumn" class="mb-2 block">
          {t('components.tsvConfigSection.startTimeColumnLabel')} *
        </Label>
        <Select
          id="startTimeColumn"
          data-testid="startTimeColumn"
          value={tsvConfigStore.tsvConfig.startTimeColumnIndex}
          onchange={handleStartTimeColumnChange}
          items={columnOptions}
        />
        {#if tsvConfigStore.startTimeColumnErrorMessageKey}
          <div data-testid="startTimeColumnError" class="mt-1 text-sm text-red-600">
            {t(tsvConfigStore.startTimeColumnErrorMessageKey)}
          </div>
        {/if}
      </div>
      <div>
        <Label for="textColumn" class="mb-2 block">
          {t('components.tsvConfigSection.textColumnLabel')} *
        </Label>
        <Select
          id="textColumn"
          data-testid="textColumn"
          value={tsvConfigStore.tsvConfig.textColumnIndex}
          onchange={handleTextColumnChange}
          items={columnOptions}
        />
        {#if tsvConfigStore.textColumnErrorMessageKey}
          <div data-testid="textColumnError" class="mt-1 text-sm text-red-600">
            {t(tsvConfigStore.textColumnErrorMessageKey)}
          </div>
        {/if}
      </div>
      <div>
        <Label for="endTimeColumn" class="mb-2 block">
          {t('components.tsvConfigSection.endTimeColumnLabel')}
        </Label>
        <Select
          id="endTimeColumn"
          data-testid="endTimeColumn"
          value={tsvConfigStore.tsvConfig.endTimeColumnIndex}
          onchange={handleEndTimeColumnChange}
          items={endTimeColumnOptions}
        />
      </div>
    </div>
    <div class="overflow-x-auto">
      <Table>
        <TableHead>
          <TableHeadCell>
            {t('components.tsvConfigSection.previewTable.rowNumber')}
          </TableHeadCell>
          {#each displayHeaders as header, i (i)}
            <TableHeadCell>{header}</TableHeadCell>
          {/each}
        </TableHead>
        <TableBody>
          {#each tsvConfigStore.scriptPreview.rows as row, i (i)}
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
