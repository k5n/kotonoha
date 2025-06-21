<script lang="ts">
  import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
  import { Accordion, AccordionItem } from 'flowbite-svelte';

  interface Props {
    sentenceCards: readonly SentenceCard[];
  }
  let { sentenceCards }: Props = $props();

  function formatDate(date: Date) {
    try {
      return date.toLocaleDateString();
    } catch {
      return String(date);
    }
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
          {#snippet header()}{card.targetExpression}{/snippet}
          <div class="mb-4 w-full text-left font-semibold">
            {card.sentence}
          </div>
          <div class="space-y-2">
            <p>
              {card.definition}
            </p>
            <p class="text-xs text-gray-400">作成日: {formatDate(card.createdAt)}</p>
          </div>
        </AccordionItem>
      {/each}
    </Accordion>
  {/if}
</div>
