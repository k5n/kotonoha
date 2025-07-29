<script lang="ts">
  import { Button, Modal, P } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

  type Props = {
    open?: boolean;
    title?: string;
    message: string;
    isProcessing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };

  let {
    open = $bindable(),
    title,
    message,
    isProcessing = false,
    onConfirm,
    onCancel,
  }: Props = $props();

  function handleConfirm() {
    if (isProcessing) return;
    onConfirm();
  }

  function handleCancel() {
    if (isProcessing) return;
    onCancel();
  }
</script>

{#snippet footer()}
  <Button color="red" disabled={isProcessing} onclick={handleConfirm}
    >{isProcessing ? '処理中...' : 'はい、削除します'}</Button
  >
  <Button color="alternative" disabled={isProcessing} onclick={handleCancel}>キャンセル</Button>
{/snippet}

<Modal bind:open size="sm" onclose={handleCancel} {footer}>
  <div class="text-center">
    <ExclamationCircleOutline class="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
    {#if title}
      <h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    {/if}
    <P class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
      {message}
    </P>
  </div>
</Modal>
