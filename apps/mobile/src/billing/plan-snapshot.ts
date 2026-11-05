import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";

/**
 * 書き込みの応答に添えられた、その時点のプラン（誰のものか付きで）
 * プランのスナップショット
 *
 * 取引の記録の応答は記録後のプランを含む（`MobileAppleTransactionResponse`）。
 * 画面に渡すときに、誰の名義で送った応答かを添える — 記録は画面の外
 * （ルートの購入の同期）で終わるので、その間にログインが切り替わっていることが
 * ありうる。
 */
export interface PlanSnapshot {
  readonly userId: string;
  readonly plan: MobilePlanResponse;
}

/**
 * プランの読み直しの合図を受けた画面が、読み直さずに出せるプラン。無ければ読み直す
 * 出せるプラン
 *
 * スナップショットがあり、画面のユーザーと同じ名義のものだけを出す。別の名義の
 * スナップショット（切り替え前のアカウントの記録が、切り替え後に終わった）は
 * その人のプランではないので出さず、読み直す。
 *
 * @param snapshot - 合図に添えられたプラン。読み直すだけの合図なら undefined
 * @param userId - 画面を開いているユーザー
 */
export function planToShowOf(
  snapshot: PlanSnapshot | undefined,
  userId: string,
): MobilePlanResponse | undefined {
  return snapshot?.userId === userId ? snapshot.plan : undefined;
}
