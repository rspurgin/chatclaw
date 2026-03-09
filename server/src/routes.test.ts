import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import routes from './routes.js';
import { getLogContent } from './logger.js';

vi.mock('./logger.js', () => ({
  getLogContent: vi.fn(),
}));

const mockedGetLogContent = vi.mocked(getLogContent);

const app = express();
app.use('/api', routes);

describe('routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/log', () => {
    it('returns success and log data when getLogContent resolves', async () => {
      mockedGetLogContent.mockResolvedValue('line1\nline2\n');
      const res = await request(app).get('/api/log');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: 'line1\nline2\n' });
      expect(mockedGetLogContent).toHaveBeenCalledTimes(1);
    });

    it('returns empty data when log file is empty', async () => {
      mockedGetLogContent.mockResolvedValue('');
      const res = await request(app).get('/api/log');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: '' });
    });

    it('returns 500 and error message when getLogContent rejects', async () => {
      mockedGetLogContent.mockRejectedValue(new Error('read failed'));
      const res = await request(app).get('/api/log');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, error: 'Failed to read log file' });
    });
  });
});
