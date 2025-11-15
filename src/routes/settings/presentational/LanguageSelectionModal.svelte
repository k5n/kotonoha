<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';
  import { bcp47ToTranslationKey, getSupportedLanguages } from '$lib/utils/language';
  import { Checkbox, Modal, Search } from 'flowbite-svelte';

  type Props = {
    show: boolean;
    selectedLanguages: readonly string[];
    onSelect: (code: string, checked: boolean) => void;
    onClose: () => void;
  };

  let { show, selectedLanguages, onSelect, onClose }: Props = $props();

  let searchTerm = $state('');

  const allLanguages = $derived(
    getSupportedLanguages().map(({ code, name }) => ({
      code,
      name,
      translatedName: t(bcp47ToTranslationKey(code) ?? `language.${code}`) || name,
    }))
  );

  const filteredLanguages = $derived(
    allLanguages.filter((lang) => {
      const term = searchTerm.toLowerCase();
      return (
        lang.name.toLowerCase().includes(term) || lang.translatedName.toLowerCase().includes(term)
      );
    })
  );

  function isLanguageSelected(code: string): boolean {
    return selectedLanguages.includes(code);
  }
</script>

<Modal open={show} onclose={onClose}>
  <div class="flex flex-col space-y-4">
    <Search bind:value={searchTerm} placeholder={t('components.languageSelectionModal.search')} />
    <div class="h-64 overflow-y-auto border">
      {#each filteredLanguages as lang (lang.code)}
        <label class="flex w-full items-center space-x-2 p-2 hover:bg-gray-100">
          <Checkbox
            checked={isLanguageSelected(lang.code)}
            onchange={(event) => onSelect(lang.code, event.currentTarget.checked)}
          />
          <span>
            {lang.translatedName}
            {#if lang.translatedName !== lang.name}
              <span class="text-sm text-gray-500">({lang.name})</span>
            {/if}
          </span>
        </label>
      {/each}
    </div>
  </div>
</Modal>
