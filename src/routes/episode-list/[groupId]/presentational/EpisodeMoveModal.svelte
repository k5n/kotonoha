<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { Episode } from '$lib/domain/entities/episode';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { Alert, Button, Heading, Label, Modal, Select } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    episode: Episode | null;
    availableTargetGroups: readonly EpisodeGroup[]; // Hierarchical list of available parents
    onClose: () => void;
    onSubmit: (_newParentId: string) => void;
  };
  let {
    show,
    isSubmitting = false,
    episode,
    availableTargetGroups,
    onClose,
    onSubmit,
  }: Props = $props();

  let selectedGroupId = $state<string | null>(null);
  let errorMessage = $state('');

  function handleSubmit() {
    if (selectedGroupId === null) {
      errorMessage = t('components.episodeMoveModal.errorTargetRequired');
      return;
    }
    onSubmit(selectedGroupId);
    resetInternalState();
  }

  function handleClose() {
    onClose();
    resetInternalState();
  }

  function resetInternalState() {
    selectedGroupId = null;
    errorMessage = '';
  }

  // Helper to render hierarchical options with indentation
  function renderGroupOptions(groups: readonly EpisodeGroup[], level: number = 0) {
    let options: { value: string | null; name: string }[] = [];
    const indent = '　'.repeat(level); // Japanese full-width space for indentation

    for (const group of groups) {
      options.push({ value: group.id, name: `${indent}${group.name}` });
      if (group.children && group.children.length > 0) {
        options = options.concat(renderGroupOptions(group.children, level + 1));
      }
    }
    return options;
  }

  // Derived state for flattened options with indentation
  let flattenedOptions = $derived.by(() => {
    return renderGroupOptions(availableTargetGroups);
  });
</script>

<Modal open={show} onclose={handleClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold"
      >{t('components.episodeMoveModal.title')}</Heading
    >
    <p class="mb-4">{t('components.episodeMoveModal.message', { title: episode?.title })}</p>

    <div class="mb-4">
      <Label for="targetGroup" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {t('components.episodeMoveModal.targetGroupLabel')}
      </Label>
      <Select
        items={flattenedOptions}
        bind:value={selectedGroupId}
        disabled={isSubmitting}
        class="w-full"
        placeholder={t('components.episodeMoveModal.targetGroupPlaceholder')}
      />
    </div>

    {#if errorMessage}
      <Alert color="red" class="mb-4">
        {errorMessage}
      </Alert>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={handleClose} disabled={isSubmitting}
        >{t('common.cancel')}</Button
      >
      <Button onclick={handleSubmit} disabled={isSubmitting || selectedGroupId === null}>
        {isSubmitting
          ? t('components.episodeMoveModal.submitting')
          : t('components.episodeMoveModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
