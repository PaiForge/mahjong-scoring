import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRecordedResults } from "./use-recorded-results";
import type { FinalResult } from "./use-timed-session";

interface Row {
  readonly id: string;
}

const KEY = "test-results";

interface Props {
  readonly finalResult: FinalResult | undefined;
}

/** 終了前。renderHook の initialProps の型を Props に固定する */
const NOT_FINISHED: Props = { finalResult: undefined };

function finished(reason: FinalResult["reason"]): FinalResult {
  return { correctCount: 1, incorrectCount: 0, totalCount: 1, reason };
}

function saved(): readonly Row[] {
  const raw = sessionStorage.getItem(KEY);
  return raw === null ? [] : (JSON.parse(raw) as Row[]);
}

describe("useRecordedResults", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("終了が確定するまで保存しない", () => {
    const { result } = renderHook(() =>
      useRecordedResults<Row>(KEY, undefined),
    );
    act(() => {
      result.current.recordResult({ id: "a" });
    });
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("時間切れで終わると、出題中だった問題を回答なしのまま末尾に足して保存する", () => {
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) => useRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.recordResult({ id: "a" });
      result.current.presentQuestion({ id: "pending" });
    });

    rerender({ finalResult: finished("timeUp") });

    expect(saved()).toEqual([{ id: "a" }, { id: "pending" }]);
  });

  it("ミス上限で終わると、出題中だった問題は保存しない", () => {
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) => useRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.recordResult({ id: "a" });
      result.current.presentQuestion({ id: "pending" });
    });

    rerender({ finalResult: finished("mistakeLimit") });

    expect(saved()).toEqual([{ id: "a" }]);
  });

  it("答えた問題は届け出を上書きし、時間切れでも二重には載らない", () => {
    // 回答直後のフィードバック表示中に時間が来る場合
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) => useRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.presentQuestion({ id: "q1" });
      result.current.recordResult({ id: "q1-answered" });
    });

    rerender({ finalResult: finished("timeUp") });

    expect(saved()).toEqual([{ id: "q1-answered" }]);
  });

  it("保存先が無い練習では時間切れでも何も保存しない", () => {
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) =>
        useRecordedResults<Row>(undefined, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.presentQuestion({ id: "pending" });
    });

    rerender({ finalResult: finished("timeUp") });

    expect(sessionStorage.length).toBe(0);
  });
});
