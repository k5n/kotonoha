import { parseVttToSubtitleLines } from './parseVttToSubtitleLines';

describe('parseVttToSubtitleLines', () => {
  it('should correctly parse a simple VTT content', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000
Hello, world.

00:04.000 --> 00:06.000
This is a test.
`;
    const episodeId = 'episode-1';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
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

  it('should handle multi-line subtitleLine', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000
Line 1
Line 2

00:04.000 --> 00:06.000
Line A
Line B
Line C
`;
    const episodeId = 'episode-2';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Line 1\nLine 2');
    expect(subtitleLines[1].originalText).toBe('Line A\nLine B\nLine C');
    expect(warnings.length).toBe(0);
  });

  it('should handle empty VTT content', () => {
    const vttContent = '';
    const episodeId = 'episode-3';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(0);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('does not start with WEBVTT');
  });

  it('should handle VTT content with only header', () => {
    const vttContent = 'WEBVTT';
    const episodeId = 'episode-4';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(0);
    expect(warnings.length).toBe(0);
  });

  it('should skip malformed blocks and return warnings', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000
Valid block

Malformed block

00:07.000 --> 00:09.000
Another valid block
`;
    const episodeId = 'episode-5';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Valid block');
    expect(subtitleLines[1].originalText).toBe('Another valid block');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Skipping malformed VTT block');
  });

  it('should handle timecodes with hours', () => {
    const vttContent = `WEBVTT

01:02:03.456 --> 01:02:04.789
Hello.
`;
    const episodeId = 'episode-6';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(1);
    expect(subtitleLines[0].startTimeMs).toBe(3723456);
    expect(subtitleLines[0].endTimeMs).toBe(3724789);
    expect(warnings.length).toBe(0);
  });

  it('should handle cue identifiers', () => {
    const vttContent = `WEBVTT

CUE-1
00:01.000 --> 00:03.000
Hello, world.

CUE-2
00:04.000 --> 00:06.000
This is a test.
`;
    const episodeId = 'episode-7';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(subtitleLines[0].originalText).toBe('Hello, world.');
    expect(subtitleLines[1].originalText).toBe('This is a test.');
    expect(warnings.length).toBe(0);
  });

  it('should ignore NOTE comments', () => {
    const vttContent = `WEBVTT

NOTE This is a comment

00:01.000 --> 00:03.000
Hello, world.

NOTE
Another comment
block

00:04.000 --> 00:06.000
This is a test.
`;
    const episodeId = 'episode-8';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(warnings.length).toBe(0);
  });

  it('should handle timecodes with extra settings', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000 align:start position:10%
Hello, world.
`;
    const episodeId = 'episode-9';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(1);
    expect(subtitleLines[0].startTimeMs).toBe(1000);
    expect(subtitleLines[0].endTimeMs).toBe(3000);
    expect(warnings.length).toBe(0);
  });

  it('should handle VTT content with \r\n newlines', () => {
    const vttContent = `WEBVTT\r\n\r\n00:01.000 --> 00:03.000\r\nHello, world.\r\n\r\n00:04.000 --> 00:06.000\r\nThis is a test.\r\n`;
    const episodeId = 'episode-10';
    const { subtitleLines, warnings } = parseVttToSubtitleLines(vttContent, episodeId);
    expect(subtitleLines.length).toBe(2);
    expect(warnings.length).toBe(0);
  });
});
