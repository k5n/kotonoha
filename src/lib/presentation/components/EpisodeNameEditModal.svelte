<script lang="ts">
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
      errorMessage = 'エピソード名を入力してください';
      return;
    }
    onSubmit(name.trim());
    // 入力値はモーダルを閉じる側でリセットする想定
  }
</script>

<Modal open={show} onclose={onClose}>
  <div class="p-4">
    <Heading tag="h2" class="mb-4 text-xl font-bold">エピソード名の編集</Heading>
    <div class="mb-4">
      <Label for="episodeName">エピソード名</Label>
      <Input
        id="episodeName"
        type="text"
        class="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        bind:value={name}
        placeholder="新しいエピソード名"
        disabled={isSubmitting}
      />
      {#if errorMessage}
        <Alert color="red" class="mb-4">
          {errorMessage}
        </Alert>
      {/if}
    </div>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={onClose} disabled={isSubmitting}>キャンセル</Button>
      <Button onclick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? '保存中...' : '保存'}
      </Button>
    </div>
  </div>
</Modal>
