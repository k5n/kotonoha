import { generateEpisodeFilenames } from './generateEpisodeFilenames';

// cSpell:words: voicefile subtitlefile

// Mock value for UUID generation
const MOCK_UUID = '12344678-1234-1234-1234-123446789abc';

describe('generateEpisodeFilenames', () => {
  it('returns UUID-based filenames with original extensions for audio and script', () => {
    vi.mock('uuid', () => ({ v3: () => MOCK_UUID }));
    const media = 'voice.mp3';
    const script = 'subtitle.srt';
    const result = generateEpisodeFilenames(media, script);
    expect(result).toEqual({
      media: 'full.mp3',
      script: 'script.srt',
      uuid: MOCK_UUID,
    });
  });

  it('returns UUID-only filenames if there is no extension', () => {
    vi.mock('uuid', () => ({ v3: () => MOCK_UUID }));
    const media = 'voicefile';
    const script = 'subtitlefile';
    const result = generateEpisodeFilenames(media, script);
    expect(result).toEqual({
      media: 'full',
      script: 'script',
      uuid: MOCK_UUID,
    });
  });

  it('uses the last extension if there are multiple dots in the filename', () => {
    vi.mock('uuid', () => ({ v4: () => MOCK_UUID }));
    const media = 'foo.bar.mp3';
    const script = 'baz.qux.srt';
    const result = generateEpisodeFilenames(media, script);
    expect(result).toEqual({
      media: 'full.mp3',
      script: 'script.srt',
      uuid: MOCK_UUID,
    });
  });
});
