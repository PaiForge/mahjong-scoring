import { useEffect, useRef } from "react";
import { createTranslator } from "use-intl";
import { create } from "zustand";
import { messages } from "@mahjong-scoring/messages/ja";
import type { MobileAppleTransactionResponse } from "@mahjong-scoring/features/billing/mobile-api";

import { useAuth } from "../auth/use-auth";
import { showToast } from "../components/toast";
import {
  connectIap,
  finishIapPurchase,
  listIapPurchases,
  onIapPurchase,
  type IapPurchase,
} from "./iap";
import { IAP_AVAILABLE } from "./iap-availability";
import {
  postAppleTransaction,
  type PlanApiFailure,
  type PlanApiResult,
} from "./plan-api";
import {
  shouldFinishAfter,
  summarizeRestore,
  type RestoreSummary,
} from "./purchase-sync";
import { invalidatePlan } from "./use-plan";

type TransactionResult = PlanApiResult<MobileAppleTransactionResponse>;

/**
 * トーストの文言。購入の同期はルートレイアウトで辞書の Provider の外から
 * 動くので、`useTranslations` ではなく辞書から直接引く
 */
const t = createTranslator({
  locale: "ja",
  messages,
  namespace: "mobilePlan",
});

/** 送っている最中の取引（取引 ID → 送った結果）。同じ取引を並行して 2 回送らない */
const inFlight = new Map<string, Promise<TransactionResult>>();

/**
 * この起動中に完了した取引の ID。StoreKit が同じ取引を配り直すことがあるので、
 * 2 度目は送らない
 */
const finished = new Set<string>();

/**
 * 購入の直後に記録できなかったときの送り直しの間隔（ミリ秒）。使い切ったら
 * 取引を未完了のまま残し、次の起動で StoreKit が配り直したときに送る
 */
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 30_000] as const;

/** 送り直せば通るかもしれない失敗（通信・サーバーの一時的な障害） */
function isRetryable(error: PlanApiFailure): boolean {
  return (
    error === "network" ||
    error === "serverError" ||
    error === "appleUnavailable" ||
    error === "authUnavailable" ||
    error === "rateLimited"
  );
}

/** 記録を送っている取引の数。プラン画面が「記録しています」を出すのに使う */
const useRecordingStore = create<{ readonly count: number }>(() => ({
  count: 0,
}));

/**
 * 購入の直後の取引を記録している最中か
 * 購入記録中
 *
 * 記録されるまで Pro は付かず、パスの期限は購入した時点から数えるので、
 * 記録が遅れた分の日数は戻らない。通信に失敗して送り直している間、
 * プラン画面は閉じずに待つよう知らせる。
 */
export function usePurchaseRecording(): boolean {
  return useRecordingStore((state) => state.count > 0);
}

function changeRecording(delta: number): void {
  useRecordingStore.setState((state) => ({ count: state.count + delta }));
}

/**
 * 取引をサーバーへ送り、応答に応じて完了する
 * 取引送信と完了
 *
 * 完了するかは {@link shouldFinishAfter}。同じ取引を送っている最中なら、その
 * 結果を待って返す（購入の同期と復元が同じ取引を同時に送ることがある）。
 * 記録できたらプラン画面に読み直させる。
 */
