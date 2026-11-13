import { useCallback, useEffect } from "react";
import { create } from "zustand";
import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";

import { useFocusRead, type FocusReadState } from "../lib/use-focus-read";
import { clearPlanBenefitsCache } from "../practice/quota/use-practice-quota";
import { fetchPlan, type PlanApiFailure } from "./plan-api";
import { planToShowOf, type PlanSnapshot } from "./plan-snapshot";

/**
 * プランの読み直しの合図。`version` が進むと、開いているプラン画面が読み直す
 *
 * 購入の同期（取引の記録）と復元は画面の外で終わるので、画面へは「古くなった」
 * ことを知らせる。記録の応答のように新しいプランが手元にあるときは `snapshot`
 * に添え、画面は読み直さずにそれを出す（もう 1 往復を待たせない）。
 */
const usePlanVersionStore = create<{
  readonly version: number;
  readonly snapshot: PlanSnapshot | undefined;
}>(() => ({
  version: 0,
  snapshot: undefined,
}));

/**
 * 開いているプラン画面に読み直させる
 * プラン再読み込み
 *
 * 取引を記録した後・復元の後に呼ぶ。画面が開いていなければ何もしない
 * （次に開いたときに読む）。回数制限が控えている特典も捨てる。
 *
 * @param snapshot - 手元にある新しいプラン。渡せば、同じユーザーの画面は
 *   読み直さずにこれを出す
 */
export function invalidatePlan(snapshot?: PlanSnapshot): void {
  clearPlanBenefitsCache();
  usePlanVersionStore.setState((state) => ({
    version: state.version + 1,
    snapshot,
  }));
}

/**
 * プランの状態を読み、画面を開くたび・{@link invalidatePlan} のたびに読み直す
 * プラン読み込み
 *
 * web で買った Pro・期限切れ・返金はアプリの外で変わるので、画面が前面に
 * 戻るたびに読み直す（{@link useFocusRead}）。記録の応答に添えられたプランは
 * 読み直さずに出す（{@link invalidatePlan}）。
 */
export function usePlan(userId: string): {
  readonly state: FocusReadState<MobilePlanResponse, PlanApiFailure>;
  readonly reload: () => Promise<void>;
} {
  const read = useCallback(async () => {
    const result = await fetchPlan(userId);
    return "value" in result ? result.value : { error: result.error };
  }, [userId]);
  const { state, reload, replace } = useFocusRead(read);

  useEffect(
    () =>
      usePlanVersionStore.subscribe(({ snapshot }) => {
        const plan = planToShowOf(snapshot, userId);
        if (plan === undefined) void reload();
        else replace(plan);
      }),
    [reload, replace, userId],
  );

  return { state, reload };
}
