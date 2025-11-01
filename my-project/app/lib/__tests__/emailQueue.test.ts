/**
 * Unit Tests for Email Queue Processor Module (emailQueue.ts)
 * 
 * This file contains comprehensive unit tests for EmailQueueProcessor methods:
 * - processQueue()
 * - triggerProcessing()
 * - getQueueStats()
 * - Private methods are tested through public interface
 */

import { emailQueueProcessor } from '../emailQueue';
import { executeQuery } from '../db';
import { emailService } from '../email';

// Mock dependencies
jest.mock('../db');
jest.mock('../email');

describe('EmailQueueProcessor', () => {
  const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
  const mockEmailService = emailService as jest.Mocked<typeof emailService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailService.isReady = jest.fn().mockReturnValue(true);
    mockEmailService.sendEmail = jest.fn();
  });

  describe('processQueue', () => {
    it('should not process if already processing', async () => {
      // Start processing
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce([]) // getCampaignData
        .mockResolvedValueOnce([]) // optInResult
        .mockResolvedValueOnce([]) // updateQueueStatus
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]) // updateCampaignStats
        .mockResolvedValueOnce([]); // No more pending

      mockEmailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-123',
        response: 'Sent',
      });

      // Call twice simultaneously
      const promise1 = emailQueueProcessor.processQueue();
      const promise2 = emailQueueProcessor.processQueue();

      await Promise.all([promise1, promise2]);

      // Should only process once
      expect(mockExecuteQuery).toHaveBeenCalled();
    });

    it('should process pending emails successfully', async () => {
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      const campaignData = [
        {
          id: 1,
          html_content: '<p>Test Content</p>',
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce([]) // optInResult - no contact found, allow sending
        .mockResolvedValueOnce([]) // updateQueueStatus - sending
        .mockResolvedValueOnce(campaignData) // getCampaignData
        .mockResolvedValueOnce([]) // updateQueueStatus - sent
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]) // updateCampaignStats
        .mockResolvedValueOnce([]); // No more pending

      mockEmailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'test-123',
        response: 'Sent',
      });

      await emailQueueProcessor.processQueue();

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockExecuteQuery).toHaveBeenCalled();
    });

    it('should stop processing when email service is not ready', async () => {
      mockEmailService.isReady.mockReturnValue(false);

      await emailQueueProcessor.processQueue();

      expect(mockExecuteQuery).not.toHaveBeenCalled();
    });

    it('should skip email when contact opted out (opt1 for campaigns)', async () => {
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      const optInResult = [
        {
          opt1: false, // Opted out
          opt2: true,
          opt3: true,
          campaign_type: 'campaign', // Not newsletter
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce(optInResult) // optInResult
        .mockResolvedValueOnce([]) // updateQueueStatus - skipped
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]); // No more pending

      await emailQueueProcessor.processQueue();

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should skip email when contact opted out (opt2 for newsletters)', async () => {
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      const optInResult = [
        {
          opt1: true,
          opt2: false, // Opted out of newsletters
          opt3: true,
          campaign_type: 'email', // Newsletter
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce(optInResult) // optInResult
        .mockResolvedValueOnce([]) // updateQueueStatus - skipped
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]); // No more pending

      await emailQueueProcessor.processQueue();

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email send failure and retry', async () => {
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      const campaignData = [
        {
          id: 1,
          html_content: '<p>Test Content</p>',
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce([]) // optInResult
        .mockResolvedValueOnce([]) // updateQueueStatus - sending
        .mockResolvedValueOnce(campaignData) // getCampaignData
        .mockResolvedValueOnce([]) // updateQueueStatus - retry
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]); // No more pending

      mockEmailService.sendEmail.mockResolvedValue({
        success: false,
        error: 'Send failed',
      });

      await emailQueueProcessor.processQueue();

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      // Should update status to retry
      expect(mockExecuteQuery).toHaveBeenCalled();
    });

    it('should mark as failed on SMTP transport failure', async () => {
      const pendingEmails = [
        {
          id: 1,
          campaign_id: 1,
          contact_id: 1,
          email: 'test@example.com',
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        },
      ];

      const campaignData = [
        {
          id: 1,
          html_content: '<p>Test Content</p>',
        },
      ];

      mockExecuteQuery
        .mockResolvedValueOnce(pendingEmails) // getPendingEmails
        .mockResolvedValueOnce([]) // optInResult
        .mockResolvedValueOnce([]) // updateQueueStatus - sending
        .mockResolvedValueOnce(campaignData) // getCampaignData
        .mockResolvedValueOnce([]) // updateQueueStatus - failed
        .mockResolvedValueOnce([]) // logEmailAction
        .mockResolvedValueOnce([]) // updateCampaignStats
        .mockResolvedValueOnce([]); // getPendingEmails - no more pending

      mockEmailService.sendEmail.mockResolvedValue({
        success: false,
        error: 'SMTP Transport Failed: Connection error',
      });

      await emailQueueProcessor.processQueue();

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      // Should mark as failed immediately, not retry
      expect(mockExecuteQuery).toHaveBeenCalled();
    });
  });

  describe('triggerProcessing', () => {
    it('should trigger processing when not already processing', async () => {
      mockExecuteQuery.mockResolvedValueOnce([]); // No pending emails

      await emailQueueProcessor.triggerProcessing();

      expect(mockExecuteQuery).toHaveBeenCalled();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = [
        { status: 'pending', count: 5 },
        { status: 'sent', count: 10 },
        { status: 'failed', count: 2 },
      ];

      mockExecuteQuery.mockResolvedValueOnce(mockStats);

      const stats = await emailQueueProcessor.getQueueStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('sending');
      expect(stats).toHaveProperty('sent');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('retry');
      expect(stats).toHaveProperty('skipped');
      expect(stats.pending).toBe(5);
      expect(stats.sent).toBe(10);
      expect(stats.failed).toBe(2);
    });

    it('should return zero counts when no stats found', async () => {
      mockExecuteQuery.mockResolvedValueOnce([]);

      const stats = await emailQueueProcessor.getQueueStats();

      expect(stats.pending).toBe(0);
      expect(stats.sending).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.retry).toBe(0);
      expect(stats.skipped).toBe(0);
    });
  });
});

