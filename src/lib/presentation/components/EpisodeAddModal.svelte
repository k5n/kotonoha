<script lang="ts">
  import { episodeAddStore } from '$lib/application/stores/episodeAddStore/episodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileEpisodeForm from '$lib/presentation/components/FileEpisodeForm.svelte';
  import YoutubeEpisodeForm from '$lib/presentation/components/YoutubeEpisodeForm.svelte';
  import { Heading, Label, Modal, Radio } from 'flowbite-svelte';

  type Props = {
    onSubmit: () => void;
    onTsvFileSelected: (filePath: string) => void;
    onYoutubeUrlChanged: (url: string) => void;
    onTtsEnabled: () => void;
  };
  let { onSubmit, onTsvFileSelected, onYoutubeUrlChanged, onTtsEnabled }: Props = $props();
</script>

<Modal onclose={episodeAddStore.close} open={episodeAddStore.show} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>

    <div class="mb-4 flex items-center gap-6">
      <span class="text-sm font-medium text-gray-900 dark:text-white"
        >{t('components.episodeAddModal.sourceTypeLabel')}</span
      >
      <div class="flex items-center">
        <Radio id="source-file" bind:group={episodeAddStore.sourceType} value="file" />
        <Label for="source-file" class="ms-2"
          >{t('components.episodeAddModal.sourceTypeFile')}</Label
        >
      </div>
      <div class="flex items-center">
        <Radio id="source-youtube" bind:group={episodeAddStore.sourceType} value="youtube" />
        <Label for="source-youtube" class="ms-2"
          >{t('components.episodeAddModal.sourceTypeYoutube')}</Label
        >
      </div>
    </div>

    {#if episodeAddStore.sourceType === 'file'}
      <FileEpisodeForm {onTsvFileSelected} {onSubmit} {onTtsEnabled} />
    {/if}

    {#if episodeAddStore.sourceType === 'youtube'}
      <YoutubeEpisodeForm {onYoutubeUrlChanged} {onSubmit} />
    {/if}
  </div>
</Modal>
