<script lang="ts">
  import { Toast } from 'flowbite-svelte';
  import { CloseCircleSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';

  type Props = {
    errorMessage: string;
    type: 'error' | 'warning';
  };
  let { errorMessage, type }: Props = $props();

  let toastClass = $derived(
    type === 'error'
      ? 'bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200'
      : 'bg-orange-100 text-orange-500 dark:bg-orange-800 dark:text-orange-200'
  );
</script>

<Toast color={undefined} class={toastClass}>
  {#snippet icon()}
    {#if type === 'error'}
      <CloseCircleSolid class="h-5 w-5" />
    {:else if type === 'warning'}
      <ExclamationCircleSolid class="h-5 w-5" />
    {/if}
  {/snippet}
  {errorMessage}
</Toast>
