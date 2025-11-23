<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import type { Voice } from '$lib/domain/entities/voice';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Heading, Input, Label, Select } from 'flowbite-svelte';
  import TtsConfigSection from './TtsConfigSection.svelte';
  import TsvConfigSection from './TsvConfigSection.svelte';

  type Props = {
    isSubmitting: boolean;
    isProcessing: boolean;
    title: string;
    scriptFilePath: string | null;
    tsvPreviewOpen: boolean;
    tsvValid: boolean;
    tsvConfig: import('$lib/domain/entities/tsvConfig').TsvConfig;
    tsvPreviewHeaders: readonly string[];
    tsvPreviewRows: readonly (readonly string[])[];
    tsvStartTimeColumnErrorMessage: string;
    tsvTextColumnErrorMessage: string;
    selectedStudyLanguage: string | null;
    learningTargetLanguages: readonly string[];
    languageDetectionWarningMessage: string;
    fieldErrors: {
      title: string;
      scriptFile: string;
    };
    fieldTouched: {
      title: boolean;
      scriptFile: boolean;
    };
    errorMessage: string;
    tsvErrorMessage: string;
    onTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    onScriptFilePathChange: (filePath: string | null) => void;
    onCancel: () => void;
    onSubmit: () => void;
    onTsvFileSelected: (filePath: string) => Promise<void>;
    onDetectScriptLanguage: () => Promise<void>;
    onTtsEnabled: () => Promise<void>;
    onTsvConfigUpdate: (
      key: keyof import('$lib/domain/entities/tsvConfig').TsvConfig,
      value: number
    ) => void;
    ttsSelectedLanguageVoices: readonly Voice[];
    ttsSelectedQuality: string;
    ttsSelectedVoice: Voice | null;
    ttsSelectedSpeakerId: string;
    ttsIsFetchingVoices: boolean;
    ttsErrorMessage: string;
    onTtsSelectedQualityChange: (quality: string) => void;
    onTtsSelectedVoiceChange: (voiceName: string) => void;
    onTtsSelectedSpeakerIdChange: (speakerId: string) => void;
  };

  let {
    isSubmitting,
    isProcessing,
    title,
    scriptFilePath,
    tsvPreviewOpen,
    tsvValid,
    tsvConfig,
    tsvPreviewHeaders,
    tsvPreviewRows,
    tsvStartTimeColumnErrorMessage,
    tsvTextColumnErrorMessage,
    selectedStudyLanguage = $bindable(null),
    learningTargetLanguages,
    languageDetectionWarningMessage,
    fieldErrors,
    fieldTouched,
    errorMessage,
    tsvErrorMessage,
    onTitleChange,
    onTitleBlur,
    onScriptFilePathChange,
    onCancel,
    onSubmit,
    onDetectScriptLanguage,
    onTsvConfigUpdate,
    ttsSelectedLanguageVoices,
    ttsSelectedQuality,
    ttsSelectedVoice,
    ttsSelectedSpeakerId,
    ttsIsFetchingVoices,
    ttsErrorMessage,
    onTtsSelectedQualityChange,
    onTtsSelectedVoiceChange,
    onTtsSelectedSpeakerIdChange,
  }: Props = $props();

  let isFormValid = $derived(
    title.trim() && scriptFilePath && selectedStudyLanguage && (!tsvPreviewOpen || tsvValid)
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

  {#if tsvPreviewOpen}
    <TsvConfigSection
      headers={tsvPreviewHeaders}
      rows={tsvPreviewRows}
      config={tsvConfig}
      valid={tsvValid}
      startTimeColumnErrorMessage={tsvStartTimeColumnErrorMessage}
      textColumnErrorMessage={tsvTextColumnErrorMessage}
      onConfigUpdate={onTsvConfigUpdate}
      {onDetectScriptLanguage}
    />
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

  {#if scriptFilePath}
    <div class="mb-4">
      <TtsConfigSection
        selectedLanguageVoices={ttsSelectedLanguageVoices}
        selectedQuality={ttsSelectedQuality}
        selectedVoice={ttsSelectedVoice}
        selectedSpeakerId={ttsSelectedSpeakerId}
        isFetchingVoices={ttsIsFetchingVoices}
        errorMessage={ttsErrorMessage}
        onSelectedQualityChange={onTtsSelectedQualityChange}
        onSelectedVoiceChange={onTtsSelectedVoiceChange}
        onSelectedSpeakerIdChange={onTtsSelectedSpeakerIdChange}
      />
    </div>
  {/if}

  {#if errorMessage}
    <div class="mb-4 text-sm text-red-600">
      {errorMessage}
    </div>
  {/if}
  {#if tsvErrorMessage}
    <div class="mb-4 text-sm text-red-600">
      {tsvErrorMessage}
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
