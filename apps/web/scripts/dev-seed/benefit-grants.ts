/**
 * ローカル開発用の特典の手動付与の投入
 * 付与シード
 *
 * 「購入は無いが運営から Pro を付与されている」状態をログインするだけで
 * 確認できるよう、`benefit_grants` に行を入れる。マイページの「Pro（付与）」
 * と「付与された特典」、管理画面の付与一覧（`/admin/benefit-grants`）の
 * 取り消しがこれで試せる。
 *
 * - dave — 60 日の付与 1 件（5 日前に付与、理由「モニター」）。購入なし
 *
 * 付与者は seed_admin。宣言した状態へ消して入れ直す（購入と同じ方針）。
 * 管理画面でシードユーザーに付与・取り消ししても次の実行で戻る。
 */
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { PLANS } from "../../src/lib/billing/plans";
import { benefitGrants, type NewBenefitGrant } from "../../src/lib/db/schema";

/** 投入先のユーザー（`ensureSeedUser` が返した id と username） */
export interface GrantSeedUser {
  readonly userId: string;
  readonly username: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFrom(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/** username → 投入する行を作る関数（`grantedBy` は seed_admin の id） */
const GRANTS_BY_USERNAME: Readonly<
  Record<
    string,
    (userId: string, grantedBy: string, now: Date) => readonly NewBenefitGrant[]
  >
> = {
  seed_dave: (userId, grantedBy, now) => {
    const startsAt = daysFrom(now, -5);
    return [
      {
        userId,
        plan: PLANS.pro.key,
        benefits: [...PLANS.pro.benefits],
        reason: "モニター協力（シード）",
        grantedBy,
        startsAt,
        expiresAt: daysFrom(startsAt, 60),
        createdAt: startsAt,
      },
    ];
  },
};

/**
 * シードユーザーへの付与を宣言どおりに入れ直す
 * 付与再投入
 *
 * @param users - 投入先の候補（付与者の seed_admin もここから引く）
 * @returns 投入した行数
 */
export async function reseedBenefitGrants(
  db: PostgresJsDatabase,
  users: readonly GrantSeedUser[],
  now: Date = new Date(),
): Promise<number> {
  const userIds = users.map((user) => user.userId);
  if (userIds.length === 0) return 0;

  const admin = users.find((user) => user.username === "seed_admin");
  if (!admin) {
    throw new Error("dev-seed: 付与者となる seed_admin がいません");
  }

  const rows = users.flatMap(
    (user) =>
      GRANTS_BY_USERNAME[user.username]?.(user.userId, admin.userId, now) ?? [],
  );

  await db.transaction(async (tx) => {
    await tx
      .delete(benefitGrants)
      .where(inArray(benefitGrants.userId, userIds));
    if (rows.length > 0) await tx.insert(benefitGrants).values([...rows]);
  });

  return rows.length;
}
