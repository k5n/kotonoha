<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import type { EpisodeGroup } from '$lib/domain/entities/episodeGroup';
  import { Alert, Button, Heading, Label, Modal, Select } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    currentGroup: EpisodeGroup | null; // The group being moved
    availableParentGroups: readonly EpisodeGroup[]; // Hierarchical list of available parents
    onClose: () => void;
    onSubmit: (_newParentId: number | null) => void;
  };
  let {
    show,
    isSubmitting = false,
    currentGroup,
    availableParentGroups,
    onClose,
    onSubmit,
  }: Props = $props();

  let selectedParentId = $state<number | null>(null);
  let errorMessage = $state('');

  function handleSubmit() {
    if (selectedParentId === null) {
      errorMessage = t('components.groupMoveModal.errorTargetRequired');
      return;
    }
    onSubmit(selectedParentId);
    resetInternalState();
  }

  function handleClose() {
    onClose();
    resetInternalState();
  }

  function resetInternalState() {
    selectedParentId = null;
    errorMessage = '';
  }

  // Helper to render hierarchical options with indentation
  function renderGroupOptions(groups: readonly EpisodeGroup[], level: number = 0) {
    let options: { value: number | null; name: string }[] = [];
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
    const options = renderGroupOptions(availableParentGroups);
    return [{ value: null, name: `(${t('components.groupMoveModal.root')})` }, ...options];
  });
</script>

<Modal open={show} onclose={handleClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold">{t('components.groupMoveModal.title')}</Heading
    >
    <p class="mb-4">{t('components.groupMoveModal.message', { name: currentGroup?.name })}</p>

    <div class="mb-4">
      <Label for="parentGroup" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
        {t('components.groupMoveModal.targetGroupLabel')}
      </Label>
      <Select
        items={flattenedOptions}
        bind:value={selectedParentId}
        disabled={isSubmitting}
        class="w-full"
      />
    </div>

    {#if errorMessage}
      <Alert color="red" class="mb-4">
        {errorMessage}
      </Alert>
    {/if}

    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={onClose} disabled={isSubmitting}>{t('common.cancel')}</Button>
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting
          ? t('components.groupMoveModal.submitting')
          : t('components.groupMoveModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
