import { describe, expect, it } from "vitest";

import {
  AGARI_SCORE_PRACTICE_HREF,
  ANNOUNCEMENTS_PATH,
  DAILY_PROBLEM_HREF,
  DOJO_PATH,
  LEADERBOARD_PATH,
  LESSONS_PATH,
  MYPAGE_NOTIFICATIONS_PATH,
  MYPAGE_PLAN_PATH,
  MY_RECORD_PATH,
  PRACTICE_PATH,
  PREFERENCES_PATH,
  RANKS_PATH,
  RANK_PARAM,
  REFERENCE_PATH,
  REFERENCE_YAKU_PATH,
  TENPAI_SCORE_PRACTICE_HREF,
  VARIANT_PARAM,
  YAKU_ORDER_PATH,
  announcementHref,
  chapterHref,
  lessonsListHref,
  myRecordHref,
  practiceHref,
  practiceListHrefForRank,
  practicePlayHref,
  practiceResultHref,
  practiceTrainingHref,
  rankHref,
  variantQuery,
} from "./routes";

describe("practiceHref", () => {
  it("slug から練習ページのパスを作る", () => {
    expect(practiceHref("jantou-fu")).toBe("/practice/jantou-fu");
  });

  it("バリアントを渡すとクエリに載せる", () => {
    expect(practiceHref("score-table", "all")).toBe(
      "/practice/score-table?variant=all",
    );
  });

  it("バリアントを持たない練習にはクエリを付けない", () => {
    expect(practiceHref("jantou-fu", "default")).toBe("/practice/jantou-fu");
  });
});

describe("practiceListHrefForRank", () => {
  it("級の slug を rank のクエリに載せる", () => {
    expect(practiceListHrefForRank("kyu-4")).toBe("/practice?rank=kyu-4");
  });
});

describe("lessonsListHref", () => {
  it("級を渡さなければ全レッスンの目次", () => {
    expect(lessonsListHref()).toBe("/lessons");
  });

  it("級を渡すとその級で絞った目次", () => {
    expect(lessonsListHref("kyu-5")).toBe("/lessons?rank=kyu-5");
  });
});

describe("rankHref", () => {
  it("段級位の詳細の親パスの下に slug を置く", () => {
    expect(rankHref("kyu-5")).toBe("/dojo/ranks/kyu-5");
  });
});

describe("myRecordHref", () => {
  it("土俵を menu と variant のクエリで運ぶ", () => {
    expect(myRecordHref({ menuType: "yaku_han", variant: "kuisagari" })).toBe(
      "/mypage/challenges?menu=yaku_han&variant=kuisagari",
    );
  });
});

describe("variantQuery", () => {
  it("バリアントを持つ練習は正規化したバリアントを variant のクエリにする", () => {
    expect(variantQuery("total-fu", "up_to_60")).toBe("?variant=up_to_60");
    expect(variantQuery("total-fu", "bogus")).toBe("?variant=up_to_40");
  });

  it("バリアントを持たない練習には何も付けない", () => {
    expect(variantQuery("jantou-fu", "all")).toBe("");
  });
});

describe("chapterHref", () => {
  it("レッスンの目次の下に章の slug を置く", () => {
    expect(chapterHref("jantou-fu")).toBe("/lessons/jantou-fu");
  });
});

describe("practicePlayHref", () => {
  it("練習ページの下の play にバリアントを載せる", () => {
    expect(practicePlayHref("yaku-han", "kuisagari")).toBe(
      "/practice/yaku-han/play?variant=kuisagari",
    );
  });

  it("バリアントを省略すると既定のバリアントを載せる", () => {
    expect(practicePlayHref("yaku-han")).toBe(
      "/practice/yaku-han/play?variant=no_kuisagari",
    );
  });

  it("バリアントを持たない練習はクエリを付けない", () => {
    expect(practicePlayHref("jantou-fu")).toBe("/practice/jantou-fu/play");
  });

  it("試験は /exam の下の play", () => {
    expect(practicePlayHref("mangan-exam")).toBe("/exam/mangan/play");
  });
});

describe("practiceTrainingHref", () => {
  it("練習ページの下の training にバリアントを載せる", () => {
    expect(practiceTrainingHref("score-table", "all")).toBe(
      "/practice/score-table/training?variant=all",
    );
  });

  it("バリアントを省略すると既定のバリアントを載せる", () => {
    expect(practiceTrainingHref("score-table")).toBe(
      "/practice/score-table/training?variant=ko_mangan_plus",
    );
  });

  it("模試は試験のパスの下の training", () => {
    expect(practiceTrainingHref("fu-exam")).toBe("/exam/fu/training");
  });
});

describe("practiceResultHref", () => {
  it("練習ページの下の result（バリアントは載せない）", () => {
    expect(practiceResultHref("total-fu")).toBe("/practice/total-fu/result");
  });
});

describe("announcementHref", () => {
  it("お知らせの一覧の下に slug を 1 つのパスの区切りとして置く", () => {
    expect(announcementHref("release")).toBe("/announcements/release");
    expect(announcementHref("a/b")).toBe("/announcements/a%2Fb");
  });
});

describe("固定のパス", () => {
  // パスは web のルートとアプリの画面が共有する契約なので、値そのものを検証する
  it.each([
    ["VARIANT_PARAM", VARIANT_PARAM, "variant"],
    ["RANK_PARAM", RANK_PARAM, "rank"],
    ["PRACTICE_PATH", PRACTICE_PATH, "/practice"],
    ["LESSONS_PATH", LESSONS_PATH, "/lessons"],
    ["ANNOUNCEMENTS_PATH", ANNOUNCEMENTS_PATH, "/announcements"],
    ["PREFERENCES_PATH", PREFERENCES_PATH, "/preferences"],
    ["YAKU_ORDER_PATH", YAKU_ORDER_PATH, "/preferences/yaku-order"],
    ["REFERENCE_PATH", REFERENCE_PATH, "/reference"],
    ["REFERENCE_YAKU_PATH", REFERENCE_YAKU_PATH, "/reference/yaku"],
    ["DOJO_PATH", DOJO_PATH, "/dojo"],
    ["RANKS_PATH", RANKS_PATH, "/dojo/ranks"],
    ["MY_RECORD_PATH", MY_RECORD_PATH, "/mypage/challenges"],
    ["LEADERBOARD_PATH", LEADERBOARD_PATH, "/leaderboard"],
    [
      "AGARI_SCORE_PRACTICE_HREF",
      AGARI_SCORE_PRACTICE_HREF,
      "/practice/agari-score",
    ],
    [
      "TENPAI_SCORE_PRACTICE_HREF",
      TENPAI_SCORE_PRACTICE_HREF,
      "/practice/tenpai-score",
    ],
    ["DAILY_PROBLEM_HREF", DAILY_PROBLEM_HREF, "/daily-problem"],
    ["MYPAGE_PLAN_PATH", MYPAGE_PLAN_PATH, "/mypage/plan"],
    [
      "MYPAGE_NOTIFICATIONS_PATH",
      MYPAGE_NOTIFICATIONS_PATH,
      "/mypage/notifications",
    ],
  ])("%s の値", (_, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
