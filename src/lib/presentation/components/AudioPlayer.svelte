<script lang="ts">
  interface Props {
    src: string;
    currentTime: number;
  }
  let { src, currentTime = $bindable() }: Props = $props();
</script>

<audio id="audio-player" controls class="w-full" {src} bind:currentTime>
  お使いのブラウザは audio タグをサポートしていません。
</audio>
