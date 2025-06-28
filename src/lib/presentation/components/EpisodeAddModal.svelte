<script lang="ts">
  import { Alert, Button, Fileupload, Heading, Input, Label, Modal } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (title: string, audioFile: File, srtFile: File) => void;
  };
  let { show, isSubmitting = false, onClose, onSubmit }: Props = $props();

  let title = $state('');
  let audioFiles = $state<FileList | null>(null);
  let srtFiles = $state<FileList | null>(null);
  // NOTE: 「作成」ボタンが押せないので表示されることはないはずだが・・・。
  let errorMessage = $state('');

  function handleSubmit() {
    if (!title.trim()) {
      errorMessage = 'タイトルを入力してください';
      return;
    }
    if (!audioFiles || audioFiles.length === 0) {
      errorMessage = '音声ファイルを選択してください';
      return;
    }
    if (!srtFiles || srtFiles.length === 0) {
      errorMessage = '字幕ファイルを選択してください';
      return;
    }
    onSubmit(title, audioFiles[0], srtFiles[0]);
    title = '';
  }
</script>

<Modal onclose={onClose} open={show}>
  <div class="p-4">
    <Heading class="mb-4 text-xl font-bold">エピソード新規追加</Heading>
    <div class="mb-4">
      <Label class="mb-2 block" for="title">タイトル</Label>
      <Input id="title" placeholder="エピソードのタイトル" bind:value={title} type="text" />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="audioFile">音声ファイル</Label>
      <Fileupload accept="audio/*" bind:files={audioFiles} id="audioFile" />
    </div>
    <div class="mb-4">
      <Label class="mb-2 block" for="srtFile">字幕ファイル (*.srt)</Label>
      <Fileupload accept=".srt" bind:files={srtFiles} id="srtFile" />
    </div>
    {#if errorMessage}
      <Alert class="mb-4" color="red">
        {errorMessage}
      </Alert>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" disabled={isSubmitting} onclick={onClose}>キャンセル</Button>
      <Button
        disabled={isSubmitting || !title.trim() || !audioFiles?.length || !srtFiles?.length}
        onclick={handleSubmit}
      >
        {isSubmitting ? '作成中...' : '作成'}
      </Button>
    </div>
  </div>
</Modal>
