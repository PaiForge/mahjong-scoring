// @vitest-environment node
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq, sql } from "drizzle-orm";

import * as schema from "../db/schema";

vi.mock("../log-error", async () => await import("@/test/log-error-mock"));
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

import { writeAppUsage } from "./app-usage";

const url = process.env.CHALLENGE_TEST_DATABASE_URL;
const user = "44444444-4444-4444-8444-444444444444";
const IOS = { platform: "ios", appVersion: "1.1.0" } as const;

async function usageRow() {
  const [row] = await challengeTestDb()
    .select()
    .from(schema.appUsage)
    .where(eq(schema.appUsage.userId, user));
  return row;
}

/** 記録の日時を書き換える（前の日に書いた状態を作る） */
async function setSeenAt(firstSeenAt: string, lastSeenAt: string) {
  await challengeTestDb().execute(
    sql`UPDATE app_usage SET first_seen_at = ${firstSeenAt}::timestamptz, last_seen_at = ${lastSeenAt}::timestamptz`,
  );
}

/** いまの JST の日付の 0 時 0 分 1 秒（同じ日のうちに書いた状態を作る） */
const TODAY_JST_START = sql`((date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') + interval '1 second') AT TIME ZONE 'Asia/Tokyo')`;

// 明示されたローカル DB の一時テーブルだけを使う。本番・既存テーブルには触れない。
describe.skipIf(!url)("アプリの利用の記録（PostgreSQL）", () => {
  beforeAll(async () => {
    const db = challengeTestDb();
    await db.execute(
      `CREATE TEMP TABLE account_deletions (user_id uuid PRIMARY KEY, requested_at timestamptz NOT NULL DEFAULT now(), data_deleted_at timestamptz, storage_deleted_at timestamptz, auth_deleted_at timestamptz, apple_revoked_at timestamptz, completed_at timestamptz, attempts integer NOT NULL DEFAULT 0, last_attempt_at timestamptz, last_error text)`,
    );
    await db.execute(
      `CREATE TEMP TABLE app_usage (user_id uuid PRIMARY KEY, platform varchar(20) NOT NULL, app_version varchar(32), first_seen_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT app_usage_chk_platform CHECK (platform IN ('ios', 'android')))`,
    );
  });
  afterAll(async () => {
    await closeChallengeTestDb();
  });
  beforeEach(async () => {
    const db = challengeTestDb();
    await db.execute(`DELETE FROM account_deletions`);
    await db.execute(`DELETE FROM app_usage`);
  });

  it("初めての利用で行を作る（版が無ければ NULL）", async () => {
    expect(
      await writeAppUsage(user, { platform: "android", appVersion: undefined }),
    ).toBe(true);

    expect(await usageRow()).toMatchObject({
      platform: "android",
      appVersion: null,
    });
  });

  it("同じ日のうちに同じ申告が届いても書き直さない", async () => {
    await writeAppUsage(user, IOS);
    await challengeTestDb().execute(
      sql`UPDATE app_usage SET last_seen_at = ${TODAY_JST_START}`,
    );
    const before = await usageRow();

    await writeAppUsage(user, IOS);

    expect((await usageRow())?.lastSeenAt).toEqual(before?.lastSeenAt);
  });

  it("前の日以前に書いた人は、最後に使った日時だけを更新する", async () => {
    await writeAppUsage(user, IOS);
    await setSeenAt("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z");

    await writeAppUsage(user, IOS);

    const row = await usageRow();
    expect(row?.firstSeenAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(row?.lastSeenAt.getTime()).toBeGreaterThan(
      new Date("2026-01-02T00:00:00Z").getTime(),
    );
  });

  it("版か OS が変わったら、同じ日のうちでも書く", async () => {
    await writeAppUsage(user, IOS);
    await challengeTestDb().execute(
      sql`UPDATE app_usage SET last_seen_at = ${TODAY_JST_START}`,
    );

    await writeAppUsage(user, { platform: "ios", appVersion: "1.2.0" });
    expect((await usageRow())?.appVersion).toBe("1.2.0");

    await writeAppUsage(user, { platform: "android", appVersion: "1.2.0" });
    expect((await usageRow())?.platform).toBe("android");
  });

  it("退会を受け付けた人の行は作らない", async () => {
    await challengeTestDb().execute(
      sql`INSERT INTO account_deletions (user_id) VALUES (${user}::uuid)`,
    );

    expect(await writeAppUsage(user, IOS)).toBe(false);
    expect(await usageRow()).toBeUndefined();
  });

  it("知らない OS は DB の CHECK でも弾く", async () => {
    await expect(
      writeAppUsage(user, { platform: "web" as "ios", appVersion: undefined }),
    ).rejects.toThrow();
  });
});
