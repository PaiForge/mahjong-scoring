import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { cache } from "react";
import "server-only";

import { isPlanBenefit, type PlanBenefit } from "@/lib/billing/plans";
import { db, purchases } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

/**
 * 特典の判定 — 唯一の入口
 * 特典判定
 *
 * 「このユーザーは特典 X を持つか」はすべてここを通す。回数制限・拡張機能・
 * 将来の特典のどれも、購入の種類（パス / 買い切り）や Stripe の事情を知らずに
 * `hasBenefit(userId, PlanBenefit.X)` と聞けばよい。
 *
 * 判定の規則:
 *
 * - 取り消されていない（`revoked_at IS NULL`）
 * - 開始済み（`starts_at <= now`。重ね買いしたパスは前のパスの期限から始まる）
 * - 期限内か永久（`expires_at IS NULL OR expires_at > now`）
 *
 * を満たす購入行の `benefits` の和集合に含まれれば true。契約状態や Webhook の
 * 到達に依らず時刻だけで失効するので、取りこぼしが永続の特典になる構造がない。
 *
 * @design fail-closed
 *
 * DB に届かなければ特典なし。払った人が一時的に無料版の扱いになる方が、
 * 払っていない人に特典が出るより軽い。ログは残す。
 *
 * @design React `cache()` でリクエスト内メモ化
 *
 * 1 回の描画で回数制限と拡張機能が別々に聞いても DB は 1 回。リクエストを
 * 越えるキャッシュ（`unstable_cache`）は置かない — 購入直後に反映されない
 * 時間が生まれ、無効化のタグ運用が要る。購入は稀で、判定は購入者だけが
 * 払うコストなので、毎リクエスト 1 クエリで足りる。
 */

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
      const rows = await db
        .select({ benefits: purchases.benefits })
        .from(purchases)
        .where(
          and(
            eq(purchases.userId, userId),
            isNull(purchases.revokedAt),
            lte(purchases.startsAt, now),
            or(isNull(purchases.expiresAt), gt(purchases.expiresAt, now)),
          ),
        );

      const benefits = new Set<PlanBenefit>();
      for (const row of rows) {
        for (const value of row.benefits) {
          if (isPlanBenefit(value)) benefits.add(value);
        }
      }
      return benefits;
    } catch (error) {
      logExternalError(
        "getActiveBenefits",
        "failed to load purchases; treating as no benefits",
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
