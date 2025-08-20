import { parseSswtToDialogues } from './parseSswtToDialogues';

describe('parseSswtToDialogues', () => {
  it('should parse a single generic SSWT line correctly', () => {
    const sswtContent = '[00:00:01.000 -> 00:00:02.500] This is a test sentence.';
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);

    expect(dialogues).toHaveLength(1);
    expect(dialogues[0]).toEqual({
      id: 0,
      episodeId: 1,
      startTimeMs: 1000,
      endTimeMs: 2500,
      originalText: 'This is a test sentence.',
      correctedText: null,
      translation: null,
      explanation: null,
    });
    expect(warnings).toHaveLength(0);
  });

  it('should parse multiple generic SSWT lines correctly', () => {
    const sswtContent = `[00:00:03.000 -> 00:00:05.000] Line one of the test.
[00:00:05.500 -> 00:00:07.000] And here is line two.
[00:00:07.100 -> 00:00:09.900] Finally, the third line.`;
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);

    expect(dialogues).toHaveLength(3);
    expect(dialogues[0].originalText).toBe('Line one of the test.');
    expect(dialogues[1].originalText).toBe('And here is line two.');
    expect(dialogues[2].originalText).toBe('Finally, the third line.');
    expect(dialogues[0].startTimeMs).toBe(3000);
    expect(dialogues[1].startTimeMs).toBe(5500);
    expect(dialogues[2].startTimeMs).toBe(7100);
    expect(warnings).toHaveLength(0);
  });

  it('should handle empty lines and invalid lines gracefully in generic content', () => {
    const sswtContent = `[00:00:01.000 -> 00:00:02.000] Valid line A.

This is an invalid line.
[00:00:03.000 -> 00:00:04.000] Valid line B.`;
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);

    expect(dialogues).toHaveLength(2);
    expect(dialogues[0].originalText).toBe('Valid line A.');
    expect(dialogues[1].originalText).toBe('Valid line B.');
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0]).toMatch(/Invalid SSWT format/);
  });

  it('should return an empty array for empty content', () => {
    const sswtContent = '';
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);
    expect(dialogues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('should handle leading/trailing spaces in text correctly', () => {
    const sswtContent = '[00:00:01.000 -> 00:00:02.000]   Some text with spaces   ';
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);
    expect(dialogues[0].originalText).toBe('Some text with spaces');
    expect(warnings).toHaveLength(0);
  });

  it('should return warnings for lines with invalid SSWT format', () => {
    const sswtContent = `This is not a valid SSWT line.
Another invalid line.
[00:00:01.000 -> 00:00:02.000] Valid line.`;
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);

    expect(dialogues).toHaveLength(1);
    expect(dialogues[0].originalText).toBe('Valid line.');
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/Invalid SSWT format/);
    expect(warnings[1]).toMatch(/Invalid SSWT format/);
  });

  it('should return warnings for lines with invalid time format', () => {
    const sswtContent = '[00:00:60.002 -> 00:00:02.000] Invalid time line.';
    const { dialogues, warnings } = parseSswtToDialogues(sswtContent, 1);

    expect(dialogues).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/Invalid time format/);
  });
});
