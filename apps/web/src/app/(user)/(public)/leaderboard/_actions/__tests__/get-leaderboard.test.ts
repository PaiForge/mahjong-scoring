import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { LeaderboardPage, RankedLeaderboardRow } from '@/lib/db/challenge-queries';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetRanking, mockGetUserRankedRow, mockUnstableCache } = vi.hoisted(() => ({
  mockGetRanking: vi.fn(),
  mockGetUserRankedRow: vi.fn(),
  mockUnstableCache: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_cache: mockUnstableCache,
}));

vi.mock('../../_lib/period-queries', () => ({
  getQueriesForPeriod: vi.fn(() => ({
    getRanking: mockGetRanking,
    getUserRankedRow: mockGetUserRankedRow,
  })),
}));

import { getLeaderboard } from '../get-leaderboard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildPage(overrides?: Partial<LeaderboardPage>): LeaderboardPage {
  return {
    rows: [
      {
        userId: 'user-1',
        username: 'alice',
        score: 20,
        incorrectAnswers: 0,
        timeTaken: 30,
        displayName: 'Alice',
        avatarUrl: undefined,
      },
      {
        userId: 'user-2',
        username: 'bob',
        score: 18,
        incorrectAnswers: 1,
        timeTaken: 40,
        displayName: undefined,
        avatarUrl: undefined,
      },
    ],
    total: 2,
    ...overrides,
  };
}

const rankedRow: RankedLeaderboardRow = {
  rank: 5,
  userId: 'user-99',
  username: 'charlie',
  score: 10,
  incorrectAnswers: 3,
  timeTaken: 55,
  displayName: 'Charlie',
  avatarUrl: undefined,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // unstable_cache should execute the callback immediately
    mockUnstableCache.mockImplementation((fn: () => Promise<LeaderboardPage>) => fn);
    mockGetRanking.mockResolvedValue(buildPage());
    mockGetUserRankedRow.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  describe('input validation', () => {
    it('returns empty result for invalid module', async () => {
      const result = await getLeaderboard('invalid' as 'jantou_fu', 'all-time', 1);

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });

    it('returns empty result for invalid period', async () => {
      const result = await getLeaderboard('jantou_fu', 'weekly' as 'all-time', 1);

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });

    it('returns empty result for page < 1', async () => {
      const result = await getLeaderboard('jantou_fu', 'all-time', 0);

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });

    it('returns empty result for negative page', async () => {
      const result = await getLeaderboard('jantou_fu', 'monthly', -1);

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });

    it('does not call ranking queries when module is invalid', async () => {
      await getLeaderboard('invalid' as 'jantou_fu', 'all-time', 1);

      expect(mockGetRanking).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Basic retrieval
  // -------------------------------------------------------------------------

  describe('basic retrieval', () => {
    it('returns rows with computed rank (page 1)', async () => {
      const result = await getLeaderboard('jantou_fu', 'all-time', 1);

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toMatchObject({ userId: 'user-1', rank: 1 });
      expect(result.rows[1]).toMatchObject({ userId: 'user-2', rank: 2 });
    });

    it('returns totalCount from the query', async () => {
      const result = await getLeaderboard('jantou_fu', 'all-time', 1);

      expect(result.totalCount).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('pagination', () => {
    it('computes rank offset correctly for page 2 (PAGE_SIZE = 20)', async () => {
      mockGetRanking.mockResolvedValue(
        buildPage({
          rows: [
            {
              userId: 'user-21',
              username: 'page2-first',
              score: 5,
              incorrectAnswers: 0,
              timeTaken: 50,
              displayName: undefined,
              avatarUrl: undefined,
            },
          ],
          total: 25,
        }),
      );

      const result = await getLeaderboard('jantou_fu', 'all-time', 2);

      // Page 2 with PAGE_SIZE=20 means offset=20, so first row rank = 21
      expect(result.rows[0]).toMatchObject({ rank: 21, userId: 'user-21' });
      expect(result.totalCount).toBe(25);
    });

    it('computes rank offset correctly for page 3', async () => {
      mockGetRanking.mockResolvedValue(
        buildPage({
          rows: [
            {
              userId: 'user-41',
              username: 'page3-first',
              score: 3,
              incorrectAnswers: 2,
              timeTaken: 58,
              displayName: undefined,
              avatarUrl: undefined,
            },
          ],
          total: 50,
        }),
      );

      const result = await getLeaderboard('jantou_fu', 'monthly', 3);

      expect(result.rows[0]).toMatchObject({ rank: 41, userId: 'user-41' });
    });
  });

  // -------------------------------------------------------------------------
  // Current user rank
  // -------------------------------------------------------------------------

  describe('currentUserRank', () => {
    it('is undefined when no currentUserId is provided', async () => {
      const result = await getLeaderboard('jantou_fu', 'all-time', 1);

      expect(result.currentUserRank).toBeUndefined();
    });

    it('is undefined when the current user appears in the page rows', async () => {
      const result = await getLeaderboard('jantou_fu', 'all-time', 1, 'user-1');

      expect(result.currentUserRank).toBeUndefined();
      expect(mockGetUserRankedRow).not.toHaveBeenCalled();
    });

    it('fetches user ranked row when the current user is not in the page rows', async () => {
      mockGetUserRankedRow.mockResolvedValue(rankedRow);

      const result = await getLeaderboard('jantou_fu', 'all-time', 1, 'user-99');

      expect(mockGetUserRankedRow).toHaveBeenCalledWith('user-99', 'jantou_fu', 'default');
      expect(result.currentUserRank).toEqual(rankedRow);
    });

    it('returns undefined currentUserRank when user has no ranked row', async () => {
      mockGetUserRankedRow.mockResolvedValue(undefined);

      const result = await getLeaderboard('jantou_fu', 'all-time', 1, 'user-not-found');

      expect(result.currentUserRank).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('returns empty result when ranking query throws', async () => {
      mockGetRanking.mockRejectedValue(new Error('DB connection lost'));

      const result = await getLeaderboard('jantou_fu', 'all-time', 1);

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });

    it('returns empty result when getUserRankedRow throws', async () => {
      mockGetUserRankedRow.mockRejectedValue(new Error('Query timeout'));

      const result = await getLeaderboard('jantou_fu', 'all-time', 1, 'user-99');

      expect(result).toEqual({ rows: [], totalCount: 0, currentUserRank: undefined });
    });
  });
});
