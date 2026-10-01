import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../_actions/begin-practice-question",
  async () => await import("@/test/begin-practice-question-mock"),
);

import { beginPracticeQuestion } from "@/test/begin-practice-question-mock";

import { usePracticeQuota } from "./use-practice-quota";

type Reply = Awaited<ReturnType<typeof beginPracticeQuestion>>;

const ALLOWED: Reply = {
  success: true,
  allowed: true,
  remaining: 2,
  limit: 3,
  signedIn: true,
  benefits: ["practice_tools"],
};

/** 外から resolve できる Promise */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("usePracticeQuota", () => {
  it("許可されたら生成し、gate は open になる", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));

    await act(async () => {
      await result.current.requestQuestion();
    });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(beginPracticeQuestion).toHaveBeenCalledWith("score");
    expect(result.current.gate).toEqual({
      kind: "open",
      remaining: 2,
      limit: 3,
      benefits: ["practice_tools"],
    });
    expect(result.current.isChecking).toBe(false);
  });

  it("上限到達なら生成せず、gate は blocked になる", async () => {
    beginPracticeQuestion.mockResolvedValue({
      ...ALLOWED,
      allowed: false,
      remaining: 0,
      signedIn: false,
      benefits: [],
    });
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));

    await act(async () => {
      await result.current.requestQuestion();
    });

    expect(generate).not.toHaveBeenCalled();
    expect(result.current.gate).toEqual({
      kind: "blocked",
      limit: 3,
      signedIn: false,
      benefits: [],
    });
  });

  it("レート制限は生成せず rateLimited", async () => {
    beginPracticeQuestion.mockResolvedValue({ error: "rateLimited" });
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));

    await act(async () => {
      await result.current.requestQuestion();
    });

    expect(generate).not.toHaveBeenCalled();
    expect(result.current.gate).toEqual({ kind: "rateLimited" });
  });

  it("通信が失敗したら生成する（fail-open）", async () => {
    beginPracticeQuestion.mockRejectedValue(new Error("offline"));
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));

    await act(async () => {
      await result.current.requestQuestion();
    });

    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.gate).toBeUndefined();
  });

  it("要求が重なったら後の返事だけを使う（先の返事で生成しない）", async () => {
    const first = deferred<Reply>();
    const second = deferred<Reply>();
    beginPracticeQuestion
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));

    let p1: Promise<void> = Promise.resolve();
    let p2: Promise<void> = Promise.resolve();
    act(() => {
      p1 = result.current.requestQuestion();
      p2 = result.current.requestQuestion();
    });
    expect(result.current.isChecking).toBe(true);

    await act(async () => {
      second.resolve({ ...ALLOWED, remaining: 1 });
      await p2;
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.isChecking).toBe(false);

    await act(async () => {
      first.resolve(ALLOWED);
      await p1;
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.gate).toEqual(
      expect.objectContaining({ kind: "open", remaining: 1 }),
    );
  });

  it("最新の generate を呼ぶ（差し替え後の関数）", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const oldGenerate = vi.fn();
    const newGenerate = vi.fn();
    const { result, rerender } = renderHook(
      ({ generate }) => usePracticeQuota("score", generate),
      { initialProps: { generate: oldGenerate } },
    );
    rerender({ generate: newGenerate });

    await act(async () => {
      await result.current.requestQuestion();
    });

    expect(oldGenerate).not.toHaveBeenCalled();
    expect(newGenerate).toHaveBeenCalledTimes(1);
  });
});
