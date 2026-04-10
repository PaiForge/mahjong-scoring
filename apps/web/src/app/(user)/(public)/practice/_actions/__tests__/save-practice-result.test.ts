import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockGetUser, mockSaveChallengeResult } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSaveChallengeResult: vi.fn(),
}));

vi.mock('../../../../../../lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}));

vi.mock('../../../../../../lib/db/save-challenge-result', () => ({
  saveChallengeResult: mockSaveChallengeResult,
}));

import { savePracticeResult } from '../save-practice-result';
import type { ChallengeFields } from '../save-practice-result';

const validFields: ChallengeFields = {
  score: 8,
  incorrectAnswers: 2,
  timeTaken: 42,
};

describe('savePracticeResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it("returns { success: true, skipped: 'anonymous' } when user is not logged in (undefined)", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      const result = await savePracticeResult('jantou_fu', 'default', validFields);

      expect(result).toEqual({ success: true, skipped: 'anonymous' });
    });

    it("returns { success: true, skipped: 'anonymous' } when user is null", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await savePracticeResult('jantou_fu', 'default', validFields);

      expect(result).toEqual({ success: true, skipped: 'anonymous' });
    });

    it('does not call saveChallengeResult when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      await savePracticeResult('jantou_fu', 'default', validFields);

      expect(mockSaveChallengeResult).not.toHaveBeenCalled();
    });
  });

  describe('invalid menuType', () => {
    it('returns invalid_menu_type for unknown menu type', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Force an invalid value through type assertion (simulating runtime mismatch)
      const result = await savePracticeResult(
        'invalid_type' as 'jantou_fu',
        'default',
        validFields,
      );

      expect(result).toEqual({ success: false, error: 'invalid_menu_type' });
    });

    it('does not call saveChallengeResult for invalid menuType', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      await savePracticeResult('not_valid' as 'jantou_fu', 'default', validFields);

      expect(mockSaveChallengeResult).not.toHaveBeenCalled();
    });
  });

  describe('successful save', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSaveChallengeResult.mockResolvedValue({ challengeResultId: 'cr-1' });
    });

    it('returns success: true with challengeResultId', async () => {
      const result = await savePracticeResult('jantou_fu', 'default', validFields);

      expect(result).toEqual({ success: true, challengeResultId: 'cr-1' });
    });

    it('calls saveChallengeResult with rounded values', async () => {
      const fieldsWithDecimals: ChallengeFields = {
        score: 8.7,
        incorrectAnswers: 2.3,
        timeTaken: 42.9,
      };

      await savePracticeResult('jantou_fu', 'default', fieldsWithDecimals);

      expect(mockSaveChallengeResult).toHaveBeenCalledWith({
        userId: 'user-123',
        menuType: 'jantou_fu',
        leaderboardKey: 'default',
        score: 9,
        incorrectAnswers: 2,
        timeTaken: 43,
      });
    });

    it('passes the correct userId from the authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'specific-user-id' } },
      });

      await savePracticeResult('machi_fu', 'default', validFields);

      expect(mockSaveChallengeResult).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'specific-user-id',
          menuType: 'machi_fu',
        }),
      );
    });
  });

  describe('unexpected error handling', () => {
    it('returns unexpected_error when saveChallengeResult throws', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSaveChallengeResult.mockRejectedValue(new Error('DB connection lost'));

      const result = await savePracticeResult('jantou_fu', 'default', validFields);

      expect(result).toEqual({ success: false, error: 'unexpected_error' });
    });

    it('returns unexpected_error when createClient throws', async () => {
      mockGetUser.mockRejectedValue(new Error('Supabase unavailable'));

      const result = await savePracticeResult('jantou_fu', 'default', validFields);

      expect(result).toEqual({ success: false, error: 'unexpected_error' });
    });
  });
});
