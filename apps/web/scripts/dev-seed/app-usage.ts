/**
 * ローカル開発用のアプリの利用の記録の投入
 * アプリ利用シード
 *
 * ローカルではアプリから API を叩かない限り記録が無く、管理画面のユーザー一覧の
 * 「アプリ」列と詳細の「アプリの最終利用」が全員「-」「未記録」になる。表示の
 * 出し分けを確かめられるよう、`app_usage` に行を入れる。
 *
 * - bob — iOS 1.1.0（30 日前に初めて使い、昨日最後に使った）
 * - erin — Android、版が読めなかった（10 日前に初めて使い、今日最後に使った）
 * - ほかのシードユーザー — 行なし（未記録）
 *
 * 宣言した状態へ消して入れ直す（購入・付与と同じ方針）。
 */
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { appUsage } from "../../src/lib/db/schema";

/** 投入先のユーザー（`ensureSeedUser` が返した id と username） */
export interface AppUsageSeedUser {
  readonly userId: string;
  readonly username: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** username → 記録（OS・版・何日前に初めて / 最後に使ったか） */
const USAGE_BY_USERNAME: Readonly<
  Record<
    string,
    {
      readonly platform: "ios" | "android";
      readonly appVersion: string | null;
      readonly firstDaysAgo: number;
      readonly lastDaysAgo: number;
    }
  >
> = {
  seed_bob: {
    platform: "ios",
    appVersion: "1.1.0",
    firstDaysAgo: 30,
    lastDaysAgo: 1,
  },
  seed_erin: {
    platform: "android",
    appVersion: null,
    firstDaysAgo: 10,
    lastDaysAgo: 0,
  },
};

/**
 * シードユーザーのアプリの利用の記録を宣言どおりに入れ直す
 * アプリ利用再投入
 *
 * @returns 投入した行数
 */
export async function reseedAppUsage(
  db: PostgresJsDatabase,
  users: readonly AppUsageSeedUser[],
  now: Date = new Date(),
): Promise<number> {
  const userIds = users.map((user) => user.userId);
  if (userIds.length === 0) return 0;

  const rows = users.flatMap((user) => {
    const usage = USAGE_BY_USERNAME[user.username];
    if (!usage) return [];
    return [
      {
        userId: user.userId,
        platform: usage.platform,
        appVersion: usage.appVersion,
        firstSeenAt: new Date(now.getTime() - usage.firstDaysAgo * DAY_MS),
        lastSeenAt: new Date(now.getTime() - usage.lastDaysAgo * DAY_MS),
      },
    ];
  });

  await db.transaction(async (tx) => {
    await tx.delete(appUsage).where(inArray(appUsage.userId, userIds));
    if (rows.length > 0) await tx.insert(appUsage).values(rows);
  });

  return rows.length;
}
