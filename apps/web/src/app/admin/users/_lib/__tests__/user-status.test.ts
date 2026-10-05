import { describe, expect, it } from "vitest";

import { UserStatus, isAuthBanned, resolveUserStatus } from "../user-status";

const now = new Date("2026-06-01T00:00:00+09:00");
const at = new Date("2026-01-01T00:00:00+09:00");

/** Auth 側で BAN されていないユーザー */
const notBanned = { banned_until: undefined };
/** Auth 側で永久 BAN 中（100 年先の期限） */
const authBanned = { banned_until: "2126-06-01T00:00:00Z" };

describe("isAuthBanned", () => {
  it("banned_until が無ければ BAN されていない", () => {
    expect(isAuthBanned({ banned_until: undefined }, now)).toBe(false);
    expect(isAuthBanned({}, now)).toBe(false);
  });

  it("banned_until が未来なら BAN 中", () => {
    expect(isAuthBanned(authBanned, now)).toBe(true);
  });

  it("banned_until が過去なら期限切れで BAN されていない", () => {
    expect(isAuthBanned({ banned_until: "2026-05-01T00:00:00Z" }, now)).toBe(
      false,
    );
  });

  it("日時として読めない値は BAN 扱いにしない", () => {
    expect(isAuthBanned({ banned_until: "not-a-date" }, now)).toBe(false);
  });
});

describe("resolveUserStatus", () => {
  it("プロフィールが無く Auth でも BAN されていなければ仮登録", () => {
    expect(resolveUserStatus(undefined, notBanned, now)).toBe(
      UserStatus.Provisional,
    );
  });

  it("プロフィールが無くても Auth で BAN 中なら BAN 済み（仮登録の BAN を解除できる入口）", () => {
    expect(resolveUserStatus(undefined, authBanned, now)).toBe(
      UserStatus.Banned,
    );
  });

  it("退会日時があれば退会済み（BAN 中でも退会を優先する）", () => {
    expect(
      resolveUserStatus({ bannedAt: null, deletedAt: at }, notBanned, now),
    ).toBe(UserStatus.Deleted);
    expect(
      resolveUserStatus({ bannedAt: at, deletedAt: at }, authBanned, now),
    ).toBe(UserStatus.Deleted);
  });

  it("profiles.bannedAt だけがあれば BAN 済み（Auth と食い違っていても）", () => {
    expect(
      resolveUserStatus({ bannedAt: at, deletedAt: null }, notBanned, now),
    ).toBe(UserStatus.Banned);
  });

  it("Auth の BAN だけがあっても BAN 済み（Auth と食い違っていても）", () => {
    expect(
      resolveUserStatus({ bannedAt: null, deletedAt: null }, authBanned, now),
    ).toBe(UserStatus.Banned);
  });

  it("どちらにも無ければ有効", () => {
    expect(
      resolveUserStatus({ bannedAt: null, deletedAt: null }, notBanned, now),
    ).toBe(UserStatus.Active);
  });
});
