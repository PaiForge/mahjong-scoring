import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "../_actions/begin-practice-question",
  async () => await import("@/test/begin-practice-question-mock"),
);

import {
  beginPracticeQuestion,
  peekPracticeQuota,
} from "@/test/begin-practice-question-mock";

import {
  _resetPracticeQuota,
  canResumePractice,
  usePracticeQuota,
} from "./use-practice-quota";

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
  _resetPracticeQuota();
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
    expect(result.current.gate).toEqual({ kind: "unverified" });
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

it("Pro の成功応答の後でも通信失敗時は特典を引き継がない", async () => {
  const generate = vi.fn();
  const { result } = renderHook(() => usePracticeQuota("score", generate));
  beginPracticeQuestion.mockResolvedValueOnce(ALLOWED);
  await act(async () => {
    await result.current.requestQuestion();
  });
  beginPracticeQuestion.mockRejectedValueOnce(new Error("offline"));
  await act(async () => {
    await result.current.requestQuestion();
  });
  expect(generate).toHaveBeenCalledTimes(2);
  expect(result.current.gate).toEqual({ kind: "unverified" });
});
it("出題関数自身の例外を通信失敗として再実行しない", async () => {
  const generate = vi.fn(() => {
    throw new Error("generation failed");
  });
  beginPracticeQuestion.mockResolvedValueOnce(ALLOWED);
  const { result } = renderHook(() => usePracticeQuota("score", generate));
  await act(async () => {
    await expect(result.current.requestQuestion()).rejects.toThrow(
      "generation failed",
    );
  });
  expect(generate).toHaveBeenCalledTimes(1);
  expect(result.current.isChecking).toBe(false);
});
it("古い通信失敗は新しい特典判定を消さない", async () => {
  let reject!: (error: Error) => void;
  beginPracticeQuestion.mockReturnValueOnce(
    new Promise((_resolve, rejectPromise) => {
      reject = rejectPromise;
    }),
  );
  const generate = vi.fn();
  const { result } = renderHook(() => usePracticeQuota("score", generate));
  let first: Promise<void>;
  act(() => {
    first = result.current.requestQuestion();
  });
  beginPracticeQuestion.mockResolvedValueOnce(ALLOWED);
  await act(async () => {
    await result.current.requestQuestion();
  });
  await act(async () => {
    reject(new Error("stale"));
    await first;
  });
  expect(result.current.gate).toMatchObject({
    kind: "open",
    benefits: ["practice_tools"],
  });
  expect(generate).toHaveBeenCalledTimes(1);
});

describe("盤面を離れて戻る", () => {
  it("再マウントしても直前の gate を引き継ぐ", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const first = renderHook(() => usePracticeQuota("score", vi.fn()));
    await act(async () => {
      await first.result.current.requestQuestion();
    });
    first.unmount();

    const second = renderHook(() => usePracticeQuota("score", vi.fn()));
    expect(second.result.current.gate).toEqual(
      expect.objectContaining({ kind: "open", remaining: 2 }),
    );
    expect(second.result.current.isChecking).toBe(false);
  });

  it("練習ごとに別の gate を持つ", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const score = renderHook(() => usePracticeQuota("score", vi.fn()));
    await act(async () => {
      await score.result.current.requestQuestion();
    });
    const machi = renderHook(() => usePracticeQuota("tenpai-score", vi.fn()));
    expect(machi.result.current.gate).toBeUndefined();
  });

  it("アンマウント後に届いた返事でも生成し、gate に残す（戻ったときに問題がある）", async () => {
    const reply = deferred<Reply>();
    beginPracticeQuestion.mockReturnValueOnce(reply.promise);
    const generate = vi.fn();
    const { result, unmount } = renderHook(() =>
      usePracticeQuota("score", generate),
    );
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.requestQuestion();
    });
    unmount();
    expect(
      canResumePractice("score", {
        hasQuestion: false,
        generationFailed: false,
      }),
    ).toBe(true);

    await act(async () => {
      reply.resolve(ALLOWED);
      await pending;
    });
    expect(generate).toHaveBeenCalledTimes(1);

    const again = renderHook(() => usePracticeQuota("score", vi.fn()));
    expect(again.result.current.gate).toEqual(
      expect.objectContaining({ kind: "open", remaining: 2 }),
    );
    expect(again.result.current.isChecking).toBe(false);
  });

  it("戻った盤面が先に聞き直したら、古い返事では生成しない", async () => {
    const stale = deferred<Reply>();
    beginPracticeQuestion
      .mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce({ ...ALLOWED, remaining: 1 });
    const oldGenerate = vi.fn();
    const first = renderHook(() => usePracticeQuota("score", oldGenerate));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = first.result.current.requestQuestion();
    });
    first.unmount();

    const newGenerate = vi.fn();
    const second = renderHook(() => usePracticeQuota("score", newGenerate));
    await act(async () => {
      await second.result.current.requestQuestion();
    });
    await act(async () => {
      stale.resolve(ALLOWED);
      await pending;
    });

    expect(oldGenerate).not.toHaveBeenCalled();
    expect(newGenerate).toHaveBeenCalledTimes(1);
    expect(second.result.current.gate).toEqual(
      expect.objectContaining({ remaining: 1 }),
    );
  });
});

