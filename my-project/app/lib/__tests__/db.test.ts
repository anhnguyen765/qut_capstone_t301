/**
 * Unit Tests for Database Module (db.ts)
 * 
 * This file contains comprehensive unit tests for all database-related methods:
 * - createConnection()
 * - executeQuery()
 * - executeTransaction()
 */

import { createConnection, executeQuery, executeTransaction } from '../db';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
jest.mock('mysql2/promise');

describe('Database Module', () => {
  const mockConnection = {
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    end: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default environment variables
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASS = 'test_pass';
    process.env.DB_NAME = 'test_db';
  });

  afterEach(() => {
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASS;
    delete process.env.DB_NAME;
  });

  describe('createConnection', () => {
    it('should create a connection with default config when env vars are not set', async () => {
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASS;
      delete process.env.DB_NAME;

      (mysql.createConnection as jest.Mock).mockResolvedValue(mockConnection);

      const connection = await createConnection();

      expect(mysql.createConnection).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'crm_db',
        connectTimeout: 30000,
      });
      expect(connection).toBe(mockConnection);
    });

    it('should create a connection with environment variables', async () => {
      (mysql.createConnection as jest.Mock).mockResolvedValue(mockConnection);

      const connection = await createConnection();

      expect(mysql.createConnection).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'test_user',
        password: 'test_pass',
        database: 'test_db',
        connectTimeout: 30000,
      });
      expect(connection).toBe(mockConnection);
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      (mysql.createConnection as jest.Mock).mockRejectedValue(error);

      await expect(createConnection()).rejects.toThrow('Failed to connect to database');
    });
  });

  describe('executeQuery', () => {
    beforeEach(() => {
      (mysql.createConnection as jest.Mock).mockResolvedValue(mockConnection);
    });

    it('should execute SELECT query and return array', async () => {
      const mockRows = [{ id: 1, name: 'Test' }];
      mockConnection.execute.mockResolvedValue([mockRows]);

      const result = await executeQuery('SELECT * FROM users WHERE id = ?', [1]);

      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
      expect(mockConnection.end).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });

    it('should execute SELECT query and return empty array when no rows', async () => {
      mockConnection.execute.mockResolvedValue([[]]);

      const result = await executeQuery('SELECT * FROM users WHERE id = ?', [999]);

      expect(result).toEqual([]);
    });

    it('should execute non-SELECT query and return result', async () => {
      const mockResult = { affectedRows: 1, insertId: 123 };
      mockConnection.execute.mockResolvedValue([mockResult]);

      const result = await executeQuery('INSERT INTO users (name) VALUES (?)', ['Test']);

      expect(mockConnection.execute).toHaveBeenCalledWith('INSERT INTO users (name) VALUES (?)', ['Test']);
      expect(result).toBe(mockResult);
    });

    it('should retry on failure with exponential backoff', async () => {
      jest.useFakeTimers();
      
      // First two attempts fail, third succeeds
      mockConnection.execute
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockRejectedValueOnce(new Error('Connection lost'))
        .mockResolvedValueOnce([[{ id: 1 }]]);

      const queryPromise = executeQuery('SELECT * FROM users', []);

      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(2000); // First retry delay
      await jest.advanceTimersByTimeAsync(4000); // Second retry delay

      const result = await queryPromise;

      expect(mockConnection.execute).toHaveBeenCalledTimes(3);
      expect(result).toEqual([{ id: 1 }]);

      jest.useRealTimers();
    });

    it('should throw error after all retries fail', async () => {
      const error = new Error('Database error');
      mockConnection.execute.mockRejectedValue(error);

      await expect(executeQuery('SELECT * FROM users', [], 2)).rejects.toThrow('Database error');
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    });

    it('should use default retries value of 3', async () => {
      jest.useFakeTimers();
      mockConnection.execute.mockRejectedValue(new Error('Database error'));

      const queryPromise = executeQuery('SELECT * FROM users', []);

      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(2000); // First retry
      await jest.advanceTimersByTimeAsync(4000); // Second retry

      await expect(queryPromise).rejects.toThrow();
      expect(mockConnection.execute).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    }, 10000);
  });

  describe('executeTransaction', () => {
    beforeEach(() => {
      (mysql.createConnection as jest.Mock).mockResolvedValue(mockConnection);
      mockConnection.beginTransaction.mockResolvedValue(undefined);
      mockConnection.commit.mockResolvedValue(undefined);
    });

    it('should execute multiple queries in a transaction', async () => {
      const queries = [
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User1'] },
        { query: 'UPDATE users SET name = ? WHERE id = ?', params: ['User1Updated', 1] },
      ];

      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const results = await executeTransaction(queries);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.execute).toHaveBeenCalledTimes(2);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.end).toHaveBeenCalled();
      expect(results).toHaveLength(2);
    });

    it('should rollback on error', async () => {
      const queries = [
        { query: 'INSERT INTO users (name) VALUES (?)', params: ['User1'] },
        { query: 'INVALID SQL', params: [] },
      ];

      mockConnection.execute
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockRejectedValueOnce(new Error('SQL Error'));

      await expect(executeTransaction(queries)).rejects.toThrow('SQL Error');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.end).toHaveBeenCalled();
    });

    it('should handle empty queries array', async () => {
      const results = await executeTransaction([]);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.execute).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });
  });
});

