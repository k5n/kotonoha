import { beforeEach, describe, expect, it } from 'vitest';
import { __reset, exists, remove, rename, writeFile, writeTextFile } from './plugin-fs';

describe('plugin-fs mock', () => {
  beforeEach(() => {
    __reset();
  });

  describe('exists', () => {
    it('returns true for existing file', async () => {
      await writeTextFile('test.txt', 'Hello, world!');
      expect(await exists('test.txt')).toBe(true);
    });

    it('returns false for non-existing file', async () => {
      expect(await exists('nonexistent.txt')).toBe(false);
    });
  });

  describe('writeFile', () => {
    it('creates a file', async () => {
      await writeFile('newfile.ogg', new Uint8Array());
      expect(await exists('newfile.ogg')).toBe(true);
    });

    it('overwrites existing file', async () => {
      await writeFile('existing.ogg', new Uint8Array([1, 2, 3]));
      await writeFile('existing.ogg', new Uint8Array([4, 5, 6]));
      expect(await exists('existing.ogg')).toBe(true);
    });

    it('throws error if path is a directory', async () => {
      await writeFile('dir/file.ogg', new Uint8Array());
      await expect(writeFile('dir', new Uint8Array())).rejects.toThrow('Path is a directory: dir');
    });
  });

  describe('remove', () => {
    it('removes a file', async () => {
      await writeFile('remove_file.ogg', new Uint8Array());
      await remove('remove_file.ogg');
      expect(await exists('remove_file.ogg')).toBe(false);
    });

    it('throws error for non-existing path', async () => {
      await expect(remove('nonexistent')).rejects.toThrow('Path does not exist: nonexistent');
    });

    it('removes empty directory', async () => {
      await writeFile('empty_dir/empty.ogg', new Uint8Array());
      await remove('empty_dir/empty.ogg');
      await remove('empty_dir');
      expect(await exists('empty_dir')).toBe(false);
    });

    it('throws error for non-empty directory without recursive', async () => {
      await writeFile('dir2/file.ogg', new Uint8Array());
      await expect(remove('dir2')).rejects.toThrow('Directory is not empty: dir2');
    });

    it('removes non-empty directory with recursive', async () => {
      await writeFile('dir3/file.ogg', new Uint8Array());
      await remove('dir3', { recursive: true });
      expect(await exists('dir3')).toBe(false);
    });
  });

  describe('rename', () => {
    it('renames a file in the same baseDir', async () => {
      await writeFile('oldname.ogg', new Uint8Array());
      await rename('oldname.ogg', 'newname.ogg');
      expect(await exists('oldname.ogg')).toBe(false);
      expect(await exists('newname.ogg')).toBe(true);
    });

    it('does nothing if oldPath equals newPath', async () => {
      await writeFile('same.ogg', new Uint8Array());
      await rename('same.ogg', 'same.ogg');
      expect(await exists('same.ogg')).toBe(true);
    });

    it('throws error if newPath already exists', async () => {
      await writeFile('file1.ogg', new Uint8Array());
      await writeFile('file2.ogg', new Uint8Array());
      await expect(rename('file1.ogg', 'file2.ogg')).rejects.toThrow(
        'New path already exists: file2.ogg'
      );
    });

    it('creates directories for new path', async () => {
      await writeFile('source.ogg', new Uint8Array());
      await rename('source.ogg', 'subdir/dest.ogg');
      expect(await exists('source.ogg')).toBe(false);
      expect(await exists('subdir/dest.ogg')).toBe(true);
    });

    // Note: Since BaseDirectory is enum with only AppLocalData, testing different baseDir is limited.
    // But the code supports it.
  });

  describe('path validation', () => {
    it('throws error for path with ..', async () => {
      await expect(writeFile('../test.ogg', new Uint8Array())).rejects.toThrow(
        "Path contains invalid component '..'"
      );
    });

    it('throws error for path with .', async () => {
      await expect(writeFile('./test.ogg', new Uint8Array())).rejects.toThrow(
        "Path contains invalid component '.'"
      );
    });
  });
});
