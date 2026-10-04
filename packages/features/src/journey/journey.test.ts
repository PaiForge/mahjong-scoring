import { describe, expect, it } from "vitest";

import { LESSON_REGISTRY, lessonForChapter } from "../lessons/registry";
import { DEFAULT_VARIANT } from "../practice-menu-types";
import { RANK_REGISTRY, RANK_SLUGS, type RankSlug } from "../ranks/registry";
import {
  buildJourney,
  buildJourneyPath,
  countProgress,
  currentStage,
  stepAfterLesson,
  stepAfterLessonWithProgress,
  type BuildJourneyInput,
  type PracticeAttempt,
} from "./journey";

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];
const NO_RANKS: readonly RankSlug[] = [];

function input(overrides: Partial<BuildJourneyInput> = {}): BuildJourneyInput {
  return {
    readSlugs: NONE,
    completedLessonSlugs: NONE,
    attemptedPractices: NO_ATTEMPTS,
    achievedRankSlugs: NO_RANKS,
    ...overrides,
  };
}

/** 5級の前提章をすべてレッスンで学んだ状態（5級の章はすべてレッスンを持つ） */
const KYU5_LESSONS_DONE: ReadonlySet<string> = new Set(
  RANK_REGISTRY[0].learnChapterSlugs.flatMap((chapterSlug) => {
    const lesson = lessonForChapter(chapterSlug);
    return lesson === undefined ? [] : [lesson.slug];
  }),
);

/** 5級の章から送っている練習に、章が指す土俵ですべて挑戦した状態 */
const KYU5_PRACTICES_ATTEMPTED: readonly PracticeAttempt[] = [
  { slug: "score-table", variant: "ko_mangan_plus" },
  { slug: "score-table", variant: "oya_mangan_plus" },
  { slug: "mangan-score-calculation", variant: DEFAULT_VARIANT },
  { slug: "yaku-han", variant: "no_kuisagari" },
  { slug: "yaku", variant: DEFAULT_VARIANT },
  { slug: "han-count", variant: DEFAULT_VARIANT },
];

