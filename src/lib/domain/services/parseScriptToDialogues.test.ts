import { describe, expect, it, vi } from 'vitest';
import { parseScriptToDialogues, type TsvConfig } from './parseScriptToDialogues';

// Mock the individual parse functions
vi.mock('./parseSrtToDialogues', () => ({
  parseSrtToDialogues: vi.fn(),
}));

vi.mock('./parseSswtToDialogues', () => ({
  parseSswtToDialogues: vi.fn(),
}));

vi.mock('./parseTsvToDialogues', () => ({
  parseTsvToDialogues: vi.fn(),
}));

vi.mock('./parseVttToDialogues', () => ({
  parseVttToDialogues: vi.fn(),
}));

import { parseSrtToDialogues } from './parseSrtToDialogues';
import { parseSswtToDialogues } from './parseSswtToDialogues';
import { parseTsvToDialogues } from './parseTsvToDialogues';
import { parseVttToDialogues } from './parseVttToDialogues';

const mockResult = { dialogues: [], warnings: [] };

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
    vi.mocked(parseSrtToDialogues).mockReturnValue(mockResult);
    vi.mocked(parseSswtToDialogues).mockReturnValue(mockResult);
    vi.mocked(parseTsvToDialogues).mockReturnValue(mockResult);
    vi.mocked(parseVttToDialogues).mockReturnValue(mockResult);
  });

  it('calls parseSrtToDialogues for srt extension', () => {
    const result = parseScriptToDialogues(scriptContent, 'srt', episodeId);
    expect(parseSrtToDialogues).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('calls parseSswtToDialogues for sswt extension', () => {
    const result = parseScriptToDialogues(scriptContent, 'sswt', episodeId);
    expect(parseSswtToDialogues).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('calls parseTsvToDialogues for tsv extension with config', () => {
    const result = parseScriptToDialogues(scriptContent, 'tsv', episodeId, tsvConfig);
    expect(parseTsvToDialogues).toHaveBeenCalledWith(scriptContent, episodeId, tsvConfig);
    expect(result).toBe(mockResult);
  });

  it('throws error for tsv extension without config', () => {
    expect(() => parseScriptToDialogues(scriptContent, 'tsv', episodeId)).toThrow(
      'TSV config is required for TSV script files.'
    );
  });

  it('calls parseVttToDialogues for vtt extension', () => {
    const result = parseScriptToDialogues(scriptContent, 'vtt', episodeId);
    expect(parseVttToDialogues).toHaveBeenCalledWith(scriptContent, episodeId);
    expect(result).toBe(mockResult);
  });

  it('throws error for unsupported extension', () => {
    expect(() => parseScriptToDialogues(scriptContent, 'txt', episodeId)).toThrow(
      'Unsupported script file type: txt'
    );
  });
});
