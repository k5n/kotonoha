<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/application/stores/i18n.svelte';
  import { addNewEpisode, type EpisodeAddPayload } from '$lib/application/usecases/addNewEpisode';
  import type { Episode } from '$lib/domain/entities/episode';
  import { assertNotNull } from '$lib/utils/assertion';
  import { Button } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import EpisodeSourceSelectionModal from '../presentational/EpisodeSourceSelectionModal.svelte';
  import AudioScriptFileEpisodeAddContainer from './AudioScriptFileEpisodeAddContainer.svelte';
  import TtsEpisodeAddContainer from './TtsEpisodeAddContainer.svelte';
  import YoutubeEpisodeAddContainer from './YoutubeEpisodeAddContainer.svelte';

  interface Props {
    episodeGroupId: string;
    episodes: readonly Episode[];
    disabled?: boolean;
    isOpen?: boolean;
    onError: (message: string) => void;
  }

  let {
    episodeGroupId,
    episodes,
    disabled = false,
    isOpen = $bindable(false),
    onError,
  }: Props = $props();

  let isSubmitting = $state(false);
  type EpisodeType = 'none' | 'audio-script' | 'script-tts' | 'youtube';
  let selectedEpisodeType = $state<EpisodeType>('none');

  // === Add episode ===

  function handleAddEpisodeClick() {
    isOpen = true;
    selectedEpisodeType = 'none';
  }

  function handleEpisodeSourceSelected(source: 'youtube' | 'audio-script' | 'script-tts') {
    selectedEpisodeType = source;
  }

  function handleEpisodeModalClose() {
    isOpen = false;
    selectedEpisodeType = 'none';
  }

  async function handleEpisodeSubmit(payload: EpisodeAddPayload | null): Promise<void> {
    isSubmitting = true;
    try {
      assertNotNull(payload, 'Episode payload is not ready');
      await addNewEpisode(payload, episodeGroupId, episodes);
      await invalidateAll();
    } catch (e) {
      console.error(`Failed to add episode: ${e}`);
      onError(t('episodeListPage.errors.addEpisode'));
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Button onclick={handleAddEpisodeClick} disabled={disabled || isSubmitting}>
  <PlusOutline class="me-2 h-5 w-5" />
  {t('episodeListPage.addNewButton')}
</Button>

<EpisodeSourceSelectionModal
  open={isOpen && selectedEpisodeType === 'none'}
  onClose={handleEpisodeModalClose}
  onSourceSelected={handleEpisodeSourceSelected}
/>

<AudioScriptFileEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'audio-script'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
/>

<TtsEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'script-tts'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
/>

<YoutubeEpisodeAddContainer
  open={isOpen && selectedEpisodeType === 'youtube'}
  onClose={handleEpisodeModalClose}
  onSubmit={handleEpisodeSubmit}
/>
