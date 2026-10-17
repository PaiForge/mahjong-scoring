import { describe, expect, it } from "vitest";

import { toHandPresentationAuth } from "./hand-presentation-auth";

describe("toHandPresentationAuth", () => {
  it("接続先の無いビルドとゲストは未ログイン", () => {
    expect(toHandPresentationAuth("unavailable", undefined)).toEqual({
      kind: "signedOut",
    });
    expect(toHandPresentationAuth("signedOut", undefined)).toEqual({
      kind: "signedOut",
    });
  });

  it("セッションを読んでいる間は読み込み中", () => {
    expect(toHandPresentationAuth("loading", undefined)).toEqual({
      kind: "loading",
    });
  });

  it("ログイン中でもユーザーがまだ無ければ未ログインと決めずに待つ", () => {
    expect(toHandPresentationAuth("signedIn", undefined)).toEqual({
      kind: "loading",
    });
  });

  it("ログイン中はそのユーザー", () => {
    expect(toHandPresentationAuth("signedIn", "u1")).toEqual({
      kind: "signedIn",
      userId: "u1",
    });
  });
});
