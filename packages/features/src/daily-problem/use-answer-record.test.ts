// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useAnswerRecord,
  type DailyAnswerSaveResult,
} from "./use-answer-record";

afterEach(cleanup);
const day = "2026-11-17";
function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const send = vi
    .fn<(correct: boolean) => Promise<DailyAnswerSaveResult>>()
    .mockResolvedValue("saved");
  const options = { day, userId: "alice", storage, send, answered: false };
  return { values, options, send };
}

describe("daily answer recording", () => {
  it("retains the first answer across a failure and a remount", async () => {
    const { options, send, values } = fixture();
    send.mockResolvedValueOnce("failed");
    const first = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    act(() => first.result.current.record(false));
    await waitFor(() => expect(first.result.current.status).toBe("failed"));
    act(() => first.result.current.record(true));
    expect(send).toHaveBeenCalledTimes(1);
    first.unmount();
    const second = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(second.result.current.status).toBe("saved"));
    expect(send.mock.calls).toEqual([[false], [false]]);
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
      result.current.record(false);
      void result.current.retry();
      result.current.record(true);
    });
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    await act(async () => resolve("saved"));
    expect(result.current.status).toBe("saved");
  });
  it("does not send another account's or another day's pending answer", async () => {
    const { options, values, send } = fixture();
    values.set(
      `daily-problem-answer:bob:${day}`,
      JSON.stringify({ day, isCorrect: false }),
    );
    values.set(
      "daily-problem-answer:alice:2026-11-16",
      JSON.stringify({ day: "2026-11-16", isCorrect: false }),
    );
    const { result } = renderHook(() => useAnswerRecord(options));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["staleDay", "anonymous", "blocked"] as const)(
    "discards terminal %s responses",
    async (outcome) => {
      const { options, values, send } = fixture();
      send.mockResolvedValue(outcome);
      const { result } = renderHook(() => useAnswerRecord(options));
      await waitFor(() => expect(result.current.ready).toBe(true));
      act(() => result.current.record(false));
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
    act(() => result.current.record(false));
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(send).toHaveBeenCalledWith(false);
  });
});
