<script lang="ts">
  import { saveSettings } from '$lib/application/usecases/saveSettings';
  import { Alert, Button, Input, Label } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let apiKeyInput = $state('');
  let isApiKeySet = $state(data.isApiKeySet);
  let errorMessage = $state(data.error ?? '');
  let successMessage = $state('');

  function goBack() {
    if (history.length > 1) {
      history.back();
    } else {
      // Cannot go back, navigate to the top page
      window.location.href = '/';
    }
  }

  async function handleSave() {
    errorMessage = '';
    successMessage = '';
    if (!apiKeyInput) {
      errorMessage = 'APIキーを入力してください。';
      return;
    }
    try {
      await saveSettings({ geminiApiKey: apiKeyInput });
      isApiKeySet = true;
      apiKeyInput = '';
      successMessage = 'APIキーを保存しました。';
    } catch (e) {
      errorMessage = 'APIキーの保存に失敗しました。';
      console.error(e);
    }
  }
</script>

<div class="p-4 md:p-6">
  <Button color="light" class="mb-4 w-fit" onclick={goBack}>
    <ArrowLeftOutline class="me-2 h-5 w-5" />
    戻る
  </Button>

  <h1 class="text-xl font-bold">設定</h1>

  <div class="mt-4">
    {#if isApiKeySet}
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
    <Button onclick={handleSave}>保存</Button>
  </div>

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
