<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Button, Heading, Input, Label, Select } from 'flowbite-svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    isSubmitting: boolean;
    isProcessing: boolean;
    isFormValid: boolean;
    title: string;
    selectedStudyLanguage: string | null;
    learningTargetLanguages: readonly string[];
    languageDetectionWarningMessage: string;
    fieldErrors: {
      title: string;
    };
    fieldTouched: {
      title: boolean;
    };
    errorMessage: string;
    onTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    onCancel: () => void;
    onSubmit: () => void;
    children?: Snippet;
  };

  let {
    isSubmitting,
    isProcessing,
    isFormValid,
    title,
    selectedStudyLanguage = $bindable(null),
    learningTargetLanguages,
    languageDetectionWarningMessage,
    fieldErrors,
    fieldTouched,
    errorMessage,
    onTitleChange,
    onTitleBlur,
    onCancel,
    onSubmit,
    children,
  }: Props = $props();

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

  {#if children}
    {@render children()}
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
    <div class="mb-4 text-sm text-red-600">
      {errorMessage}
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
