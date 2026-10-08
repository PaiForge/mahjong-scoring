// @vitest-environment node
import { randomBytes } from "node:crypto";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq } from "drizzle-orm";

import * as schema from "../db/schema";

const mocked = vi.hoisted(() => ({
  exchange: vi.fn(),
  revoke: vi.fn(),
  linked: vi.fn(),
  encryptionKey: Buffer.alloc(32),
}));

vi.mock("server-only", () => ({}));
vi.mock("../log-error", () => ({ logExternalError: vi.fn() }));
vi.mock("./apple-id-api", () => ({
  exchangeAppleAuthorizationCode: mocked.exchange,
  revokeAppleRefreshToken: mocked.revoke,
}));
vi.mock("./identity", () => ({ hasAppleIdentity: mocked.linked }));
vi.mock("./config", () => ({
  readAppleServerConfig: () => ({
    teamId: "TEAM",
    keyId: "KEY",
    privateKey: "pem",
    encryptionKey: mocked.encryptionKey,
  }),
}));
vi.mock("../db", async () => {
  const { challengeTestDb } = await import("../challenge/test-database");
  return {
    db: process.env.CHALLENGE_TEST_DATABASE_URL ? challengeTestDb() : undefined,
    ...(await import("../db/schema")),
  };
});

import {
  challengeTestDb,
  closeChallengeTestDb,
} from "../challenge/test-database";
import {
  hasAppleRefreshToken,
  revokeAppleLinkForDeletion,
  storeAppleAuthorizationCode,
} from "./refresh-tokens";

const url = process.env.CHALLENGE_TEST_DATABASE_URL;
const user = "33333333-3333-4333-8333-333333333333";

/** Apple が交換の結果として返すもの（このユーザーの Apple の連携） */
function exchangedAs(refreshToken: string, subject = "apple-sub") {
  return { ok: true, refreshToken, subject };
}

