<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import { Alert, Button, Input, Label, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let apiKeyInput = $state('');
  let settings = $derived(data.settings);
  let errorMessage = $state(data.error ?? '');
  let successMessage = $state('');
  let isSaving = $state(false);

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      // Cannot go back, navigate to the top page
      window.location.href = '/';
    }
  }

  async function handleSave() {
    if (!settings) {
      errorMessage = t('settings.notifications.loadError');
      return;
    }
    errorMessage = '';
    successMessage = '';
    if (!apiKeyInput) {
      errorMessage = t('settings.notifications.apiKeyRequired');
      return;
    }
    isSaving = true;
    try {
      await saveSettings(settings, apiKeyInput);
      settings = { ...settings, isApiKeySet: true }; // Update settings to reflect the new API key
      apiKeyInput = '';
      successMessage = t('settings.notifications.saveSuccess');
    } catch (e) {
      errorMessage = t('settings.notifications.saveError');
      console.error(e);
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
      {#if settings.isApiKeySet}
        <Alert color="green" class="mb-4">
          <span class="font-medium">{t('settings.apiKey.alreadySet')}</span>
          {t('settings.apiKey.overwriteWarning')}
        </Alert>
      {:else}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">{t('settings.apiKey.notSet')}</span>
          {t('settings.apiKey.notSetWarning')}
        </Alert>
      {/if}
    </div>

    <div class="mt-6">
      <Label for="api-key" class="mb-2">{t('settings.apiKey.label')}</Label>
      <Input
        type="password"
        id="api-key"
        bind:value={apiKeyInput}
        placeholder={t('settings.apiKey.placeholder')}
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
</div>
