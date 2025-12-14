import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { describe, expect, it, vi } from 'vitest';
import { parseScriptToSubtitleLines } from './parseScriptToSubtitleLines';

// Mock the individual parse functions
vi.mock('./parseSrtToSubtitleLines', () => ({
  parseSrtToSubtitleLines: vi.fn(),
}));

vi.mock('./parseSswtToSubtitleLines', () => ({
  parseSswtToSubtitleLines: vi.fn(),
}));

vi.mock('./parseTsvToSubtitleLines', () => ({
  parseTsvToSubtitleLines: vi.fn(),
}));

vi.mock('./parseVttToSubtitleLines', () => ({
  parseVttToSubtitleLines: vi.fn(),
}));

import { parseSrtToSubtitleLines } from './parseSrtToSubtitleLines';
import { parseSswtToSubtitleLines } from './parseSswtToSubtitleLines';
import { parseTsvToSubtitleLines } from './parseTsvToSubtitleLines';
import { parseVttToSubtitleLines } from './parseVttToSubtitleLines';

const mockResult = { subtitleLines: [], warnings: [] };

describe('parseScriptToDialogues', () => {
  const scriptContent = 'sample content';
  const episodeId = 1;
  const tsvConfig: TsvConfig = {
    startTimeColumnIndex: 0,
    textColumnIndex: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default return values for mocks
    vi.mocked(parseSrtToSubtitleLines).mockReturnValue(mockResult);
    vi.mocked(parseSswtToSubtitleLines).mockReturnValue(mockResult);
    vi.mocked(parseTsvToSubtitleLines).mockReturnValue(mockResult);
    vi.mocked(parseVttToSubtitleLines).mockReturnValue(mockResult);
  });

  it('calls parseSrtToDialogues for srt extension', () => {
    const result = parseScriptToSubtitleLines(scriptContent, 'srt', episodeId);
    expect(parseSrtToSubtitleLines).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('calls parseSswtToDialogues for sswt extension', () => {
    const result = parseScriptToSubtitleLines(scriptContent, 'sswt', episodeId);
    expect(parseSswtToSubtitleLines).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('calls parseTsvToDialogues for tsv extension with config', () => {
    const result = parseScriptToSubtitleLines(scriptContent, 'tsv', episodeId, tsvConfig);
    expect(parseTsvToSubtitleLines).toHaveBeenCalledWith(scriptContent, episodeId, tsvConfig);
    expect(result).toBe(mockResult);
  });

  it('throws error for tsv extension without config', () => {
    expect(() => parseScriptToSubtitleLines(scriptContent, 'tsv', episodeId)).toThrow(
      'TSV config is required for TSV script files.'
    );
  });

  it('calls parseVttToDialogues for vtt extension', () => {
    const result = parseScriptToSubtitleLines(scriptContent, 'vtt', episodeId);
    expect(parseVttToSubtitleLines).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('throws error for unsupported extension', () => {
    expect(() => parseScriptToSubtitleLines(scriptContent, 'txt', episodeId)).toThrow(
      'Unsupported script file type: txt'
    );
  });
});
