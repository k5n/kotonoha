<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
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
    headers: readonly string[];
    rows: readonly (readonly string[])[];
    config: TsvConfig;
    valid: boolean;
    startTimeColumnErrorMessage: string;
    textColumnErrorMessage: string;
    onConfigUpdate: (key: keyof TsvConfig, value: number) => void;
    onDetectScriptLanguage: () => Promise<void>;
  };
  let {
    headers,
    rows,
    config,
    valid,
    startTimeColumnErrorMessage,
    textColumnErrorMessage,
    onConfigUpdate,
    onDetectScriptLanguage,
  }: Props = $props();
  let columnOptions = $derived(headers.map((header, i) => ({ value: i, name: header })));
  let endTimeColumnOptions = $derived([
    { value: -1, name: t('components.tsvConfigSection.none') },
    ...columnOptions,
  ]);

  async function handleStartTimeColumnChange(e: Event) {
    onConfigUpdate('startTimeColumnIndex', parseInt((e.currentTarget as HTMLSelectElement).value));
  }

  async function handleTextColumnChange(e: Event) {
    onConfigUpdate('textColumnIndex', parseInt((e.currentTarget as HTMLSelectElement).value));
    await onDetectScriptLanguage();
  }

  function handleEndTimeColumnChange(e: Event) {
    onConfigUpdate('endTimeColumnIndex', parseInt((e.currentTarget as HTMLSelectElement).value));
  }
</script>

{#if rows.length > 0}
  <div
    class={'mb-4 rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800' +
      (valid ? ' border-green-600' : '')}
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
          value={config.startTimeColumnIndex}
          onchange={handleStartTimeColumnChange}
          items={columnOptions}
        />
        {#if startTimeColumnErrorMessage}
          <div data-testid="startTimeColumnError" class="mt-1 text-sm text-red-600">
            {startTimeColumnErrorMessage}
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
          value={config.textColumnIndex}
          onchange={handleTextColumnChange}
          items={columnOptions}
        />
        {#if textColumnErrorMessage}
          <div data-testid="textColumnError" class="mt-1 text-sm text-red-600">
            {textColumnErrorMessage}
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
          value={config.endTimeColumnIndex}
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
          {#each headers as header, i (i)}
            <TableHeadCell>{header}</TableHeadCell>
          {/each}
        </TableHead>
        <TableBody>
          {#each rows as row, i (i)}
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
