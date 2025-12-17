import { goto, invalidateAll } from '$app/navigation';
import { apiKeyStore } from '$lib/application/stores/apiKeyStore.svelte';
import { audioInfoCacheStore } from '$lib/application/stores/audioInfoCacheStore.svelte';
import { i18nStore } from '$lib/application/stores/i18n.svelte';
import { mediaPlayerStore } from '$lib/application/stores/mediaPlayerStore.svelte';
import type { SentenceAnalysisResult } from '$lib/domain/entities/sentenceAnalysisResult';
import mockDatabase from '$lib/infrastructure/mocks/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { listen, type Event, type UnlistenFn } from '@tauri-apps/api/event';
import { load as storeLoad } from '@tauri-apps/plugin-store';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { PageData } from '../routes/episode/[id]/$types';
import { load } from '../routes/episode/[id]/+page';
import {
  clearDatabase,
  getSentenceCards,
  insertEpisode,
  insertEpisodeGroup,
  insertSentenceCard,
  insertSubtitleLine,
} from './lib/database';
import Component from './lib/EpisodePageWrapper.svelte';
import { createMockStore } from './lib/mockFactories';
import { outputCoverage } from './lib/outputCoverage';
import { waitForFadeTransition } from './lib/utils';

import '$src/app.css';

vi.mock('@tauri-apps/plugin-sql', () => ({ __esModule: true, default: mockDatabase }));
vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@tauri-apps/plugin-store');
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

const DEFAULT_ANALYZE_SENTENCE_RESPONSE: SentenceAnalysisResult = {
  sentence: 'Analyzed sentence from LLM.',
  translation: 'LLM translation result',
  explanation: 'LLM explanation result',
  items: [
    {
      id: 0,
      expression: 'LLM Expression A',
      partOfSpeech: 'noun',
      contextualDefinition: 'Context from LLM result A',
      coreMeaning: 'Core meaning A',
      exampleSentence: 'Analyzed sentence from LLM.',
      status: 'cache',
    },
    {
      id: 0,
      expression: 'LLM Expression B',
      partOfSpeech: 'verb',
      contextualDefinition: 'Context from LLM result B',
      coreMeaning: 'Core meaning B',
      exampleSentence: 'Analyzed sentence from LLM.',
      status: 'cache',
    },
  ],
};

async function defaultInvokeMock(command: string, args?: unknown): Promise<unknown> {
  if (command === 'get_env_prefix_command') {
    return '';
  }
  if (command === 'open_audio') {
    return null;
  }
  if (command === 'analyze_audio') {
    return {
      duration: 120000,
      peaks: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 0.2 : 0.6)),
    };
  }
  if (
    command === 'play_audio' ||
    command === 'pause_audio' ||
    command === 'resume_audio' ||
    command === 'stop_audio'
  ) {
    return null;
  }
  if (command === 'analyze_sentence_with_llm') {
    return DEFAULT_ANALYZE_SENTENCE_RESPONSE;
  }
  if (command === 'seek_audio') {
    const payload = args as { positionMs: number } | undefined;
    return payload?.positionMs ?? null;
  }
  throw new Error(`Unhandled Tauri command: ${command as string}`);
}

async function loadPageData(id: string): Promise<PageData> {
  return (await load({ params: { id } } as never)) as PageData;
}

type RouteParams = { id: string };

function createRouteParams(id: string): RouteParams {
  return { id };
}

async function setupPage(id: string) {
  const params = createRouteParams(id);
  const data = await loadPageData(id);
  const renderResult = render(Component, { data, params });

  vi.mocked(invalidateAll).mockImplementation(async () => {
    const refreshed = await loadPageData(params.id);
    await renderResult.rerender({ data: refreshed, params });
  });

  return { data, params, renderResult };
}

