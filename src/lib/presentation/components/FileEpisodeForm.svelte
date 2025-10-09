<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore.svelte';
  import { fileEpisodeAddStore } from '$lib/application/stores/fileEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/FileSelect.svelte';
  import TsvConfigSection from '$lib/presentation/components/TsvConfigSection.svelte';
  import TtsConfigSection from '$lib/presentation/components/TtsConfigSection.svelte';
  import { Button, Checkbox, Input, Label } from 'flowbite-svelte';

  type Props = {
    onTsvFileSelected: (filePath: string) => void;
    onSubmit: () => void;
    onTtsEnabled: () => void;
  };

  let { onTsvFileSelected, onSubmit, onTtsEnabled }: Props = $props();

  let disabled = $derived(
    episodeAddStore.isSubmitting ||
      fileEpisodeAddStore.isFetchingScriptPreview ||
      fileEpisodeAddStore.isFetchingTtsVoices
  );

  async function handleScriptFileChange(filePath: string | null) {
    fileEpisodeAddStore.setScriptFilePath(filePath);
    if (filePath && filePath.toLowerCase().endsWith('.tsv')) {
      onTsvFileSelected(filePath);
    } else {
      fileEpisodeAddStore.shouldGenerateAudio = fileEpisodeAddStore.isTxtScriptFile;
      fileEpisodeAddStore.completeScriptPreviewFetching(null);
    }
  }

  function handleTtsCheckboxChange(checked: boolean) {
    fileEpisodeAddStore.shouldGenerateAudio = checked;
    if (checked) {
      onTtsEnabled();
    }
  }

  async function handleSubmit() {
    if (fileEpisodeAddStore.validate()) {
      onSubmit();
    }
  }
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
  <Input
    id="title"
    placeholder={t('components.episodeAddModal.titlePlaceholder')}
    value={fileEpisodeAddStore.title}
    oninput={(e) => (fileEpisodeAddStore.title = (e.currentTarget as HTMLInputElement).value)}
    type="text"
  />
</div>

{#if !fileEpisodeAddStore.shouldGenerateAudio}
  <div class="mb-4">
    <Label class="mb-2 block" for="audioFile">
      {t('components.episodeAddModal.audioFileLabel')}
    </Label>
    <FileSelect
      accept="audio/*"
      onFileSelected={(file) => fileEpisodeAddStore.setAudioFilePath(file || null)}
      id="audioFile"
    />
  </div>
{/if}

<div class="mb-4">
  <Label class="mb-2 block" for="scriptFile">
    {t('components.episodeAddModal.scriptFileLabel')}
  </Label>
  <FileSelect
    accept=".srt,.sswt,.tsv,.vtt,.txt"
    onFileSelected={(file) => handleScriptFileChange(file || null)}
    id="scriptFile"
  />
</div>

{#if fileEpisodeAddStore.hasOnlyScriptFile}
  <div class="mb-4">
    <Label class="flex items-center gap-2">
      <Checkbox
        checked={fileEpisodeAddStore.shouldGenerateAudio}
        onchange={(e) => handleTtsCheckboxChange((e.currentTarget as HTMLInputElement).checked)}
        class="h-4 w-4"
        disabled={fileEpisodeAddStore.isTxtScriptFile}
      />
      {t('components.episodeAddModal.generateAudioLabel')}
    </Label>
  </div>

  {#if fileEpisodeAddStore.shouldGenerateAudio}
    <TtsConfigSection />
  {/if}
{/if}

{#if fileEpisodeAddStore.scriptPreview}
  <TsvConfigSection />
{/if}

{#if fileEpisodeAddStore.errorMessage}
  <div class="mb-4">
    <div class="text-sm text-red-600">{fileEpisodeAddStore.errorMessage}</div>
  </div>
{/if}

<div class="flex justify-end gap-2">
  <Button color="gray" {disabled} onclick={episodeAddStore.close}>
    {t('components.episodeAddModal.cancel')}
  </Button>
  <Button {disabled} onclick={handleSubmit}>
    {episodeAddStore.isSubmitting
      ? t('components.episodeAddModal.submitting')
      : t('components.episodeAddModal.submit')}
  </Button>
</div>
