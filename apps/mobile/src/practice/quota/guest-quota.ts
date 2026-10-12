import { z } from "zod";
import {
  consumeUsage,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import {
  EMPTY_QUOTA_COUNTS,
  QUOTA_MENUS,
  type QuotaCounts,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

/**
 * ゲストの回数制限の数え方（純粋な状態遷移）
 * ゲスト回数
 *
 * ログインしていない人（とユーザー名を決めていない人）の「今日始めた問題数」を
 * 端末の中で数える。上限は `PRACTICE_QUOTA_LIMITS[menu].anonymous`、日付の境界は
 * サーバーと同じ JST（`jstDayKey`）。保存は `guest-quota-storage.ts` が持ち、
 * ここは保存した値から次の値を計算するだけ。
 *
 * @design 改ざん防止を持たない
 *
 * web の未ログインは署名付き cookie で数えるが、cookie を消せば枠が戻る弱い
 * 制限であることは同じ。端末の中の値に署名を付けても、アプリを入れ直せば
 * 消える。ログインすればサーバーで数えるので、ゲストの枠は「どんな練習か」を
 * 見せる分だけの目安として扱う。
 */

/**
 * ゲストの今日の利用状況
 * ゲスト利用状況
 *
 * `day` は JST の日付（`jstDayKey`）。日が変われば `counts` は 0 に戻す。
 */
export interface GuestQuotaState {
  readonly day: string;
  readonly counts: QuotaCounts;
}

/**
 * その日の利用状況を返す。保存が無い・日が違うなら 0 から
 * ゲスト日付切り替え
 *
 * @param day - 今日の JST の日付（`jstDayKey`）
 */
export function guestQuotaForDay(
  state: GuestQuotaState | undefined,
  day: string,
): GuestQuotaState {
  if (state?.day === day) return state;
  return { day, counts: EMPTY_QUOTA_COUNTS };
}

/**
 * 1 問消費する。上限に達していれば数を変えずに不許可
 * ゲスト消費
 *
 * 判定の規則は web・サーバーと同じ `consumeUsage`。
 */
export function consumeGuestQuota(
  state: GuestQuotaState,
  menu: QuotaMenu,
  limit: number,
): { readonly state: GuestQuotaState; readonly usage: QuotaUsage } {
  const used = state.counts[menu];
  const usage = consumeUsage(limit, used);
  if (!usage.allowed) return { state, usage };
  return {
    state: { ...state, counts: { ...state.counts, [menu]: used + 1 } },
    usage,
  };
}

const countSchema = z.number().int().nonnegative();

const stateSchema = z.object({
  day: z.string(),
  counts: z.record(z.string(), z.unknown()),
});

/**
 * 保存した値を読む。形が違えば undefined
 * ゲスト利用状況検証
 *
 * 数が壊れている練習・保存した版に無い練習は 0 にする（他の練習の数は捨てない）。
 */
export function parseGuestQuotaState(
  value: unknown,
): GuestQuotaState | undefined {
  const parsed = stateSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const stored = parsed.data.counts;
  const countOf = (menu: QuotaMenu): number => {
    const count = countSchema.safeParse(stored[menu]);
    return count.success ? count.data : 0;
  };
  const counts: Record<QuotaMenu, number> = { ...EMPTY_QUOTA_COUNTS };
  for (const menu of QUOTA_MENUS) {
    counts[menu] = countOf(menu);
  }
  return { day: parsed.data.day, counts };
}
