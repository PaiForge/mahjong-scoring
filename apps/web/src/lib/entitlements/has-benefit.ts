import { and, eq, gt, isNull, lte, or, type SQL } from "drizzle-orm";
import { cache } from "react";
import "server-only";

import {
  isPlanBenefit,
  type PlanBenefit,
} from "@mahjong-scoring/features/billing/plans";
import { benefitGrants, db, purchases } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

/**
 * 特典の判定 — 唯一の入口
 * 特典判定
 *
 * 「このユーザーは特典 X を持つか」はすべてここを通す。回数制限・拡張機能・
 * 将来の特典のどれも、特典の出どころ（購入 / 手動付与）や Stripe の事情を
 * 知らずに `hasBenefit(userId, PlanBenefit.X)` と聞けばよい。
 *
 * 判定の規則:
 *
 * - 取り消されていない（`revoked_at IS NULL`）
 * - 開始済み（`starts_at <= now`。旧データに開始待ちがあっても先に付与しない）
 * - 期限内か永久（`expires_at IS NULL OR expires_at > now`）
 *
 * を満たす購入行（`purchases`）と付与行（`benefit_grants`）の `benefits` の
 * 和集合に含まれれば true。契約状態や Webhook の到達に依らず時刻だけで
 * 失効するので、取りこぼしが永続の特典になる構造がない。
 *
 * @design fail-closed
 *
 * DB に届かなければ特典なし。払った人が一時的に無料版の扱いになる方が、
 * 払っていない人に特典が出るより軽い。ログは残す。
 *
 * @design React `cache()` でリクエスト内メモ化
 *
 * 1 回の描画で回数制限と拡張機能が別々に聞いても DB は 1 往復。リクエストを
 * 越えるキャッシュ（`unstable_cache`）は置かない — 購入直後に反映されない
 * 時間が生まれ、無効化のタグ運用が要る。購入は稀で、判定は購入者だけが
 * 払うコストなので、毎リクエスト 1 往復で足りる。
 */

/** 特典の出どころの表（購入・手動付与）。有効性の規則は同じ */
export type EntitlementTable = typeof purchases | typeof benefitGrants;

/**
 * 特典の出どころの行が「いま有効」である条件（上の判定の規則）。誰の行かは見ない
 * 有効特典条件
 *
 * 購入と付与で同じ規則を使うため、表を受け取って条件を組み立てる。
 * 本人の判定（{@link getActiveBenefits}）も、期限切れの通知が「まだ Pro の人」
 * を除くとき（`lib/notifications/plan-expiry.ts`）も、この条件を使う。
 * 規則を書き直すと判定と通知が食い違うので、ここ以外に有効性の条件を書かない。
 */
export function activeEntitlementConditions(
  table: EntitlementTable,
  now: Date,
): SQL[] {
  // `or()` は引数が無いと undefined を返す型だが、ここでは常に 2 つ渡すので
  // 値がある。型の都合で絞る
  const withinPeriod = or(isNull(table.expiresAt), gt(table.expiresAt, now));
  return [
    isNull(table.revokedAt),
    lte(table.startsAt, now),
    ...(withinPeriod ? [withinPeriod] : []),
  ];
}

/** 本人の行で「いま有効」なものの条件 */
function activeEntitlementWhere(
  table: EntitlementTable,
  userId: string,
  now: Date,
) {
  return and(
    eq(table.userId, userId),
    ...activeEntitlementConditions(table, now),
  );
}

/**
 * ユーザーが現在持つ特典の集合
 * 保有特典取得
 *
 * @param userId - ユーザー ID
 * @param now - 判定の基準時刻。テストから差し替えるために引数にしている。
 *   `cache()` の引数に含まれるので、同じリクエスト内でも違う時刻を渡せば再問い合わせになる
 */
export const getActiveBenefits = cache(
  async (
    userId: string,
    now: Date = new Date(),
  ): Promise<ReadonlySet<PlanBenefit>> => {
    try {
      // 購入と付与は同じ条件で並行に読む。表を増やしても判定の規則は 1 つ
      const [purchaseRows, grantRows] = await Promise.all([
        db
          .select({ benefits: purchases.benefits })
          .from(purchases)
          .where(activeEntitlementWhere(purchases, userId, now)),
        db
          .select({ benefits: benefitGrants.benefits })
          .from(benefitGrants)
          .where(activeEntitlementWhere(benefitGrants, userId, now)),
      ]);

      const benefits = new Set<PlanBenefit>();
      for (const row of [...purchaseRows, ...grantRows]) {
        for (const value of row.benefits) {
          if (isPlanBenefit(value)) benefits.add(value);
        }
      }
      return benefits;
    } catch (error) {
      logExternalError(
        "getActiveBenefits",
        "failed to load purchases and grants; treating as no benefits",
        error,
      );
      return new Set();
    }
  },
);

/**
 * ユーザーが特典を持つか
 * 特典保有判定
 */
export async function hasBenefit(
  userId: string,
  benefit: PlanBenefit,
  now?: Date,
): Promise<boolean> {
  const benefits = await getActiveBenefits(userId, now);
  return benefits.has(benefit);
}
