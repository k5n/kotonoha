import type { Episode } from '$lib/domain/entities/episode';
import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import type { SubtitleLine } from '$lib/domain/entities/subtitleLine';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';

// エピソード詳細取得ユースケース
export async function fetchEpisodeDetail(episodeId: number): Promise<{
  episode: Episode;
  subtitleLines: readonly SubtitleLine[];
  sentenceCards: readonly SentenceCard[];
} | null> {
  console.info(`Fetching episode detail for ID: ${episodeId}`);
  const episode = await episodeRepository.getEpisodeById(episodeId);
  if (!episode) {
    console.error(`Episode with ID ${episodeId} not found`);
    return null;
  }
  const subtitleLines = await dialogueRepository.getDialoguesByEpisodeId(episodeId);
  const sentenceCards = await sentenceCardRepository.getSentenceCardsByEpisodeId(episodeId);

  return {
    episode,
    subtitleLines,
    sentenceCards,
  };
}
