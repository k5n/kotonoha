import { describe, expect, it, vi } from 'vitest';
import { generateEpisodeFilenames } from './generateEpisodeFilenames';

// cSpell:words: voicefile subtitlefile

// Mock value for UUID generation
const MOCK_UUID = '12345678-1234-1234-1234-123456789abc';

describe('generateEpisodeFilenames', () => {
  it('returns UUID-based filenames with original extensions for audio and script', () => {
    vi.mock('uuid', () => ({ v4: () => MOCK_UUID }));
    const audio = 'voice.mp3';
    const script = 'subtitle.srt';
    const result = generateEpisodeFilenames(audio, script);
    expect(result).toEqual({
      audio: `${MOCK_UUID}.mp3`,
      script: `${MOCK_UUID}.srt`,
      uuid: MOCK_UUID,
    });
  });

  it('returns UUID-only filenames if there is no extension', () => {
    vi.mock('uuid', () => ({ v4: () => MOCK_UUID }));
    const audio = 'voicefile';
    const script = 'subtitlefile';
    const result = generateEpisodeFilenames(audio, script);
    expect(result).toEqual({
      audio: MOCK_UUID,
      script: MOCK_UUID,
      uuid: MOCK_UUID,
    });
  });

  it('uses the last extension if there are multiple dots in the filename', () => {
    vi.mock('uuid', () => ({ v4: () => MOCK_UUID }));
    const audio = 'foo.bar.mp3';
    const script = 'baz.qux.srt';
    const result = generateEpisodeFilenames(audio, script);
    expect(result).toEqual({
      audio: `${MOCK_UUID}.mp3`,
      script: `${MOCK_UUID}.srt`,
      uuid: MOCK_UUID,
    });
  });
});
