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
 * 英語で公開するレッスンの章（目次の 20 章から、はじめに `about-this-app` を除く 19 章）
 *
 * messages はカリキュラムのレジストリ（features）に依存しないので写して持つ。
 * 写し元は features `curriculum/registry.ts` の章の slug と、web
 * `i18n/translated-publications.ts` の許可リスト（アプリ側の
 * `publication-gate.test.ts` が許可リストとこの表のキーの一致を検査する）。
 */
const EN_LESSON_ROUTES = [
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
  it("英語で公開するルートは公開単位の表どおり（用語のページはテンプレートで 1 行）", () => {
    expect(Object.keys(EN_ROUTE_NAMESPACES)).toEqual([
      "/",
      "/lessons",
      ...EN_LESSON_ROUTES,
      "/reference",
      "/reference/yaku",
      "/reference/glossary",
      "/reference/glossary/[slug]",
      "/reference/score-table",
    ]);
  });

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
      const namespaces: readonly string[] =
        EN_ROUTE_NAMESPACES[route as keyof typeof EN_ROUTE_NAMESPACES];
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
