import { i18nStore, t } from '$lib/application/stores/i18n.svelte';
import type { Settings } from '$lib/domain/entities/settings';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SettingsComponent from './SettingsComponent.svelte';

describe('SettingsComponent', () => {
  beforeEach(() => {
    i18nStore.init('en');
  });

  const mockSettings: Settings = {
    language: 'en',
    learningTargetLanguages: ['ja'],
    explanationLanguages: ['en'],
  };

  const defaultProps = {
    initialSettings: mockSettings,
    isGeminiApiKeySet: false,
    isYoutubeApiKeySet: false,
    isSaving: false,
    onSave: vi.fn(),
  };

  test('renders API key inputs and language selects', async () => {
    render(SettingsComponent, defaultProps);

    // Check if Gemini API key input is rendered
    await expect.element(page.getByLabelText(t('settings.gemini.label'))).toBeInTheDocument();

    // Check if YouTube API key input is rendered
    await expect.element(page.getByLabelText(t('settings.youtube.label'))).toBeInTheDocument();

    // Check if UI language select is rendered
    await expect.element(page.getByLabelText(t('settings.uiLanguage.label'))).toBeInTheDocument();

    // Check if learning target languages section is rendered
    await expect
      .element(page.getByText(t('settings.learningTargetLanguages.label')))
      .toBeInTheDocument();

    // Check if explanation languages section is rendered
    await expect
      .element(page.getByText(t('settings.explanationLanguages.label')))
      .toBeInTheDocument();

    // Check if save button is rendered
    await expect
      .element(page.getByRole('button', { name: t('settings.saveButton.label') }))
      .toBeInTheDocument();
  });

  test('calls onSave with correct data when save button is clicked', async () => {
    const mockOnSave = vi.fn();
    render(SettingsComponent, { ...defaultProps, onSave: mockOnSave });

    // Fill in some data
    const geminiInput = page.getByLabelText(t('settings.gemini.label'));
    await geminiInput.fill('test-gemini-key');

    const youtubeInput = page.getByLabelText(t('settings.youtube.label'));
    await youtubeInput.fill('test-youtube-key');

    // Click save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Verify onSave was called with correct data
    expect(mockOnSave).toHaveBeenCalledWith(
      {
        language: 'en',
        learningTargetLanguages: ['ja'],
        explanationLanguages: ['en'],
      },
      'test-gemini-key',
      'test-youtube-key'
    );
  });
});
