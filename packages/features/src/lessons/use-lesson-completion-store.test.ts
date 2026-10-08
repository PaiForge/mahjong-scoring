// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createLessonCompletionStore } from "./use-lesson-completion-store";
import {
  createAsyncStorage,
  createMemoryStorage,
} from "../test/memory-storage";

describe("レッスン完了ストア", () => {
  it("完了を保存名 mahjong-lesson-completions に書き込む", () => {
    const { data, storage } = createMemoryStorage();
    const { useLessonCompletionStore } = createLessonCompletionStore({
      storage: () => storage,
    });

    act(() => useLessonCompletionStore.getState().markCompleted("jantou-fu"));

    const saved = JSON.parse(data.get("mahjong-lesson-completions") ?? "{}");
    expect(saved.state.completedSlugs).toEqual(["jantou-fu"]);
  });

  it("同じレッスンを 2 回完了にしても 1 件のまま", () => {
    const { storage } = createMemoryStorage();
    const { useLessonCompletionStore } = createLessonCompletionStore({
      storage: () => storage,
    });

    act(() => {
      useLessonCompletionStore.getState().markCompleted("yaku");
      useLessonCompletionStore.getState().markCompleted("yaku");
    });

    expect(useLessonCompletionStore.getState().completedSlugs).toEqual([
      "yaku",
    ]);
  });

  it("カリキュラムに無い slug は完了の集合に含めない", () => {
    const { storage } = createMemoryStorage({
      "mahjong-lesson-completions": JSON.stringify({
        state: { completedSlugs: ["jantou-fu", "removed-chapter"] },
        version: 0,
      }),
    });
    const { useCompletedLessonSlugs } = createLessonCompletionStore({
      storage: () => storage,
    });

    const { result } = renderHook(() => useCompletedLessonSlugs());
    expect([...result.current]).toEqual(["jantou-fu"]);
  });

  it("非同期の保存先でも読み込み後に完了が反映される", async () => {
    const { storage } = createAsyncStorage({
      "mahjong-lesson-completions": JSON.stringify({
        state: { completedSlugs: ["machi-fu"] },
        version: 0,
      }),
    });
    const { useLessonCompleted } = createLessonCompletionStore({
      storage: () => storage,
    });

    const { result } = renderHook(() => useLessonCompleted("machi-fu"));
    await waitFor(() => expect(result.current).toBe(true));
  });
});
