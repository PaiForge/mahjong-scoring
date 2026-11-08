/**
 * Google の OAuth の戻り先のテスト
 *
 * @description
 * - 日本語: 戻り先の文字列は従来と同じ（`locale` 無し、`next` は指定があるときだけ）。
 *   本番の Supabase の Redirect URLs の許可リストと照合される文字列を変えない
 * - 英語: `locale=en` と言語付きの `next`（未指定なら `/en/mypage`）を付ける
 */
import { describe, expect, it } from "vitest";

import { buildOAuthCallbackTarget } from "../oauth-callback-url";

const ORIGIN = "https://example.test";

describe("buildOAuthCallbackTarget", () => {
  it("日本語で戻り先の指定が無ければ、従来どおり query の無い /auth/callback", () => {
    expect(buildOAuthCallbackTarget(ORIGIN, "ja", undefined)).toEqual({
      redirectTo: `${ORIGIN}/auth/callback`,
      landing: "/mypage",
    });
  });

  it("日本語で戻り先の指定があれば、従来どおり next だけを付ける", () => {
    expect(
      buildOAuthCallbackTarget(ORIGIN, "ja", "/practice/jantou-fu"),
    ).toEqual({
      redirectTo: `${ORIGIN}/auth/callback?next=%2Fpractice%2Fjantou-fu`,
      landing: "/practice/jantou-fu",
    });
  });

  it("英語で戻り先の指定が無ければ、locale=en と英語のマイページの next", () => {
    expect(buildOAuthCallbackTarget(ORIGIN, "en", undefined)).toEqual({
      redirectTo: `${ORIGIN}/auth/callback?locale=en&next=%2Fen%2Fmypage`,
      landing: "/en/mypage",
    });
  });

  it("英語で戻り先の指定があれば、locale=en とその next", () => {
    expect(
      buildOAuthCallbackTarget(ORIGIN, "en", "/en/practice/jantou-fu"),
    ).toEqual({
      redirectTo: `${ORIGIN}/auth/callback?locale=en&next=%2Fen%2Fpractice%2Fjantou-fu`,
      landing: "/en/practice/jantou-fu",
    });
  });
});
