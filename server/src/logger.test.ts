import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { appendToLog, getLogContent } from './logger.js';

vi.mock('fs', () => ({
  default: {
    appendFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

const mockedFs = vi.mocked(fs);

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('appendToLog', () => {
    it('calls fs.appendFile with path, formatted log entry, and callback', () => {
      appendToLog('hello world');
      expect(mockedFs.appendFile).toHaveBeenCalledTimes(1);
      const [path, content, callback] = mockedFs.appendFile.mock.calls[0]!;
      expect(path).toContain('data.log');
      expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d.:]+Z\] hello world\n$/);
      expect(typeof callback).toBe('function');
    });

    it('formats message with ISO timestamp', () => {
      appendToLog('[CHAT] user said hi');
      const content = mockedFs.appendFile.mock.calls[0]![1] as string;
      expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
      expect(content).toContain('[CHAT] user said hi');
      expect(content).toMatch(/\n$/);
    });

    it('invokes callback so write errors can be handled', () => {
      const cb = vi.fn();
      mockedFs.appendFile.mockImplementation((_path, _data, callback) => {
        (callback as (err: Error | null) => void)(null);
      });
      appendToLog('test');
      const usedCb = mockedFs.appendFile.mock.calls[0]![2] as (err: Error | null) => void;
      usedCb(null);
      expect(usedCb).toBeDefined();
    });
  });

  describe('getLogContent', () => {
    it('resolves with file content when read succeeds', async () => {
      const content = 'line1\nline2\n';
      mockedFs.readFile.mockImplementation((_path, _encoding, cb) => {
        (cb as (err: null, data: string) => void)(null, content);
      });
      await expect(getLogContent()).resolves.toBe(content);
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('data.log'),
        'utf8',
        expect.any(Function)
      );
    });

    it('resolves with empty string when file does not exist (ENOENT)', async () => {
      const enoent = new Error('No such file') as NodeJS.ErrnoException;
      enoent.code = 'ENOENT';
      mockedFs.readFile.mockImplementation((_path, _encoding, cb) => {
        (cb as (err: NodeJS.ErrnoException, data?: string) => void)(enoent);
      });
      await expect(getLogContent()).resolves.toBe('');
    });

    it('rejects when read fails with non-ENOENT error', async () => {
      const err = new Error('Permission denied');
      mockedFs.readFile.mockImplementation((_path, _encoding, cb) => {
        (cb as (err: Error) => void)(err);
      });
      await expect(getLogContent()).rejects.toThrow('Permission denied');
    });
  });
});
