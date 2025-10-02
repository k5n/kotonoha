import { describe, expect, it } from 'vitest';
import { extractYoutubeVideoId, isValidYoutubeUrl } from './youtubeUrlValidator';

describe('youtubeUrlValidator', () => {
  describe('isValidYoutubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'http://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'youtube.com/watch?v=dQw4w9WgXcQ',
        'youtu.be/dQw4w9WgXcQ',
      ];

      validUrls.forEach((url) => {
        expect(isValidYoutubeUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        '',
        '   ',
        'not-a-url',
        'https://google.com',
        'https://vimeo.com/123456',
        'https://youtube.com',
        'https://youtu.be',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidYoutubeUrl(url)).toBe(false);
      });
    });

    it('should return false for null, undefined, or non-string input', () => {
      expect(isValidYoutubeUrl(null as unknown as string)).toBe(false);
      expect(isValidYoutubeUrl(undefined as unknown as string)).toBe(false);
      expect(isValidYoutubeUrl(123 as unknown as string)).toBe(false);
      expect(isValidYoutubeUrl({} as unknown as string)).toBe(false);
    });

    it('should handle URLs with additional parameters', () => {
      const urlsWithParams = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
        'https://youtu.be/dQw4w9WgXcQ?t=10',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmRdnEQy',
      ];

      urlsWithParams.forEach((url) => {
        expect(isValidYoutubeUrl(url)).toBe(true);
      });
    });
  });

  describe('extractYoutubeVideoId', () => {
    it('should extract video ID from watch URLs', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://youtube.com/watch?v=abc123DEF&t=10s',
          expected: 'abc123DEF',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractYoutubeVideoId(url)).toBe(expected);
      });
    });

    it('should extract video ID from short URLs', () => {
      const testCases = [
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ',
        },
        {
          url: 'youtu.be/abc123DEF?t=10',
          expected: 'abc123DEF',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractYoutubeVideoId(url)).toBe(expected);
      });
    });

    it('should extract video ID from embed URLs', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ',
        },
        {
          url: 'youtube.com/embed/abc123DEF?autoplay=1',
          expected: 'abc123DEF',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractYoutubeVideoId(url)).toBe(expected);
      });
    });

    it('should return null for invalid URLs', () => {
      const invalidUrls = ['', 'not-a-url', 'https://google.com', 'https://vimeo.com/123456'];

      invalidUrls.forEach((url) => {
        expect(extractYoutubeVideoId(url)).toBeNull();
      });
    });

    it('should return null for malformed YouTube URLs', () => {
      const malformedUrls = [
        'https://youtube.com/watch',
        'https://youtu.be/',
        'https://youtube.com/embed/',
      ];

      malformedUrls.forEach((url) => {
        expect(extractYoutubeVideoId(url)).toBeNull();
      });
    });
  });
});
