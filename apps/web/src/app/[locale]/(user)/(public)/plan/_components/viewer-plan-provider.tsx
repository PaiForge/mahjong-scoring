"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/app/_contexts/auth-context";
import { fetchViewerPlan } from "@/app/_lib/viewer-plan";
import type { ViewerPlan } from "@/lib/billing/viewer-plan";

interface ViewerPlanContextValue {
  /**
   * 認証状態か購入の状態の解決中か。解決するまで購入の面はスケルトンにする
   * （未ログインと確定したら false。取得に失敗しても false）
   */
  readonly isPending: boolean;
  /**
   * 閲覧者の購入の状態。未ログイン・取得失敗は undefined（どちらも「売らない
   * 理由が分からない」で、呼び出し側は購入の導線へ倒す）
   */
  readonly plan: ViewerPlan | undefined;
  /** 状態を取り直す（Checkout の作成が有効な購入を理由に拒まれたとき用） */
  readonly refresh: () => Promise<void>;
}

const ViewerPlanContext = createContext<ViewerPlanContextValue | undefined>(
  undefined,
);

/** 取得した状態と、それが誰のものか（ログインし直したときに前の人の状態を出さない） */
interface FetchedPlan {
  readonly userId: string;
  readonly plan: ViewerPlan | undefined;
}

/**
 * 料金ページの購入の面に、閲覧者の購入の状態を配る
 * 閲覧者プラン状態プロバイダー
 *
 * 料金ページは静的なので、購入済みかどうかはクライアントで `/api/plan/me` から
 * 読む。売り方ごとのボタン 2 つと付与中の案内が同じ状態を読むので、取得は
 * ここで 1 回にまとめる。認証コンテキストのプロフィール（`/api/profile/me`）に
 * 載せない理由は Route Handler の TSDoc。
 *
 * ログインが確定してから取りに行く（未ログインの訪問者にサーバーへの往復を
 * させない）。取得はこのページを開くたびに行うので、クライアント遷移で来ても
 * その時点の状態になる。
 *
 * @design 取得に失敗したら購入ボタンへ倒す
 * ここは表示の出し分けだけで、販売可否の強制は Checkout の作成
 * （`lib/billing/checkout.ts`）がサーバーで行う。失敗時にボタンを伏せると、
 * 一時的な障害で誰も買えなくなる。ボタンを出して押された先で拒まれる方が軽い
 * （修正前の挙動と同じ）。アプリ向けの API が失敗を 500 にして導線を出させない
 * のとは事情が違う — あちらはストアの決済がサーバーの検査より先に走る。
 */
export function ViewerPlanProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const [fetched, setFetched] = useState<FetchedPlan | undefined>(undefined);

  const load = useCallback(async (targetUserId: string) => {
    const plan = await fetchViewerPlan();
    // null は「サーバーから見て未ログイン」（セッション切れ・認証サーバーの失敗）。
    // 取得失敗と同じく購入ボタンへ倒し、押した先の「ログインが必要です」に任せる
    setFetched({ userId: targetUserId, plan: plan ?? undefined });
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    void fetchViewerPlan().then((plan) => {
      if (cancelled) return;
      setFetched({ userId, plan: plan ?? undefined });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId !== undefined) await load(userId);
  }, [userId, load]);

  const isResolved = userId !== undefined && fetched?.userId === userId;
  return (
    <ViewerPlanContext
      value={{
        isPending: isLoading || (userId !== undefined && !isResolved),
        plan: isResolved ? fetched.plan : undefined,
        refresh,
      }}
    >
      {children}
    </ViewerPlanContext>
  );
}

/**
 * 閲覧者の購入の状態を読む（{@link ViewerPlanProvider} の内側で使う）
 * 閲覧者プラン状態フック
 */
export function useViewerPlan(): ViewerPlanContextValue {
  const context = useContext(ViewerPlanContext);
  if (!context) {
    throw new Error("useViewerPlan must be used within a ViewerPlanProvider");
  }
  return context;
}
