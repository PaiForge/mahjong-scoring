import { describe, expect, it } from "vitest";

import { UserStatus, resolveUserStatus } from "../user-status";

const at = new Date("2026-01-01T00:00:00+09:00");

describe("resolveUserStatus", () => {
  it("プロフィールが無ければ仮登録", () => {
    expect(resolveUserStatus(undefined)).toBe(UserStatus.Provisional);
  });

  it("退会日時があれば退会済み（BAN 中でも退会を優先する）", () => {
    expect(resolveUserStatus({ bannedAt: null, deletedAt: at })).toBe(
      UserStatus.Deleted,
    );
    expect(resolveUserStatus({ bannedAt: at, deletedAt: at })).toBe(
      UserStatus.Deleted,
    );
  });

  it("BAN 日時だけがあれば BAN 済み", () => {
    expect(resolveUserStatus({ bannedAt: at, deletedAt: null })).toBe(
      UserStatus.Banned,
    );
  });

  it("どちらも無ければ有効", () => {
    expect(resolveUserStatus({ bannedAt: null, deletedAt: null })).toBe(
      UserStatus.Active,
    );
  });
});
