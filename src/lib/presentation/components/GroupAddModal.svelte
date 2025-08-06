<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { EpisodeGroupType } from '$lib/domain/entities/episodeGroup';
  import { Alert, Button, Heading, Input, Label, Modal, Radio } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (_name: string, _groupType: EpisodeGroupType) => void;
  };
  let { show, isSubmitting = false, onClose, onSubmit }: Props = $props();

  let groupName = $state('');
  let groupType = $state<EpisodeGroupType>('folder');
  let errorMessage = $state('');

  function handleSubmit() {
    if (!groupName.trim()) {
      errorMessage = t('components.groupAddModal.errorNameRequired');
      return;
    }
    onSubmit(groupName, groupType);
    groupName = '';
    groupType = 'folder';
  }
</script>

<Modal open={show} onclose={onClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold">{t('components.groupAddModal.title')}</Heading>
    <div class="mb-4">
      <Label for="groupName">{t('components.groupAddModal.nameLabel')}</Label>
      <Input
        id="groupName"
        type="text"
        class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        bind:value={groupName}
        placeholder={t('components.groupAddModal.namePlaceholder')}
      />
    </div>
    <div class="mb-4">
      <Label>{t('components.groupAddModal.typeLabel')}</Label>
      <div class="mt-2 flex gap-4">
        <Radio id="type-folder" name="groupType" value="folder" bind:group={groupType} />
        <Label for="type-folder">{t('components.groupAddModal.typeFolder')}</Label>
        <Radio id="type-album" name="groupType" value="album" bind:group={groupType} />
        <Label for="type-album">{t('components.groupAddModal.typeAlbum')}</Label>
      </div>
    </div>
    {#if errorMessage}
      <Alert color="red" class="mb-4">
        {errorMessage}
      </Alert>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={onClose} disabled={isSubmitting}
        >{t('components.groupAddModal.cancel')}</Button
      >
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting
          ? t('components.groupAddModal.submitting')
          : t('components.groupAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