beforeEach(async () => {
  vi.clearAllMocks();

  apiKeyStore.gemini.reset();
  apiKeyStore.youtube.reset();
  apiKeyStore.gemini.set('test-gemini');
  apiKeyStore.youtube.set('test-youtube');
  i18nStore.init('en');
  audioInfoCacheStore.clear();
  mediaPlayerStore.stop();
  mediaPlayerStore.isReady = false;
  mediaPlayerStore.currentTime = 0;

  const invokeMock = vi.mocked(invoke);
  invokeMock.mockReset();
  invokeMock.mockImplementation(defaultInvokeMock);

  const listenMock = vi.mocked(listen);
  listenMock.mockReset();
  listenMock.mockImplementation(
    async (_event: string, _callback: (event: Event<number>) => void) => vi.fn() as UnlistenFn
  );

  const mockStore = createMockStore({
    language: 'en',
    learningTargetLanguages: ['ja'],
    explanationLanguages: ['en'],
  });
  vi.mocked(storeLoad).mockResolvedValue(mockStore as never);

  vi.mocked(invalidateAll).mockReset();
  vi.mocked(invalidateAll).mockResolvedValue(undefined);
  vi.mocked(goto).mockReset();
  vi.mocked(goto).mockResolvedValue();

  await clearDatabase();

  page.viewport(1280, 800);
});

afterAll(async () => {
  await outputCoverage(import.meta.url);
});

test('success: mining flow with cache', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Story Album' });
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode Story',
    mediaPath: 'media/story.mp3',
  });

  const subtitleLineId = await insertSubtitleLine({
    episodeId,
    startTimeMs: 0,
    endTimeMs: 5000,
    originalText: 'Hello world from Kotonoha.',
    correctedText: 'Hello world from Kotonoha!',
    translation: 'こんにちは、ことのは。',
    explanation: 'A friendly greeting to start the episode.',
    sentence: 'Hello world from Kotonoha!',
  });

  await insertSubtitleLine({
    episodeId,
    startTimeMs: 6000,
    endTimeMs: 11000,
    originalText: 'Second line follows shortly after.',
  });

  const sentenceCardId01 = await insertSentenceCard({
    subtitleLineId,
    expression: 'Kotonoha Card Expression',
    sentence: 'Hello world from Kotonoha!',
    contextualDefinition: 'Name of the app in the greeting.',
    coreMeaning: 'Kotonoha proper noun',
    partOfSpeech: 'noun',
    status: 'active',
  });

  const sentenceCardId02 = await insertSentenceCard({
    subtitleLineId,
    expression: 'Cache Me',
    sentence: 'Hello world from Kotonoha!',
    contextualDefinition: 'Cached contextual definition.',
    coreMeaning: 'Cached core meaning',
    partOfSpeech: 'noun',
    status: 'cache',
    createdAt: '2020-01-01T00:00:00.000Z',
  });

  const { data } = await setupPage(String(episodeId));

  expect(data.errorKey).toBeNull();
  expect(data.episode?.title).toBe('Episode Story');
  await page.screenshot();

  const sentenceCardsSection = page.getByTestId('sentence-cards-section');
  await expect
    .element(sentenceCardsSection.getByText('Kotonoha Card Expression'))
    .toBeInTheDocument();

  await expect.element(page.getByRole('button', { name: 'Mine' })).toBeVisible();
  await page.getByRole('button', { name: 'Mine' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect.element(page.getByRole('heading', { name: 'Sentence Mining' })).toBeInTheDocument();
  await expect
    .element(
      page.getByTestId('sentence-mining-modal-sentence').getByText('Hello world from Kotonoha!')
    )
    .toBeInTheDocument();

  const item01 = page.getByTestId(`analysis-result-item-${sentenceCardId01}`);
  const item02 = page.getByTestId(`analysis-result-item-${sentenceCardId02}`);
  await expect.element(item01.getByText('Kotonoha Card Expression')).toBeInTheDocument();
  await expect.element(item01.getByRole('checkbox')).toBeDisabled();
  await expect.element(item01.getByRole('checkbox')).toBeChecked();
  await expect.element(item02.getByText('Cache Me')).toBeInTheDocument();
  await expect.element(item02.getByRole('checkbox')).toBeEnabled();
  await expect.element(item02.getByRole('checkbox')).not.toBeChecked();

  await expect
    .element(page.getByTestId('sentence-mining-modal-cancel-button').getByText('Cancel'))
    .toBeEnabled();
  await expect
    .element(
      page
        .getByTestId('sentence-mining-modal-submit-button')
        .getByText('Add 0 selected items to cards')
    )
    .toBeDisabled();

  await item02.getByRole('checkbox').click();
  await page.screenshot();
  const submitButton = page.getByTestId('sentence-mining-modal-submit-button');
  await expect.element(submitButton.getByText('Add 1 selected items to cards')).toBeEnabled();

  await submitButton.click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect.element(sentenceCardsSection.getByText('Cache Me')).toBeInTheDocument();
  await expect
    .element(sentenceCardsSection.getByText('Kotonoha Card Expression'))
    .toBeInTheDocument();
});