// 明示されたローカル DB の一時テーブルだけを使う。本番・既存テーブルには触れない。
describe.skipIf(!url)(
  "Apple のトークンの保存と退会の取り消し（PostgreSQL）",
  () => {
    beforeAll(async () => {
      mocked.encryptionKey = randomBytes(32);
      const db = challengeTestDb();
      await db.execute(
        `CREATE TEMP TABLE account_deletions (user_id uuid PRIMARY KEY, requested_at timestamptz NOT NULL DEFAULT now(), data_deleted_at timestamptz, storage_deleted_at timestamptz, auth_deleted_at timestamptz, apple_revoked_at timestamptz, completed_at timestamptz, attempts integer NOT NULL DEFAULT 0, last_attempt_at timestamptz, last_error text)`,
      );
      await db.execute(
        `CREATE TEMP TABLE apple_refresh_tokens (user_id uuid PRIMARY KEY, apple_subject text NOT NULL, client_id text NOT NULL, encrypted_refresh_token text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
      );
    });
    afterAll(async () => {
      await closeChallengeTestDb();
    });
    beforeEach(async () => {
      vi.clearAllMocks();
      mocked.revoke.mockResolvedValue(undefined);
      mocked.linked.mockResolvedValue(true);
      const db = challengeTestDb();
      await db.execute(`DELETE FROM account_deletions`);
      await db.execute(`DELETE FROM apple_refresh_tokens`);
    });

    async function deletionRow() {
      const [row] = await challengeTestDb()
        .select()
        .from(schema.accountDeletions)
        .where(eq(schema.accountDeletions.userId, user));
      return row;
    }

    it("交換したトークンを暗号化して保存する", async () => {
      mocked.exchange.mockResolvedValue(exchangedAs("apple-refresh-1"));

      expect(await storeAppleAuthorizationCode(user, "apple-sub", "code")).toBe(
        "saved",
      );
      expect(await hasAppleRefreshToken(user)).toBe(true);
      const [row] = await challengeTestDb()
        .select()
        .from(schema.appleRefreshTokens);
      expect(row?.encryptedRefreshToken).not.toContain("apple-refresh-1");
    });

    it("交換の結果が別の Apple アカウントなら保存しない", async () => {
      mocked.exchange.mockResolvedValue(exchangedAs("other", "other-sub"));

      expect(await storeAppleAuthorizationCode(user, "apple-sub", "code")).toBe(
        "rejected",
      );
      expect(await hasAppleRefreshToken(user)).toBe(false);
    });

    it("退会の取り消しは、保存したトークンを Apple に取り消させてから済みにする", async () => {
      mocked.exchange.mockResolvedValue(exchangedAs("apple-refresh-1"));
      await storeAppleAuthorizationCode(user, "apple-sub", "code");
      await challengeTestDb()
        .insert(schema.accountDeletions)
        .values({ userId: user });

      await revokeAppleLinkForDeletion(user);

      expect(mocked.revoke).toHaveBeenCalledWith(
        expect.anything(),
        "help.mahjong.score",
        "apple-refresh-1",
      );
      expect(await hasAppleRefreshToken(user)).toBe(false);
      expect((await deletionRow())?.appleRevokedAt).toBeInstanceOf(Date);
    });

    it("Apple の連携があるのにトークンが無ければ、済みにせずに投げる", async () => {
      await challengeTestDb()
        .insert(schema.accountDeletions)
        .values({ userId: user });

      await expect(revokeAppleLinkForDeletion(user)).rejects.toThrow(
        "linked but no token",
      );
      expect((await deletionRow())?.appleRevokedAt).toBeNull();
    });

    it("Apple の連携が無ければ、取り消すものは無いので済みにする", async () => {
      mocked.linked.mockResolvedValue(false);
      await challengeTestDb()
        .insert(schema.accountDeletions)
        .values({ userId: user });

      await revokeAppleLinkForDeletion(user);

      expect(mocked.revoke).not.toHaveBeenCalled();
      expect((await deletionRow())?.appleRevokedAt).toBeInstanceOf(Date);
    });

    it("退会が完了した後に届いたトークンも保存し、Apple の工程と完了を未了へ戻す", async () => {
      await challengeTestDb().insert(schema.accountDeletions).values({
        userId: user,
        appleRevokedAt: new Date(),
        completedAt: new Date(),
      });
      mocked.exchange.mockResolvedValue(exchangedAs("late-refresh"));

      expect(await storeAppleAuthorizationCode(user, "apple-sub", "code")).toBe(
        "saved",
      );
      expect(await deletionRow()).toMatchObject({
        appleRevokedAt: null,
        completedAt: null,
      });

      // cron が拾い直して取り消す
      await revokeAppleLinkForDeletion(user);
      expect(mocked.revoke).toHaveBeenCalledWith(
        expect.anything(),
        "help.mahjong.score",
        "late-refresh",
      );
      expect(await hasAppleRefreshToken(user)).toBe(false);
    });

    it("取り消している間に新しいトークンが保存されたら、それも取り消してから済みにする", async () => {
      mocked.exchange.mockResolvedValue(exchangedAs("first"));
      await storeAppleAuthorizationCode(user, "apple-sub", "code-1");
      await challengeTestDb()
        .insert(schema.accountDeletions)
        .values({ userId: user });
      mocked.revoke.mockImplementationOnce(async () => {
        mocked.exchange.mockResolvedValue(exchangedAs("second"));
        await storeAppleAuthorizationCode(user, "apple-sub", "code-2");
      });

      await revokeAppleLinkForDeletion(user);

      expect(mocked.revoke.mock.calls.map((call) => call[2])).toEqual([
        "first",
        "second",
      ]);
      expect(await hasAppleRefreshToken(user)).toBe(false);
      expect((await deletionRow())?.appleRevokedAt).toBeInstanceOf(Date);
    });
  },
);