describe("buildJourney", () => {
  it("全段級位を level 昇順で並べ、取得状態を付ける", () => {
    const journey = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));

    expect(journey.ranks.map((entry) => entry.rank.slug)).toEqual(RANK_SLUGS);
    expect(journey.ranks.map((entry) => entry.status)).toEqual([
      "achieved",
      "next",
      "unachieved",
      "unachieved",
      "unachieved",
      "unachieved",
    ]);
    expect(journey.current?.rank.slug).toBe("kyu-4");
  });

  it("何も始めていなければ isFresh で、次の一歩は最初の章のレッスン", () => {
    const journey = buildJourney(input());

    expect(journey.isFresh).toBe(true);
    expect(journey.current?.rank.slug).toBe("kyu-5");
    expect(journey.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-ron",
      chapterSlug: "mangan-ko-ron",
    });
  });

  it("挑戦の記録が 1 つでもあれば isFresh ではない", () => {
    const journey = buildJourney(
      input({
        attemptedPractices: [{ slug: "jantou-fu", variant: DEFAULT_VARIANT }],
      }),
    );

    expect(journey.isFresh).toBe(false);
  });

  it("レッスンを終えると、その章は学んだことになり、次は次の章のレッスン", () => {
    const journey = buildJourney(
      input({ completedLessonSlugs: new Set(["mangan-ko-ron"]) }),
    );

    expect(journey.isFresh).toBe(false);
    expect(journey.current?.chapters[0]).toEqual({
      kind: "chapter",
      chapterSlug: "mangan-ko-ron",
      lessonSlug: "mangan-ko-ron",
      done: true,
    });
    expect(journey.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-tsumo",
      chapterSlug: "mangan-ko-tsumo",
    });
  });

  it("レッスンのある章は、読了だけでは済みにならない（学んだ印はレッスンの完了だけ）", () => {
    const journey = buildJourney(
      input({ readSlugs: new Set(RANK_REGISTRY[0].learnChapterSlugs) }),
    );

    expect(countProgress(journey.current?.chapters ?? [])).toEqual({
      done: 0,
      total: 5,
    });
    expect(journey.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-ron",
      chapterSlug: "mangan-ko-ron",
    });
  });

  it("次の級の最初の章はレッスンで学び、読了では済みにならない", () => {
    const unread = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));
    expect(unread.current?.chapters[0]).toEqual({
      kind: "chapter",
      chapterSlug: "jantou-fu",
      lessonSlug: "jantou-fu",
      done: false,
    });
    expect(unread.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "jantou-fu",
      chapterSlug: "jantou-fu",
    });

    const read = buildJourney(
      input({
        achievedRankSlugs: ["kyu-5"],
        readSlugs: new Set(["jantou-fu"]),
      }),
    );
    expect(read.current?.chapters[0].done).toBe(false);
  });

  describe("学ぶと練習するを章の順に交互に案内する", () => {
    it("子のロン・ツモを学び終えたら、残りの章より先に子・満貫以上の練習へ送る", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
        }),
      );

      expect(journey.nextStep).toEqual({
        kind: "practice",
        slug: "score-table",
        variant: "ko_mangan_plus",
      });
    });

    it("子・満貫以上に挑戦したら、次は親のロンの章", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
          attemptedPractices: [
            { slug: "score-table", variant: "ko_mangan_plus" },
          ],
        }),
      );

      expect(journey.nextStep).toEqual({
        kind: "lesson",
        lessonSlug: "mangan-oya-ron",
        chapterSlug: "mangan-oya-ron",
      });
    });

    it("親のロン・ツモを学び終えたら、その章から送る練習（親・満貫以上 → 満貫以上点数計算）へ順に送る", () => {
      const learned = {
        completedLessonSlugs: new Set([
          "mangan-ko-ron",
          "mangan-ko-tsumo",
          "mangan-oya-ron",
          "mangan-oya-tsumo",
        ]),
      };

      expect(
        buildJourney(
          input({
            ...learned,
            attemptedPractices: [
              { slug: "score-table", variant: "ko_mangan_plus" },
            ],
          }),
        ).nextStep,
      ).toEqual({
        kind: "practice",
        slug: "score-table",
        variant: "oya_mangan_plus",
      });

      expect(
        buildJourney(
          input({
            ...learned,
            attemptedPractices: [
              { slug: "score-table", variant: "ko_mangan_plus" },
              { slug: "score-table", variant: "oya_mangan_plus" },
            ],
          }),
        ).nextStep,
      ).toEqual({
        kind: "practice",
        slug: "mangan-score-calculation",
        variant: undefined,
      });
    });

    it("先取りで後の章を学んでも、未了の章が先にあればそちらを案内し、後の章の練習へは送らない", () => {
      const journey = buildJourney(
        input({ completedLessonSlugs: new Set(["yaku"]) }),
      );

      expect(journey.nextStep).toEqual({
        kind: "lesson",
        lessonSlug: "mangan-ko-ron",
        chapterSlug: "mangan-ko-ron",
      });
    });

    it("先に済ませた練習は飛ばして、次の未了（章でも練習でも）を指す", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
          attemptedPractices: [],
        }),
      );
      expect(journey.nextStep?.kind).toBe("practice");

      const skippedAhead = buildJourney(
        input({
          completedLessonSlugs: new Set([
            "mangan-ko-ron",
            "mangan-ko-tsumo",
            "mangan-oya-ron",
          ]),
        }),
      );
      // 練習を飛ばして章を学び進めていても、最初の未了（子・満貫以上）に戻す
      expect(skippedAhead.nextStep).toEqual({
        kind: "practice",
        slug: "score-table",
        variant: "ko_mangan_plus",
      });
    });

    it("途中から再開しても、行程の最初の未了を指す", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: KYU5_PRACTICES_ATTEMPTED.slice(0, 3),
        }),
      );

      expect(journey.nextStep).toEqual({
        kind: "practice",
        slug: "yaku-han",
        variant: undefined,
      });
    });

    it("学ぶ・練習するが済むと、次は昇級試験", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: KYU5_PRACTICES_ATTEMPTED,
        }),
      );

      expect(journey.nextStep).toEqual({ kind: "exam", slug: "mangan-exam" });
      expect(journey.current?.exam.done).toBe(false);
    });
  });

  describe("練習の進捗は土俵（slug × バリアント）ごと", () => {
    it("章から送る練習は土俵ごとに別の項目になる（子・満貫以上と親・満貫以上）", () => {
      const journey = buildJourney(
        input({ completedLessonSlugs: KYU5_LESSONS_DONE }),
      );

      expect(
        journey.current?.practices.map((item) => [item.slug, item.variant]),
      ).toEqual([
        ["score-table", "ko_mangan_plus"],
        ["score-table", "oya_mangan_plus"],
        ["mangan-score-calculation", undefined],
        ["yaku-han", undefined],
        ["yaku", undefined],
        ["han-count", undefined],
      ]);
    });

    it("子・満貫以上に挑戦しても、親・満貫以上は済みにならない", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: [
            { slug: "score-table", variant: "ko_mangan_plus" },
          ],
        }),
      );

      expect(
        journey.current?.practices
          .filter((item) => item.slug === "score-table")
          .map((item) => item.done),
      ).toEqual([true, false]);
      expect(journey.nextStep).toEqual({
        kind: "practice",
        slug: "score-table",
        variant: "oya_mangan_plus",
      });
    });

    it("満貫未満の挑戦だけでは、満貫以上の練習は済みにならない", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: [
            { slug: "score-table", variant: "ko_non_mangan" },
            { slug: "score-table", variant: "all" },
          ],
        }),
      );

      expect(
        journey.current?.practices
          .filter((item) => item.slug === "score-table")
          .every((item) => !item.done),
      ).toBe(true);
      expect(journey.nextStep).toEqual({
        kind: "practice",
        slug: "score-table",
        variant: "ko_mangan_plus",
      });
    });

    it("バリアントを指定しないリンクは、その練習のどの土俵に挑戦していても済み", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: [
            // 設定を持つ練習（役の翻数）の既定でない土俵
            { slug: "yaku-han", variant: "kuisagari" },
            // 設定を持たない練習は DEFAULT_VARIANT
            { slug: "yaku", variant: DEFAULT_VARIANT },
          ],
        }),
      );

      const done = new Map(
        journey.current?.practices.map((item) => [item.slug, item.done]),
      );
      expect(done.get("yaku-han")).toBe(true);
      expect(done.get("yaku")).toBe(true);
      expect(done.get("han-count")).toBe(false);
    });

    it("レジストリに無い古いキーの記録は、バリアントを指定しないリンクだけを済みにする", () => {
      const journey = buildJourney(
        input({
          completedLessonSlugs: KYU5_LESSONS_DONE,
          attemptedPractices: [
            { slug: "score-table", variant: "default" },
            { slug: "yaku-han", variant: "default" },
          ],
        }),
      );

      const practices = journey.current?.practices ?? [];
      expect(
        practices
          .filter((item) => item.slug === "score-table")
          .every((item) => !item.done),
      ).toBe(true);
      expect(practices.find((item) => item.slug === "yaku-han")?.done).toBe(
        true,
      );
    });
  });

  it("前提章を持たない級（初段）では、学ぶ・練習するが空で、次はすぐ試験", () => {
    const allButDan = RANK_SLUGS.filter((slug) => slug !== "dan-1");
    const journey = buildJourney(input({ achievedRankSlugs: allButDan }));

    expect(journey.current?.rank.slug).toBe("dan-1");
    expect(journey.current?.path).toEqual([]);
    expect(journey.current?.chapters).toEqual([]);
    expect(journey.current?.practices).toEqual([]);
    expect(journey.nextStep).toEqual({ kind: "exam", slug: "score-exam" });
  });

  it("取得済みの級の行程も組まれ、試験は合格として表れる", () => {
    const journey = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));
    const kyu5 = journey.ranks[0];

    expect(kyu5.status).toBe("achieved");
    expect(kyu5.exam.done).toBe(true);
    // 章を読んでいなくても行程は残る（取得済みの級の中身を道場で見られる）
    expect(kyu5.chapters.length).toBe(5);
    // 次の一歩は次の級（4級）の最初の章のレッスン
    expect(journey.nextStep).toEqual({
      kind: "lesson",
      lessonSlug: "jantou-fu",
      chapterSlug: "jantou-fu",
    });
  });

  it("全級取得済みなら current も nextStep も無い", () => {
    const journey = buildJourney(input({ achievedRankSlugs: RANK_SLUGS }));

    expect(journey.current).toBeUndefined();
    expect(journey.nextStep).toBeUndefined();
    expect(journey.ranks.every((entry) => entry.exam.done)).toBe(true);
  });

  it("飛び番で級を持つユーザーでも、次は最下位の未取得の級", () => {
    const journey = buildJourney(
      input({ achievedRankSlugs: ["kyu-5", "kyu-2"] }),
    );

    expect(journey.current?.rank.slug).toBe("kyu-4");
    expect(journey.ranks.map((entry) => entry.status)).toEqual([
      "achieved",
      "next",
      "unachieved",
      "achieved",
      "unachieved",
      "unachieved",
    ]);
  });
});

