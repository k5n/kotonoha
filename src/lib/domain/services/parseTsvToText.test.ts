import type { TsvConfig } from '$lib/domain/entities/tsvConfig';
import { describe, expect, it } from 'vitest';
import { parseTsvToText } from './parseTsvToText';

describe('parseTsvToText', () => {
  const tsvConfig: TsvConfig = {
    startTimeColumnIndex: 0,
    textColumnIndex: 1,
  };

  it('should extract text from the specified column', () => {
    const content = `start_time\ttext
00:00:01.000\tHello world
00:00:05.000\tThis is a test`;
    const result = parseTsvToText(content, tsvConfig);
    expect(result).toBe('Hello world\nThis is a test');
  });

  it('should throw error if textColumnIndex is negative', () => {
    const invalidConfig: TsvConfig = {
      startTimeColumnIndex: 0,
      textColumnIndex: -1,
    };
    const content = `start_time\ttext
00:00:01.000\tHello world`;
    expect(() => parseTsvToText(content, invalidConfig)).toThrow(
      'Invalid textColumnIndex: must be 0 or greater.'
    );
  });

  it('should throw error if not enough columns', () => {
    const content = `start_time\ttext
00:00:01.000`;
    expect(() => parseTsvToText(content, tsvConfig)).toThrow(
      'Line 2: Not enough columns for textColumnIndex 1.'
    );
  });

  it('should handle empty lines and trim text', () => {
    const content = `start_time\ttext
00:00:01.000\t  Hello world  
00:00:05.000\tThis is a test
\t
00:00:10.000\tFinal line`;
    const result = parseTsvToText(content, tsvConfig);
    expect(result).toBe('Hello world\nThis is a test\nFinal line');
  });

  it('should skip lines with empty text', () => {
    const content = `start_time\ttext
00:00:01.000\tHello world
00:00:05.000\t
00:00:10.000\tFinal line`;
    const result = parseTsvToText(content, tsvConfig);
    expect(result).toBe('Hello world\nFinal line');
  });
});
