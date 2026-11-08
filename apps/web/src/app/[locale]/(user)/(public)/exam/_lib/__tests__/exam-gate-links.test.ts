/**
 * 受験ゲートの導線の解決（resolveExamGateLinks）のテスト
 *
 * @description
 * 行き先は公開状態で決まる。日本語では今までどおりの行き先、英語では
 * 英語で公開している道場・登録は英語の URL（未公開の先なら日本語の URL のまま
 * 言語をまたぐ印を付ける）。
 */
import { describe, expect, it } from "vitest";

import { resolveExamGateLinks } from "../exam-gate-links";

describe("resolveExamGateLinks", () => {
  it("日本語では登録・道場とも接頭辞なしのまま、言語をまたがない", () => {
    expect(resolveExamGateLinks("ja")).toEqual({
      signUp: { href: "/sign-up", crossLocale: false },
      dojo: { href: "/dojo", crossLocale: false },
    });
  });

  it("英語では登録・道場とも英語で公開しているので、英語のページへ言語をまたがずに送る", () => {
    expect(resolveExamGateLinks("en")).toEqual({
      signUp: { href: "/en/sign-up", crossLocale: false },
      dojo: { href: "/en/dojo", crossLocale: false },
    });
  });
});
