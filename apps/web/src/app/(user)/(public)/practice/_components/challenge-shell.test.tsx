import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

function renderShell(
  isPaused: boolean,
  reconnect?: { message: "connectionLost"; onPress: () => void },
) {
  return render(
    <ChallengeShell
      title="t"
      slug="jantou-fu"
      resultPath="/practice/jantou-fu/result"
      gameSession={gameSession({ isPaused, isPlaying: !isPaused })}
      timerControl={timerControl}
      reconnect={reconnect}
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

describe("ChallengeShell 再接続の案内", () => {
  it("案内を盤面の上に重ね、盤面と一時停止を押せなくし、押すと送り直しを続ける", () => {
    const onPress = vi.fn();
    renderShell(false, { message: "connectionLost", onPress });
    const board = screen.getByText("choice").parentElement;
    expect(board?.hasAttribute("inert")).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain(
      "recording.connectionLost",
    );
    expect(screen.getByRole("button", { name: "pause" })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(screen.getByText("recording.reconnect"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("案内が無ければ何も重ねない", () => {
    renderShell(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
