<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import FileSelect from '$lib/presentation/components/presentational/FileSelect.svelte';
  import { Label } from 'flowbite-svelte';

  type Props = {
    scriptFilePath: string | null;
    fieldErrors: {
      scriptFile: string;
    };
    fieldTouched: {
      scriptFile: boolean;
    };
    hasOtherErrorRelatedToScriptFile: boolean;
    onScriptFilePathChange: (filePath: string | null) => void;
  };

  let {
    scriptFilePath,
    fieldErrors,
    fieldTouched,
    hasOtherErrorRelatedToScriptFile,
    onScriptFilePathChange,
  }: Props = $props();
</script>

<div class="mb-4">
  <Label class="mb-2 block" for="scriptFile">
    {t('components.fileEpisodeForm.scriptFileLabel')}
  </Label>
  <FileSelect
    color={fieldTouched.scriptFile && !fieldErrors.scriptFile && !hasOtherErrorRelatedToScriptFile
      ? 'green'
      : 'light'}
    accept=".srt,.sswt,.tsv,.vtt,.txt"
    value={scriptFilePath}
    onFileSelected={(file) => onScriptFilePathChange(file)}
    onClear={() => onScriptFilePathChange(null)}
    id="scriptFile"
    dataTestId="script-file-select"
  />
  {#if fieldTouched.scriptFile && fieldErrors.scriptFile}
    <div class="mt-1 text-sm text-red-600">{fieldErrors.scriptFile}</div>
  {/if}
</div>
