import type { FileBasedEpisodeAddPayload } from '$lib/application/stores/fileBasedEpisodeAddStore.svelte';
import type { YoutubeEpisodeAddPayload } from '$lib/application/stores/youtubeEpisodeAddStore.svelte';
import type { Episode } from '$lib/domain/entities/episode';
import { addNewEpisode } from './addNewEpisode';

type EpisodeAddPayload = FileBasedEpisodeAddPayload | YoutubeEpisodeAddPayload;

// Mock repositories
vi.mock('$lib/infrastructure/repositories/dialogueRepository', () => ({
  dialogueRepository: {
    bulkInsertDialogues: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('$lib/infrastructure/repositories/episodeRepository', () => ({
  episodeRepository: {
    addEpisode: vi.fn().mockResolvedValue({ id: 1, title: 'Test Episode' }),
  },
}));

vi.mock('$lib/infrastructure/repositories/fileRepository', () => ({
  fileRepository: {
    saveAudioFile: vi.fn().mockResolvedValue('/saved/audio.mp3'),
    readTextFileByAbsolutePath: vi
      .fn()
      .mockResolvedValue('00:00:00,000 --> 00:00:05,000\nHello world\n'),
    uuidFileExists: vi.fn().mockResolvedValue(false),
    deleteEpisodeData: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('$lib/domain/services/generateEpisodeFilenames', () => ({
  generateEpisodeFilenames: vi.fn().mockReturnValue({
    media: 'audio.mp3',
    script: 'script.srt',
    uuid: 'test-uuid',
  }),
}));

vi.mock('$lib/domain/services/parseScriptToDialogues', () => ({
  parseScriptToDialogues: vi.fn().mockReturnValue({
    dialogues: [{ startTime: 0, endTime: 5000, text: 'Hello world' }],
    warnings: [],
  }),
}));

describe('addNewEpisode', () => {
  const mockEpisodes: readonly Episode[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts FileBasedEpisodeAddPayload and processes it correctly', async () => {
    const payload: FileBasedEpisodeAddPayload = {
      source: 'file',
      title: 'File-based Episode',
      audioFilePath: '/generated/audio.mp3',
      scriptFilePath: '/path/to/script.srt',
      learningLanguage: 'en',
    };

    await expect(addNewEpisode(payload, 1, mockEpisodes)).resolves.not.toThrow();
  });

  it('throws error for unknown payload source', async () => {
    const invalidPayload = {
      source: 'unknown' as 'file' | 'youtube',
      title: 'Invalid',
    };

    await expect(
      addNewEpisode(invalidPayload as unknown as EpisodeAddPayload, 1, mockEpisodes)
    ).rejects.toThrow('Unknown payload source:');
  });
});
