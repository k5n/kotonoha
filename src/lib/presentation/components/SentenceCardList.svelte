<script lang="ts">
  import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
  import { formatDate } from '$lib/presentation/utils/dateFormatter';
  import DOMPurify from 'dompurify';
  import { Accordion, AccordionItem } from 'flowbite-svelte';

  interface Props {
    sentenceCards: readonly SentenceCard[];
  }
  let { sentenceCards }: Props = $props();

  function sanitizeSentence(html: string): string {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b'], ALLOWED_ATTR: [] });
  }
</script>

<div class="space-y-2">
  {#if sentenceCards.length === 0}
    <div class="rounded-lg border-2 border-dashed py-10 text-center">
      <p class="text-gray-500">このエピソードにはSentence Cardがありません。</p>
    </div>
  {:else}
    <Accordion>
      {#each sentenceCards as card (card.id)}
        <AccordionItem>
          {#snippet header()}
            <div>
              <div class="text-xl font-bold">{card.expression}</div>
              <div class="sentence-content text-gray-600 dark:text-gray-400">
                <!-- サニタイズして表示しているので警告を抑制 -->
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html sanitizeSentence(card.sentence)}
              </div>
            </div>
          {/snippet}
          <div class="space-y-2">
            <div class="space-y-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                <span
                  class="me-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >文脈</span
                >{card.contextualDefinition}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                <span
                  class="me-1 inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                  >コア</span
                >{card.coreMeaning}
              </p>
            </div>
            <p class="text-xs text-gray-400">作成日: {formatDate(card.createdAt)}</p>
          </div>
        </AccordionItem>
      {/each}
    </Accordion>
  {/if}
</div>
