<script lang="ts">
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
      errorMessage = 'グループ名を入力してください';
      return;
    }
    onSubmit(groupName, groupType);
    groupName = '';
    groupType = 'folder';
  }
</script>

<Modal open={show} onclose={onClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold">グループ新規追加</Heading>
    <div class="mb-4">
      <Label for="groupName">グループ名</Label>
      <Input
        id="groupName"
        type="text"
        class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        bind:value={groupName}
        placeholder="グループ名を入力"
      />
    </div>
    <div class="mb-4">
      <Label>グループ種別</Label>
      <div class="mt-2 flex gap-4">
        <Radio id="type-folder" name="groupType" value="folder" bind:group={groupType} />
        <Label for="type-folder">フォルダ</Label>
        <Radio id="type-album" name="groupType" value="album" bind:group={groupType} />
        <Label for="type-album">アルバム</Label>
      </div>
    </div>
    {#if errorMessage}
      <Alert color="red" class="mb-4">
        {errorMessage}
      </Alert>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={onClose} disabled={isSubmitting}>キャンセル</Button>
      <Button onclick={handleSubmit} disabled={isSubmitting}
        >{isSubmitting ? '作成中...' : '作成'}</Button
      >
    </div>
  </div>
</Modal>
