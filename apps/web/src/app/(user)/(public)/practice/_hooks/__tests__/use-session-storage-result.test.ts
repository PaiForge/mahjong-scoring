import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useSessionStorageResult } from "../use-session-storage-result";

const KEY = "test-results";

/** 生文字列をそのまま1要素の配列にするだけのパーサ */
const parse = (raw: string | undefined): readonly string[] =>
  raw === undefined ? [] : [raw];

afterEach(() => {
  sessionStorage.clear();
});

describe("useSessionStorageResult", () => {
  it("保存された値を読み取り、sessionStorage からは削除する", () => {
    sessionStorage.setItem(KEY, "stored");

    const { result } = renderHook(() => useSessionStorageResult(KEY, parse));

    expect(result.current).toEqual(["stored"]);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("値が無ければ空配列を返す", () => {
    const { result } = renderHook(() => useSessionStorageResult(KEY, parse));

    expect(result.current).toEqual([]);
  });

  it("効果が再実行されても読み取り済みの値を保つ", () => {
    // 破壊的読み取り（removeItem）のため、素朴な実装では2回目の効果が
    // 空の sessionStorage を読んで結果を消してしまう。React StrictMode の
    // 二重実行で実際に起き、結果ページの問題別一覧が表示されなくなった。
    sessionStorage.setItem(KEY, "stored");

    const { result, rerender } = renderHook(
      ({ p }: { p: typeof parse }) => useSessionStorageResult(KEY, p),
      { initialProps: { p: parse } },
    );

    expect(result.current).toEqual(["stored"]);

    // parse の参照を変えて効果を再実行させる
    rerender({ p: (raw: string | undefined) => parse(raw) });

    expect(result.current).toEqual(["stored"]);
  });

  it("キーが変われば新しいキーを読み直す", () => {
    sessionStorage.setItem("a", "value-a");
    sessionStorage.setItem("b", "value-b");

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useSessionStorageResult(key, parse),
      { initialProps: { key: "a" } },
    );

    expect(result.current).toEqual(["value-a"]);

    rerender({ key: "b" });

    expect(result.current).toEqual(["value-b"]);
  });
});