test('success: mining flow without cache calls LLM and caches results', async () => {
  const groupId = await insertEpisodeGroup({ name: 'Story Album' });
  const episodeId = await insertEpisode({
    episodeGroupId: groupId,
    title: 'Episode Story',
    mediaPath: 'media/story.mp3',
  });

  const subtitleLineId = await insertSubtitleLine({
    episodeId,
    startTimeMs: 0,
    endTimeMs: 5000,
    originalText: 'Hello world from Kotonoha.',
    correctedText: 'Hello world from Kotonoha!',
    translation: null,
    explanation: null,
    sentence: null,
  });

  await insertSubtitleLine({
    episodeId,
    startTimeMs: 6000,
    endTimeMs: 11000,
    originalText: 'Second line follows shortly after.',
  });

  const { data } = await setupPage(String(episodeId));
  await page.screenshot();

  expect(data.errorKey).toBeNull();
  expect(data.episode?.title).toBe('Episode Story');

  const sentenceCardsSection = page.getByTestId('sentence-cards-section');
  await expect
    .element(sentenceCardsSection.getByText('There are no Sentence Cards in this episode.'))
    .toBeInTheDocument();

  await expect.element(page.getByRole('button', { name: 'Mine' })).toBeVisible();
  await page.getByRole('button', { name: 'Mine' }).click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect
    .element(
      page.getByTestId('sentence-mining-modal-sentence').getByText('Analyzed sentence from LLM.')
    )
    .toBeInTheDocument();

  expect(vi.mocked(invoke)).toHaveBeenCalledWith(
    'analyze_sentence_with_llm',
    expect.objectContaining({
      apiKey: 'test-gemini',
      learningLanguage: 'English',
      explanationLanguage: 'Japanese',
      targetSentence: 'Hello world from Kotonoha!',
    })
  );

  const sentenceCards = await getSentenceCards(subtitleLineId);
  expect(sentenceCards).toHaveLength(2);
  const cardIds = sentenceCards.map((card) => card.id);

  const firstItem = page.getByTestId(`analysis-result-item-${cardIds[0]}`);
  const secondItem = page.getByTestId(`analysis-result-item-${cardIds[1]}`);
  await expect.element(firstItem.getByText('LLM Expression A')).toBeInTheDocument();
  await expect.element(firstItem.getByText('Context from LLM result A')).toBeInTheDocument();
  await expect.element(firstItem.getByText('Core meaning A')).toBeInTheDocument();
  await expect.element(secondItem.getByText('LLM Expression B')).toBeInTheDocument();
  await expect.element(secondItem.getByText('Context from LLM result B')).toBeInTheDocument();
  await expect.element(secondItem.getByText('Core meaning B')).toBeInTheDocument();
  await expect.element(firstItem.getByRole('checkbox')).toBeEnabled();
  await expect.element(firstItem.getByRole('checkbox')).not.toBeChecked();
  await expect.element(secondItem.getByRole('checkbox')).toBeEnabled();
  await expect.element(secondItem.getByRole('checkbox')).not.toBeChecked();

  await firstItem.getByRole('checkbox').click();
  await page.screenshot();
  const submitButton = page.getByTestId('sentence-mining-modal-submit-button');
  await expect.element(submitButton.getByText('Add 1 selected items to cards')).toBeEnabled();

  await submitButton.click();
  await waitForFadeTransition();
  await page.screenshot();

  await expect.element(sentenceCardsSection.getByText('LLM Expression A')).toBeInTheDocument();
});
