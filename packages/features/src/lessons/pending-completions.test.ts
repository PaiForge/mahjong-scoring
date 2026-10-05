import { describe, expect, it } from "vitest";

import {
  PENDING_LESSON_COMPLETION_TTL_MS,
  addPendingLessonCompletion,
  parsePendingLessonCompletions,
  removePendingLessonCompletions,
  selectSyncableLessonCompletions,
  serializePendingLessonCompletions,
  type PendingLessonCompletion,
} from "./pending-completions";

const NOW = 1_800_000_000_000;

describe("parsePendingLessonCompletions", () => {
  it("書き出した文字列をそのまま読み戻せる", () => {
    const entries: readonly PendingLessonCompletion[] = [
      { slug: "mangan-ko-ron", completedAt: NOW - 1000 },
    ];

    expect(
      parsePendingLessonCompletions(
        serializePendingLessonCompletions(entries),
        NOW,
      ),
    ).toEqual(entries);
  });

  it("持ち主付きの預かりは userId ごと読み戻し、無いものには付けない", () => {
    const raw = serializePendingLessonCompletions([
      { slug: "mangan-ko-ron", completedAt: NOW, userId: "u1" },
    ]);

    expect(parsePendingLessonCompletions(raw, NOW)).toEqual([
      { slug: "mangan-ko-ron", completedAt: NOW, userId: "u1" },
    ]);
    expect(
      parsePendingLessonCompletions(
        serializePendingLessonCompletions([
          { slug: "mangan-ko-ron", completedAt: NOW },
        ]),
        NOW,
      )[0],
    ).not.toHaveProperty("userId");
  });

  it("空・壊れた JSON・形の違う値は空として扱い、例外を投げない", () => {
    expect(parsePendingLessonCompletions(null, NOW)).toEqual([]);
    expect(parsePendingLessonCompletions(undefined, NOW)).toEqual([]);
    expect(parsePendingLessonCompletions("", NOW)).toEqual([]);
    expect(parsePendingLessonCompletions("{not json", NOW)).toEqual([]);
    expect(
      parsePendingLessonCompletions('{"version":2,"entries":[]}', NOW),
    ).toEqual([]);
    expect(
      parsePendingLessonCompletions(
        '{"version":1,"entries":[{"slug":"mangan-ko-ron"}]}',
        NOW,
      ),
    ).toEqual([]);
  });

  it("レジストリに無いスラッグと期限切れの預かりは捨てる", () => {
    const raw = serializePendingLessonCompletions([
      {
        slug: "mangan-ko-ron",
        completedAt: NOW - PENDING_LESSON_COMPLETION_TTL_MS,
      },
      {
        slug: "mangan-ko-ron",
        completedAt: NOW - PENDING_LESSON_COMPLETION_TTL_MS - 1,
      },
    ]);
    const withUnknown = raw.replace(
      '"entries":[',
      '"entries":[{"slug":"not-a-lesson","completedAt":' + String(NOW) + "},",
    );

    const parsed = parsePendingLessonCompletions(withUnknown, NOW);
    expect(parsed).toEqual([
      {
        slug: "mangan-ko-ron",
        completedAt: NOW - PENDING_LESSON_COMPLETION_TTL_MS,
      },
    ]);
  });
});

describe("addPendingLessonCompletion", () => {
  it("同じスラッグは新しい方で置き換え、1 件に畳む", () => {
    const entries = addPendingLessonCompletion(
      [{ slug: "mangan-ko-ron", completedAt: NOW - 5000 }],
      { slug: "mangan-ko-ron", completedAt: NOW, userId: "u1" },
    );

    expect(entries).toEqual([
      { slug: "mangan-ko-ron", completedAt: NOW, userId: "u1" },
    ]);
  });
});

describe("removePendingLessonCompletions", () => {
  it("指定したスラッグだけを取り除く", () => {
    const entries: readonly PendingLessonCompletion[] = [
      { slug: "mangan-ko-ron", completedAt: NOW },
    ];

    expect(removePendingLessonCompletions(entries, ["mangan-ko-ron"])).toEqual(
      [],
    );
    expect(removePendingLessonCompletions(entries, ["other"])).toEqual(entries);
  });
});

describe("selectSyncableLessonCompletions", () => {
  it("持ち主の無い預かりと本人の預かりだけを返し、別の人の預かりは返さない", () => {
    const guest: PendingLessonCompletion = {
      slug: "mangan-ko-ron",
      completedAt: NOW,
    };
    const mine: PendingLessonCompletion = { ...guest, userId: "u1" };
    const theirs: PendingLessonCompletion = { ...guest, userId: "u2" };

    expect(selectSyncableLessonCompletions([guest], "u1")).toEqual([guest]);
    expect(selectSyncableLessonCompletions([mine], "u1")).toEqual([mine]);
    expect(selectSyncableLessonCompletions([theirs], "u1")).toEqual([]);
  });
});
