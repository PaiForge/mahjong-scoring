import { describe, expect, it } from "vitest";

import {
  mobilePublicProfileApiPath,
  parseMobilePublicProfileResponse,
} from "./mobile-api";

describe("mobilePublicProfileApiPath", () => {
  it("ユーザー名を 1 つのパスの区切りとして埋め込む", () => {
    expect(mobilePublicProfileApiPath("a/b")).toBe(
      "/api/mobile/v1/users/a%2Fb",
    );
  });
});

describe("parseMobilePublicProfileResponse", () => {
  it("ブロック中は中身の無い応答も読む", () => {
    expect(
      parseMobilePublicProfileResponse({
        username: "bob",
        relation: "blocking",
      }),
    ).toEqual({ username: "bob", relation: "blocking" });
  });

  it("知らない関係なら undefined", () => {
    expect(
      parseMobilePublicProfileResponse({ username: "bob", relation: "friend" }),
    ).toBeUndefined();
  });
});
