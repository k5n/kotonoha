<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { Alert } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

  type Props = {
    errorMessage: string;
  };
  let { errorMessage }: Props = $props();
</script>

{#if errorMessage}
  <Alert color="red">
    <ExclamationCircleOutline class="h-5 w-5" />
    <span class="font-medium">{t('common.errorPrefix')}</span>
    {errorMessage}
  </Alert>
{/if}
