/**
 * Unit Tests for Contact Groups Hook (useContactGroups.ts)
 * 
 * This file contains comprehensive unit tests for React hooks:
 * - useContactGroups()
 * - useContactGroupNames()
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useContactGroups, useContactGroupNames } from '../useContactGroups';

// Mock fetch
global.fetch = jest.fn();

describe('Contact Groups Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useContactGroups', () => {
    it('should fetch and return contact groups', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Companies',
          description: 'Business contacts',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
        {
          id: 2,
          name: 'Schools',
          description: 'School contacts',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const { result } = renderHook(() => useContactGroups());

      expect(result.current.loading).toBe(true);
      expect(result.current.groups).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groups).toEqual(mockGroups);
      expect(result.current.groupNames).toEqual(['Companies', 'Schools']);
      expect(result.current.error).toBeNull();
    });

    it('should handle API errors and fallback to hardcoded groups', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useContactGroups());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      // Should have fallback groups
      expect(result.current.groups).toHaveLength(5);
      expect(result.current.groups[0].name).toBe('Companies');
    });

    it('should handle non-OK responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useContactGroups());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch contact groups');
      expect(result.current.groups).toHaveLength(5); // Fallback groups
    });

    it('should provide refetch function', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Companies',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGroups,
      });

      const { result } = renderHook(() => useContactGroups());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refetch
      await result.current.refetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should return groupNames array', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Group A',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
        {
          id: 2,
          name: 'Group B',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const { result } = renderHook(() => useContactGroups());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.groupNames).toEqual(['Group A', 'Group B']);
    });
  });

  describe('useContactGroupNames', () => {
    it('should return only group names', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Companies',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
        {
          id: 2,
          name: 'Schools',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          is_active: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      });

      const { result } = renderHook(() => useContactGroupNames());

      await waitFor(() => {
        expect(result.current).toHaveLength(2);
      });

      expect(result.current).toEqual(['Companies', 'Schools']);
      expect(Array.isArray(result.current)).toBe(true);
    });
  });
});

