import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockInsert, mockValues, mockOnConflictDoUpdate, mockTransaction } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockOnConflictDoUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('../index', () => ({
  db: {
    transaction: mockTransaction,
  },
}));

vi.mock('../schema', () => ({
  challengeResults: { _name: 'challenge_results' },
  challengeBestScores: {
    _name: 'challenge_best_scores',
    userId: 'user_id',
    menuType: 'menu_type',
    leaderboardKey: 'leaderboard_key',
    score: 'score',
    incorrectAnswers: 'incorrect_answers',
    timeTaken: 'time_taken',
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import type { ChallengeResultInput } from '../save-challenge-result';
import { saveChallengeResult } from '../save-challenge-result';

const validInput: ChallengeResultInput = {
  userId: 'user-123',
  menuType: 'jantou_fu',
  leaderboardKey: 'default',
  score: 10,
  incorrectAnswers: 2,
  timeTaken: 45,
};

describe('saveChallengeResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    // The transaction callback receives a `tx` object with an `insert` method
    mockTransaction.mockImplementation(async (callback: (tx: { insert: typeof mockInsert }) => Promise<void>) => {
      await callback({ insert: mockInsert });
    });
  });

  describe('successful save', () => {
    it('executes two inserts within a transaction', async () => {
      await saveChallengeResult(validInput);

      expect(mockTransaction).toHaveBeenCalledOnce();
      // Two inserts: one for challenge_results, one for challenge_best_scores
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('inserts into challenge_results with correct values', async () => {
      await saveChallengeResult(validInput);

      const firstInsertCall = mockInsert.mock.calls[0];
      expect(firstInsertCall[0]).toEqual({ _name: 'challenge_results' });

      const firstValuesCall = mockValues.mock.calls[0];
      expect(firstValuesCall[0]).toEqual({
        userId: 'user-123',
        menuType: 'jantou_fu',
        leaderboardKey: 'default',
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
    });

    it('inserts into challenge_best_scores with achievedAt', async () => {
      await saveChallengeResult(validInput);

      const secondInsertCall = mockInsert.mock.calls[1];
      expect(secondInsertCall[0]).toMatchObject({
        _name: 'challenge_best_scores',
      });

      const secondValuesCall = mockValues.mock.calls[1];
      expect(secondValuesCall[0]).toMatchObject({
        userId: 'user-123',
        menuType: 'jantou_fu',
        leaderboardKey: 'default',
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
      // achievedAt should be a Date
      expect(secondValuesCall[0].achievedAt).toBeInstanceOf(Date);
    });

    it('calls onConflictDoUpdate for the best scores upsert', async () => {
      await saveChallengeResult(validInput);

      expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
      const upsertArg = mockOnConflictDoUpdate.mock.calls[0][0];
      expect(upsertArg).toHaveProperty('target');
      expect(upsertArg).toHaveProperty('set');
      expect(upsertArg).toHaveProperty('setWhere');
    });
  });

  describe('transaction error propagation', () => {
    it('propagates errors thrown inside the transaction', async () => {
      const transactionError = new Error('DB connection lost');
      mockTransaction.mockRejectedValue(transactionError);

      await expect(saveChallengeResult(validInput)).rejects.toThrow('DB connection lost');
    });

    it('propagates errors from the insert operation', async () => {
      const insertError = new Error('Insert failed');
      mockTransaction.mockImplementation(async (callback: (tx: { insert: typeof mockInsert }) => Promise<void>) => {
        mockInsert.mockReturnValue({
          values: vi.fn().mockRejectedValue(insertError),
        });
        await callback({ insert: mockInsert });
      });

      await expect(saveChallengeResult(validInput)).rejects.toThrow('Insert failed');
    });
  });
});
