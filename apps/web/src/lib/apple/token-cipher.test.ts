import { randomBytes } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { decryptToken, encryptToken } from "./token-cipher";

vi.mock("server-only", () => ({}));

const KEY = randomBytes(32);

describe("encryptToken / decryptToken", () => {
  it("暗号化したものを同じ鍵で戻せる", () => {
    const encrypted = encryptToken("r.apple-refresh-token", KEY);
    expect(encrypted).not.toContain("apple-refresh-token");
    expect(decryptToken(encrypted, KEY)).toBe("r.apple-refresh-token");
  });

  it("同じトークンでも毎回違う暗号文になる", () => {
    expect(encryptToken("token", KEY)).not.toBe(encryptToken("token", KEY));
  });

  it("鍵が違えば戻せない", () => {
    expect(decryptToken(encryptToken("token", KEY), randomBytes(32))).toBe(
      undefined,
    );
  });

  it("改ざんされたものは戻せない", () => {
    const [version, iv, tag, body] = encryptToken("token", KEY).split(".");
    const flipped = Buffer.from(body ?? "", "base64url");
    flipped[0] = (flipped[0] ?? 0) ^ 1;
    expect(
      decryptToken(
        [version, iv, tag, flipped.toString("base64url")].join("."),
        KEY,
      ),
    ).toBe(undefined);
  });

  it("形式が違えば戻せない", () => {
    expect(decryptToken("plain-token", KEY)).toBe(undefined);
    expect(decryptToken("v2.a.b.c", KEY)).toBe(undefined);
  });
});
