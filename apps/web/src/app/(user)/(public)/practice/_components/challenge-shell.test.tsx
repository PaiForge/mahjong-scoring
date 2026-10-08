import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  GameSessionState,
  TimerControl,
} from "@mahjong-scoring/features/session/use-timed-session";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);

import { ChallengeShell } from "./challenge-shell";

function gameSession(overrides: Partial<GameSessionState>): GameSessionState {
  return {
    isCountingDown: false,
    countdownValue: 0,
    isPlaying: true,
    isFinished: false,
    isPaused: false,
    correctCount: 0,
    incorrectCount: 0,
    totalCount: 0,
    remainingLives: 3,
    showFeedback: false,
    lastAnswerCorrect: undefined,
    handleAnswer: vi.fn(),
    togglePause: vi.fn(),
    mistakeLimit: 3,
    timeLimit: 60,
    finalResult: undefined,
    ...overrides,
  };
}

const timerControl: TimerControl = {
  isActive: false,
  onTimeLimitReached: vi.fn(),
  registerTimerReset: vi.fn(),
  reset: vi.fn(),
};

function renderShell(isPaused: boolean) {
  return render(
    <ChallengeShell
      title="t"
      slug="jantou-fu"
      resultPath="/practice/jantou-fu/result"
      gameSession={gameSession({ isPaused, isPlaying: !isPaused })}
      timerControl={timerControl}
    >
      <button type="button">choice</button>
    </ChallengeShell>,
  );
}

describe("ChallengeShell 一時停止", () => {
  it("一時停止中は盤面を inert にして、幕の下の選択肢を押せなくする", () => {
    renderShell(true);
    const board = screen.getByText("choice").parentElement;
    expect(board?.hasAttribute("inert")).toBe(true);
  });

  it("プレイ中は盤面を inert にしない", () => {
    renderShell(false);
    const board = screen.getByText("choice").parentElement;
    expect(board?.hasAttribute("inert")).toBe(false);
  });
});
