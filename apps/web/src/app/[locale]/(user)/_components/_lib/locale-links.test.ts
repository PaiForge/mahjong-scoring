import { describe, expect, it } from "vitest";

import { LOCALE_LINK_TABLE } from "./locale-link-table";
import {
  languageOptions,
  preservedSearch,
  resolveNavTarget,
  type LocaleLinks,
} from "./locale-links";

const ja: LocaleLinks = { locale: "ja", table: LOCALE_LINK_TABLE };
const en: LocaleLinks = { locale: "en", table: LOCALE_LINK_TABLE };

describe("LOCALE_LINK_TABLE", () => {
  it("英語で公開している点数表は、日本語を接頭辞なし・英語を /en で持つ", () => {
    expect(LOCALE_LINK_TABLE["/reference/score-table"]).toEqual({
      ja: "/reference/score-table",
      en: "/en/reference/score-table",
    });
  });

  it("英語で未公開のページは持たない", () => {
    expect(LOCALE_LINK_TABLE["/leaderboard"]).toBeUndefined();
  });
});

describe("resolveNavTarget", () => {
  it("日本語のページでは href を変えない", () => {
    expect(resolveNavTarget("/practice?x=1", ja)).toEqual({
      href: "/practice?x=1",
      crossLocale: false,
    });
  });

  it("英語のページから英語で公開しているページへは /en を付ける（query は残す）", () => {
    expect(resolveNavTarget("/reference/score-table?role=oya", en)).toEqual({
      href: "/en/reference/score-table?role=oya",
      crossLocale: false,
    });
  });

  it("英語のページから英語で未公開のページへは /en を付けず、言語をまたぐと示す", () => {
    expect(resolveNavTarget("/leaderboard", en)).toEqual({
      href: "/leaderboard",
      crossLocale: true,
    });
  });
});

describe("preservedSearch", () => {
  it("許可リストのキーだけを残す（認証の値を写さない）", () => {
    expect(preservedSearch("?role=oya&code=secret&han=3&email=a%40b")).toBe(
      "?role=oya&han=3",
    );
  });

  it("残らなければ空文字", () => {
    expect(preservedSearch("token=x")).toBe("");
    expect(preservedSearch("")).toBe("");
  });
});

describe("languageOptions", () => {
  it("日本語の点数表からは英語の対訳へ（/ja を経由しない）", () => {
    expect(languageOptions("/reference/score-table", "", ja)).toEqual([
      { kind: "current", locale: "ja" },
      { kind: "link", locale: "en", href: "/en/reference/score-table" },
    ]);
  });

  it("英語の点数表からは接頭辞なしの日本語へ", () => {
    expect(languageOptions("/en/reference/score-table", "", en)).toEqual([
      { kind: "link", locale: "ja", href: "/reference/score-table" },
      { kind: "current", locale: "en" },
    ]);
  });

  it("内部 URL（/ja/...）の pathname でも同じ対訳へ", () => {
    expect(languageOptions("/ja/reference/score-table", "", ja)[1]).toEqual({
      kind: "link",
      locale: "en",
      href: "/en/reference/score-table",
    });
  });

  it("対訳の無いページでは英語をリンクにしない（別の英語ページへ向けない）", () => {
    expect(languageOptions("/leaderboard", "", ja)).toEqual([
      { kind: "current", locale: "ja" },
      { kind: "unavailable", locale: "en" },
    ]);
  });

  it("注目セルの query は引き継ぎ、それ以外は落とす", () => {
    expect(
      languageOptions("/reference/score-table", "role=oya&fu=40&code=x", ja)[1],
    ).toEqual({
      kind: "link",
      locale: "en",
      href: "/en/reference/score-table?role=oya&fu=40",
    });
  });
});
