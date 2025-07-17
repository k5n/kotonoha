<script lang="ts">
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
      errorMessage = '移動先を選択してください。';
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
    return [{ value: null, name: 'ルート (Root)' }, ...options];
  });
</script>

<Modal open={show} onclose={handleClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold">グループの移動</Heading>
    <p class="mb-4">「{currentGroup?.name}」をどこに移動しますか？</p>

    <div class="mb-4">
      <Label for="parentGroup" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        >移動先グループ</Label
      >
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
      <Button color="gray" onclick={onClose} disabled={isSubmitting}>キャンセル</Button>
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '移動中...' : '移動'}
      </Button>
    </div>
  </div>
</Modal>
