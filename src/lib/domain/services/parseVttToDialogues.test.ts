import { parseVttToDialogues } from './parseVttToDialogues';

describe('parseVttToDialogues', () => {
  it('should correctly parse a simple VTT content', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000
Hello, world.

00:04.000 --> 00:06.000
This is a test.
`;
    const episodeId = 1;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0]).toEqual({
      episodeId: 1,
      startTimeMs: 1000,
      endTimeMs: 3000,
      originalText: 'Hello, world.',
    });
    expect(dialogues[1]).toEqual({
      episodeId: 1,
      startTimeMs: 4000,
      endTimeMs: 6000,
      originalText: 'This is a test.',
    });
    expect(warnings.length).toBe(0);
  });

  it('should handle multi-line dialogue', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000
Line 1
Line 2

00:04.000 --> 00:06.000
Line A
Line B
Line C
`;
    const episodeId = 2;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Line 1\nLine 2');
    expect(dialogues[1].originalText).toBe('Line A\nLine B\nLine C');
    expect(warnings.length).toBe(0);
  });

  it('should handle empty VTT content', () => {
    const vttContent = '';
    const episodeId = 3;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(0);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('does not start with WEBVTT');
  });

  it('should handle VTT content with only header', () => {
    const vttContent = 'WEBVTT';
    const episodeId = 4;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(0);
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
    const episodeId = 5;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Valid block');
    expect(dialogues[1].originalText).toBe('Another valid block');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Skipping malformed VTT block');
  });

  it('should handle timecodes with hours', () => {
    const vttContent = `WEBVTT

01:02:03.456 --> 01:02:04.789
Hello.
`;
    const episodeId = 6;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(1);
    expect(dialogues[0].startTimeMs).toBe(3723456);
    expect(dialogues[0].endTimeMs).toBe(3724789);
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
    const episodeId = 7;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(dialogues[0].originalText).toBe('Hello, world.');
    expect(dialogues[1].originalText).toBe('This is a test.');
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
    const episodeId = 8;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(warnings.length).toBe(0);
  });

  it('should handle timecodes with extra settings', () => {
    const vttContent = `WEBVTT

00:01.000 --> 00:03.000 align:start position:10%
Hello, world.
`;
    const episodeId = 9;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(1);
    expect(dialogues[0].startTimeMs).toBe(1000);
    expect(dialogues[0].endTimeMs).toBe(3000);
    expect(warnings.length).toBe(0);
  });

  it('should handle VTT content with \r\n newlines', () => {
    const vttContent = `WEBVTT\r\n\r\n00:01.000 --> 00:03.000\r\nHello, world.\r\n\r\n00:04.000 --> 00:06.000\r\nThis is a test.\r\n`;
    const episodeId = 10;
    const { dialogues, warnings } = parseVttToDialogues(vttContent, episodeId);
    expect(dialogues.length).toBe(2);
    expect(warnings.length).toBe(0);
  });
});
