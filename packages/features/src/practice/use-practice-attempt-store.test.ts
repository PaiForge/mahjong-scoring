// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";

import { createPracticeAttemptStore } from "./use-practice-attempt-store";

/** 同期で読み書きする保存先 */
function createMemoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value);
    },
    removeItem: (name) => {
      data.delete(name);
    },
  };
  return { data, storage };
}

describe("練習挑戦ストア", () => {
  it("挑戦を保存名 mahjong-practice-attempts に書き込む", () => {
    const { data, storage } = createMemoryStorage();
    const { usePracticeAttemptStore } = createPracticeAttemptStore({
      storage: () => storage,
    });

    act(() =>
      usePracticeAttemptStore.getState().markAttempted("jantou-fu", "default"),
    );

    const saved = JSON.parse(data.get("mahjong-practice-attempts") ?? "{}");
    expect(saved.state.attempts).toEqual([
      { slug: "jantou-fu", variant: "default" },
    ]);
  });

  it("同じ土俵に 2 回挑戦しても 1 件のまま", () => {
    const { storage } = createMemoryStorage();
    const { usePracticeAttemptStore } = createPracticeAttemptStore({
      storage: () => storage,
    });

    act(() => {
      usePracticeAttemptStore.getState().markAttempted("mentsu-fu", "default");
      usePracticeAttemptStore.getState().markAttempted("mentsu-fu", "default");
    });

    expect(usePracticeAttemptStore.getState().attempts).toHaveLength(1);
  });

  it("今のレジストリに無い練習・バリアントは返さない", () => {
    const { storage } = createMemoryStorage({
      "mahjong-practice-attempts": JSON.stringify({
        state: {
          attempts: [
            { slug: "jantou-fu", variant: "default" },
            { slug: "removed-practice", variant: "default" },
            { slug: "jantou-fu", variant: "removed-variant" },
          ],
        },
        version: 0,
      }),
    });
    const { useAttemptedPractices } = createPracticeAttemptStore({
      storage: () => storage,
    });

    const { result } = renderHook(() => useAttemptedPractices());

    expect(result.current).toEqual([{ slug: "jantou-fu", variant: "default" }]);
  });
});
