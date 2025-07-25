<script lang="ts">
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import { Alert, Button, Input, Label, Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let apiKeyInput = $state('');
  let settings = $derived(data.settings);
  let errorMessage = $derived(data.error ?? '');
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
      errorMessage = '設定が読み込まれていません。';
      return;
    }
    errorMessage = '';
    successMessage = '';
    if (!apiKeyInput) {
      errorMessage = 'APIキーを入力してください。';
      return;
    }
    isSaving = true;
    try {
      await saveSettings(settings, apiKeyInput);
      settings = { ...settings, isApiKeySet: true }; // Update settings to reflect the new API key
      apiKeyInput = '';
      successMessage = 'APIキーを保存しました。';
    } catch (e) {
      errorMessage = 'APIキーの保存に失敗しました。';
      console.error(e);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="p-4 md:p-6">
  <Button color="light" class="mb-4 w-fit" onclick={goBack}>
    <ArrowLeftOutline class="me-2 h-5 w-5" />
    戻る
  </Button>

  <h1 class="text-xl font-bold">設定</h1>

  {#if settings}
    <div class="mt-4">
      {#if settings.isApiKeySet}
        <Alert color="green" class="mb-4">
          <span class="font-medium">APIキーは設定済みです。</span>
          新しいキーを保存すると上書きされます。
        </Alert>
      {:else}
        <Alert color="yellow" class="mb-4">
          <span class="font-medium">APIキーは設定されていません。</span>
          機能を利用するにはAPIキーの登録が必要です。
        </Alert>
      {/if}
    </div>

    <div class="mt-6">
      <Label for="api-key" class="mb-2">Gemini API Key</Label>
      <Input type="password" id="api-key" bind:value={apiKeyInput} placeholder="APIキーを入力" />
    </div>

    <div class="mt-6">
      <Button onclick={handleSave} disabled={isSaving}>
        {#if isSaving}
          <Spinner size="6" color="blue" class="me-2" />保存中...
        {:else}
          保存
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
