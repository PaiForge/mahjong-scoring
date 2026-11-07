import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";
import {
  EN_EXCLUDED_NAMESPACES,
  EN_NOT_FOUND_NAMESPACES,
  EN_PENDING_NAMESPACES,
  EN_ROUTE_NAMESPACES,
  EN_SHELL_NAMESPACES,
  EN_TRANSLATED_NAMESPACES,
} from "./translation-status";

const translated: ReadonlySet<string> = new Set(EN_TRANSLATED_NAMESPACES);

/**
 * 英語で公開するレッスンの章（目次の 20 章すべて）
 *
 * messages はカリキュラムのレジストリ（features）に依存しないので写して持つ。
 * 写し元は features `curriculum/registry.ts` の章の slug と、web
 * `i18n/translated-publications.ts` の許可リスト（アプリ側の
 * `publication-gate.test.ts` が許可リストとこの表のキーの一致を検査する）。
 */
const EN_LESSON_ROUTES = [
  "/lessons/about-this-app",
  "/lessons/why-scoring-is-hard-to-learn",
  "/lessons/why-scoring-is-complex",
  "/lessons/mangan-ko-ron",
  "/lessons/mangan-ko-tsumo",
  "/lessons/mangan-oya-ron",
  "/lessons/mangan-oya-tsumo",
  "/lessons/yaku",
  "/lessons/jantou-fu",
  "/lessons/mentsu-fu",
  "/lessons/machi-fu",
  "/lessons/tehai-fu",
  "/lessons/chiitoitsu-score",
  "/lessons/pinfu-score",
  "/lessons/menzen-mentsu-score",
  "/lessons/furo-score",
  "/lessons/fu-doubling",
  "/lessons/ron-to-tsumo",
  "/lessons/tsumo-payments",
  "/lessons/oya-ron-scores",
] as const;

/**
 * 英語で公開するチャレンジ型の練習（昇級試験を含む）の説明ページと名前空間
 *
 * 写し元は features `practice-menu-types.ts` の `PRACTICE_MENU_REGISTRY`
 * （`practiceHref(slug)` と `namespace`）。web の許可リストとの一致はアプリ側の
 * `publication-gate.test.ts` が検査する。
 */
const PRACTICE_MENUS = [
  ["/practice/jantou-fu", "jantouFu"],
  ["/practice/machi-fu", "machiFu"],
  ["/practice/mentsu-fu", "mentsuFu"],
  ["/practice/mentsu-jantou-fu", "mentsuJantouFu"],
  ["/practice/total-fu", "totalFu"],
  ["/practice/yaku", "yaku"],
  ["/practice/score-table", "scoreTableChallenge"],
  ["/practice/score-calculation", "scoreCalculationChallenge"],
  ["/practice/han-count", "hanCountChallenge"],
  ["/practice/yaku-han", "yakuHanChallenge"],
  ["/practice/mangan-score-calculation", "manganScoreCalculationChallenge"],
  ["/exam/mangan", "manganExamChallenge"],
  ["/exam/fu", "fuExamChallenge"],
  ["/exam/chiitoitsu", "chiitoitsuExamChallenge"],
  ["/exam/pinfu", "pinfuExamChallenge"],
  ["/exam/fu-score", "fuScoreExamChallenge"],
  ["/exam/score", "scoreExamChallenge"],
] as const;

/** 練習の説明ページ配下の画面 */
const PRACTICE_SUBPAGES = ["play", "training", "result"] as const;

/** ルートが読む名前空間（キーを string で引くため型を広げる） */
function routeNamespaces(route: string): readonly string[] {
  const routes: Readonly<Record<string, readonly string[]>> =
    EN_ROUTE_NAMESPACES;
  return routes[route] ?? [];
}

describe("英語の翻訳状況の一覧", () => {
  it("日本語の名前空間は完訳・未着手・対象外のどれか 1 つに必ず入る", () => {
    // ja に名前空間を足して一覧への追記を忘れると、英語でその名前空間を
    // 引く画面がどの扱いか決まらないまま残る
    const listed = [
      ...EN_TRANSLATED_NAMESPACES,
      ...EN_PENDING_NAMESPACES,
      ...EN_EXCLUDED_NAMESPACES,
    ];
    expect([...listed].sort()).toEqual(Object.keys(ja).sort());
    // 重なりがあれば上の比較で数が合わなくなるが、どれが重なったかを示す
    const duplicated = listed.filter(
      (namespace, index) => listed.indexOf(namespace) !== index,
    );
    expect(duplicated).toEqual([]);
  });

  it("完訳の名前空間は英語の辞書に束ねてある", () => {
    expect(Object.keys(en).sort()).toEqual(
      [...EN_TRANSLATED_NAMESPACES].sort(),
    );
  });

  it("管理画面の名前空間だけを対象外にする", () => {
    expect([...EN_EXCLUDED_NAMESPACES]).toEqual(["admin"]);
  });
});

