import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimedSession } from "./use-timed-session";
import { useFinishRedirect } from "./use-finish-redirect";
import { useGameTimer } from "./use-game-timer";

/**
 * useFinishRedirect + useTimedSession の統合テスト
 * 終了時リダイレクトフック統合テスト
 *
 * 3ミス到達による強制ゲームオーバー、時間切れ、両方のパスで
 * `onFinish` コールバックが呼ばれ、結果ページへのリダイレクトが
 * `grant` クエリ付きで実行されることを検証する。
 */

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

interface SessionHookResult {
  session: ReturnType<typeof useTimedSession>;
  onFinish: ReturnType<typeof vi.fn>;
}

function useSession(
  onFinishImpl: (args: unknown) => Promise<{ grant?: string } | undefined>,
): SessionHookResult {
  const session = useTimedSession();
  const onFinish = vi.fn(onFinishImpl);
  useFinishRedirect({
    isFinished: session.gameSession.isFinished,
    finalResult: session.gameSession.finalResult,
    elapsedMs: 0,
    resultPath: "/practice/jantou-fu/result",
    onFinish,
  });
  return { session, onFinish };
}

function completeCountdown(countdownFrom = 3) {
  for (let i = 0; i < countdownFrom; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}

describe("useFinishRedirect integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("3ミス到達で終了したとき onFinish が呼ばれ grant 付き URL に push される", async () => {
    const onFinishImpl = vi
      .fn()
      .mockResolvedValue({ grant: "cr-gameover" });
    const { result } = renderHook(() => useSession(onFinishImpl));

    completeCountdown();

    // 3回連続で不正解 → mistakeLimit = 3 到達
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.session.gameSession.handleAnswer(false, () => undefined);
      });
      // feedbackDurationMs = 800
      act(() => {
        vi.advanceTimersByTime(800);
      });
    }

    // 保留中の Promise 解決を待つ
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.onFinish).toHaveBeenCalledTimes(1);
    expect(result.current.onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        correctCount: 0,
        incorrectCount: 3,
        totalCount: 3,
      }),
    );
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("grant=cr-gameover"),
    );
  });

  it("時間切れで終了したとき onFinish が呼ばれ grant 付き URL に push される", async () => {
    const onFinishImpl = vi
      .fn()
      .mockResolvedValue({ grant: "cr-timeout" });
    const { result } = renderHook(() => useSession(onFinishImpl));

    completeCountdown();

    // 時間切れを手動でトリガ
    act(() => {
      result.current.session.timerControl.onTimeLimitReached();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.onFinish).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("grant=cr-timeout"),
    );
  });

  /**
   * 実機に近い形で ChallengeShell 相当のセットアップを再現する:
   * - `useTimedSession` でゲーム状態を管理
   * - `useGameTimer` が 100ms ごとに `elapsedMs` を更新（`useFinishRedirect` の依存配列に影響）
   * - `useFinishRedirect` で結果ページへのリダイレクトを監視
   *
   * 3ミスパスで `savePracticeResult` 相当の非同期処理を挟んだうえで
   * `grant` 付き URL に push されることを検証する。
   */
  function useShellLike(
    onFinishImpl: (args: unknown) => Promise<{ grant?: string } | undefined>,
  ) {
    const session = useTimedSession();
    const onFinish = vi.fn(onFinishImpl);
    const { elapsedMs } = useGameTimer({
      timeLimit: session.gameSession.timeLimit,
      onTimeLimitReached: session.timerControl.onTimeLimitReached,
      isActive: session.timerControl.isActive,
    });
    useFinishRedirect({
      isFinished: session.gameSession.isFinished,
      finalResult: session.gameSession.finalResult,
      elapsedMs,
      resultPath: "/practice/jantou-fu/result",
      onFinish,
    });
    return { session, onFinish, elapsedMs };
  }

  it("ChallengeShell 相当（useGameTimer 経由）で 3ミスパスでも grant が付く", async () => {
    // 実機の savePracticeResult のように microtask を跨いだ後に grant を返す
    const onFinishImpl = vi.fn(async () => {
      // 2 段階の microtask（内部 await 相当）
      await Promise.resolve();
      await Promise.resolve();
      return { grant: "cr-shell-gameover" };
    });
    const { result } = renderHook(() => useShellLike(onFinishImpl));

    completeCountdown();

    // プレイ開始後、タイマーが 100ms 単位で elapsedMs を更新する状況を作る
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // 3回連続で不正解 → mistakeLimit = 3 到達
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.session.gameSession.handleAnswer(false, () => undefined);
      });
      // feedback 中も useGameTimer は動き続けるため時間を進める
      act(() => {
        vi.advanceTimersByTime(800);
      });
    }

    // onFinish 内部の await を十分に flush する
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(result.current.onFinish).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledTimes(1);
    const pushedUrl = pushMock.mock.calls[0]?.[0] as string;
    expect(pushedUrl).toContain("grant=cr-shell-gameover");
  });
});
