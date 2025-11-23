<script lang="ts">
  import { Button, Heading } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import type { Component } from 'svelte';
  type Props = {
    title: string;
    message: string;
    buttonText: string;
    Icon: Component;
    onAdd: () => void;
  };
  let { title, message, buttonText, Icon, onAdd }: Props = $props();
</script>

<div class="rounded-lg border-2 border-dashed px-6 py-16 text-center">
  <Icon class="mx-auto mb-4 h-12 w-12 text-gray-400" />
  <Heading tag="h3" class="mb-2 text-xl font-semibold">{title}</Heading>
  <p class="mb-4 text-gray-500">{message}</p>
  <Button color="alternative" onclick={onAdd}>
    <PlusOutline class="me-2 h-5 w-5" />
    {buttonText}
  </Button>
</div>
