<script lang="ts">
  import { Spinner } from 'flowbite-svelte';

  type Props = { message?: string };
  let { message }: Props = $props();
</script>

<div class="flex items-center justify-center py-20">
  <Spinner size="16" />
  {#if message}
    <span class="ms-4 text-gray-500">{message}</span>
  {/if}
</div>
