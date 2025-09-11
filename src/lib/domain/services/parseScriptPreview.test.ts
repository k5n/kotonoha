import { describe, expect, it } from 'vitest';
import { parseScriptPreview } from './parseScriptPreview';

describe('parseScriptPreview', () => {
  describe('with hasHeader = false', () => {
    it('should return null headers and parse rows correctly', () => {
      const content = '0:00:01\tHello\n0:00:03\tWorld';
      const result = parseScriptPreview(content, false);
      expect(result.headers).toBeNull();
      expect(result.rows).toEqual([
        ['0:00:01', 'Hello'],
        ['0:00:03', 'World'],
      ]);
    });

    it('should limit the number of rows based on rowCount', () => {
      const content = '1\n2\n3\n4\n5\n6';
      const result = parseScriptPreview(content, false, 4);
      expect(result.rows.length).toBe(4);
      expect(result.rows).toEqual([['1'], ['2'], ['3'], ['4']]);
    });
  });

  describe('with hasHeader = true', () => {
    it('should parse the first line as headers and subsequent lines as rows', () => {
      const content = 'Time\tText\n0:00:01\tHello\n0:00:03\tWorld';
      const result = parseScriptPreview(content, true);
      expect(result.headers).toEqual(['Time', 'Text']);
      expect(result.rows).toEqual([
        ['0:00:01', 'Hello'],
        ['0:00:03', 'World'],
      ]);
    });

    it('should limit the number of data rows based on rowCount', () => {
      const content = 'Header\n1\n2\n3\n4\n5\n6';
      const result = parseScriptPreview(content, true, 4);
      expect(result.headers).toEqual(['Header']);
      expect(result.rows.length).toBe(4);
      expect(result.rows).toEqual([['1'], ['2'], ['3'], ['4']]);
    });

    it('should handle header-only files', () => {
      const content = 'ColumnA\tColumnB';
      const result = parseScriptPreview(content, true);
      expect(result.headers).toEqual(['ColumnA', 'ColumnB']);
      expect(result.rows).toEqual([]);
    });
  });

  it('should handle empty content', () => {
    const content = '';
    const result = parseScriptPreview(content, false);
    expect(result.headers).toBeNull();
    expect(result.rows).toEqual([]);
  });

  it('should use a custom delimiter', () => {
    const content = 'Time,Text\n0:00:01,Hello';
    const result = parseScriptPreview(content, true, 5, ',');
    expect(result.headers).toEqual(['Time', 'Text']);
    expect(result.rows).toEqual([['0:00:01', 'Hello']]);
  });

  it('should trim whitespace from cells and headers', () => {
    const content = '  Time  \t  Text  \n  0:00:01  \t  Hello  ';
    const result = parseScriptPreview(content, true);
    expect(result.headers).toEqual(['Time', 'Text']);
    expect(result.rows).toEqual([['0:00:01', 'Hello']]);
  });
});
