<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import { Button, Input, Label } from 'flowbite-svelte';

  type Props = {
    onTsvFileSelected: (filePath: string) => void;
    onSubmit: () => void;
  };

  let { onTsvFileSelected, onSubmit }: Props = $props();

  async function handleScriptFileChange(filePath: string | null) {
    episodeAddStore.setScriptFilePath(filePath);
    if (filePath && filePath.toLowerCase().endsWith('.tsv')) {
      onTsvFileSelected(filePath);
    } else {
      episodeAddStore.completeScriptPreviewFetching(null);
    }
  }

  async function handleSubmit() {
    const errorMessageKey = episodeAddStore.validateFileForm();
    if (errorMessageKey) {
      episodeAddStore.fileFormErrorMessage = t(errorMessageKey);
      return;
    }

    onSubmit();
  }
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={episodeAddStore.fileTitle}
    oninput={(e) => (episodeAddStore.fileTitle = (e.currentTarget as HTMLInputElement).value)}
    type="text"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="audioFile">
    {t('components.episodeAddModal.audioFileLabel')}
  </Label>
  <FileSelect
    accept="audio/*"
    onFileSelected={(file) => episodeAddStore.setAudioFilePath(file || null)}
    id="audioFile"
  />
</div>

<div class="mb-4">
  <Label class="mb-2 block" for="scriptFile">
    {t('components.episodeAddModal.scriptFileLabel')}
  </Label>
  <FileSelect
    accept=".srt,.sswt,.tsv,.vtt"
    onFileSelected={(file) => handleScriptFileChange(file || null)}
    id="scriptFile"
  />
</div>

{#if episodeAddStore.scriptPreview}
  <TsvConfigSection />
{/if}

{#if episodeAddStore.fileFormErrorMessage}
  <div class="mb-4">
    <div class="text-sm text-red-600">{episodeAddStore.fileFormErrorMessage}</div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button
    color="gray"
    disabled={episodeAddStore.isSubmitting || episodeAddStore.isFetchingScriptPreview}
    onclick={episodeAddStore.close}
  >
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button
    disabled={episodeAddStore.isSubmitting || episodeAddStore.isFetchingScriptPreview}
    onclick={handleSubmit}
  >
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
