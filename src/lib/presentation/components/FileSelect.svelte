<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { Button } from 'flowbite-svelte';
  import { CloseCircleSolid, FolderOpenOutline } from 'flowbite-svelte-icons';

  type Props = {
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    id?: string;
    value: string | null;
    onFileSelected: (file: string | null) => void;
    onClear: () => void;
  };
  let { accept = '*', disabled = false, id, value, onFileSelected, onClear }: Props = $props();

  // acceptプロパティからTauriのfiltersを生成
  function createFilters(accept: string) {
    if (!accept || accept === '*') {
      return [];
    }

    // MIME typeの場合（例: "audio/*", "image/*"）
    if (accept.includes('/')) {
      const mimeTypes = accept.split(',').map((type) => type.trim());
      const filters = [];

      for (const mimeType of mimeTypes) {
        if (mimeType === 'audio/*') {
          filters.push({
            name: t('components.fileSelect.audioFiles'),
            extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
          });
        }
      }

      return filters;
    }

    // 拡張子の場合（例: ".srt,.sswt,.tsv"）
    const extensions = accept
      .split(',')
      .map((ext) => ext.trim().replace(/^\./, ''))
      .filter((ext) => ext.length > 0);

    if (extensions.length > 0) {
      return [
        {
          name: t('components.fileSelect.supportedSubtitleFiles'),
          extensions,
        },
      ];
    }

    return [];
  }

  async function handleFileSelect() {
    if (disabled) return;

    try {
      const filters = createFilters(accept);

      const selected = await open({
        multiple: false,
        directory: false,
        filters,
        title: t('components.fileSelect.placeholder'),
      });

      if (!selected) {
        return; // ユーザーがキャンセルした場合
      }

      onFileSelected(selected);
    } catch (error) {
      console.error('Failed to select files:', error);
    }
  }
</script>

<div class="w-full">
  <div class="flex items-center gap-2">
    <Button
      {disabled}
      onclick={handleFileSelect}
      color="light"
      class="flex w-full items-center justify-start gap-2 bg-gray-50"
      {id}
    >
      <FolderOpenOutline class="h-4 w-4" />
      {value || t('components.fileSelect.placeholder')}
    </Button>

    {#if value}
      <Button onclick={onClear} color="light" size="sm" class="p-1" title="Clear selection">
        <CloseCircleSolid class="h-4 w-4" />
      </Button>
    {/if}
  </div>
</div>
