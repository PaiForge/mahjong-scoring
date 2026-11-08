import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStoredRecordedResults } from "./use-stored-recorded-results";
import type { FinalResult } from "@mahjong-scoring/features/session/use-timed-session";

interface Row {
  readonly id: string;
}

const KEY = "test-results";

interface Props {
  readonly finalResult: FinalResult | undefined;
}

/** 終了前。renderHook の initialProps の型を Props に固定する */
const NOT_FINISHED: Props = { finalResult: undefined };

const FINISHED_AT = 1_700_000_000_000;

function finished(reason: FinalResult["reason"]): FinalResult {
  return {
    correctCount: 1,
    incorrectCount: 0,
    totalCount: 1,
    reason,
    finishedAt: FINISHED_AT,
  };
}

/** 保存された一覧。回 ID 付きの封筒に包まれている */
function saved(): readonly Row[] {
  const raw = sessionStorage.getItem(KEY);
  return raw === null
    ? []
    : (JSON.parse(raw) as { readonly results: Row[] }).results;
}

describe("useStoredRecordedResults", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("終了が確定するまで保存しない", () => {
    const { result } = renderHook(() =>
      useStoredRecordedResults<Row>(KEY, undefined),
    );
    act(() => {
      result.current.recordResult({ id: "a" });
    });
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("時間切れで終わると、出題中だった問題を回答なしのまま末尾に足して保存する", () => {
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) =>
        useStoredRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.recordResult({ id: "a" });
      result.current.presentQuestion({ id: "pending" });
    });

    rerender({ finalResult: finished("timeUp") });

    expect(saved()).toEqual([{ id: "a" }, { id: "pending" }]);
  });

  it("終了時刻を回 ID として一覧と一緒に保存する", () => {
    // 結果ページは URL の `?run=` と一致する回の一覧だけを読む
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) =>
        useStoredRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.recordResult({ id: "a" });
    });

    rerender({ finalResult: finished("mistakeLimit") });

    expect(JSON.parse(sessionStorage.getItem(KEY) ?? "")).toEqual({
      run: FINISHED_AT,
      results: [{ id: "a" }],
    });
  });

  it("ミス上限で終わると、出題中だった問題は保存しない", () => {
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) =>
        useStoredRecordedResults<Row>(KEY, finalResult),
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
      ({ finalResult }: Props) =>
        useStoredRecordedResults<Row>(KEY, finalResult),
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
        useStoredRecordedResults<Row>(undefined, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.presentQuestion({ id: "pending" });
    });

    rerender({ finalResult: finished("timeUp") });

    expect(sessionStorage.length).toBe(0);
  });

  it("sessionStorage に書けないとき（容量超過・プライベートモード）も終了を落とさない", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });
    const { result, rerender } = renderHook(
      ({ finalResult }: Props) =>
        useStoredRecordedResults<Row>(KEY, finalResult),
      { initialProps: NOT_FINISHED },
    );
    act(() => {
      result.current.recordResult({ id: "a" });
    });

    expect(() => {
      rerender({ finalResult: finished("mistakeLimit") });
    }).not.toThrow();
    expect(saved()).toEqual([]);
  });
});
