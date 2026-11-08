import { describe, expect, it } from "vitest";

import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";
import { glossaryTermHref } from "@mahjong-scoring/features/glossary/routes";
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import { RANK_SLUGS } from "@mahjong-scoring/features/ranks/registry";
import {
  AGARI_SCORE_PRACTICE_HREF,
  chapterHref,
  practiceHref,
  rankHref,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import { EN_PUBLISHED_PATHS, getPublication } from "./route-policy";
import {
  getTranslatedPublication,
  publishedHomeHref,
  translatedPublishedPaths,
  translatedPublishedTemplates,
  translatedTemplateOf,
} from "./translated-publications";

/** 英語で出して索引させる法務・運営情報・お問い合わせの入力・料金 */
const EN_LEGAL_AND_PLAN_PATHS = [
  "/terms",
  "/privacy",
  "/tokushoho",
  "/company",
  "/contact",
  "/plan",
];

/**
 * 英語で出して索引させる公開単位（完全一致の行）
 *
 * 練習・昇級試験の説明ページはレジストリ（`practiceHref`）から組み、許可リストが
 * 文字列で持つ表とレジストリの食い違い（練習の追加・改名・`basePath` の変更）を落とす。
 */
const EN_INDEXABLE_EXACT_PATHS = [
  "/",
  "/lessons",
  ...CURRICULUM.map((chapter) => chapterHref(chapter.slug)),
  "/reference",
  "/reference/yaku",
  "/reference/glossary",
  "/reference/score-table",
  "/practice",
  ...PRACTICE_MENU_SLUGS.map((slug) => practiceHref(slug)),
  AGARI_SCORE_PRACTICE_HREF,
  TENPAI_SCORE_PRACTICE_HREF,
  "/getting-started",
  "/try/agari-score",
  "/try/mentsu-fu",
  "/reference/demo",
  ...EN_LEGAL_AND_PLAN_PATHS,
];

/**
 * 英語で出すが索引させない公開単位（完全一致の行）
 *
 * 練習・昇級試験の play / training / result、和了形・聴牌形の play、道場、
 * お問い合わせの確認・完了、お知らせの一覧、会員の画面（{@link EN_MEMBER_PATHS}）。
 */
const EN_NOINDEX_EXACT_PATHS = [
  ...PRACTICE_MENU_SLUGS.flatMap((slug) =>
    ["play", "training", "result"].map(
      (subpage) => `${practiceHref(slug)}/${subpage}`,
    ),
  ),
  `${AGARI_SCORE_PRACTICE_HREF}/play`,
  `${TENPAI_SCORE_PRACTICE_HREF}/play`,
  "/dojo",
  "/contact/confirm",
  "/contact/success",
  "/announcements",
];

/** 英語で出すが索引させない会員の画面（認証・ダッシュボード・マイページ・設定の 18 ページ） */
const EN_MEMBER_PATHS = [
  "/sign-in",
  "/sign-up",
  "/sign-up/verify-email",
  "/forgot-password",
  "/reset-password",
  "/banned",
  "/dashboard",
  "/mypage",
  "/mypage/account",
  "/mypage/account/delete",
  "/mypage/challenges",
  "/mypage/challenges/results",
  "/mypage/notifications",
  "/mypage/plan",
  "/mypage/profile/edit",
  "/mypage/setup-username",
  "/preferences",
  "/preferences/yaku-order",
];

describe("getTranslatedPublication", () => {
  it("英語の許可リストの索引対象の行は公開して索引させる（query・hash は無視）", () => {
    for (const path of EN_INDEXABLE_EXACT_PATHS) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-indexable",
      );
    }
    expect(
      getTranslatedPublication("/reference/score-table?han=3#x", "en"),
    ).toBe("published-indexable");
    expect(getTranslatedPublication("/lessons?rank=5-kyu", "en")).toBe(
      "published-indexable",
    );
    expect(getTranslatedPublication("/practice?rank=kyu-5", "en")).toBe(
      "published-indexable",
    );
  });

  it("練習・昇級試験の play / training / result・無限訓練の play・道場は出すが索引させない", () => {
    for (const path of EN_NOINDEX_EXACT_PATHS) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-noindex",
      );
    }
    expect(
      getTranslatedPublication("/practice/total-fu/play?variant=all", "en"),
    ).toBe("published-noindex");
  });

  it("会員の画面（認証・ダッシュボード・マイページ・設定）18 ページは出すが索引させない", () => {
    expect(EN_MEMBER_PATHS).toHaveLength(18);
    for (const path of EN_MEMBER_PATHS) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-noindex",
      );
    }
    expect(
      getTranslatedPublication("/sign-in?redirect=%2Fen%2Fmypage", "en"),
    ).toBe("published-noindex");
    expect(
      getTranslatedPublication("/mypage/challenges/results?page=2", "en"),
    ).toBe("published-noindex");
  });

  it("完全一致の行は公開単位どおり（索引対象 25 + 公開教材 + 法務・料金 6、noindex 54 + お問い合わせ・お知らせ 3 + 会員の画面 18）", () => {
    expect([...translatedPublishedPaths("en")].sort()).toEqual(
      [
        ...EN_INDEXABLE_EXACT_PATHS,
        ...EN_NOINDEX_EXACT_PATHS,
        ...EN_MEMBER_PATHS,
      ].sort(),
    );
    expect(EN_NOINDEX_EXACT_PATHS).toHaveLength(54 + 3);
    expect(
      translatedPublishedPaths("en").filter((path) =>
        path.startsWith("/lessons/"),
      ),
    ).toHaveLength(20);
  });

  it("はじめに（about-this-app）を英語で出して索引させる（紹介する練習・道場の画面を英語で出す）", () => {
    expect(getTranslatedPublication("/lessons/about-this-app", "en")).toBe(
      "published-indexable",
    );
  });

  it("法務・運営情報・お問い合わせの入力・料金は出して索引させ、お問い合わせの確認・完了とお知らせは索引させない", () => {
    for (const path of EN_LEGAL_AND_PLAN_PATHS) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-indexable",
      );
    }
    for (const path of [
      "/contact/confirm",
      "/contact/success",
      "/announcements",
      "/announcements?page=2",
    ]) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-noindex",
      );
    }
  });

  it("お知らせの詳細はテンプレートで出して索引させない（DB 由来なのでどの slug も通し、行の有無はページが確かめる）", () => {
    for (const path of [
      "/announcements/some-news",
      "/announcements/__audit_unknown__",
    ]) {
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-noindex",
      );
      expect(translatedTemplateOf(path, "en")).toBe("/announcements/[slug]");
    }
  });

  it("用語のページと段級位の詳細はテンプレートで公開し、全用語・全段級位が当たる", () => {
    expect(translatedPublishedTemplates("en")).toEqual([
      "/reference/glossary/[slug]",
      "/dojo/ranks/[slug]",
      "/announcements/[slug]",
    ]);
    for (const slug of GLOSSARY_TERM_SLUGS) {
      const path = glossaryTermHref(slug);
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-indexable",
      );
      expect(translatedTemplateOf(path, "en")).toBe(
        "/reference/glossary/[slug]",
      );
    }
    for (const slug of RANK_SLUGS) {
      const path = rankHref(slug);
      expect(getTranslatedPublication(path, "en"), path).toBe(
        "published-noindex",
      );
      expect(translatedTemplateOf(path, "en")).toBe("/dojo/ranks/[slug]");
    }
  });

  it.each([
    ["/reference/glossary/__unknown__"],
    ["/dojo/ranks/__unknown__"],
    ["/dojo/ranks/Kyu-5"],
  ])(
    "slug の形（英小文字で始まる英数字とハイフン）に合わない %s は unpublished（proxy が 404 にする）",
    (path) => {
      expect(getTranslatedPublication(path, "en")).toBe("unpublished");
    },
  );

  it("テンプレートに合うがレジストリに無い slug も許可リストは公開と返す（404 はページが返す）", () => {
    expect(
      getTranslatedPublication("/reference/glossary/unknown-term", "en"),
    ).toBe("published-indexable");
    expect(getTranslatedPublication("/dojo/ranks/unknown-rank", "en")).toBe(
      "published-noindex",
    );
  });

  it.each([
    ["/leaderboard"],
    ["/leaderboard/weekly/jantou-fu"],
    ["/u/alice"],
    ["/announcements/some-news/extra"],
    ["/contact/unknown"],
    ["/plan/extra"],
    ["/mypage/unknown"],
    ["/sign-in/extra"],
    ["/dojo/ranks"],
    ["/practice/agari-score/result"],
    ["/practice/jantou-fu/extra"],
    ["/exam/mangan/extra"],
    ["/reference/glossary/"],
    ["/reference/glossary/jantou/extra"],
    ["/reference/glossary/Jantou"],
    ["/dojo/ranks/kyu-5/extra"],
    ["/lessons/jantou-fu/extra"],
  ])("%s は英語で unpublished", (path) => {
    expect(getTranslatedPublication(path, "en")).toBe("unpublished");
    expect(translatedTemplateOf(path, "en")).toBeUndefined();
  });

  it("完全一致の行はテンプレートに畳まない", () => {
    expect(translatedTemplateOf("/reference/glossary", "en")).toBeUndefined();
    expect(translatedTemplateOf("/lessons/jantou-fu", "en")).toBeUndefined();
    expect(translatedTemplateOf("/dojo", "en")).toBeUndefined();
  });

  it("route-policy の英語の判定と一致する（判定を二重に持たない）", () => {
    for (const path of [
      "/leaderboard",
      "/u/alice",
      "/reference/glossary/unknown-term",
      "/dojo/ranks/unknown-rank",
      ...EN_PUBLISHED_PATHS,
    ]) {
      expect(getPublication(path, "en")).toBe(
        getTranslatedPublication(path, "en"),
      );
    }
  });

  it("EN_PUBLISHED_PATHS は完全一致の行とテンプレートの展開（全用語・全段級位。お知らせの詳細は展開しない）", () => {
    expect(EN_PUBLISHED_PATHS).toEqual([
      ...translatedPublishedPaths("en"),
      ...GLOSSARY_TERM_SLUGS.map(glossaryTermHref),
      ...RANK_SLUGS.map(rankHref),
    ]);
  });
});

describe("publishedHomeHref", () => {
  it("日本語は接頭辞なしのトップ", () => {
    expect(publishedHomeHref("ja")).toBe("/");
  });

  it("英語のトップを公開しているので英語のトップへ向ける", () => {
    expect(getTranslatedPublication("/", "en")).toBe("published-indexable");
    expect(publishedHomeHref("en")).toBe("/en");
  });
});
