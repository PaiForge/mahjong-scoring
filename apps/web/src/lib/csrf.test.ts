/**
 * Route Handler の CSRF（Origin 検証）テスト
 *
 * @description
 * - 自分自身のホストと一致する Origin は通す（プレビュー環境でも env 設定が要らない）
 * - プロキシ越しは `x-forwarded-host` / `x-forwarded-proto` を見る
 * - 別オリジン・Origin 無しは弾く
 */
import { describe, expect, it } from "vitest";

import { isValidOrigin, originMatches } from "./csrf";

function request(headers: Record<string, string>): Request {
  return new Request("https://example.test/api/profile/avatar", {
    method: "POST",
    headers,
  });
}

describe("originMatches", () => {
  it("末尾スラッシュの有無を無視する", () => {
    expect(originMatches("https://a.test/", "https://a.test")).toBe(true);
    expect(originMatches("https://a.test", "https://a.test//")).toBe(true);
  });

  it("別ホストは一致しない", () => {
    expect(originMatches("https://a.test", "https://b.test")).toBe(false);
  });

  it("スキーム違いは一致しない", () => {
    expect(originMatches("http://a.test", "https://a.test")).toBe(false);
  });
});

describe("isValidOrigin", () => {
  it("リクエスト自身のホストと一致する Origin を通す", () => {
    expect(
      isValidOrigin(
        request({ origin: "https://example.test", host: "example.test" }),
      ),
    ).toBe(true);
  });

  it("プロキシ越しは x-forwarded-host / -proto を見る", () => {
    expect(
      isValidOrigin(
        request({
          origin: "https://preview.example.test",
          host: "internal:3000",
          "x-forwarded-host": "preview.example.test",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(true);
  });

  it("ローカル開発は http で照合する", () => {
    expect(
      isValidOrigin(
        request({ origin: "http://localhost:3000", host: "localhost:3000" }),
      ),
    ).toBe(true);
  });

  it("別オリジンは弾く", () => {
    expect(
      isValidOrigin(
        request({ origin: "https://evil.test", host: "example.test" }),
      ),
    ).toBe(false);
  });

  it("Origin ヘッダが無ければ弾く", () => {
    expect(isValidOrigin(request({ host: "example.test" }))).toBe(false);
  });
});
