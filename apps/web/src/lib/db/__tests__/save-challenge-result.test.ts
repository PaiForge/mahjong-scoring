import { describe, expect, it, vi, beforeEach } from 'vitest';

const {
  mockInsert,
  mockFirstValues,
  mockFirstReturning,
  mockSecondValues,
  mockOnConflictDoUpdate,
  mockTransaction,
  mockGrantChallengeExp,
} = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockFirstValues: vi.fn(),
  mockFirstReturning: vi.fn(),
  mockSecondValues: vi.fn(),
  mockOnConflictDoUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockGrantChallengeExp: vi.fn(),
}));

vi.mock('../index', () => ({
  db: {
    transaction: mockTransaction,
  },
}));

vi.mock('../schema', () => ({
  challengeResults: { _name: 'challenge_results', id: 'id' },
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

vi.mock('../save-exp', () => ({
  grantChallengeExp: mockGrantChallengeExp,
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
  let insertCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    insertCallCount = 0;

    // First insert: challenge_results — chain is .values().returning([{ id }])
    mockFirstReturning.mockResolvedValue([{ id: 'challenge-result-1' }]);
    mockFirstValues.mockReturnValue({ returning: mockFirstReturning });

    // Second insert: challenge_best_scores — chain is .values().onConflictDoUpdate()
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockSecondValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });

    mockInsert.mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) {
        return { values: mockFirstValues };
      }
      return { values: mockSecondValues };
    });

    mockGrantChallengeExp.mockResolvedValue({
      earnedExp: 0,
      totalExp: 0,
      level: 0,
      levelUp: false,
      progressPercent: 0,
    });

    // The transaction callback receives a `tx` object
    mockTransaction.mockImplementation(
      async (callback: (tx: { insert: typeof mockInsert }) => Promise<unknown>) => {
        return await callback({ insert: mockInsert });
      },
    );
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
      expect(firstInsertCall[0]).toMatchObject({ _name: 'challenge_results' });

      expect(mockFirstValues).toHaveBeenCalledWith({
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

      const secondValuesCall = mockSecondValues.mock.calls[0];
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

    it('calls grantChallengeExp with the inserted challengeResultId', async () => {
      await saveChallengeResult(validInput);

      expect(mockGrantChallengeExp).toHaveBeenCalledOnce();
      const [, params] = mockGrantChallengeExp.mock.calls[0];
      expect(params).toMatchObject({
        userId: 'user-123',
        challengeResultId: 'challenge-result-1',
        menuType: 'jantou_fu',
        leaderboardKey: 'default',
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
    });

    it('returns the inserted challengeResultId', async () => {
      const result = await saveChallengeResult(validInput);

      expect(result).toEqual({ challengeResultId: 'challenge-result-1' });
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
      mockFirstReturning.mockRejectedValue(insertError);

      await expect(saveChallengeResult(validInput)).rejects.toThrow('Insert failed');
    });
  });
});
