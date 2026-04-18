import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanupStalePresence, startCleanupJob, stopCleanupJob, isCleanupJobRunning } from './presence-cleanup';
import * as postgres from '../db/postgres';

// Mock the postgres module
vi.mock('../db/postgres', () => ({
  query: vi.fn(),
}));

describe('Presence Cleanup Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopCleanupJob();
    vi.useRealTimers();
  });

  describe('cleanupStalePresence', () => {
    it('should mark users offline if last_seen > 1 hour', async () => {
      const mockResult = { rowCount: 3, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      const count = await cleanupStalePresence();

      expect(count).toBe(3);
      expect(postgres.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE presence_tracking'),
        expect.arrayContaining([expect.any(Date)])
      );
    });

    it('should use correct SQL query with 1 hour threshold', async () => {
      const mockResult = { rowCount: 0, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      await cleanupStalePresence();

      const call = vi.mocked(postgres.query).mock.calls[0];
      const sql = call[0];
      const params = call[1];

      expect(sql).toContain('UPDATE presence_tracking');
      expect(sql).toContain('SET status = \'offline\'');
      expect(sql).toContain('WHERE last_seen < $1 AND status != \'offline\'');
      
      // Check that the timestamp is approximately 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const paramDate = params![0] as Date;
      expect(Math.abs(paramDate.getTime() - oneHourAgo.getTime())).toBeLessThan(1000);
    });

    it('should return 0 when no records need cleanup', async () => {
      const mockResult = { rowCount: 0, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      const count = await cleanupStalePresence();

      expect(count).toBe(0);
    });

    it('should handle null rowCount', async () => {
      const mockResult = { rowCount: null, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      const count = await cleanupStalePresence();

      expect(count).toBe(0);
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(postgres.query).mockRejectedValue(error);

      await expect(cleanupStalePresence()).rejects.toThrow('Database connection failed');
    });
  });

  describe('startCleanupJob', () => {
    it('should set cleanup job as running', () => {
      expect(isCleanupJobRunning()).toBe(false);

      startCleanupJob();

      expect(isCleanupJobRunning()).toBe(true);
    });

    it('should not start multiple jobs if already running', () => {
      startCleanupJob();
      expect(isCleanupJobRunning()).toBe(true);

      // Try to start again - should warn but not create new job
      startCleanupJob();

      expect(isCleanupJobRunning()).toBe(true);
    });

    it('should call cleanup function on interval', () => {
      const mockResult = { rowCount: 1, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      startCleanupJob();

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Should have been called at least once (initial + interval)
      expect(postgres.query).toHaveBeenCalled();
    });
  });

  describe('stopCleanupJob', () => {
    it('should stop the cleanup job', () => {
      startCleanupJob();
      expect(isCleanupJobRunning()).toBe(true);

      stopCleanupJob();

      expect(isCleanupJobRunning()).toBe(false);
    });

    it('should prevent scheduled cleanups after stopping', () => {
      const mockResult = { rowCount: 0, rows: [] };
      vi.mocked(postgres.query).mockResolvedValue(mockResult);

      startCleanupJob();
      vi.advanceTimersByTime(1000); // Let initial call happen
      const callCountBeforeStop = vi.mocked(postgres.query).mock.calls.length;

      stopCleanupJob();

      // Advance time by 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Should not have made any new calls
      expect(vi.mocked(postgres.query).mock.calls.length).toBe(callCountBeforeStop);
    });

    it('should handle stopping when no job is running', () => {
      expect(() => stopCleanupJob()).not.toThrow();
    });
  });

  describe('isCleanupJobRunning', () => {
    it('should return false initially', () => {
      expect(isCleanupJobRunning()).toBe(false);
    });

    it('should return true when job is running', () => {
      startCleanupJob();
      expect(isCleanupJobRunning()).toBe(true);
    });

    it('should return false after stopping', () => {
      startCleanupJob();
      stopCleanupJob();
      expect(isCleanupJobRunning()).toBe(false);
    });
  });
});
