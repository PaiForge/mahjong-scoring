import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSavePracticeResult } = vi.hoisted(() => ({
  mockSavePracticeResult: vi.fn(),
}));

vi.mock('../../../_actions/save-practice-result', () => ({
  savePracticeResult: mockSavePracticeResult,
}));

import { saveMentsuFuResult } from '../save-result';

describe('saveMentsuFuResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('delegation to savePracticeResult', () => {
    it('calls savePracticeResult with menuType "mentsu_fu" and leaderboardKey "default"', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveMentsuFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith('mentsu_fu', 'default', {
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
    });

    it('maps correctAnswers to score', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveMentsuFuResult({
        correctAnswers: 15,
        incorrectAnswers: 0,
        timeTaken: 30,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith(
        'mentsu_fu',
        'default',
        expect.objectContaining({ score: 15 }),
      );
    });
  });

  describe('return value passthrough', () => {
    it('returns success response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      const result = await saveMentsuFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: true });
    });

    it('returns error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'auth_failed' });

      const result = await saveMentsuFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: false, error: 'auth_failed' });
    });

    it('returns unexpected_error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'unexpected_error' });

      const result = await saveMentsuFuResult({
        correctAnswers: 5,
        incorrectAnswers: 3,
        timeTaken: 60,
      });

      expect(result).toEqual({ success: false, error: 'unexpected_error' });
    });
  });

  describe('boundary values', () => {
    it('passes zero correctAnswers as score 0', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveMentsuFuResult({
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeTaken: 0,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith('mentsu_fu', 'default', {
        score: 0,
        incorrectAnswers: 0,
        timeTaken: 0,
      });
    });
  });

  describe('error propagation', () => {
    it('propagates rejection when savePracticeResult throws', async () => {
      mockSavePracticeResult.mockRejectedValue(new Error('network error'));

      await expect(
        saveMentsuFuResult({
          correctAnswers: 10,
          incorrectAnswers: 2,
          timeTaken: 45,
        }),
      ).rejects.toThrow('network error');
    });
  });
});
