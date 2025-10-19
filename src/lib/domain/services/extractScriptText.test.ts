import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { describe, expect, it } from 'vitest';
import { extractScriptText } from './extractScriptText';

describe('extractScriptText', () => {
  describe('txt extension', () => {
    it('should return the content as is', () => {
      const content = 'This is a plain text file.\nWith multiple lines.';
      const result = extractScriptText(content, 'txt');
      expect(result).toBe(content);
    });
  });

  describe('srt extension', () => {
    it('should extract text without timestamps', () => {
      const content = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,000 --> 00:00:08,000
This is a test`;
      const result = extractScriptText(content, 'srt');
      expect(result).toBe('Hello world\nThis is a test');
    });
  });

  describe('vtt extension', () => {
    it('should extract text without timestamps', () => {
      const content = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello world

00:00:05.000 --> 00:00:08.000
This is a test`;
      const result = extractScriptText(content, 'vtt');
      expect(result).toBe('Hello world\nThis is a test');
    });
  });

  describe('sswt extension', () => {
    it('should extract text without timestamps', () => {
      const content = `[00:00:01.000 -> 00:00:04.000] Hello world
[00:00:05.000 -> 00:00:08.000] This is a test`;
      const result = extractScriptText(content, 'sswt');
      expect(result).toBe('Hello world\nThis is a test');
    });
  });

  describe('tsv extension', () => {
    const tsvConfig: TsvConfig = {
      startTimeColumnIndex: 0,
      textColumnIndex: 1,
    };

    it('should extract text from the specified column', () => {
      const content = `start_time\ttext
00:00:01.000\tHello world
00:00:05.000\tThis is a test`;
      const result = extractScriptText(content, 'tsv', tsvConfig);
      expect(result).toBe('Hello world\nThis is a test');
    });

    it('should throw error if tsvConfig is not provided', () => {
      const content = `start_time\ttext
00:00:01.000\tHello world`;
      expect(() => extractScriptText(content, 'tsv')).toThrow(
        'TSV config is required for TSV script files.'
      );
    });

    it('should handle empty lines and trim text', () => {
      const content = `start_time\ttext
00:00:01.000\t  Hello world  
00:00:05.000\tThis is a test
\t
00:00:10.000\tFinal line`;
      const result = extractScriptText(content, 'tsv', tsvConfig);
      expect(result).toBe('Hello world\nThis is a test\nFinal line');
    });
  });

  describe('unsupported extension', () => {
    it('should throw error for unsupported extension', () => {
      const content = 'Some content';
      expect(() => extractScriptText(content, 'unsupported')).toThrow(
        'Unsupported script file type: unsupported'
      );
    });
  });
});
