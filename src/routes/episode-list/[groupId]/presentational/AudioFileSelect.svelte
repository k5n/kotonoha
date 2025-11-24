<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import { Label } from 'flowbite-svelte';

  type Props = {
    audioFilePath: string | null;
    fieldErrors: {
      audioFile: string;
    };
    fieldTouched: {
      audioFile: boolean;
    };
    onAudioFileChange: (filePath: string | null) => void;
  };

  let { audioFilePath, fieldErrors, fieldTouched, onAudioFileChange }: Props = $props();
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="audioFile">
    {t('components.fileEpisodeForm.audioFileLabel')}
  </Label>
  <FileSelect
    color={fieldTouched.audioFile && !fieldErrors.audioFile ? 'green' : 'light'}
    accept="audio/*"
    value={audioFilePath}
    onFileSelected={(file) => onAudioFileChange(file)}
    onClear={() => onAudioFileChange(null)}
    id="audioFile"
    dataTestId="audio-file-select"
  />
  {#if fieldTouched.audioFile && fieldErrors.audioFile}
    <div class="mt-1 text-sm text-red-600">{fieldErrors.audioFile}</div>
  {/if}
</div>
