<script lang="ts">
  import { Button, Modal, P } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

  type Props = {
    show?: boolean;
    title?: string;
    message: string;
    isSubmitting?: boolean;
    onConfirm: () => void;
    onClose: () => void;
  };

  let {
    show = $bindable(),
    title,
    message,
    isSubmitting = false,
    onConfirm,
    onClose,
  }: Props = $props();

  function handleConfirm() {
    if (isSubmitting) return;
    onConfirm();
  }

  function handleCancel() {
    if (isSubmitting) return;
    onClose();
  }
</script>

{#snippet footer()}
  <Button color="red" disabled={isSubmitting} onclick={handleConfirm}
    >{isSubmitting ? '処理中...' : 'はい、削除します'}</Button
  >
  <Button color="alternative" disabled={isSubmitting} onclick={handleCancel}>キャンセル</Button>
{/snippet}

<Modal bind:open={show} size="sm" onclose={handleCancel} {footer}>
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
