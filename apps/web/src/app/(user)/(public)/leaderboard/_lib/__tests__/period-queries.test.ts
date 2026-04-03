import { describe, expect, it, vi } from 'vitest';

const { mockGetAllTimeRanking, mockGetMonthlyRanking, mockGetUserAllTimeRankedRow, mockGetUserMonthlyRankedRow } =
  vi.hoisted(() => ({
    mockGetAllTimeRanking: vi.fn(),
    mockGetMonthlyRanking: vi.fn(),
    mockGetUserAllTimeRankedRow: vi.fn(),
    mockGetUserMonthlyRankedRow: vi.fn(),
  }));

vi.mock('@/lib/db/challenge-queries', () => ({
  getAllTimeRanking: mockGetAllTimeRanking,
  getMonthlyRanking: mockGetMonthlyRanking,
  getUserAllTimeRankedRow: mockGetUserAllTimeRankedRow,
  getUserMonthlyRankedRow: mockGetUserMonthlyRankedRow,
}));

import { getQueriesForPeriod } from '../period-queries';

describe('getQueriesForPeriod', () => {
  describe('all-time period', () => {
    it('returns getAllTimeRanking as getRanking', () => {
      const queries = getQueriesForPeriod('all-time');
      expect(queries.getRanking).toBe(mockGetAllTimeRanking);
    });

    it('returns getUserAllTimeRankedRow as getUserRankedRow', () => {
      const queries = getQueriesForPeriod('all-time');
      expect(queries.getUserRankedRow).toBe(mockGetUserAllTimeRankedRow);
    });
  });

  describe('monthly period', () => {
    it('returns getMonthlyRanking as getRanking', () => {
      const queries = getQueriesForPeriod('monthly');
      expect(queries.getRanking).toBe(mockGetMonthlyRanking);
    });

    it('returns getUserMonthlyRankedRow as getUserRankedRow', () => {
      const queries = getQueriesForPeriod('monthly');
      expect(queries.getUserRankedRow).toBe(mockGetUserMonthlyRankedRow);
    });
  });

  describe('consistency', () => {
    it('returns the same object on repeated calls for the same period', () => {
      const first = getQueriesForPeriod('all-time');
      const second = getQueriesForPeriod('all-time');
      expect(first).toBe(second);
    });

    it('returns different objects for different periods', () => {
      const allTime = getQueriesForPeriod('all-time');
      const monthly = getQueriesForPeriod('monthly');
      expect(allTime).not.toBe(monthly);
    });
  });
});
