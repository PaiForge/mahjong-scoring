import { useCallback, useEffect } from "react";
import { create } from "zustand";
import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";

import { useFocusRead, type FocusReadState } from "../lib/use-focus-read";
import { fetchPlan, type PlanApiFailure } from "./plan-api";

/**
 * プランの読み直しの合図。`version` が進むと、開いているプラン画面が読み直す
 *
 * 購入の同期（取引の記録）と復元は画面の外で終わるので、画面へは値ではなく
 * 「古くなった」ことだけを知らせ、画面が自分で読み直す。
 */
const usePlanVersionStore = create<{ readonly version: number }>(() => ({
  version: 0,
}));

/**
 * 開いているプラン画面に読み直させる
 * プラン再読み込み
 *
 * 取引を記録した後・復元の後に呼ぶ。画面が開いていなければ何もしない
 * （次に開いたときに読む）。
 */
export function invalidatePlan(): void {
  usePlanVersionStore.setState((state) => ({ version: state.version + 1 }));
}

/**
 * プランの状態を読み、画面を開くたび・{@link invalidatePlan} のたびに読み直す
 * プラン読み込み
 *
 * web で買った Pro・期限切れ・返金はアプリの外で変わるので、画面が前面に
 * 戻るたびに読み直す（{@link useFocusRead}）。
 */
export function usePlan(userId: string): {
  readonly state: FocusReadState<MobilePlanResponse, PlanApiFailure>;
  readonly reload: () => void;
} {
  const read = useCallback(async () => {
    const result = await fetchPlan(userId);
    return "value" in result ? result.value : { error: result.error };
  }, [userId]);
  const { state, reload } = useFocusRead(read);

  useEffect(() => usePlanVersionStore.subscribe(() => reload()), [reload]);

  return { state, reload };
}