describe("英語で公開するルートの依存", () => {
  it("英語で公開するルートは公開単位の表どおり（用語のページ・段級位の詳細はテンプレートで 1 行）", () => {
    expect(Object.keys(EN_ROUTE_NAMESPACES)).toEqual([
      "/",
      "/lessons",
      ...EN_LESSON_ROUTES,
      "/reference",
      "/reference/yaku",
      "/reference/glossary",
      "/reference/glossary/[slug]",
      "/reference/score-table",
      "/reference/demo",
      "/practice",
      ...PRACTICE_MENUS.flatMap(([path]) => [
        path,
        ...PRACTICE_SUBPAGES.map((subpage) => `${path}/${subpage}`),
      ]),
      "/practice/agari-score",
      "/practice/agari-score/play",
      "/practice/tenpai-score",
      "/practice/tenpai-score/play",
      "/getting-started",
      "/try/agari-score",
      "/try/mentsu-fu",
      "/dojo",
      "/dojo/ranks/[slug]",
    ]);
  });

  it.each(
    PRACTICE_MENUS.flatMap(([path, namespace]) =>
      [path, ...PRACTICE_SUBPAGES.map((subpage) => `${path}/${subpage}`)].map(
        (route) => [route, namespace] as const,
      ),
    ),
  )(
    "%s はレジストリの namespace（%s）と練習の共通の名前空間を読む",
    (route, namespace) => {
      expect(routeNamespaces(route)).toEqual(
        expect.arrayContaining([namespace, "challenge", "practice"]),
      );
    },
  );

  it("昇級試験は説明・play・training で模試の案内、result で合否を読む", () => {
    for (const [path] of PRACTICE_MENUS.filter(([menuPath]) =>
      menuPath.startsWith("/exam/"),
    )) {
      for (const route of [path, `${path}/play`, `${path}/training`]) {
        expect(routeNamespaces(route), route).toContain("examTraining");
      }
      expect(routeNamespaces(`${path}/result`)).toContain("examResult");
    }
  });

  it("練習一覧と道場は全練習の名前空間を読む（カードの variant ラベル）", () => {
    const all = PRACTICE_MENUS.map(([, namespace]) => namespace);
    expect(routeNamespaces("/practice")).toEqual(expect.arrayContaining(all));
    expect(routeNamespaces("/dojo")).toEqual(expect.arrayContaining(all));
  });

  it("面子の符の体験は確認問題の部品（lessons）を、和了形・聴牌形の設定は設定の名前空間を読む", () => {
    expect(routeNamespaces("/try/mentsu-fu")).toContain("lessons");
    for (const route of ["/practice/agari-score", "/practice/tenpai-score"]) {
      expect(routeNamespaces(route), route).toContain("settings");
    }
  });

  it.each(Object.keys(EN_ROUTE_NAMESPACES).map((route) => [route]))(
    "%s はランキングの名前空間を読まない（英語ではランキングを提供しない）",
    (route) => {
      expect(routeNamespaces(route)).not.toContain("leaderboard");
    },
  );

  it.each(Object.entries(EN_ROUTE_NAMESPACES))(
    "%s が読む名前空間はすべて完訳",
    (_route, namespaces) => {
      const notTranslated = namespaces.filter(
        (namespace) => !translated.has(namespace),
      );
      expect(notTranslated).toEqual([]);
    },
  );

  it.each(Object.entries(EN_ROUTE_NAMESPACES))(
    "%s はシェル（ヘッダー・ナビ・フッター・サイト名）の名前空間を含む",
    (_route, namespaces) => {
      expect(namespaces).toEqual(
        expect.arrayContaining([...EN_SHELL_NAMESPACES]),
      );
    },
  );

  it.each(EN_LESSON_ROUTES.map((route) => [route]))(
    "%s は章の名前空間（slug の camelCase）と章のレイアウトの名前空間を読み、確認問題の名前空間は読まない",
    (route) => {
      const namespaces = routeNamespaces(route);
      const camel = route
        .slice("/lessons/".length)
        .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      expect(namespaces).toEqual(
        expect.arrayContaining([
          camel,
          "learnCurriculum",
          "glossary",
          "company",
          "nativeAd",
          "scoreTable",
        ]),
      );
      expect(namespaces).not.toContain("lessons");
    },
  );

  it("満貫の 4 章は満貫の表、役の章は役名の名前空間を読む", () => {
    for (const route of [
      "/lessons/mangan-ko-ron",
      "/lessons/mangan-ko-tsumo",
      "/lessons/mangan-oya-ron",
      "/lessons/mangan-oya-tsumo",
    ] as const) {
      expect(EN_ROUTE_NAMESPACES[route]).toContain("manganScoreTable");
    }
    expect(EN_ROUTE_NAMESPACES["/lessons/yaku"]).toContain("yakuNames");
    expect(EN_ROUTE_NAMESPACES["/reference/yaku"]).toContain("yakuNames");
  });

  it("点数表は表と関連の早見表の名前空間を読む", () => {
    expect(EN_ROUTE_NAMESPACES["/reference/score-table"]).toEqual(
      expect.arrayContaining(["scoreTable", "reference"]),
    );
  });

  it("404 が読む名前空間はすべて完訳で、シェルを含む", () => {
    expect(
      EN_NOT_FOUND_NAMESPACES.filter((namespace) => !translated.has(namespace)),
    ).toEqual([]);
    expect([...EN_NOT_FOUND_NAMESPACES]).toEqual(
      expect.arrayContaining([...EN_SHELL_NAMESPACES, "notFound"]),
    );
  });
});
