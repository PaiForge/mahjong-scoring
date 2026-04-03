import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockSavePracticeResult } = vi.hoisted(() => ({
  mockSavePracticeResult: vi.fn(),
}));

vi.mock('../../../_actions/save-practice-result', () => ({
  savePracticeResult: mockSavePracticeResult,
}));

import { saveJantouFuResult } from '../save-result';

describe('saveJantouFuResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('delegation to savePracticeResult', () => {
    it('calls savePracticeResult with menuType "jantou_fu" and leaderboardKey "default"', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveJantouFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith('jantou_fu', 'default', {
        score: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });
    });

    it('maps correctAnswers to score', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      await saveJantouFuResult({
        correctAnswers: 15,
        incorrectAnswers: 0,
        timeTaken: 30,
      });

      expect(mockSavePracticeResult).toHaveBeenCalledWith(
        'jantou_fu',
        'default',
        expect.objectContaining({ score: 15 }),
      );
    });
  });

  describe('return value passthrough', () => {
    it('returns success response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: true });

      const result = await saveJantouFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: true });
    });

    it('returns error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'auth_failed' });

      const result = await saveJantouFuResult({
        correctAnswers: 10,
        incorrectAnswers: 2,
        timeTaken: 45,
      });

      expect(result).toEqual({ success: false, error: 'auth_failed' });
    });

    it('returns unexpected_error response from savePracticeResult', async () => {
      mockSavePracticeResult.mockResolvedValue({ success: false, error: 'unexpected_error' });

      const result = await saveJantouFuResult({
        correctAnswers: 5,
        incorrectAnswers: 3,
        timeTaken: 60,
      });

      expect(result).toEqual({ success: false, error: 'unexpected_error' });
    });
  });
});