describe("buildJourneyPath", () => {
  it("章の直後にその章から送る練習を置く", () => {
    const path = buildJourneyPath(
      ["mangan-ko-ron", "mangan-ko-tsumo"],
      "mangan-exam",
      input(),
    );

    expect(
      path.map((item) =>
        item.kind === "chapter"
          ? item.chapterSlug
          : `${item.slug}:${item.variant}`,
      ),
    ).toEqual([
      "mangan-ko-ron",
      "mangan-ko-tsumo",
      "score-table:ko_mangan_plus",
    ]);
  });

  it("同じ土俵へ送る章が並んでも、練習の項目は最初の 1 つだけ", () => {
    // 点数記憶術の 2 章はどちらも子・満貫未満の点数表早引きへ送る
    const path = buildJourneyPath(
      ["fu-doubling", "ron-to-tsumo", "tsumo-payments"],
      "score-exam",
      input(),
    );

    expect(path.filter((item) => item.kind === "practice")).toEqual([
      {
        kind: "practice",
        slug: "score-table",
        variant: "ko_non_mangan",
        done: false,
      },
      { kind: "practice", slug: "score-table", variant: "all", done: false },
    ]);
  });

  it("レッスンの無い章は読了で済みになる", () => {
    // 点数記憶術の章はどの級の前提でもなく、レッスンを持たない
    const chapterOf = (readSlugs: ReadonlySet<string>) =>
      buildJourneyPath(["fu-doubling"], "score-exam", input({ readSlugs }))[0];

    expect(chapterOf(NONE)).toEqual({
      kind: "chapter",
      chapterSlug: "fu-doubling",
      lessonSlug: undefined,
      done: false,
    });
    expect(chapterOf(new Set(["fu-doubling"])).done).toBe(true);
  });

  it("その級の試験が練習リンクに現れても行程には含めない", () => {
    const path = buildJourneyPath(["yaku"], "yaku", input());

    expect(path.filter((item) => item.kind === "practice")).toEqual([
      { kind: "practice", slug: "yaku-han", variant: undefined, done: false },
      { kind: "practice", slug: "han-count", variant: undefined, done: false },
    ]);
  });
});

