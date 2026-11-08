import { describe, expect, it } from "vitest";

import {
  GLOSSARY_SITEMAP_PATHS,
  INDEXABLE_PATHS,
  RANK_SITEMAP_PATHS,
} from "@/app/_lib/sitemap-routes";
import { EN_PUBLISHED_PATHS, getPublication } from "@/i18n/route-policy";
import { getIndexableAlternates, productionUrl } from "@/i18n/seo-alternates";

import {
  ALLOWED_NEW_JA_STATIC,
  BASELINE_HTTP_CHANGES,
  BASELINE_ROBOTS_DISALLOW,
  EN_INDEXABLE_PATHS,
  EN_INDEXABLE_TEMPLATES,
  EN_NOINDEX_PATHS,
  EN_NOINDEX_TEMPLATES,
  EN_ROBOTS_DISALLOW_ADDITIONS,
  expectedAlternates,
  expectedEnIndexablePaths,
  expectedUrl,
  isEnIndexable,
  isEnNoindex,
  matchStaticMigrations,
  parseSiteUrl,
} from "./expectations";

/**
 * 監査の期待値（`expectations.ts`）がアプリの公開状態と食い違っていないことの検査
 *
 * 監査は期待値をアプリのモジュールから読まずに独立に持つ（理由は
 * `expectations.ts` の TSDoc）。その代わり、ここで両者が一致することを確かめる。
 */

/**
 * 日本語で索引させるパス（アプリの sitemap の静的な項目）
 *
 * 監査は baseline（移行前の sitemap）を日本語の索引対象として読む。日本語の
 * 索引対象は移行で変えないので、ここではアプリの同じ集合で代用する。
 */
const JA_INDEXABLE: readonly string[] = [
  ...INDEXABLE_PATHS,
  ...GLOSSARY_SITEMAP_PATHS,
  ...RANK_SITEMAP_PATHS,
];

/** 規則を突き合わせるパス（索引対象・noindex・未公開・英語の公開を含む） */
const SAMPLE_PATHS: readonly string[] = [
  ...JA_INDEXABLE,
  ...EN_PUBLISHED_PATHS,
  "/announcements/sample-announcement",
  "/practice/jantou-fu/play",
  "/practice/jantou-fu/result",
  "/mypage",
  "/sign-in",
  "/preferences",
  "/u/alice",
  "/announcements",
  "/terms",
  "/leaderboard/monthly/jantou-fu",
  "/admin",
  "/nonexistent",
  "/reference/glossary/unknown-term",
  "/reference/glossary/__unknown__",
  "/dojo/ranks/audit-unknown-rank",
  "/dojo/ranks/__unknown__",
  "/dashboard",
  "/plan",
  "/contact/confirm",
  "/announcements/__audit_unknown__",
  "/announcements/a/b",
];

