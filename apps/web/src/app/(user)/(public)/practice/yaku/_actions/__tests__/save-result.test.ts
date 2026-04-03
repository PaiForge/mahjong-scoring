import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSavePracticeResult } = vi.hoisted(() => ({
  mockSavePracticeResult: vi.fn(),
}));

vi.mock('../../../_actions/save-practice-result', () => ({
  savePracticeResult: mockSavePracticeResult,
}));

import { saveYakuResult } from '../save-result';

describe('saveYakuResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('delegation to savePracticeResult', () => {
    it('calls savePracticeResult with menuType "yaku" and leaderboardKey "default"', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveYakuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith('yaku', 'default', {
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
    });

    it('maps correctAnswers to score', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveYakuResult({
        correctAnswers: 15,
        incorrectAnswers: 0,
        timeTaken: 30,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith(
        'yaku',
        'default',
        expect.objectContaining({ score: 15 }),
      );
    });
  });

  describe('return value passthrough', () => {
    it('returns success response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      const result = await saveYakuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: true });
    });

    it('returns error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'auth_failed' });

      const result = await saveYakuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: false, error: 'auth_failed' });
    });

    it('returns unexpected_error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'unexpected_error' });

      const result = await saveYakuResult({
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

      await saveYakuResult({
        correctAnswers: 0,
        incorrectAnswers: 0,
        timeTaken: 0,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith('yaku', 'default', {
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
        saveYakuResult({
          correctAnswers: 10,
          incorrectAnswers: 2,
          timeTaken: 45,
        }),
      ).rejects.toThrow('network error');
    });
  });
});
