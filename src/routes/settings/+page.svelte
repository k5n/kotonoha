<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import { error } from '@tauri-apps/plugin-log';
  import { Alert, Button, Input, Label, Select, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let geminiApiKeyInput = $state('');
  let youtubeApiKeyInput = $state('');
  let successMessage = $state('');
  let isSaving = $state(false);

  let settings = $derived(data.settings);
  let appInfo = $derived(data.appInfo);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      error('Cannot go back, navigate to the top page');
      window.location.href = '/';
    }
  }

  function handleLanguageChange(event: Event) {
    if (settings != null) {
      const target = event.target as HTMLSelectElement;
      settings = { ...settings, language: target.value };
    }
  }

  async function handleSave() {
    if (!settings) {
      errorMessage = t('settings.notifications.loadError');
      return;
    }
    errorMessage = '';
    successMessage = '';
    isSaving = true;
    try {
      await saveSettings(settings, geminiApiKeyInput, youtubeApiKeyInput);
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

  {#if settings}
    <div class="mt-4">
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
    </div>

    <div class="mt-6">
      <Label for="gemini-api-key" class="mb-2">{t('settings.gemini.label')}</Label>
      <Input
        type="password"
        id="gemini-api-key"
        bind:value={geminiApiKeyInput}
        placeholder={t('settings.gemini.placeholder')}
      />
    </div>

    <div class="mt-8 border-t pt-6">
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
    </div>

    <div class="mt-6">
      <Label for="youtube-api-key" class="mb-2">{t('settings.youtube.label')}</Label>
      <Input
        type="password"
        id="youtube-api-key"
        bind:value={youtubeApiKeyInput}
        placeholder={t('settings.youtube.placeholder')}
      />
    </div>

    <div class="mt-8 border-t pt-6">
      <Label for="language-select" class="mb-2">{t('settings.language.label')}</Label>
      <Select
        id="language-select"
        value={settings.language}
        onchange={handleLanguageChange}
        items={[
          { value: 'en', name: t('settings.language.english') },
          { value: 'ja', name: t('settings.language.japanese') },
        ]}
      />
    </div>

    <div class="mt-6">
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
