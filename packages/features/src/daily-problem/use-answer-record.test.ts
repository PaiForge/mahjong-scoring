// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";

import type { DailyAnswerDetail } from "./answer-detail";
import {
  useAnswerRecord,
  type DailyAnswerPending,
  type DailyAnswerSaveResult,
} from "./use-answer-record";

afterEach(cleanup);
const day = "2026-11-17";

/** 解答した瞬間に組み立てた詳細（ビルドは解答時のもの） */
const detail: DailyAnswerDetail = {
  v: 1,
  outcome: "answered",
  mode: {
    requireYaku: false,
    requireHanFu: false,
    exactHan: false,
    requireFuForMangan: false,
  },
  answer: { score: 8000, yaku: [] },
  client: {
    scoringVersion: 1,
    build: "answer-time-build",
    ruleSettings: DEFAULT_RULE_SETTINGS,
    scoreInput: "select",
    koTsumoInput: "split",
  },
};
const otherDetail: DailyAnswerDetail = {
  ...detail,
  answer: { score: 12000, yaku: [] },
  client: { ...detail.client, build: "later-build" },
};

function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getAllKeys: () => [...values.keys()],
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const send = vi
    .fn<(answer: DailyAnswerPending) => Promise<DailyAnswerSaveResult>>()
    .mockResolvedValue("saved");
  const options = { day, userId: "alice", storage, send, answered: false };
  return { values, options, send, key: `daily-problem-answer:alice:${day}` };
}

describe("daily answer recording", () => {
  it("retains the first answer across a failure and a remount", async () => {
    const { options, send, values } = fixture();
    send.mockResolvedValueOnce("failed");
    const first = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    act(() => first.result.current.record(false, detail));
    await waitFor(() => expect(first.result.current.status).toBe("failed"));
    act(() => first.result.current.record(true, otherDetail));
    expect(send).toHaveBeenCalledTimes(1);
    first.unmount();
    const second = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(second.result.current.status).toBe("saved"));
    // 再送は最初の解答の中身一式で、後の解答やビルドで作り直さない
    expect(send.mock.calls).toEqual([
      [{ isCorrect: false, detail }],
      [{ isCorrect: false, detail }],
    ]);
    expect(values.size).toBe(0);
  });
  it("retries the original answer only once while a request is pending", async () => {
    const { options, send } = fixture();
    let resolve!: (value: DailyAnswerSaveResult) => void;
    const request = {
      promise: new Promise<DailyAnswerSaveResult>((done) => {
        resolve = done;
      }),
    };
    send.mockReturnValue(request.promise);
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => {
      result.current.record(false, detail);
      void result.current.retry();
      result.current.record(true, otherDetail);
    });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await act(async () => resolve("saved"));
    expect(result.current.status).toBe("saved");
  });
  it("預かりには送る中身一式を残し、手動の再送でも同じ内容を送る", async () => {
    const { options, send, values, key } = fixture();
    send.mockResolvedValueOnce("failed");
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.record(true, detail));
    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(JSON.parse(values.get(key) ?? "null")).toEqual({
      day,
      isCorrect: true,
      detail,
    });
    await act(async () => result.current.retry());
    expect(result.current.status).toBe("saved");
    expect(send).toHaveBeenLastCalledWith({ isCorrect: true, detail });
    expect(values.size).toBe(0);
  });
  it("詳細を送らない版が預けた旧形式の解答は、詳細を付けずに送る", async () => {
    const { options, send, values, key } = fixture();
    values.set(key, JSON.stringify({ day, isCorrect: true }));
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(send.mock.calls).toEqual([[{ isCorrect: true }]]);
    expect(values.size).toBe(0);
  });
  it.each([
    ["知らない版の詳細", { v: 2 }],
    ["形の違う詳細", { ...detail, extra: true }],
    ["null の詳細", null],
  ])("%sを持つ預かりは送らずに捨てる", async (_name, stored) => {
    const { options, send, values, key } = fixture();
    values.set(key, JSON.stringify({ day, isCorrect: true, detail: stored }));
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(send).not.toHaveBeenCalled();
    expect(values.size).toBe(0);
    expect(result.current.status).toBe("idle");
  });
  it("詳細を組み立てられなかった解答は送らず、旧記録にも落とさない", async () => {
    const { options, send, values } = fixture();
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.record(true, undefined));
    expect(result.current.status).toBe("invalidDetail");
    act(() => result.current.record(true, detail));
    await act(async () => result.current.retry());
    expect(send).not.toHaveBeenCalled();
    expect(values.size).toBe(0);
  });
  it("does not send another account's or another day's pending answer", async () => {
    const { options, values, send } = fixture();
    values.set(
      `daily-problem-answer:bob:${day}`,
      JSON.stringify({ day, isCorrect: false, detail }),
    );
    values.set(
      "daily-problem-answer:alice:2026-11-16",
      JSON.stringify({ day: "2026-11-16", isCorrect: false, detail }),
    );
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(send).not.toHaveBeenCalled();
    expect(values.has(`daily-problem-answer:bob:${day}`)).toBe(true);
    expect(values.has("daily-problem-answer:alice:2026-11-16")).toBe(false);
  });
  it("解答済みの日は、端末に残った預かりを送らずに捨てる", async () => {
    const { options, values, send, key } = fixture();
    values.set(key, JSON.stringify({ day, isCorrect: false, detail }));
    const { result } = renderHook(() =>
      useAnswerRecord({ ...options, answered: true }),
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(send).not.toHaveBeenCalled();
    expect(values.size).toBe(0);
    expect(result.current.status).toBe("saved");
  });
  it.each(["staleDay", "anonymous", "blocked", "invalidDetail"] as const)(
    "discards terminal %s responses",
    async (outcome) => {
      const { options, values, send } = fixture();
      send.mockResolvedValue(outcome);
      const { result } = renderHook(() => useAnswerRecord(options));
      await waitFor(() => expect(result.current.ready).toBe(true));
      act(() => result.current.record(false, detail));
      await waitFor(() => expect(result.current.status).toBe(outcome));
      expect(values.size).toBe(0);
    },
  );
  it("can save when local storage is unavailable", async () => {
    const { options, send } = fixture();
    const storage = {
      getItem: () => {
        throw Error("disabled");
      },
      setItem: () => {
        throw Error("disabled");
      },
      removeItem: () => {
        throw Error("disabled");
      },
    };
    const { result } = renderHook(() =>
      useAnswerRecord({ ...options, storage }),
    );
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.record(false, detail));
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(send).toHaveBeenCalledWith({ isCorrect: false, detail });
  });
});