describe("canResumePractice", () => {
  const practice = { hasQuestion: true, generationFailed: false };

  it("許可された問題が残っていれば続けてよい（unverified も同じ）", async () => {
    const { result } = renderHook(() => usePracticeQuota("score", vi.fn()));
    beginPracticeQuestion.mockResolvedValueOnce(ALLOWED);
    await act(async () => {
      await result.current.requestQuestion();
    });
    expect(canResumePractice("score", practice)).toBe(true);

    beginPracticeQuestion.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await result.current.requestQuestion();
    });
    expect(canResumePractice("score", practice)).toBe(true);
  });

  it("生成に失敗した結果が残っているときも、聞き直さずその表示を続ける", async () => {
    const { result } = renderHook(() => usePracticeQuota("score", vi.fn()));
    beginPracticeQuestion.mockResolvedValueOnce(ALLOWED);
    await act(async () => {
      await result.current.requestQuestion();
    });
    expect(
      canResumePractice("score", {
        hasQuestion: false,
        generationFailed: true,
      }),
    ).toBe(true);
  });

  it("まだ一度も聞いていない・問題が無いなら続けない", () => {
    expect(canResumePractice("score", practice)).toBe(false);
    expect(
      canResumePractice("score", {
        hasQuestion: false,
        generationFailed: false,
      }),
    ).toBe(false);
  });

  it("上限・レート制限で止まっていたら聞き直す（ログインして戻る経路）", async () => {
    const { result } = renderHook(() => usePracticeQuota("score", vi.fn()));
    beginPracticeQuestion.mockResolvedValueOnce({ ...ALLOWED, allowed: false });
    await act(async () => {
      await result.current.requestQuestion();
    });
    expect(canResumePractice("score", practice)).toBe(false);

    beginPracticeQuestion.mockResolvedValueOnce({ error: "rateLimited" });
    await act(async () => {
      await result.current.requestQuestion();
    });
    expect(canResumePractice("score", practice)).toBe(false);
  });
});

describe("refreshGate", () => {
  it("消費せずに残数と特典を取り直し、残り 0 でも open のまま", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const generate = vi.fn();
    const { result } = renderHook(() => usePracticeQuota("score", generate));
    await act(async () => {
      await result.current.requestQuestion();
    });
    peekPracticeQuota.mockResolvedValueOnce({
      ...ALLOWED,
      allowed: false,
      remaining: 0,
      benefits: [],
    });

    await act(async () => {
      await result.current.refreshGate();
    });

    expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.gate).toEqual({
      kind: "open",
      remaining: 0,
      limit: 3,
      benefits: [],
    });
  });

  it("失敗・レート制限のときは今の gate を保つ", async () => {
    beginPracticeQuestion.mockResolvedValue(ALLOWED);
    const { result } = renderHook(() => usePracticeQuota("score", vi.fn()));
    await act(async () => {
      await result.current.requestQuestion();
    });

    peekPracticeQuota.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await result.current.refreshGate();
    });
    expect(result.current.gate).toEqual(
      expect.objectContaining({ kind: "open", remaining: 2 }),
    );

    peekPracticeQuota.mockResolvedValueOnce({ error: "rateLimited" });
    await act(async () => {
      await result.current.refreshGate();
    });
    expect(result.current.gate).toEqual(
      expect.objectContaining({ kind: "open", remaining: 2 }),
    );
  });

  it("取り直している間に新しい出題が始まったら、その返事を上書きしない", async () => {
    beginPracticeQuestion.mockResolvedValue({ ...ALLOWED, remaining: 1 });
    const peek = deferred<Reply>();
    peekPracticeQuota.mockReturnValueOnce(peek.promise);
    const { result } = renderHook(() => usePracticeQuota("score", vi.fn()));

    let refreshing: Promise<void> = Promise.resolve();
    act(() => {
      refreshing = result.current.refreshGate();
    });
    await act(async () => {
      await result.current.requestQuestion();
    });
    await act(async () => {
      peek.resolve({ ...ALLOWED, remaining: 2 });
      await refreshing;
    });

    expect(result.current.gate).toEqual(
      expect.objectContaining({ remaining: 1 }),
    );
  });
});
