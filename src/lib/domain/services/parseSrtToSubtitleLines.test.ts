import { parseSrtToSubtitleLines } from './parseSrtToSubtitleLines';

describe('parseSrtToDialogues', () => {
  it('should correctly parse a simple SRT content', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello, world.

2
00:00:04,000 --> 00:00:06,000
This is a test.
`;
    const episodeId = 'episode-1';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0]).toEqual({
      episodeId: episodeId,
      startTimeMs: 1000,
      endTimeMs: 3000,
      originalText: 'Hello, world.',
    });
    expect(subtitleLines[1]).toEqual({
      episodeId: episodeId,
      startTimeMs: 4000,
      endTimeMs: 6000,
      originalText: 'This is a test.',
    });
    expect(warnings.length).toBe(0);
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
    const episodeId = 'episode-2';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Line 1\nLine 2');
    expect(subtitleLines[1].originalText).toBe('Line A\nLine B\nLine C');
    expect(warnings.length).toBe(0);
  });

  it('should handle empty SRT content', () => {
    const srtContent = '';
    const episodeId = 'episode-3';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(0);
    expect(warnings.length).toBe(0);
  });

  it('should handle SRT content with only whitespace', () => {
    const srtContent = '   \n \n  ';
    const episodeId = 'episode-4';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(0);
    expect(warnings.length).toBe(0);
  });

  it('should skip malformed blocks and return warnings', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Valid block

2Malformed block

3
00:00:07,000 --> 00:00:09,000
Another valid block
`;
    const episodeId = 'episode-5';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Valid block');
    expect(subtitleLines[1].originalText).toBe('Another valid block');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Skipping malformed SRT block');
  });

  it('should handle timecodes with different milliseconds', () => {
    const srtContent = `1
00:00:00,123 --> 00:00:01,456
Hello.
`;
    const episodeId = 'episode-6';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(1);
    expect(subtitleLines[0].startTimeMs).toBe(123);
    expect(subtitleLines[0].endTimeMs).toBe(1456);
    expect(warnings.length).toBe(0);
  });

  it('should handle leading/trailing whitespace in blocks and lines', () => {
    const srtContent = `  1
  00:00:01,000 --> 00:00:03,000
    Hello, world.   

  2
  00:00:04,000 --> 00:00:06,000
    This is a test.  
`;
    const episodeId = 'episode-7';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Hello, world.');
    expect(subtitleLines[1].originalText).toBe('This is a test.');
    expect(warnings.length).toBe(0);
  });

  it('should handle SRT content with \r\n newlines (Windows style)', () => {
    const srtContent = `1\r\n00:00:01,000 --> 00:00:03,000\r\nHello, world.\r\n\r\n2\r\n00:00:04,000 --> 00:00:06,000\r\nThis is a test.\r\n`;
    const episodeId = 'episode-8';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Hello, world.');
    expect(subtitleLines[1].originalText).toBe('This is a test.');
    expect(warnings.length).toBe(0);
  });

  it('should handle SRT content with \r newlines (old Mac style)', () => {
    const srtContent = `1\r00:00:01,000 --> 00:00:03,000\rHello, world.\r\r2\r00:00:04,000 --> 00:00:06,000\rThis is a test.\r`;
    const episodeId = 'episode-9';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Hello, world.');
    expect(subtitleLines[1].originalText).toBe('This is a test.');
    expect(warnings.length).toBe(0);
  });

  it('should return warning for invalid timecode format', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:03,000
Valid block

2
invalid timecode
Another block
`;
    const episodeId = 'episode-10';
    const { subtitleLines, warnings } = parseSrtToSubtitleLines(srtContent, episodeId);
    expect(subtitleLines.length).toBe(1);
    expect(subtitleLines[0].originalText).toBe('Valid block');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Skipping malformed SRT block');
  });
});
