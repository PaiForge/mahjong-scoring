import { describe, expect, it } from "vitest";

import { mobileAppleTokenRequestSchema } from "./apple";

describe("mobileAppleTokenRequestSchema", () => {
  it("1 文字から 1024 文字までの認可コードを受け付ける", () => {
    for (const authorizationCode of ["c", "c".repeat(1024)]) {
      expect(
        mobileAppleTokenRequestSchema.safeParse({ authorizationCode }),
      ).toEqual({ success: true, data: { authorizationCode } });
    }
  });

  it("空の認可コードは断る", () => {
    expect(
      mobileAppleTokenRequestSchema.safeParse({ authorizationCode: "" })
        .success,
    ).toBe(false);
  });

  it("1024 文字を超える認可コードは断る", () => {
    expect(
      mobileAppleTokenRequestSchema.safeParse({
        authorizationCode: "c".repeat(1025),
      }).success,
    ).toBe(false);
  });

  it("認可コードが無い・文字列でない要求は断る", () => {
    expect(mobileAppleTokenRequestSchema.safeParse({}).success).toBe(false);
    expect(
      mobileAppleTokenRequestSchema.safeParse({ authorizationCode: 1 }).success,
    ).toBe(false);
  });
});
