<script lang="ts">
  import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
  import { youtubeEpisodeAddStore } from '$lib/application/stores/episodeAddStore/youtubeEpisodeAddStore.svelte';
  import { t } from '$lib/application/stores/i18n.svelte';
  import YoutubeEpisodeForm from '$lib/presentation/components/YoutubeEpisodeForm.svelte';
  import { Heading, Modal } from 'flowbite-svelte';

  type Props = {
    open: boolean;
    onClose: () => void;
    onSubmitRequested: (payload: YoutubeEpisodeAddPayload) => Promise<void>;
    onYoutubeUrlChanged: (url: string) => Promise<void>;
  };

  let { open = false, onClose, onSubmitRequested, onYoutubeUrlChanged }: Props = $props();

  let isSubmitting = $state(false);
  let previousOpen = false;

  function resetFormState() {
    youtubeEpisodeAddStore.reset();
  }

  $effect(() => {
    if (open && !previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    if (!open && previousOpen) {
      resetFormState();
      isSubmitting = false;
    }

    previousOpen = open;
  });

  function handleClose() {
    resetFormState();
    isSubmitting = false;
    onClose();
  }

  async function handleSubmitRequest() {
    if (isSubmitting || youtubeEpisodeAddStore.isMetadataFetching) {
      return;
    }

    if (!youtubeEpisodeAddStore.validate()) {
      return;
    }

    const payload = youtubeEpisodeAddStore.buildPayload();
    if (!payload) {
      return;
    }

    try {
      isSubmitting = true;
      await onSubmitRequested(payload);
      handleClose();
    } catch (error) {
      console.error('Failed to submit YouTube episode:', error);
      youtubeEpisodeAddStore.setErrorMessage('components.youtubeEpisodeForm.errorSubmissionFailed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal {open} onclose={handleClose} size="xl">
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>

    <YoutubeEpisodeForm
      {isSubmitting}
      onClose={handleClose}
      onSubmit={handleSubmitRequest}
      {onYoutubeUrlChanged}
    />
  </div>
</Modal>
