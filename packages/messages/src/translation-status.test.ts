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
  it("フェーズ 1 の英語ページは点数表だけ", () => {
    expect(Object.keys(EN_ROUTE_NAMESPACES)).toEqual([
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