describe("stepAfterLesson", () => {
  it("練習を送らない章のレッスンの次は、次の章のレッスン", () => {
    expect(stepAfterLesson("mangan-ko-ron")).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-tsumo",
      chapterSlug: "mangan-ko-tsumo",
    });
  });

  it("練習を送る章のレッスンの次も、練習を飛ばして次の章のレッスン", () => {
    expect(stepAfterLesson("mangan-ko-tsumo")).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-oya-ron",
      chapterSlug: "mangan-oya-ron",
    });
  });

  it("級の行程で後ろにレッスンが無ければ、直後の項目（章から送る練習）", () => {
    expect(stepAfterLesson("yaku")).toEqual({
      kind: "practice",
      slug: "yaku-han",
      variant: undefined,
    });
  });

  it("どのレッスンも次の一歩を持つ（級の最後なら昇級試験）", () => {
    for (const lesson of LESSON_REGISTRY) {
      expect(stepAfterLesson(lesson.slug), lesson.slug).toBeDefined();
    }
  });

  it("次の一歩が練習なら、その練習を完了画面の関連する練習に重ねない", () => {
    for (const lesson of LESSON_REGISTRY) {
      const step = stepAfterLesson(lesson.slug);
      if (step?.kind !== "practice") continue;
      const related = lesson.practiceLinks.map((link) => link.slug);
      expect(related, lesson.slug).not.toContain(step.slug);
    }
  });
});

