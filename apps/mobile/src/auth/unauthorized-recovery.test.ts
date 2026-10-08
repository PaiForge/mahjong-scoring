import { describe, expect, it } from "vitest";

import { decideUnauthorizedRecovery } from "./unauthorized-recovery";

const A = { userId: "user-a", accessToken: "token-a1" };

describe("decideUnauthorizedRecovery", () => {
  it("応答を待つ間に別のユーザーでログインし直していたら、今のログインに触らない", () => {
    expect(
      decideUnauthorizedRecovery(A, {
        userId: "user-b",
        accessToken: "token-b",
      }),
    ).toEqual({ kind: "ignore" });
  });

  it("応答を待つ間にログアウトしていたら何もしない", () => {
    expect(decideUnauthorizedRecovery(A, undefined)).toEqual({
      kind: "ignore",
    });
  });

  it("同じユーザーのトークンが更新済みなら、新しいトークンで送り直す", () => {
    expect(
      decideUnauthorizedRecovery(A, {
        userId: "user-a",
        accessToken: "token-a2",
      }),
    ).toEqual({ kind: "retry", accessToken: "token-a2" });
  });

  it("送ったトークンがまだ今のものなら、更新させてから決める", () => {
    expect(decideUnauthorizedRecovery(A, A)).toEqual({ kind: "refresh" });
  });
});
