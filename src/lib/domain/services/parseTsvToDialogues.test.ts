import { describe, expect, it } from 'vitest';
import { parseTsvToDialogues } from './parseTsvToDialogues';

describe('parseTsvToDialogues', () => {
  const episodeId = 1;

  it('should parse a valid TSV with start and end times', () => {
    const tsvContent = `StartTime\tEndTime\tText
0:01.500\t0:03.200\tHello world.
2.5\t4s\tThis is a test.`;
    const config = { startTimeColumnIndex: 0, endTimeColumnIndex: 1, textColumnIndex: 2 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(warnings).toHaveLength(0);
    expect(dialogues).toHaveLength(2);
    expect(dialogues[0]).toEqual({
      episodeId: 1,
      startTimeMs: 1500,
      endTimeMs: 3200,
      originalText: 'Hello world.',
    });
    expect(dialogues[1]).toEqual({
      episodeId: 1,
      startTimeMs: 2500,
      endTimeMs: 4000,
      originalText: 'This is a test.',
    });
  });

  it('should parse a valid TSV without an end time column', () => {
    const tsvContent = `StartTime\tText
1:01:01.100\tLong time format.
65.5\tShort time format.`;
    const config = { startTimeColumnIndex: 0, textColumnIndex: 1 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(warnings).toHaveLength(0);
    expect(dialogues).toHaveLength(2);
    expect(dialogues[0]).toEqual({
      episodeId: 1,
      startTimeMs: 3661100,
      endTimeMs: null,
      originalText: 'Long time format.',
    });
    expect(dialogues[1]).toEqual({
      episodeId: 1,
      startTimeMs: 65500,
      endTimeMs: null,
      originalText: 'Short time format.',
    });
  });

  it('should handle various time formats correctly', () => {
    const tsvContent = `start\ttext
2s\t2 seconds
61:30\t61 minutes 30 seconds
1:02:03.456\t1 hour 2 minutes 3.456 seconds`;
    const config = { startTimeColumnIndex: 0, textColumnIndex: 1 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(warnings).toHaveLength(0);
    expect(dialogues).toHaveLength(3);
    expect(dialogues[0].startTimeMs).toBe(2000);
    expect(dialogues[1].startTimeMs).toBe(3690000); // 61 * 60 + 30
    expect(dialogues[2].startTimeMs).toBe(3723456); // 1*3600 + 2*60 + 3.456
  });

  it('should generate warnings for malformed rows and skip them', () => {
    const tsvContent = `start\tend\ttext
invalid-time\t0:02.000\tThis row will be skipped.
0:01.000\t0:03.000\tThis is a valid row.
0:04.000\tinvalid-end\tThis row will have a warning.
not enough columns\t
`;
    const config = { startTimeColumnIndex: 0, endTimeColumnIndex: 1, textColumnIndex: 2 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(dialogues).toHaveLength(2);
    expect(dialogues[0].originalText).toBe('This is a valid row.');
    expect(dialogues[1].originalText).toBe('This row will have a warning.');
    expect(dialogues[1].endTimeMs).toBe(null); // Fallback

    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toContain('Skipping line 2: Invalid start time format "invalid-time".');
    expect(warnings[1]).toContain(
      'Warning on line 4: Invalid end time format "invalid-end". Defaulting to null.'
    );
    expect(warnings[2]).toContain('Skipping line 5: Not enough columns.');
  });

  it('should handle empty or header-only TSV content', () => {
    let tsvContent = ``;
    const config = { startTimeColumnIndex: 0, textColumnIndex: 1 };
    let result = parseTsvToDialogues(tsvContent, episodeId, config);
    expect(result.dialogues).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);

    tsvContent = `StartTime\tText`;
    result = parseTsvToDialogues(tsvContent, episodeId, config);
    expect(result.dialogues).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should handle different column orders', () => {
    const tsvContent = `Text\tStartTime
My dialogue\t10.5`;
    const config = { startTimeColumnIndex: 1, textColumnIndex: 0 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(warnings).toHaveLength(0);
    expect(dialogues).toHaveLength(1);
    expect(dialogues[0]).toEqual({
      episodeId: 1,
      startTimeMs: 10500,
      endTimeMs: null,
      originalText: 'My dialogue',
    });
  });

  it('should skip rows with empty text', () => {
    const tsvContent = `start\ttext
1.0\t
2.0\tSome text`;
    const config = { startTimeColumnIndex: 0, textColumnIndex: 1 };
    const { dialogues, warnings } = parseTsvToDialogues(tsvContent, episodeId, config);

    expect(dialogues).toHaveLength(1);
    expect(dialogues[0].startTimeMs).toBe(2000);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Skipping line 2: Text column is empty.');
  });
});
