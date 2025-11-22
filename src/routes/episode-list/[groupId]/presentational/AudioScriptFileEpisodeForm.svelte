<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Heading, Input, Label, Select } from 'flowbite-svelte';
  import TsvConfigSection from '../container/TsvConfigSection.svelte';

  type Props = {
    isSubmitting: boolean;
    isProcessing: boolean;
    title: string;
    audioFilePath: string | null;
    scriptFilePath: string | null;
    openTsvConfigSection: boolean;
    validTsv: boolean;
    selectedStudyLanguage: string | null;
    learningTargetLanguages: readonly string[];
    languageDetectionWarningMessage: string;
    fieldErrors: {
      title: string;
      audioFile: string;
      scriptFile: string;
      tsvConfig: string;
    };
    fieldTouched: {
      title: boolean;
      audioFile: boolean;
      scriptFile: boolean;
      tsvConfig: boolean;
    };
    errorMessage: string;
    tsvErrorMessage: string;
    onTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    onAudioFileChange: (filePath: string | null) => void;
    onScriptFilePathChange: (filePath: string | null) => void;
    onCancel: () => void;
    onSubmit: () => void;
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
  };

  let {
    isSubmitting,
    isProcessing,
    title = $bindable(''),
    audioFilePath = $bindable(null),
    scriptFilePath,
    openTsvConfigSection,
    validTsv,
    selectedStudyLanguage = $bindable(null),
    learningTargetLanguages,
    languageDetectionWarningMessage,
    fieldErrors,
    fieldTouched,
    errorMessage,
    tsvErrorMessage,
    onTitleChange,
    onTitleBlur,
    onAudioFileChange,
    onScriptFilePathChange,
    onCancel,
    onSubmit,
    onDetectScriptLanguage,
  }: Props = $props();

  // Form validity check
  let isFormValid = $derived(
    title.trim() &&
      audioFilePath &&
      scriptFilePath &&
      selectedStudyLanguage &&
      (!openTsvConfigSection || validTsv)
  );

  let learningTargetLanguageOptions = $derived(
    learningTargetLanguages.map((lang) => ({
      value: lang,
      name: `${t(bcp47ToTranslationKey(lang)!)} (${bcp47ToLanguageName(lang)})`,
    })) || []
  );
</script>

<div class="p-4">
  <Heading class="mb-4 text-xl font-bold">
    {t('components.episodeAddModal.title')}
  </Heading>

  <div class="mb-4">
    <Label class="mb-2 block" for="title">{t('components.fileEpisodeForm.titleLabel')}</Label>
    <Input
      id="title"
      class={fieldTouched.title && !fieldErrors.title ? 'border-green-700' : ''}
      placeholder={t('components.fileEpisodeForm.titlePlaceholder')}
      value={title}
      oninput={(event) => onTitleChange((event.target as HTMLInputElement).value)}
      onblur={onTitleBlur}
      type="text"
    />
    {#if fieldTouched.title && fieldErrors.title}
      <div class="mt-1 text-sm text-red-600">{fieldErrors.title}</div>
    {/if}
  </div>

  <div class="mb-4">
    <Label class="mb-2 block" for="audioFile">
      {t('components.fileEpisodeForm.audioFileLabel')}
    </Label>
    <FileSelect
      color={fieldTouched.audioFile && !fieldErrors.audioFile ? 'green' : 'light'}
      accept="audio/*"
      value={audioFilePath}
      onFileSelected={(file) => onAudioFileChange(file)}
      onClear={() => onAudioFileChange(null)}
      id="audioFile"
      dataTestId="audio-file-select"
    />
    {#if fieldTouched.audioFile && fieldErrors.audioFile}
      <div class="mt-1 text-sm text-red-600">{fieldErrors.audioFile}</div>
    {/if}
  </div>

  <div class="mb-4">
    <Label class="mb-2 block" for="scriptFile">
      {t('components.fileEpisodeForm.scriptFileLabel')}
    </Label>
    <FileSelect
      color={fieldTouched.scriptFile && !fieldErrors.scriptFile && !tsvErrorMessage
        ? 'green'
        : 'light'}
      accept=".srt,.sswt,.tsv,.vtt,.txt"
      value={scriptFilePath}
      onFileSelected={(file) => onScriptFilePathChange(file)}
      onClear={() => onScriptFilePathChange(null)}
      id="scriptFile"
      dataTestId="script-file-select"
    />
    {#if fieldTouched.scriptFile && fieldErrors.scriptFile}
      <div class="mt-1 text-sm text-red-600">{fieldErrors.scriptFile}</div>
    {/if}
  </div>

  {#if openTsvConfigSection}
    <TsvConfigSection {onDetectScriptLanguage} />
    {#if fieldTouched.tsvConfig && fieldErrors.tsvConfig}
      <div class="mb-4 text-sm text-red-600">{fieldErrors.tsvConfig}</div>
    {/if}
  {/if}

  {#if learningTargetLanguageOptions.length > 0}
    <div class="mb-4">
      <Label class="mb-2 block" for="learningLanguage">
        {t('components.fileEpisodeForm.learningLanguageLabel')}
      </Label>
      {#if languageDetectionWarningMessage}
        <div class="mb-2 text-sm text-yellow-600">
          {languageDetectionWarningMessage}
        </div>
      {/if}
      <Select
        id="learningLanguage"
        data-testid="learningLanguage"
        bind:value={selectedStudyLanguage}
        items={learningTargetLanguageOptions}
      ></Select>
    </div>
  {/if}

  {#if errorMessage}
    <div class="mb-4">
      <div class="text-sm text-red-600">
        {errorMessage}
      </div>
    </div>
  {/if}
  {#if tsvErrorMessage}
    <div class="mb-4">
      <div class="text-sm text-red-600">
        {tsvErrorMessage}
      </div>
    </div>
  {/if}

  <div class="flex justify-end gap-2">
    <Button color="gray" disabled={isSubmitting || isProcessing} onclick={onCancel}>
      {t('common.cancel')}
    </Button>
    <Button
      data-testid="audio-script-file-episode-add-submit"
      disabled={isSubmitting || isProcessing || !isFormValid}
      onclick={onSubmit}
    >
      {isSubmitting
        ? t('components.episodeAddModal.submitting')
        : t('components.episodeAddModal.submit')}
    </Button>
  </div>
</div>
