<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { previewScriptFile } from '$lib/application/usecases/previewScriptFile';
  import type { ScriptPreview } from '$lib/domain/entities/scriptPreview';
  import { getAudioDuration } from '$lib/presentation/utils/getAudioDuration';
  import {
    Alert,
    Button,
    Fileupload,
    Heading,
    Input,
    Label,
    Modal,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  type TsvConfig = {
    startTimeColumnIndex: number;
    textColumnIndex: number;
    endTimeColumnIndex?: number;
  };

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (
      _title: string,
      _audioFile: File,
      _scriptFile: File,
      _duration: number,
      _tsvConfig?: TsvConfig
    ) => void;
  };
  let { show, isSubmitting = false, onClose, onSubmit }: Props = $props();

  let title = $state('');
  let audioFiles = $state<FileList | null>(null);
  let scriptFiles = $state<FileList | null>(null);
  let errorMessage = $state('');

  let scriptPreview = $state<ScriptPreview | null>(null);
  let tsvConfig = $state({
    startTimeColumnIndex: -1,
    textColumnIndex: -1,
    endTimeColumnIndex: -1,
  });

  $effect(() => {
    const file = scriptFiles?.[0];
    if (file && file.name.toLowerCase().endsWith('.tsv')) {
      previewScriptFile(file)
        .then((preview) => {
          errorMessage = '';
          scriptPreview = preview;
        })
        .catch((e) => {
          errorMessage = t('components.episodeAddModal.errorTsvParse');
          scriptPreview = null;
          console.error(e);
        });
    } else {
      scriptPreview = null;
    }
  });

  let displayHeaders = $derived.by(() => {
    if (!scriptPreview || !scriptPreview.headers) return [];
    return scriptPreview.headers;
  });

  async function handleSubmit() {
    if (!title.trim()) {
      errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return;
    }
    const audioFile = audioFiles?.[0];
    if (!audioFile) {
      errorMessage = t('components.episodeAddModal.errorAudioFileRequired');
      return;
    }
    const scriptFile = scriptFiles?.[0];
    if (!scriptFile) {
      errorMessage = t('components.episodeAddModal.errorScriptFileRequired');
      return;
    }

    let finalTsvConfig: TsvConfig | undefined = undefined;
    if (scriptPreview) {
      if (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1) {
        errorMessage = t('components.episodeAddModal.errorTsvColumnRequired');
        return;
      }
      finalTsvConfig = {
        startTimeColumnIndex: tsvConfig.startTimeColumnIndex,
        textColumnIndex: tsvConfig.textColumnIndex,
        ...(tsvConfig.endTimeColumnIndex !== -1 && {
          endTimeColumnIndex: tsvConfig.endTimeColumnIndex,
        }),
      };
    }

    try {
      const duration = await getAudioDuration(audioFile);
      onSubmit(title, audioFile, scriptFile, duration, finalTsvConfig);
      resetForm();
    } catch (error) {
      errorMessage = t('components.episodeAddModal.errorAudioFileLoad');
      console.error(error);
    }
  }

  function resetForm() {
    title = '';
    audioFiles = null;
    scriptFiles = null;
    errorMessage = '';
    scriptPreview = null;
    tsvConfig = {
      startTimeColumnIndex: -1,
      textColumnIndex: -1,
      endTimeColumnIndex: -1,
    };
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  let isSubmitDisabled = $derived(
    isSubmitting ||
      !title.trim() ||
      !audioFiles?.length ||
      !scriptFiles?.length ||
      (scriptPreview !== null &&
        (tsvConfig.startTimeColumnIndex === -1 || tsvConfig.textColumnIndex === -1))
  );
</script>

<Modal onclose={handleClose} open={show} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>
    <div class="mb-4">
      <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
      <Input
        id="title"
        placeholder={t('components.episodeAddModal.titlePlaceholder')}
        bind:value={title}
        type="text"
      />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="audioFile"
        >{t('components.episodeAddModal.audioFileLabel')}</Label
      >
      <Fileupload accept="audio/*" bind:files={audioFiles} id="audioFile" />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="scriptFile"
        >{t('components.episodeAddModal.scriptFileLabel')}</Label
      >
      <Fileupload accept=".srt,.sswt,.tsv" bind:files={scriptFiles} id="scriptFile" />
    </div>

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
              bind:value={tsvConfig.startTimeColumnIndex}
              items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
            />
          </div>
          <div>
            <Label for="textColumn" class="mb-2 block">
              {t('components.episodeAddModal.textColumnLabel')} *
            </Label>
            <Select
              id="textColumn"
              bind:value={tsvConfig.textColumnIndex}
              items={displayHeaders.map((header, i) => ({ value: i, name: header }))}
            />
          </div>
          <div>
            <Label for="endTimeColumn" class="mb-2 block">
              {t('components.episodeAddModal.endTimeColumnLabel')}
            </Label>
            <Select
              id="endTimeColumn"
              bind:value={tsvConfig.endTimeColumnIndex}
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

    {#if errorMessage}
      <Alert class="mb-4" color="red">
        {errorMessage}
      </Alert>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={isSubmitting} onclick={handleClose}
        >{t('components.episodeAddModal.cancel')}</Button
      >
      <Button disabled={isSubmitDisabled} onclick={handleSubmit}>
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