describe("監査の期待値とアプリの公開状態", () => {
  it("英語で索引させるパスの展開（日本語の索引対象のうちテンプレートに合うものを含む）は route-policy の published-indexable と同じ集合", () => {
    expect([...expectedEnIndexablePaths(JA_INDEXABLE)].sort()).toEqual(
      EN_PUBLISHED_PATHS.filter(
        (path) => getPublication(path, "en") === "published-indexable",
      ).sort(),
    );
  });

  it("展開に重複が無い", () => {
    const expanded = expectedEnIndexablePaths(JA_INDEXABLE);
    expect(new Set(expanded).size).toBe(expanded.length);
  });

  it("英語のテンプレートは用語のページだけで、全用語が当たる", () => {
    expect([...EN_INDEXABLE_TEMPLATES.keys()]).toEqual([
      "/reference/glossary/[slug]",
    ]);
    for (const path of GLOSSARY_SITEMAP_PATHS) {
      expect(isEnIndexable(path), path).toBe(true);
    }
  });

  it.each(SAMPLE_PATHS.map((path) => [path]))(
    "%s を英語で索引させるかは route-policy と一致する",
    (path) => {
      expect(isEnIndexable(path)).toBe(
        getPublication(path, "en") === "published-indexable",
      );
    },
  );

  it("英語のトップは 200 に変わり、レッスンの目次だけが日本語で新たに静的になる", () => {
    expect(BASELINE_HTTP_CHANGES.get("/en")).toEqual({ status: 200 });
    expect(ALLOWED_NEW_JA_STATIC).toEqual(["/lessons"]);
    expect(EN_INDEXABLE_PATHS).toEqual(
      expect.arrayContaining([...ALLOWED_NEW_JA_STATIC]),
    );
  });

  // 段級位の詳細は監査が実在の 6 件を文字列で持つ（アプリは形で判定する）ので、
  // 形に合うが無い段級位（ページの 404）は比べない。http.ts の未知の slug の検査が見る
  it.each(
    SAMPLE_PATHS.filter(
      (path) => path !== "/dojo/ranks/audit-unknown-rank",
    ).map((path) => [path]),
  )(
    "%s を英語で出して索引させないかは route-policy と一致する（テンプレートを含む）",
    (path) => {
      expect(isEnNoindex(path)).toBe(
        getPublication(path, "en") === "published-noindex",
      );
    },
  );

  it("英語の noindex のテンプレートはお知らせの詳細だけで、具体的な URL へ展開しない", () => {
    expect([...EN_NOINDEX_TEMPLATES.keys()]).toEqual(["/announcements/[slug]"]);
    expect(
      EN_PUBLISHED_PATHS.filter((path) => path.startsWith("/announcements/")),
    ).toEqual([]);
    expect(
      EN_NOINDEX_PATHS.filter((path) => path.startsWith("/announcements/")),
    ).toEqual([]);
  });

  it("英語の料金とお知らせの一覧は baseline の 404 から 200 に変わる", () => {
    expect(BASELINE_HTTP_CHANGES.get("/en/plan")).toEqual({ status: 200 });
    expect(BASELINE_HTTP_CHANGES.get("/en/announcements")).toEqual({
      status: 200,
    });
  });

  it("英語で出して索引させないパスは route-policy の published-noindex と同じ集合", () => {
    expect([...EN_NOINDEX_PATHS].sort()).toEqual(
      EN_PUBLISHED_PATHS.filter(
        (path) => getPublication(path, "en") === "published-noindex",
      ).sort(),
    );
  });

  it("英語で索引させるページは日本語でも索引させる（日本語の索引対象から英語を足す）", () => {
    const jaIndexable = new Set(JA_INDEXABLE);
    expect(EN_INDEXABLE_PATHS.filter((path) => !jaIndexable.has(path))).toEqual(
      [],
    );
  });

  it("英語の noindex に道場・段級位の詳細 6 件・練習と試験の play / training / result が入る", () => {
    expect(EN_NOINDEX_PATHS).toEqual(
      expect.arrayContaining([
        "/dojo",
        ...RANK_SITEMAP_PATHS,
        "/practice/jantou-fu/result",
        "/exam/score/play",
        "/practice/tenpai-score/play",
      ]),
    );
    expect(new Set(EN_NOINDEX_PATHS).size).toBe(EN_NOINDEX_PATHS.length);
    for (const path of EN_NOINDEX_PATHS) {
      expect(isEnIndexable(path), path).toBe(false);
    }
  });

  it("英語の noindex に会員の画面（認証・ダッシュボード・マイページ・設定の 18 件）が入る", () => {
    const member = [
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
    expect(EN_NOINDEX_PATHS).toEqual(expect.arrayContaining(member));
    expect(EN_NOINDEX_PATHS).toHaveLength(54 + 6 + member.length + 3);
  });

  it("英語の noindex にお問い合わせの確認・完了とお知らせの一覧が入り、法務・料金は索引対象", () => {
    expect(EN_NOINDEX_PATHS).toEqual(
      expect.arrayContaining([
        "/contact/confirm",
        "/contact/success",
        "/announcements",
      ]),
    );
    expect(EN_INDEXABLE_PATHS).toEqual(
      expect.arrayContaining([
        "/terms",
        "/privacy",
        "/tokushoho",
        "/company",
        "/contact",
        "/plan",
      ]),
    );
  });

  it("robots.txt の Disallow は日本語の行をそのまま保ち、英語のマイページと公開プロフィールを足す", async () => {
    const { default: robots } = await import("@/app/robots");
    const { rules } = robots();
    const disallow = Array.isArray(rules) ? undefined : rules.disallow;
    expect(BASELINE_ROBOTS_DISALLOW).toEqual([
      "/admin",
      "/mypage",
      "/api",
      "/u/",
    ]);
    expect(EN_ROBOTS_DISALLOW_ADDITIONS).toEqual([]);
    expect(disallow).toEqual([
      ...BASELINE_ROBOTS_DISALLOW,
      ...EN_ROBOTS_DISALLOW_ADDITIONS,
    ]);
  });

  it.each(SAMPLE_PATHS.map((path) => [path]))(
    "%s の hreflang の期待値は getIndexableAlternates と一致する",
    (path) => {
      expect(
        expectedAlternates(
          path,
          getPublication(path, "ja") === "published-indexable",
          getPublication(path, "en") === "published-indexable",
        ),
      ).toEqual({ ...getIndexableAlternates(path) });
    },
  );

  // `/admin` は `app/[locale]` の外で、productionUrl はロケール接頭辞を付けない
  it.each(
    SAMPLE_PATHS.filter((path) => path !== "/admin").flatMap((path) => [
      [path, "ja"],
      [path, "en"],
    ]),
  )(
    "%s（%s）の本番 URL は productionUrl と一致し、元のパスへ戻せる",
    (path, locale) => {
      const supported = locale === "en" ? "en" : "ja";
      expect(expectedUrl(path, supported)).toBe(productionUrl(path, supported));
      expect(parseSiteUrl(expectedUrl(path, supported))).toEqual({
        locale: supported,
        path,
      });
    },
  );

  it("本番の origin でない URL は解釈しない", () => {
    expect(parseSiteUrl("https://example.com/practice")).toBeUndefined();
    expect(parseSiteUrl("https://score.mahjong.help.evil/x")).toBeUndefined();
  });
});

describe("動的 → 静的の移行の許可（静的生成の台帳と動的ルートの台帳が同じ一覧を読む）", () => {
  it("許可したパスだけが静的へ移ったなら合格", () => {
    expect(matchStaticMigrations(["/lessons"], ["/lessons"])).toEqual({
      unexpected: [],
      unused: [],
    });
  });

  it("既定の許可は ALLOWED_NEW_JA_STATIC で、/lessons の静的化だけを認める", () => {
    expect(matchStaticMigrations(["/lessons"])).toEqual({
      unexpected: [],
      unused: [],
    });
  });

  it("許可に無いパスが静的へ移ったら unexpected として失敗にする", () => {
    expect(
      matchStaticMigrations(["/practice", "/lessons"], ["/lessons"]),
    ).toEqual({ unexpected: ["/practice"], unused: [] });
  });

  it("許可したのに静的へ移っていない（動的のまま・移行前から静的）パスは unused として失敗にする", () => {
    expect(matchStaticMigrations([], ["/lessons"])).toEqual({
      unexpected: [],
      unused: ["/lessons"],
    });
  });

  it("移行が無く許可も無ければ合格", () => {
    expect(matchStaticMigrations([], [])).toEqual({
      unexpected: [],
      unused: [],
    });
  });
});
