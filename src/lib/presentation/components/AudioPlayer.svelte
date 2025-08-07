<script lang="ts">
  import { t } from '$lib/application/stores/i18n.svelte';

  interface Props {
    src: string;
    currentTime: number;
  }
  let { src, currentTime = $bindable() }: Props = $props();
</script>

<audio id="audio-player" controls class="w-full" {src} bind:currentTime>
  {t('components.audioPlayer.notSupported')}
</audio>
