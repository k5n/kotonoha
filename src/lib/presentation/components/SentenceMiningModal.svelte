<script lang="ts">
  import type { Dialogue } from '$lib/domain/entities/dialogue';
  import { Badge, Button, Checkbox, Modal, Spinner } from 'flowbite-svelte';
  import { CheckOutline, CloseOutline } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';

  type MinedResult = {
    id: number; // ★ 識別子としてidを追加
    expression: string;
    definition: string;
    type: '単語' | 'イディオム';
  };

  // --- Props ---
  interface Props {
    openModal: boolean;
    dialogue: Dialogue | null;
    onCreate: (selectedResults: MinedResult[]) => void;
  }
  let { openModal = $bindable(), dialogue, onCreate }: Props = $props();

  // --- State ---
  let isLoading = $state(true);
  let minedResults: MinedResult[] = $state([]);
  let selectedItemIds: number[] = $state([]);

  function handleCreate() {
    // 選択されたIDに基づいて、元のオブジェクトの配列を生成する
    const selectedObjects = minedResults.filter((result) => selectedItemIds.includes(result.id));
    onCreate(selectedObjects);
  }

  // --- Lifecycle ---
  onMount(() => {
    // LLMによる解析処理をシミュレート
    setTimeout(() => {
      minedResults = [
        {
          id: 1,
          expression: 'take off',
          definition: '（飛行機が）離陸する；（衣服などを）脱ぐ；（事業などが）軌道に乗る',
          type: 'イディオム',
        },
        {
          id: 2,
          expression: 'immediately',
          definition: 'すぐに、即座に',
          type: '単語',
        },
        {
          id: 3,
          expression: 'on track',
          definition: '順調に進んで、予定通りで',
          type: 'イディオム',
        },
      ];
      isLoading = false;
    }, 1500); // 1.5秒の遅延
  });
</script>

<Modal title="Sentence Mining" bind:open={openModal} size="lg">
  <div class="space-y-4">
    <p class="text-sm text-gray-500">以下の文から学習カードを作成します。</p>
    <blockquote
      class="border-s-4 border-gray-300 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-800"
    >
      <p class="text-base leading-relaxed font-medium text-gray-900 dark:text-white">
        {#if dialogue}
          {dialogue.correctedText || dialogue.originalText}
        {/if}
      </p>
    </blockquote>

    <div>
      {#if isLoading}
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <Spinner size="8" />
          <p class="mt-4 text-gray-500">AIが重要表現を抽出しています...</p>
        </div>
      {:else}
        <p class="mb-2 text-sm text-gray-500">カードにしたい単語・表現を選択してください。</p>
        <div class="space-y-3">
          {#each minedResults as item (item.id)}
            <label
              class="flex w-full items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Checkbox bind:group={selectedItemIds} value={item} />
              <div class="flex-1">
                <div class="flex items-center">
                  <span class="text-primary-700 dark:text-primary-400 text-lg font-bold"
                    >{item.expression}</span
                  >
                  <Badge color="gray" class="ms-2">{item.type}</Badge>
                </div>
                <p class="text-gray-600 dark:text-gray-300">{item.definition}</p>
              </div>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="flex justify-end space-x-2">
    <Button color="alternative" onclick={() => (openModal = false)}>
      <CloseOutline class="me-2 h-5 w-5" />
      キャンセル
    </Button>
    <Button disabled={selectedItemIds.length === 0} onclick={handleCreate}>
      <CheckOutline class="me-2 h-5 w-5" />
      選択した {selectedItemIds.length} 件をカードに追加
    </Button>
  </div>
</Modal>