function submitPurchase(
  userId: string,
  purchase: IapPurchase,
): Promise<TransactionResult> {
  const sending = inFlight.get(purchase.transactionId);
  if (sending !== undefined) return sending;
  const result = (async () => {
    const response = await postAppleTransaction(userId, purchase.jws);
    if (shouldFinishAfter(response)) {
      await finishIapPurchase(purchase);
      finished.add(purchase.transactionId);
    }
    if ("value" in response) invalidatePlan();
    return response;
  })().finally(() => inFlight.delete(purchase.transactionId));
  inFlight.set(purchase.transactionId, result);
  return result;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * StoreKit から届いた取引を記録する。通信に失敗したら間を置いて送り直す
 *
 * @param notifyOwnedByAnotherAccount - 別のアカウントの取引だったと知らせるか。
 *   ログインした直後の取り直し（{@link sweepPurchases}）では知らせない —
 *   同じ端末でアカウントを切り替えた人に、前のアカウントの買い切りのたびに
 *   出てしまう
 */
async function recordPurchase(
  userId: string,
  purchase: IapPurchase,
  notifyOwnedByAnotherAccount: boolean,
): Promise<void> {
  if (finished.has(purchase.transactionId)) return;
  changeRecording(1);
  try {
    let result = await submitPurchase(userId, purchase);
    for (const delay of RETRY_DELAYS_MS) {
      if (!("error" in result) || !isRetryable(result.error)) break;
      await wait(delay);
      result = await submitPurchase(userId, purchase);
    }
    if ("value" in result) {
      if (result.value.outcome === "recorded")
        showToast(t("purchaseRecorded"), "success");
      return;
    }
    if (result.error === "ownedByAnotherAccount") {
      if (notifyOwnedByAnotherAccount) showToast(t("ownedByAnotherAccount"));
      return;
    }
    console.warn("[iap] 取引を記録できなかった", {
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      error: result.error,
    });
  } finally {
    changeRecording(-1);
  }
}

/**
 * 端末の Apple ID の購入を取り直して記録する（ログインした直後）
 *
 * ログインしていない間に届いた取引は、送る名義が無いので何もせず未完了のまま
 * 残す。StoreKit は未完了の取引を次の起動で配り直すが、起動中にログインした
 * ときは配り直しを待たず、ここで未完了分を含めて取り直す。購入した直後に
 * ログアウトされる経路はほぼ無いが、Ask to Buy（保護者の承認）の承認が
 * 後日、ログアウト中に届く経路がある。
 */
async function sweepPurchases(userId: string): Promise<void> {
  const purchases = await listIapPurchases();
  for (const purchase of purchases) {
    await recordPurchase(userId, purchase, false);
  }
}

/**
 * 端末の Apple ID の購入をすべてサーバーへ送り直す（「購入を復元」）
 * 購入の復元
 *
 * 1 件ずつ順に送り、全部終わったらプラン画面に読み直させる。結果は画面が
 * 出す知らせ 1 つにまとめて返す（{@link summarizeRestore}）。
 */
export async function restoreIapPurchases(
  userId: string,
): Promise<RestoreSummary> {
  const purchases = await listIapPurchases();
  const results: TransactionResult[] = [];
  for (const purchase of purchases) {
    results.push(await submitPurchase(userId, purchase));
  }
  invalidatePlan();
  return summarizeRestore(results);
}

/**
 * 購入の同期（ルートで 1 回だけ呼ぶ）
 * 購入同期フック
 *
 * iOS でログインしている間、StoreKit から届く取引（購入の直後・Ask to Buy の
 * 承認・前回の起動で完了しなかった取引）を受け、ログイン中のユーザーの名義で
 * サーバーへ記録してから完了する。ログアウト・別のユーザーへの切り替えで
 * 受け取りをやめる（別の名義で送らない）。
 *
 * 起動中にログインしたときは、端末の購入を取り直して記録する
 * （{@link sweepPurchases}）。起動時に保存済みのログインが戻ったときは
 * 取り直さない — 未完了の取引は接続した時点で StoreKit が配り直す。
 */
export function usePurchaseSync(): void {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;
  // 起動中にゲストの状態を通ったか（その後のログインで取り直す）
  const sawSignedOut = useRef(false);
  useEffect(() => {
    if (status === "signedOut") sawSignedOut.current = true;
  }, [status]);

  useEffect(() => {
    if (!IAP_AVAILABLE || userId === undefined) return;
    // 接続より先に受け取り口を置く。接続の時点で未完了の取引が届く
    const unsubscribe = onIapPurchase((purchase) => {
      void recordPurchase(userId, purchase, true);
    });
    void connectIap().then((connected) => {
      if (connected && sawSignedOut.current) void sweepPurchases(userId);
    });
    return unsubscribe;
  }, [userId]);
}
