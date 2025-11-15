<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { Settings } from '$lib/domain/entities/settings';
  import { bcp47ToLanguageName, bcp47ToTranslationKey } from '$lib/utils/language';
  import { Alert, Badge, Button, Input, Label, Select } from 'flowbite-svelte';
  import { CloseCircleSolid } from 'flowbite-svelte-icons';
  import LanguageSelectionModal from './LanguageSelectionModal.svelte';

  interface SettingsComponentProps {
    initialSettings: Settings;
    isGeminiApiKeySet: boolean;
    isYoutubeApiKeySet: boolean;
    isSaving: boolean;
    onSave: (settings: Partial<Settings>, geminiApiKey: string, youtubeApiKey: string) => void;
  }

  let {
    initialSettings,
    isGeminiApiKeySet,
    isYoutubeApiKeySet,
    isSaving,
    onSave,
  }: SettingsComponentProps = $props();

  // Internal state
  let geminiApiKey = $state('');
  let youtubeApiKey = $state('');
  let language = $state(initialSettings.language);
  let learningTargetLanguages = $state([...initialSettings.learningTargetLanguages]);
  let explanationLanguages = $state([...initialSettings.explanationLanguages]);

  let showLanguageModal = $state(false);
  let showExplanationLanguageModal = $state(false);

  function translatedName(code: string): string {
    const key = bcp47ToTranslationKey(code) ?? `languages.${code}`;
    const raw = t(key);
    // If i18n returns the key itself, fallback to the plain name from supported languages
    if (!raw || raw === key) {
      return bcp47ToLanguageName(code) ?? code;
    }
    return raw;
  }

  function handleLanguageSelection(code: string, checked: boolean) {
    if (checked) {
      if (!learningTargetLanguages.includes(code)) {
        learningTargetLanguages = [...learningTargetLanguages, code];
      }
    } else {
      learningTargetLanguages = learningTargetLanguages.filter((lang) => lang !== code);
    }
  }

  function removeLanguage(code: string) {
    learningTargetLanguages = learningTargetLanguages.filter((lang) => lang !== code);
  }

  function handleExplanationLanguageSelection(code: string, checked: boolean) {
    if (checked) {
      if (!explanationLanguages.includes(code)) {
        explanationLanguages = [...explanationLanguages, code];
      }
    } else {
      explanationLanguages = explanationLanguages.filter((lang) => lang !== code);
    }
  }

  function removeExplanationLanguage(code: string) {
    explanationLanguages = explanationLanguages.filter((lang) => lang !== code);
  }
</script>

<div>
  <!-- Gemini API Key -->
  <div class="mt-6">
    <Label for="gemini-api-key" class="mb-2">{t('settings.gemini.label')}</Label>
    {#if isGeminiApiKeySet}
      <Alert color="green" class="mb-4">
        <span class="font-medium">{t('settings.gemini.alreadySet')}</span>
        {t('settings.gemini.overwriteWarning')}
      </Alert>
    {:else}
      <Alert color="yellow" class="mb-4">
        <span class="font-medium">{t('settings.gemini.notSet')}</span>
        {t('settings.gemini.notSetWarning')}
      </Alert>
    {/if}
    <Input
      type="password"
      id="gemini-api-key"
      bind:value={geminiApiKey}
      placeholder={t('settings.gemini.placeholder')}
    />
  </div>

  <!-- YouTube API Key -->
  <div class="mt-6">
    <Label for="youtube-api-key" class="mb-2">{t('settings.youtube.label')}</Label>
    {#if isYoutubeApiKeySet}
      <Alert color="green" class="mb-4">
        <span class="font-medium">{t('settings.youtube.alreadySet')}</span>
        {t('settings.youtube.overwriteWarning')}
      </Alert>
    {:else}
      <Alert color="yellow" class="mb-4">
        <span class="font-medium">{t('settings.youtube.notSet')}</span>
        {t('settings.youtube.notSetWarning')}
      </Alert>
    {/if}
    <Input
      type="password"
      id="youtube-api-key"
      bind:value={youtubeApiKey}
      placeholder={t('settings.youtube.placeholder')}
    />
  </div>

  <!-- UI Language -->
  <div class="mt-6">
    <Label for="language-select" class="mb-2">{t('settings.uiLanguage.label')}</Label>
    <Select
      id="language-select"
      bind:value={language}
      items={[
        { value: 'en', name: t('settings.uiLanguage.english') },
        { value: 'ja', name: t('settings.uiLanguage.japanese') },
      ]}
    />
  </div>

  <!-- Learning Target Languages -->
  <div class="mt-6">
    <Label class="mb-2">{t('settings.learningTargetLanguages.label')}</Label>
    <div class="mb-2 flex flex-wrap gap-2">
      {#if learningTargetLanguages.length > 0}
        {#each learningTargetLanguages as langCode (langCode)}
          <Badge
            large
            color="indigo"
            class="flex items-center gap-1 p-2"
            data-testid={`learning-target-badge-${langCode}`}
          >
            {translatedName(langCode)}
            <button
              aria-label={`Remove ${translatedName(langCode)}`}
              onclick={() => removeLanguage(langCode)}
              class="hover:text-gray-400"
            >
              <CloseCircleSolid class="h-4 w-4" />
            </button>
          </Badge>
        {/each}
      {:else}
        <p class="text-sm text-gray-500">{t('settings.learningTargetLanguages.none')}</p>
      {/if}
    </div>
    <Button size="sm" color="light" onclick={() => (showLanguageModal = true)}
      >{t('settings.learningTargetLanguages.add')}</Button
    >
  </div>

  <!-- Explanation Languages -->
  <div class="mt-6">
    <Label class="mb-2">{t('settings.explanationLanguages.label')}</Label>
    <div class="mb-2 flex flex-wrap gap-2">
      {#if explanationLanguages.length > 0}
        {#each explanationLanguages as langCode (langCode)}
          <Badge
            large
            color="indigo"
            class="flex items-center gap-1 p-2"
            data-testid={`explanation-language-badge-${langCode}`}
          >
            {translatedName(langCode)}
            <button
              aria-label={`Remove ${translatedName(langCode)}`}
              onclick={() => removeExplanationLanguage(langCode)}
              class="hover:text-gray-400"
            >
              <CloseCircleSolid class="h-4 w-4" />
            </button>
          </Badge>
        {/each}
      {:else}
        <p class="text-sm text-gray-500">{t('settings.explanationLanguages.none')}</p>
      {/if}
    </div>
    <Button size="sm" color="light" onclick={() => (showExplanationLanguageModal = true)}>
      {t('settings.explanationLanguages.add')}
    </Button>
  </div>

  <!-- Save Button -->
  <div class="mt-6 pt-6">
    <Button
      onclick={() =>
        onSave(
          { language, learningTargetLanguages, explanationLanguages },
          geminiApiKey,
          youtubeApiKey
        )}
      disabled={isSaving}
    >
      {#if isSaving}
        {t('settings.saveButton.saving')}
      {:else}
        {t('settings.saveButton.label')}
      {/if}
    </Button>
  </div>
</div>

<LanguageSelectionModal
  show={showLanguageModal}
  selectedLanguages={learningTargetLanguages}
  onSelect={handleLanguageSelection}
  onClose={() => (showLanguageModal = false)}
/>

<LanguageSelectionModal
  show={showExplanationLanguageModal}
  selectedLanguages={explanationLanguages}
  onSelect={handleExplanationLanguageSelection}
  onClose={() => (showExplanationLanguageModal = false)}
/>
