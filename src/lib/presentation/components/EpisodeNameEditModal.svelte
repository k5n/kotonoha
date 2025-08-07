<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Alert, Button, Heading, Input, Label, Modal } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    initialName?: string;
    onClose: () => void;
    onSubmit: (_name: string) => void;
  };
  let { show, isSubmitting = false, initialName = '', onClose, onSubmit }: Props = $props();

  let name = $state(initialName);
  let errorMessage = $state('');

  function handleSubmit() {
    if (!name.trim()) {
      errorMessage = t('components.episodeNameEditModal.errorNameRequired');
      return;
    }
    onSubmit(name.trim());
    // 入力値はモーダルを閉じる側でリセットする想定
  }
</script>

<Modal open={show} onclose={onClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold"
      >{t('components.episodeNameEditModal.title')}</Heading
    >
    <div class="mb-4">
      <Label for="episodeName">{t('components.episodeNameEditModal.nameLabel')}</Label>
      <Input
        id="episodeName"
        type="text"
        class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        bind:value={name}
        placeholder={t('components.episodeNameEditModal.namePlaceholder')}
        disabled={isSubmitting}
      />
      {#if errorMessage}
        <Alert color="red" class="mb-4">
          {errorMessage}
        </Alert>
      {/if}
    </div>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={onClose} disabled={isSubmitting}
        >{t('components.episodeNameEditModal.cancel')}</Button
      >
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting
          ? t('components.episodeNameEditModal.submitting')
          : t('components.episodeNameEditModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
