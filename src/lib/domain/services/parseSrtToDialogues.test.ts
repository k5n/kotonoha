import { describe, expect, it } from 'vitest';
import { parseSrtToDialogues } from './parseSrtToDialogues';

describe('parseSrtToDialogues', () => {
  it('should correctly parse a simple SRT content', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello, world.

2
00:00:04,000 --> 00:00:06,000
This is a test.
`;
    const episodeId = 1;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0]).toEqual({
      id: 0,
      episodeId: 1,
      startTimeMs: 1000,
      endTimeMs: 3000,
      originalText: 'Hello, world.',
      correctedText: null,
    });
    expect(dialogues[1]).toEqual({
      id: 0,
      episodeId: 1,
      startTimeMs: 4000,
      endTimeMs: 6000,
      originalText: 'This is a test.',
      correctedText: null,
    });
  });

  it('should handle multi-line dialogue', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Line 1
Line 2

2
00:00:04,000 --> 00:00:06,000
Line A
Line B
Line C
`;
    const episodeId = 2;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Line 1\nLine 2');
    expect(dialogues[1].originalText).toBe('Line A\nLine B\nLine C');
  });

  it('should handle empty SRT content', () => {
    const srtContent = '';
    const episodeId = 3;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(0);
  });

  it('should handle SRT content with only whitespace', () => {
    const srtContent = '   \n \n  ';
    const episodeId = 4;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(0);
  });

  it('should skip malformed blocks', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Valid block

2Malformed block

3
00:00:07,000 --> 00:00:09,000
Another valid block
`;
    const episodeId = 5;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Valid block');
    expect(dialogues[1].originalText).toBe('Another valid block');
  });

  it('should handle timecodes with different milliseconds', () => {
    const srtContent = `1
00:00:00,123 --> 00:00:01,456
Hello.
`;
    const episodeId = 6;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(1);
    expect(dialogues[0].startTimeMs).toBe(123);
    expect(dialogues[0].endTimeMs).toBe(1456);
  });

  it('should handle leading/trailing whitespace in blocks and lines', () => {
    const srtContent = `  1
  00:00:01,000 --> 00:00:03,000
    Hello, world.   

  2
  00:00:04,000 --> 00:00:06,000
    This is a test.  
`;
    const episodeId = 7;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Hello, world.');
    expect(dialogues[1].originalText).toBe('This is a test.');
  });

  it('should handle SRT content with \r\n newlines (Windows style)', () => {
    const srtContent = `1\r\n00:00:01,000 --> 00:00:03,000\r\nHello, world.\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\nThis is a test.\r\n`;
    const episodeId = 8;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Hello, world.');
    expect(dialogues[1].originalText).toBe('This is a test.');
  });

  it('should handle SRT content with \r newlines (old Mac style)', () => {
    const srtContent = `1\r00:00:01,000 --> 00:00:03,000\rHello, world.\r\r2\r00:00:04,000 --> 00:00:06,000\rThis is a test.\r`;
    const episodeId = 9;
    const dialogues = parseSrtToDialogues(srtContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Hello, world.');
    expect(dialogues[1].originalText).toBe('This is a test.');
  });
});