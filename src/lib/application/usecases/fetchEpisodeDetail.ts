import type { Dialogue } from '$lib/domain/entities/dialogue';
import type { Episode } from '$lib/domain/entities/episode';
import type { SentenceCard } from '$lib/domain/entities/sentenceCard';
import { dialogueRepository } from '$lib/infrastructure/repositories/dialogueRepository';
import { episodeRepository } from '$lib/infrastructure/repositories/episodeRepository';
import { fileRepository } from '$lib/infrastructure/repositories/fileRepository';
import { sentenceCardRepository } from '$lib/infrastructure/repositories/sentenceCardRepository';
import { error, info } from '@tauri-apps/plugin-log';

// エピソード詳細取得ユースケース
export async function fetchEpisodeDetail(episodeId: number): Promise<{
  episode: Episode;
  dialogues: readonly Dialogue[];
  sentenceCards: readonly SentenceCard[];
  audioBlobUrl: string;
} | null> {
  info(`Fetching episode detail for ID: ${episodeId}`);
  const episode = await episodeRepository.getEpisodeById(episodeId);
  if (!episode) {
    error(`Episode with ID ${episodeId} not found`);
    return null;
  }
  const dialogues = await dialogueRepository.getDialoguesByEpisodeId(episodeId);
  const sentenceCards = await sentenceCardRepository.getSentenceCardsByEpisodeId(episodeId);
  const audioBlobUrl = await fileRepository.getAudioBlobUrl(episode.audioPath);
  return {
    episode,
    dialogues,
    sentenceCards,
    audioBlobUrl,
  };
}
