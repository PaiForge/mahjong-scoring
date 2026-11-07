import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSaveOnFinish } from "./use-save-on-finish";
import type { FinishCallbackArgs } from "./use-finish-redirect";

vi.mock(
  "../_actions/save-practice-result",
  async () => await import("@/test/save-practice-result-mock"),
);

vi.mock("./use-verified-challenge", () => ({
  useVerifiedChallenge: () => ({ id: "attempt-id", settled: async () => {} }),
}));

async function importMockedAction() {
  const mod = await import("../_actions/save-practice-result");
  return mod.savePracticeResult as ReturnType<typeof vi.fn>;
}

function makeArgs(
  overrides: Partial<FinishCallbackArgs> = {},
): FinishCallbackArgs {
  return {
    correctCount: 5,
    incorrectCount: 2,
    totalCount: 7,
    elapsedMs: 30000,
    variant: "default",
    ...overrides,
  };
}

describe("useSaveOnFinish", () => {
  let mockedSave: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockedSave = await importMockedAction();
    mockedSave.mockReset();
    mockedSave.mockResolvedValue({ success: true, challengeResultId: "cr-1" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    // 送り直しの待ち時間（500ms → 1s → 2s）を実時間で待たない
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // 次のテストの spyOn が同じスパイを返し、呼び出しの記録を引き継ぐのを防ぐ
    vi.mocked(console.error).mockRestore();
  });

  /** 送り直しの待ち時間をすべて進めて終了時の処理の結果を得る */
  async function finishWithRetries(
    run: () => Promise<{ grant?: string } | undefined>,
  ) {
    const promise = run();
    await vi.runAllTimersAsync();
    return promise;
  }

  it("申告スコアやvariantを渡さず挑戦IDだけを送る", async () => {
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    await result.current(makeArgs({ correctCount: 1000, variant: "forged" }));
    expect(mockedSave).toHaveBeenCalledWith("attempt-id");
  });

  it("totalCount === 0 の場合 savePracticeResult が呼ばれない", async () => {
    const { result } = renderHook(() => useSaveOnFinish("machi_fu"));
    await result.current(makeArgs({ totalCount: 0 }));

    expect(mockedSave).not.toHaveBeenCalled();
  });

  it("認証済みユーザーの成功時に { grant: challengeResultId } を返す", async () => {
    mockedSave.mockResolvedValue({
      success: true,
      challengeResultId: "cr-xyz",
    });
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    const ret = await result.current(makeArgs());

    expect(mockedSave).toHaveBeenCalled();
    expect(ret).toEqual({ grant: "cr-xyz" });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("匿名ユーザー（skipped='anonymous'）はサイレント no-op、console.error を出さない", async () => {
    mockedSave.mockResolvedValue({ success: true, skipped: "anonymous" });
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));
    const ret = await result.current(makeArgs());

    // Server Action は呼ぶ（サーバー側が単一の認証ソース）
    expect(mockedSave).toHaveBeenCalledTimes(1);
    // ただし grant は返さない → URL に grant=… が付かない → EXP カードは表示されない
    expect(ret).toBeUndefined();
    // ログノイズなし
    expect(console.error).not.toHaveBeenCalled();
  });

  it("一時的な失敗は間を空けて送り直し、通ったら grant を返す", async () => {
    mockedSave
      .mockResolvedValueOnce({ error: "rateLimited" })
      .mockResolvedValueOnce({ error: "unexpectedError" })
      .mockResolvedValueOnce({ error: "authUnavailable" })
      .mockResolvedValueOnce({ success: true, challengeResultId: "cr-retry" });
    const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));

    const ret = await finishWithRetries(() => result.current(makeArgs()));

    expect(ret).toEqual({ grant: "cr-retry" });
    expect(mockedSave).toHaveBeenCalledTimes(4);
    // 同じ挑戦 ID を送り直す
    expect(mockedSave.mock.calls.every(([id]) => id === "attempt-id")).toBe(
      true,
    );
    // 通ったのでログは出さない
    expect(console.error).not.toHaveBeenCalled();
  });

  it("送り直しても通らなければ undefined を返し、最後の失敗を console.error にログする", async () => {
    mockedSave.mockResolvedValue({ error: "unexpectedError" });
    const { result } = renderHook(() => useSaveOnFinish("mentsu_jantou_fu"));

    const ret = await finishWithRetries(() => result.current(makeArgs()));

    expect(ret).toBeUndefined();
    // 初回 + 送り直し 3 回
    expect(mockedSave).toHaveBeenCalledTimes(4);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] mentsu_jantou_fu:",
      "unexpectedError",
    );
  });

  it.each(["banned", "invalidResult"] as const)(
    "サーバーが答えを出した失敗（%s）は送り直さない",
    async (error) => {
      mockedSave.mockResolvedValue({ error });
      const { result } = renderHook(() => useSaveOnFinish("jantou_fu"));

      const ret = await finishWithRetries(() => result.current(makeArgs()));

      expect(ret).toBeUndefined();
      expect(mockedSave).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "[savePracticeResult] jantou_fu:",
        error,
      );
    },
  );

  it("action が reject した場合も送り直し、尽きたらクラッシュせず console.error にログする", async () => {
    const networkError = new Error("network error");
    mockedSave.mockRejectedValue(networkError);
    const { result } = renderHook(() => useSaveOnFinish("yaku"));

    const ret = await finishWithRetries(() => result.current(makeArgs()));

    expect(ret).toBeUndefined();
    expect(mockedSave).toHaveBeenCalledTimes(4);
    // logExternalError は unknown をメッセージ文字列に正規化してから出力する
    expect(console.error).toHaveBeenCalledWith(
      "[savePracticeResult] yaku:",
      networkError.message,
    );
  });

  it("reject の後に通れば grant を返す", async () => {
    mockedSave
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ success: true, challengeResultId: "cr-2" });
    const { result } = renderHook(() => useSaveOnFinish("yaku"));

    const ret = await finishWithRetries(() => result.current(makeArgs()));

    expect(ret).toEqual({ grant: "cr-2" });
    expect(console.error).not.toHaveBeenCalled();
  });
});
