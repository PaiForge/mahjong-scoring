import { afterEach, describe, expect, it, vi } from "vitest";

import { PENDING_LESSON_COMPLETION_TTL_MS } from "@mahjong-scoring/features/lessons/pending-completions";

import {
  forgetPendingLessonCompletions,
  readPendingLessonCompletions,
  rememberPendingLessonCompletion,
} from "../pending-completions-storage";

const T0 = Date.UTC(2026, 9, 4, 12);

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("pending lesson completions in localStorage", () => {
  it("預けた時刻を完了時刻として残す", () => {
    rememberPendingLessonCompletion("mangan-ko-ron", undefined, T0);
    expect(readPendingLessonCompletions(T0)).toEqual([
      { slug: "mangan-ko-ron", completedAt: T0 },
    ]);
  });

  it("期限ちょうどまでは読み出し、過ぎたら落とす", () => {
    rememberPendingLessonCompletion("mangan-ko-ron", "user-1", T0);
    expect(
      readPendingLessonCompletions(T0 + PENDING_LESSON_COMPLETION_TTL_MS),
    ).toHaveLength(1);
    expect(
      readPendingLessonCompletions(T0 + PENDING_LESSON_COMPLETION_TTL_MS + 1),
    ).toEqual([]);
  });

  it("新しく預けるとき、期限切れの預かりは同じ時刻で落とす", () => {
    rememberPendingLessonCompletion("mangan-ko-ron", undefined, T0);
    const later = T0 + PENDING_LESSON_COMPLETION_TTL_MS + 1;
    rememberPendingLessonCompletion("mangan-ko-tsumo", undefined, later);
    expect(readPendingLessonCompletions(later)).toEqual([
      { slug: "mangan-ko-tsumo", completedAt: later },
    ]);
  });

  it("localStorage が使えないときは預かり無しとして扱い、預ける・外す操作も落ちない", () => {
    const denied = () => {
      throw new DOMException("access denied", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(denied);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(denied);

    expect(readPendingLessonCompletions(T0)).toEqual([]);
    expect(() => {
      rememberPendingLessonCompletion("mangan-ko-ron", undefined, T0);
    }).not.toThrow();
    expect(() => {
      forgetPendingLessonCompletions(["mangan-ko-ron"]);
    }).not.toThrow();
  });
});
