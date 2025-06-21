import type { Dialogue } from '$lib/domain/entities/dialogue';
import type { Episode } from '$lib/domain/entities/episode';
import type { SentenceCard } from '$lib/domain/entities/sentenceCard';

// スタブ用ダイアログ
const stubDialogues: Dialogue[] = [
  {
    id: 101,
    episodeId: 1,
    startTimeMs: 0,
    endTimeMs: 5000,
    originalText: 'Hello, world!',
    correctedText: 'Hello, world!',
  },
  {
    id: 102,
    episodeId: 1,
    startTimeMs: 6000,
    endTimeMs: 10000,
    originalText: 'How are you?',
    correctedText: 'How are you?',
  },
];

// スタブデータ
const stubEpisode: Episode = {
  id: 1,
  episodeGroupId: 1,
  displayOrder: 1,
  title: 'サンプルエピソード',
  audioPath: '/audio/sample.mp3',
  dialogues: stubDialogues,
  durationSeconds: 120,
  createdAt: new Date('2025-06-21T10:00:00Z'),
  updatedAt: new Date('2025-06-21T10:00:00Z'),
};

const stubSentenceCards: SentenceCard[] = [
  {
    id: 201,
    dialogueId: 101,
    targetExpression: 'Hello',
    sentence: 'Hello, world!',
    definition: 'A greeting.',
    status: 'active',
    createdAt: new Date('2025-06-21T10:01:00Z'),
    vocabulary: {
      id: 1,
      expression: 'Hello',
    },
  },
];

// エピソード詳細取得ユースケース（スタブ）
export async function fetchEpisodeDetail(
  episodeId: number
): Promise<{ episode: Episode; sentenceCards: SentenceCard[] } | null> {
  // 引数に応じて分岐も可能だが、ここでは常に同じデータを返す
  return Promise.resolve({ episode: stubEpisode, sentenceCards: stubSentenceCards });
}
