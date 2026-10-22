import { useMemo, type ReactNode } from "react";
import {
  HandPresentationContext,
  HandPresentationNoticeContext,
  useHandPresentationContextValue,
  useHandPresentationPreparation,
  type HandPresentationBenefitsResult,
} from "@mahjong-scoring/features/board/use-hand-presentation";

import { useAuth } from "../auth/use-auth";
import { toHandPresentationAuth } from "./hand-presentation-auth";
import { fetchPlan } from "../billing/plan-api";
import { IAP_AVAILABLE } from "../billing/iap-availability";
import {
  useDisplaySettingsHydration,
  useDisplaySettingsStore,
} from "../hooks/use-display-settings-store";

/**
 * そのユーザーの特典を読む（見せ方の準備用）
 *
 * プラン画面と同じ API を、準備のために 1 度だけ読む。送る名義は `userId` に限る
 * （`fetchPlan` の `asUser`。読む前に別のユーザーへ切り替わっていれば送らずに
 * 失敗になる）。失敗の理由は区別せず取得不能として扱う。プラン画面の
 * `usePlan` / `useFocusRead` の読み直しは、準備の完了条件にしない。
 */
async function fetchUserBenefits(
  userId: string,
): Promise<HandPresentationBenefitsResult> {
  const result = await fetchPlan(userId);
  return "error" in result
    ? { ok: false }
    : { ok: true, benefits: result.value.benefits };
}

interface HandPresentationProviderProps {
  /** 見せ方が決まるまでに出すもの（本体と同じ見出しの画面） */
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

/**
 * 練習の手牌の見せ方を決めてから練習を始める Provider（モバイル）
 * 手牌表示 Provider
 *
 * web の `HandPresentationProvider` と同じ役目。決まるまで子をマウントしない
 * （記録付きチャレンジの開始・カウントダウン・出題は子の側）。決まった見せ方は
 * この画面がマウントされている間は変えない — プラン画面を積んで戻る・アプリが
 * 前面へ戻る・画面にフォーカスが戻るだけでは決め直さない。練習を閉じて開き直すと
 * 決め直す。この機能のためにフォーカスの復帰で盤面を作り直さない。
 *
 * Android は Pro を扱わないので（`IAP_AVAILABLE`）、待たずに従来の見せ方（正規の向き・理牌した順）で始める。
 * 練習・昇級試験のチャレンジ・トレーニング（模試）と無限訓練に置く。
 */
export function HandPresentationProvider({
  fallback,
  children,
}: HandPresentationProviderProps) {
  const hydration = useDisplaySettingsHydration();
  const savedOrientation = useDisplaySettingsStore((s) => s.tileOrientation);
  const savedOrder = useDisplaySettingsStore((s) => s.tileOrder);
  const { status, user } = useAuth();
  const userId = user?.id;
  const auth = useMemo(
    () => toHandPresentationAuth(status, userId),
    [status, userId],
  );

  const preparation = useHandPresentationPreparation({
    supported: IAP_AVAILABLE,
    settingsStatus: hydration,
    savedOrientation,
    savedOrder,
    auth,
    fetchBenefits: fetchUserBenefits,
  });

  const value = useHandPresentationContextValue(preparation);

  if (preparation.status === "pending" || value === undefined) return fallback;
  return (
    <HandPresentationContext.Provider value={value}>
      <HandPresentationNoticeContext.Provider
        value={preparation.fallbackReason !== undefined}
      >
        {children}
      </HandPresentationNoticeContext.Provider>
    </HandPresentationContext.Provider>
  );
}