describe("stepAfterLessonWithProgress", () => {
  it("何も済んでいなければ、後ろに項目があるレッスンは道筋の順の一歩と同じ", () => {
    for (const lesson of LESSON_REGISTRY) {
      const planned = stepAfterLesson(lesson.slug);
      // 後ろに項目が無い（道筋の順なら昇級試験）レッスンは、前に残した
      // 項目へ戻る（次のテスト）
      if (planned?.kind === "exam") continue;
      expect(
        stepAfterLessonWithProgress(lesson.slug, input()),
        lesson.slug,
      ).toEqual(planned);
    }
  });

  it("級の行程の最後のレッスンは、前に残したレッスンへ戻り、全部済めば昇級試験", () => {
    expect(stepAfterLesson("furo-score")).toEqual({
      kind: "exam",
      slug: "fu-score-exam",
    });
    expect(stepAfterLessonWithProgress("furo-score", input())).toEqual({
      kind: "lesson",
      lessonSlug: "menzen-mentsu-score",
      chapterSlug: "menzen-mentsu-score",
    });
    expect(
      stepAfterLessonWithProgress(
        "furo-score",
        input({ completedLessonSlugs: new Set(["menzen-mentsu-score"]) }),
      ),
    ).toEqual({ kind: "exam", slug: "fu-score-exam" });
  });

  it("後ろの済んだレッスンは飛ばす", () => {
    expect(
      stepAfterLessonWithProgress(
        "mangan-ko-ron",
        input({ completedLessonSlugs: new Set(["mangan-ko-tsumo"]) }),
      ),
    ).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-oya-ron",
      chapterSlug: "mangan-oya-ron",
    });
  });

  it("後ろのレッスンが済んでいれば、後ろの最初の未挑戦の練習", () => {
    expect(
      stepAfterLessonWithProgress(
        "mangan-ko-ron",
        input({ completedLessonSlugs: KYU5_LESSONS_DONE }),
      ),
    ).toEqual({
      kind: "practice",
      slug: "score-table",
      variant: "ko_mangan_plus",
    });
  });

  it("後ろが全部済んでいれば、前に残した最初の未了へ戻る", () => {
    expect(
      stepAfterLessonWithProgress(
        "yaku",
        input({ attemptedPractices: KYU5_PRACTICES_ATTEMPTED }),
      ),
    ).toEqual({
      kind: "lesson",
      lessonSlug: "mangan-ko-ron",
      chapterSlug: "mangan-ko-ron",
    });
  });

  it("級の項目が全部済んでいれば昇級試験。終えたレッスン自身は済みとして扱う", () => {
    const others = new Set(
      [...KYU5_LESSONS_DONE].filter((slug) => slug !== "yaku"),
    );
    expect(
      stepAfterLessonWithProgress(
        "yaku",
        input({
          completedLessonSlugs: others,
          attemptedPractices: KYU5_PRACTICES_ATTEMPTED,
        }),
      ),
    ).toEqual({ kind: "exam", slug: "mangan-exam" });
  });

  it("級を取得済み（学び直し）なら、ホームと同じ次に取る級の一歩", () => {
    const progress = input({ achievedRankSlugs: ["kyu-5"] });
    const step = stepAfterLessonWithProgress("yaku", progress);
    expect(step).toEqual(buildJourney(progress).nextStep);
    expect(step).toBeDefined();
  });

  it("全級取得済みでホームにも一歩が無ければ undefined", () => {
    expect(
      stepAfterLessonWithProgress(
        "yaku",
        input({ achievedRankSlugs: RANK_SLUGS }),
      ),
    ).toBeUndefined();
  });
});

describe("countProgress", () => {
  it("済んだ数と全体を数える", () => {
    const journey = buildJourney(
      input({ completedLessonSlugs: new Set(["mangan-ko-ron", "yaku"]) }),
    );

    expect(countProgress(journey.current?.chapters ?? [])).toEqual({
      done: 2,
      total: 5,
    });
    expect(countProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe("currentStage", () => {
  it("何も始めていなければ学ぶ段", () => {
    const journey = buildJourney(input());

    expect(currentStage(journey.ranks[0])).toBe("learn");
  });

  it("章を学んだ直後はその章から送る練習の段（学ぶが残っていても）", () => {
    const journey = buildJourney(
      input({
        completedLessonSlugs: new Set(["mangan-ko-ron", "mangan-ko-tsumo"]),
      }),
    );

    expect(journey.nextStep?.kind).toBe("practice");
    expect(currentStage(journey.ranks[0])).toBe("practice");
  });

  it("学ぶ・練習するが済んだら試験の段、合格した級は（学ぶが残っていても）無い", () => {
    const journey = buildJourney(
      input({
        completedLessonSlugs: KYU5_LESSONS_DONE,
        attemptedPractices: KYU5_PRACTICES_ATTEMPTED,
      }),
    );

    expect(currentStage(journey.ranks[0])).toBe("exam");

    const passed = buildJourney(input({ achievedRankSlugs: ["kyu-5"] }));
    expect(currentStage(passed.ranks[0])).toBeUndefined();
  });
});
