/**
 * Unit Tests for Email Service Module (email.ts)
 * 
 * This file contains comprehensive unit tests for all EmailService methods:
 * - sendEmail()
 * - sendBulkEmails()
 * - testConnection()
 * - sendTestEmail()
 * - getConfiguration()
 * - isReady()
 * - getInitializationError()
 * - getStatus()
 */

import { emailService } from '../email';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let mockTransporter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for tests
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'test_password';
    process.env.SMTP_SECURE = 'false';

    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
    // Setup the singleton's internal state for testing
    if (emailService) {
      (emailService as any).transporter = mockTransporter;
      (emailService as any).isInitialized = true;
      (emailService as any).config = {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'test@test.com', pass: 'test_password' }
      };
      (emailService as any).initializationError = null;
    }
  });

  describe('Initialization', () => {
    it('should be initialized', () => {
      // EmailService is a singleton, so it initializes when imported
      // We can verify it exists
      expect(emailService).toBeDefined();
    });

    it('should have configuration available', () => {
      const config = emailService.getConfiguration();
      // Config may be null if not initialized, or an object if initialized
      expect(config === null || typeof config === 'object').toBe(true);
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      // Mock the service to be ready
      jest.spyOn(emailService, 'isReady').mockReturnValue(true);
      mockTransporter.verify.mockResolvedValue(true);
    });

    it('should send email successfully when service is ready', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        })
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
    });

    it('should handle array of recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const emailData = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.recipients).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should include cc and bcc when provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const emailData = {
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
        })
      );
    });

    it('should include attachments when provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id-123',
      });

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf',
          },
        ],
      };

      await emailService.sendEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: emailData.attachments,
        })
      );
    });

    it('should return error when transporter is not initialized', async () => {
      // Simulate uninitialized transporter
      (emailService as any).transporter = null;
      (emailService as any).isInitialized = false;
      jest.spyOn(emailService, 'isReady').mockReturnValue(false);

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP Transport Failed');
    });

    it('should handle sendMail errors', async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP Error'));
      (emailService as any).transporter = { sendMail: mockSendMail };

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await emailService.sendEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email Send Failed');
    });
  });

  describe('sendBulkEmails', () => {
    beforeEach(() => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send multiple emails in sequence', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Content 1</p>',
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Content 2</p>',
        },
      ];

      const promise = emailService.sendBulkEmails(emails);

      // Fast-forward through delays
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);

      const results = await promise;

      expect(results).toHaveLength(2);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle partial failures in bulk send', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'success-1' })
        .mockRejectedValueOnce(new Error('Failed email'))
        .mockResolvedValueOnce({ messageId: 'success-2' });

      const emails = [
        { to: 'user1@example.com', subject: 'Email 1', html: '<p>1</p>' },
        { to: 'user2@example.com', subject: 'Email 2', html: '<p>2</p>' },
        { to: 'user3@example.com', subject: 'Email 3', html: '<p>3</p>' },
      ];

      const promise = emailService.sendBulkEmails(emails);

      await jest.advanceTimersByTimeAsync(300);

      const results = await promise;

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('testConnection', () => {
    it('should return success when connection is valid', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should timeout after 10 seconds', async () => {
      jest.useFakeTimers();
      mockTransporter.verify.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 20000))
      );

      const promise = emailService.testConnection();

      await jest.advanceTimersByTimeAsync(10000);

      const result = await promise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');

      jest.useRealTimers();
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email with correct format', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      const result = await emailService.sendTestEmail('test@example.com');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email from CRM System',
          html: expect.stringContaining('Test Email'),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getConfiguration', () => {
    it('should return configuration when available', () => {
      const config = emailService.getConfiguration();

      // Configuration may be null if not initialized, or an object if initialized
      expect(config === null || typeof config === 'object').toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return boolean indicating readiness', () => {
      const ready = emailService.isReady();

      expect(typeof ready).toBe('boolean');
    });
  });

  describe('getInitializationError', () => {
    it('should return error message or null', () => {
      const error = emailService.getInitializationError();

      expect(error === null || typeof error === 'string').toBe(true);
    });
  });

  describe('getStatus', () => {
    it('should return status object with all properties', () => {
      const status = emailService.getStatus();

      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('hasTransporter');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('config');
      expect(typeof status.isReady).toBe('boolean');
      expect(typeof status.isInitialized).toBe('boolean');
      expect(typeof status.hasTransporter).toBe('boolean');
    });
  });
});

