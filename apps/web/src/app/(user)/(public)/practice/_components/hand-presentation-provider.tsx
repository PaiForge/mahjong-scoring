"use client";

import { useMemo, type ReactNode } from "react";
import {
  HandPresentationContext,
  HandPresentationNoticeContext,
  toHandPresentationContextValue,
  useHandPresentationPreparation,
  type HandPresentationAuth,
  type HandPresentationBenefitsResult,
} from "@mahjong-scoring/features/board/use-hand-presentation";

import { useAuth } from "@/app/_contexts/auth-context";
import { useIsClient } from "@/app/_hooks/use-is-client";
import {
  useDisplaySettingsHydration,
  useDisplaySettingsStore,
} from "@/app/_hooks/use-display-settings-store";
import { fetchViewerProfile } from "@/app/_lib/viewer-profile";

/**
 * 閲覧者の特典を読む（見せ方の準備用）
 *
 * ヘッダーと同じ `/api/profile/me` を、準備のために 1 度だけ読む。応答は cookie の
 * 閲覧者のもので、引数のユーザー ID は使わない（ユーザーが変われば準備側が
 * 古い応答を捨てて読み直す）。プロフィールが無い（未作成・取得失敗のどちらも
 * undefined で区別できない）ときは取得不能として扱う — 通信エラーとは断定しない。
 * AuthProvider の `profile` は読み直しのたびに変わるため、準備の完了条件にしない。
 */
async function fetchViewerBenefits(): Promise<HandPresentationBenefitsResult> {
  const profile = await fetchViewerProfile();
  return profile === undefined
    ? { ok: false }
    : { ok: true, benefits: profile.benefits };
}

interface HandPresentationProviderProps {
  /**
   * 見せ方が決まるまでに出すもの（既存のスケルトン）
   *
   * サーバー描画とハイドレーションの最初の描画もこれになる。本体と同じ
   * アンカー・高さを持つものを渡す。
   */
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

/**
 * 練習の手牌の見せ方を決めてから練習を始める Provider（web）
 * 手牌表示 Provider
 *
 * 決まるまでは子をマウントしない — チャレンジの開始 API・カウントダウン・
 * 問題の生成・回答の受付はすべて子の側にあり、見せ方が決まる前には始まらない。
 * 決まった見せ方はこの Provider がマウントされている間は変えない（ルートを
 * 離れて戻ると作り直され、そのときの保存値と特典で決め直す）。判定の順と期限は
 * features の `useHandPresentationPreparation`。
 *
 * 保存値はクライアントの準備が済んでから読む。サーバー描画とハイドレーション中は
 * 設定を既定値で描くため、その一時的な `upright` を保存値と取り違えないよう、
 * 準備前は復元中として渡す。
 *
 * 練習のチャレンジ・トレーニングと無限訓練にだけ置く。昇級試験（本番・模試）・
 * 説明・結果・レッスンには置かない（見せ方は従来のまま）。
 */
export function HandPresentationProvider({
  fallback,
  children,
}: HandPresentationProviderProps) {
  const isClient = useIsClient();
  const hydration = useDisplaySettingsHydration();
  const savedOrientation = useDisplaySettingsStore((s) => s.tileOrientation);
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const auth = useMemo<HandPresentationAuth>(() => {
    if (isLoading) return { kind: "loading" };
    if (userId === undefined) return { kind: "signedOut" };
    return { kind: "signedIn", userId };
  }, [isLoading, userId]);

  const preparation = useHandPresentationPreparation({
    supported: true,
    settingsStatus: isClient ? hydration : "pending",
    savedOrientation,
    auth,
    fetchBenefits: fetchViewerBenefits,
  });

  const value = useMemo(
    () =>
      preparation.status === "ready"
        ? toHandPresentationContextValue(preparation.snapshot)
        : undefined,
    [preparation],
  );

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
