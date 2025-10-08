<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import { bcp47ToLanguageName, bcp47ToLanguageNameTable } from '$lib/utils/language';
  import { error } from '@tauri-apps/plugin-log';
  import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Input,
    Label,
    Modal,
    Search,
    Select,
    Spinner,
  } from 'flowbite-svelte';
  import { ArrowLeftOutline, CloseCircleSolid } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let geminiApiKeyInput = $state('');
  let youtubeApiKeyInput = $state('');
  let successMessage = $state('');
  let isSaving = $state(false);
  let showLanguageModal = $state(false);
  let searchTerm = $state('');

  let language = $state(data.settings?.language ?? 'en');
  let learningTargetLanguages = $state(data.settings?.learningTargetLanguages ?? []);

  let appInfo = $derived(data.appInfo);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');

  const allLanguages = $derived(
    Object.entries(bcp47ToLanguageNameTable).map(([code, name]) => ({
      code,
      name,
      translatedName: t(`languages.${code}`),
    }))
  );

  const filteredLanguages = $derived(
    allLanguages.filter((lang) => {
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || lang.translatedName.toLowerCase().includes(term);
    })
  );

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      error('Cannot go back, navigate to the top page');
      window.location.href = '/';
    }
  }

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    language = target.value;
  }

  function handleLanguageSelection(checked: boolean, code: string) {
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

  function isLanguageSelected(code: string): boolean {
    return learningTargetLanguages.includes(code);
  }

  async function handleSave() {
    if (!data.settings) {
      errorMessage = t('settings.notifications.loadError');
      return;
    }
    errorMessage = '';
    successMessage = '';
    isSaving = true;
    try {
      const newSettings = {
        ...data.settings,
        language,
        learningTargetLanguages,
      };
      await saveSettings(newSettings, geminiApiKeyInput, youtubeApiKeyInput);
      geminiApiKeyInput = '';
      youtubeApiKeyInput = '';
      successMessage = t('settings.notifications.saveSuccess');
      invalidateAll(); // Invalidate all data to refresh settings
    } catch (e) {
      errorMessage = t('settings.notifications.saveError');
      error(`Failed to save settings: ${e}`);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="p-4 md:p-6">
  <Button color="light" class="mb-4 w-fit" onclick={goBack}>
    <ArrowLeftOutline class="me-2 h-5 w-5" />
    {t('settings.backButton')}
  </Button>

  <h1 class="text-xl font-bold">{t('settings.title')}</h1>

  {#if data.settings}
    <div class="mt-6">
      <Label for="gemini-api-key" class="mb-2">{t('settings.gemini.label')}</Label>
      {#if data.isGeminiApiKeySet}
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
        bind:value={geminiApiKeyInput}
        placeholder={t('settings.gemini.placeholder')}
      />
    </div>

    <div class="mt-6">
      <Label for="youtube-api-key" class="mb-2">{t('settings.youtube.label')}</Label>
      {#if data.isYoutubeApiKeySet}
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
        bind:value={youtubeApiKeyInput}
        placeholder={t('settings.youtube.placeholder')}
      />
    </div>

    <div class="mt-6">
      <Label for="language-select" class="mb-2">{t('settings.uiLanguage.label')}</Label>
      <Select
        id="language-select"
        value={language}
        onchange={handleLanguageChange}
        items={[
          { value: 'en', name: t('settings.uiLanguage.english') },
          { value: 'ja', name: t('settings.uiLanguage.japanese') },
        ]}
      />
    </div>

    <div class="mt-6">
      <Label class="mb-2">{t('settings.learningTargetLanguages.label')}</Label>
      <div class="mb-2 flex flex-wrap gap-2">
        {#if learningTargetLanguages.length > 0}
          {#each learningTargetLanguages as langCode (langCode)}
            <Badge large color="indigo" class="flex items-center gap-1 p-2">
              {bcp47ToLanguageName(langCode) ?? langCode}
              <button onclick={() => removeLanguage(langCode)} class="hover:text-gray-400">
                <CloseCircleSolid class="h-4 w-4" />
              </button>
            </Badge>
          {/each}
        {:else}
          <p class="text-sm text-gray-500">{t('settings.learningTargetLanguages.none')}</p>
        {/if}
      </div>
      <Button size="sm" color="light" onclick={() => (showLanguageModal = true)}>
        {t('settings.learningTargetLanguages.add')}
      </Button>
    </div>

    <div class="mt-6 pt-6">
      <Button onclick={handleSave} disabled={isSaving}>
        {#if isSaving}
          <Spinner size="6" color="blue" class="me-2" />{t('settings.saveButton.saving')}
        {:else}
          {t('settings.saveButton.label')}
        {/if}
      </Button>
    </div>
  {/if}

  {#if errorMessage}
    <Alert color="red" class="mt-4">
      {errorMessage}
    </Alert>
  {/if}

  {#if successMessage}
    <Alert color="green" class="mt-4">
      {successMessage}
    </Alert>
  {/if}

  {#if appInfo}
    <div class="mt-8 border-t border-gray-200 pt-4">
      <h2 class="mb-2 text-lg font-semibold">
        {t('appInfo.title', { appName: appInfo.name })}
      </h2>
      <div class="space-y-1 text-sm text-gray-500">
        <div>{t('appInfo.version')}: {appInfo.version}</div>
        <div>{t('appInfo.copyright')}: {appInfo.copyright}</div>
        <div>{t('appInfo.license')}: {appInfo.license}</div>
        <div>
          {t('appInfo.homepage')}:
          <a href={appInfo.homepage} target="_blank" rel="noopener" class="text-blue-600 underline"
            >{appInfo.homepage}</a
          >
        </div>
      </div>
    </div>
  {/if}
</div>

<Modal bind:open={showLanguageModal} title={t('settings.learningTargetLanguages.modalTitle')}>
  <div class="flex flex-col space-y-4">
    <Search bind:value={searchTerm} placeholder={t('settings.learningTargetLanguages.search')} />
    <div class="h-64 overflow-y-auto border">
      {#each filteredLanguages as lang (lang.code)}
        <label class="flex w-full items-center space-x-2 p-2 hover:bg-gray-100">
          <Checkbox
            checked={isLanguageSelected(lang.code)}
            onchange={() => handleLanguageSelection(!isLanguageSelected(lang.code), lang.code)}
          />
          <span>
            {lang.translatedName}
            {#if lang.translatedName !== lang.name}
              <span class="text-sm text-gray-500">({lang.name})</span>
            {/if}
          </span>
        </label>
      {/each}
    </div>
  </div>
</Modal>
