import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { packStoredResults } from "../../_lib/challenge-run";
import { useSessionStorageResult } from "../use-session-storage-result";

const KEY = "test-results";
const RUN = 1_700_000_000_000;

/** デコード済みの配列の要素を文字列にするだけのパーサ */
const parse = (stored: unknown): readonly string[] =>
  Array.isArray(stored) ? stored.map(String) : [];

afterEach(() => {
  sessionStorage.clear();
});

describe("useSessionStorageResult", () => {
  it("回 ID が一致する保存を読み取り、sessionStorage には残す", () => {
    // ブラウザバックやリロードで再マウントしても同じ一覧を読めるように、
    // 読んだ後も消さない
    sessionStorage.setItem(KEY, packStoredResults(RUN, ["stored"]));

    const { result } = renderHook(() =>
      useSessionStorageResult(KEY, RUN, parse),
    );

    expect(result.current).toEqual(["stored"]);
    expect(sessionStorage.getItem(KEY)).not.toBeNull();
  });

  it("別の回の保存なら空配列を返す", () => {
    sessionStorage.setItem(KEY, packStoredResults(RUN, ["stored"]));

    const { result } = renderHook(() =>
      useSessionStorageResult(KEY, RUN + 1, parse),
    );

    expect(result.current).toEqual([]);
  });

  it("回 ID が分からなければ空配列を返す", () => {
    sessionStorage.setItem(KEY, packStoredResults(RUN, ["stored"]));

    const { result } = renderHook(() =>
      useSessionStorageResult(KEY, undefined, parse),
    );

    expect(result.current).toEqual([]);
  });

  it("値が無ければ空配列を返す", () => {
    const { result } = renderHook(() =>
      useSessionStorageResult(KEY, RUN, parse),
    );

    expect(result.current).toEqual([]);
  });

  it("キーが変われば新しいキーを読み直す", () => {
    sessionStorage.setItem("a", packStoredResults(RUN, ["value-a"]));
    sessionStorage.setItem("b", packStoredResults(RUN, ["value-b"]));

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useSessionStorageResult(key, RUN, parse),
      { initialProps: { key: "a" } },
    );

    expect(result.current).toEqual(["value-a"]);

    rerender({ key: "b" });

    expect(result.current).toEqual(["value-b"]);
  });
});
