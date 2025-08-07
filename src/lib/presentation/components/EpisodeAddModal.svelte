<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { getAudioDuration } from '$lib/presentation/utils/getAudioDuration';
  import { Alert, Button, Fileupload, Heading, Input, Label, Modal } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (_title: string, _audioFile: File, _srtFile: File, _duration: number) => void;
  };
  let { show, isSubmitting = false, onClose, onSubmit }: Props = $props();

  let title = $state('');
  let audioFiles = $state<FileList | null>(null);
  let srtFiles = $state<FileList | null>(null);
  // NOTE: 「作成」ボタンが押せないので表示されることはないはずだが・・・。
  let errorMessage = $state('');

  async function handleSubmit() {
    if (!title.trim()) {
      errorMessage = t('components.episodeAddModal.errorTitleRequired');
      return;
    }
    const audioFile = audioFiles?.[0];
    if (!audioFile) {
      errorMessage = t('components.episodeAddModal.errorAudioFileRequired');
      return;
    }
    const srtFile = srtFiles?.[0];
    if (!srtFile) {
      errorMessage = t('components.episodeAddModal.errorSrtFileRequired');
      return;
    }

    try {
      const duration = await getAudioDuration(audioFile);
      onSubmit(title, audioFile, srtFile, duration);
      resetForm();
    } catch (error) {
      errorMessage = t('components.episodeAddModal.errorAudioFileLoad');
      console.error(error);
    }

    function resetForm() {
      title = '';
      audioFiles = null;
      srtFiles = null;
      errorMessage = '';
    }
  }
</script>

<Modal onclose={onClose} open={show}>
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">{t('components.episodeAddModal.title')}</Heading>
    <div class="mb-4">
      <Label class="mb-2 block" for="title">{t('components.episodeAddModal.titleLabel')}</Label>
      <Input
        id="title"
        placeholder={t('components.episodeAddModal.titlePlaceholder')}
        bind:value={title}
        type="text"
      />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="audioFile"
        >{t('components.episodeAddModal.audioFileLabel')}</Label
      >
      <Fileupload accept="audio/*" bind:files={audioFiles} id="audioFile" />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="srtFile">{t('components.episodeAddModal.srtFileLabel')}</Label>
      <Fileupload accept=".srt" bind:files={srtFiles} id="srtFile" />
    </div>
    {#if errorMessage}
      <Alert class="mb-4" color="red">
        {errorMessage}
      </Alert>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={isSubmitting} onclick={onClose}
        >{t('components.episodeAddModal.cancel')}</Button
      >
      <Button
        disabled={isSubmitting || !title.trim() || !audioFiles?.length || !srtFiles?.length}
        onclick={handleSubmit}
      >
        {isSubmitting
          ? t('components.episodeAddModal.submitting')
          : t('components.episodeAddModal.submit')}
      </Button>
    </div>
  </div>
</Modal>
