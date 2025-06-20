<script lang="ts">
  import type { Episode } from '$lib/domain/entities/episode';
  import { ArrowRightOutline } from 'flowbite-svelte-icons';

  export let episode: Episode;

  // ISO 8601形式の日付文字列を YYYY-MM-DD 形式に変換
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch (e) {
      return '----/--/--';
    }
  };
</script>

<a href={`/episode/${episode.id}`} class="group block p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
  <div class="flex items-center justify-between">
    <div>
      <p class="font-semibold text-gray-900 dark:text-white">{episode.title}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        作成日: {formatDate(episode.createdAt)}
      </p>
    </div>
    <ArrowRightOutline
      class="group-hover:text-primary-500 h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1"
    />
  </div>
</a>
