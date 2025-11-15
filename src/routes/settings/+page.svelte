<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import type { Settings } from '$lib/domain/entities/settings';
  import { Alert, Button } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';
  import AppInfoComponent from './presentational/AppInfoComponent.svelte';
  import SettingsComponent from './presentational/SettingsComponent.svelte';

  let { data }: PageProps = $props();

  let successMessage = $state('');
  let isSaving = $state(false);

  let appInfo = $derived(data.appInfo);
  let errorMessage = $derived(data.errorKey ? t(data.errorKey) : '');

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      console.error('Cannot go back, navigate to the top page');
      window.location.href = '/';
    }
  }

  async function handleSave(
    settings: Partial<Settings>,
    geminiApiKey: string,
    youtubeApiKey: string
  ) {
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
        ...settings,
      };
      await saveSettings(newSettings, geminiApiKey, youtubeApiKey);
      successMessage = t('settings.notifications.saveSuccess');
      invalidateAll(); // Invalidate all data to refresh settings
    } catch (e) {
      errorMessage = t('settings.notifications.saveError');
      console.error(`Failed to save settings: ${e}`);
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
    <SettingsComponent
      initialSettings={data.settings}
      isGeminiApiKeySet={data.isGeminiApiKeySet}
      isYoutubeApiKeySet={data.isYoutubeApiKeySet}
      {isSaving}
      onSave={handleSave}
    />
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
    <AppInfoComponent {appInfo} />
  {/if}
</div>
