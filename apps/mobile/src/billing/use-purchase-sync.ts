import { useEffect, useRef } from "react";
import { createTranslator } from "use-intl";
import { create } from "zustand";
import type { MobileAppleTransactionResponse } from "@mahjong-scoring/features/billing/mobile-api";

import { useAuth } from "../auth/use-auth";
import { showToast } from "../components/toast";
import { APP_LOCALE, APP_MESSAGES } from "../lib/app-locale";
import {
  connectIap,
  finishIapPurchase,
  listIapPurchases,
  onIapPurchase,
  requestIapPurchase,
  type IapPurchase,
} from "./iap";
import { IAP_AVAILABLE } from "./iap-availability";
import { postAppleTransaction, type PlanApiResult } from "./plan-api";
import {
  isRetryable,
  shouldFinishAfter,
  summarizeRestore,
  type RestoreSummary,
} from "./purchase-sync";
import { invalidatePlan } from "./use-plan";

type TransactionResult = PlanApiResult<MobileAppleTransactionResponse>;

/**
 * トーストの文言。購入の同期はルートレイアウトで辞書の Provider の外から
 * 動くので、`useTranslations` / `useAppLocale` ではなく、Provider と同じ
 * 起動時に決めた言語と辞書（`APP_LOCALE` / `APP_MESSAGES`）から直接引く
 */
const t = createTranslator({
  locale: APP_LOCALE,
  messages: APP_MESSAGES,
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

/**
 * プラン画面で買った取引の ID（この起動中）
 *
 * 記録の結果が `duplicate` でも、ここにある取引は「購入を記録した」と知らせる。
 * App Store の通知（ONE_TIME_CHARGE）はアプリが取引を受け取るより先にサーバーへ
 * 届くことがあり（Sandbox では購入シートの完了から 8 秒ほど後に取引が届いた）、
 * そのときアプリの送信は `duplicate` になる。本人から見れば今買った購入が
 * 記録されたことに変わりはない。起動時の配り直し・復元の `duplicate` は
 * 知らせない（記録済みの購入を、そのたびに知らせることになる）。
 */
const purchasedHere = new Set<string>();

/** 1 度だけ解決する合図 */
interface Signal {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
}

function createSignal(): Signal {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/**
 * 取引の記録の進み（取引 ID → 始まり・終わりの合図）
 *
 * 購入の要求が返る（取引 ID が分かる）のと、StoreKit のイベントで取引が届く
 * （記録が始まる）のは別の経路で届く。openiap はイベントを流してから要求を
 * 解決する（`OpenIapStoreKitModule.requestPurchase` は `emitPurchaseUpdate` →
 * `return`）ので通常はイベントが先だが、ブリッジの配送順は頼れない。どちらが
 * 先でも同じ口で出会えるよう、先に来た側が作る。記録する側
 * （{@link recordPurchase}）が `started` → `done` の順に解決し、買った側
 * （{@link buyIapProduct}）が待つ。配り直し・取り直しの取引も通るので、
 * この起動中に届いた取引の数だけ増える（それで足りるので消さない）。
 */
const recordings = new Map<
  string,
  { readonly started: Signal; readonly done: Signal }
>();

function recordingOf(transactionId: string) {
  const existing = recordings.get(transactionId);
  if (existing !== undefined) return existing;
  const created = { started: createSignal(), done: createSignal() };
  recordings.set(transactionId, created);
  return created;
}

/**
 * 購入の要求が返ってから、その取引の記録が始まるのを待つ上限（ミリ秒）
 *
 * 上の経路のとおり、要求が返った時点で記録は普通もう始まっている。始まって
 * いないのは、イベントが要求の解決より後に配られた（この猶予で拾う）か、
 * この接続ではもう届かない（必須の項目が欠けて `toIapPurchase` が捨てた・
 * openiap が配り済みと見なした）かのどちらか。後者は次の起動で StoreKit が
 * 配り直すので、購入ボタンを回し続けずに返す。始まった記録の終わりには上限を
 * 置かない — 送り直しの間（最大 47 秒と各回の通信）も押したボタンを回し
 * 続ける方が、途中で戻して「買えていない」ように見せるより正しい
 */
const RECORDING_START_GRACE_MS = 3_000;

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

/**
 * プラン画面から商品を買い、取引の記録が終わるまで待つ
 * 購入と記録待ち
 *
 * 購入画面が閉じても、取引が記録されるまで Pro は付かない。押したボタンを
 * 記録が終わるまで処理中に保ち、「完了したのに無料のまま」に見える間を作らない。
 * 記録そのものはルートの購入の同期（{@link usePurchaseSync}）が行い、ここは
 * その終わりを待つだけ — 画面を離れても記録と知らせは続く。
 *
 * 取り消し・失敗・承認待ちは購入画面が閉じた時点で返る（取引が無い）。買えた
 * のに取引が届かないときは、記録の始まりを少し待ってから返す
 * （{@link RECORDING_START_GRACE_MS}）。
 */
export async function buyIapProduct(
  productId: string,
  userId: string,
): Promise<void> {
  const transactionId = await requestIapPurchase(productId, userId);
  if (transactionId === undefined) return;
  purchasedHere.add(transactionId);
  const recording = recordingOf(transactionId);
  const started = await Promise.race([
    recording.started.promise.then(() => true),
    wait(RECORDING_START_GRACE_MS).then(() => false),
  ]);
  if (!started) return;
  await recording.done.promise;
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
 * 記録できたら、応答に添えられた記録後のプランをプラン画面に渡す。
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
    // 応答は記録後のプランを含むので、画面に読み直させずそのまま渡す
    if ("value" in response) invalidatePlan({ userId, plan: response.value });
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
  const recording = recordingOf(purchase.transactionId);
  recording.started.resolve();
  if (finished.has(purchase.transactionId)) {
    recording.done.resolve();
    return;
  }
  changeRecording(1);
  try {
    let result = await submitPurchase(userId, purchase);
    for (const delay of RETRY_DELAYS_MS) {
      if (!("error" in result) || !isRetryable(result.error)) break;
      await wait(delay);
      result = await submitPurchase(userId, purchase);
    }
    if ("value" in result) {
      if (
        result.value.outcome === "recorded" ||
        purchasedHere.has(purchase.transactionId)
      )
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
    recording.done.resolve();
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
  const listed = await listIapPurchases();
  // 読めなければ何もしない。未完了の取引は次の起動で StoreKit が配り直す
  if (!listed.ok) return;
  for (const purchase of listed.purchases) {
    await recordPurchase(userId, purchase, false);
  }
}

/**
 * 端末の Apple ID の購入をすべてサーバーへ送り直す（「購入を復元」）
 * 購入の復元
 *
 * 1 件ずつ順に送り、全部終わったらプラン画面に読み直させる。結果は画面が
 * 出す知らせ 1 つにまとめて返す（{@link summarizeRestore}）。
 *
 * 端末の購入を読めなかった（StoreKit に接続できない・一覧の取得に失敗）ときは
 * 送らずに `failed` — 「復元できる購入は無かった」ではなく「復元できなかった」
 * と知らせ、通信できる状態でやり直してもらう。
 */
export async function restoreIapPurchases(
  userId: string,
): Promise<RestoreSummary> {
  const listed = await listIapPurchases();
  if (!listed.ok) return "failed";
  const results: TransactionResult[] = [];
  for (const purchase of listed.purchases) {
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
    return startPurchaseSync(userId, () => sawSignedOut.current);
  }, [userId]);
}

/**
 * 1 人のユーザーの名義で取引を受け取り始める。止める関数を返す
 * 購入同期の開始
 *
 * {@link usePurchaseSync} の中身。フックの外に出してあるのは、Node の単体テストが
 * React を描画せずに受け取りから記録・知らせまでを通すため。
 *
 * @param shouldSweep - 接続できたときに端末の購入を取り直すか（起動中にゲストを
 *   通ったか）。接続を待つ間に変わりうるので、接続した時点で読む
 */
export function startPurchaseSync(
  userId: string,
  shouldSweep: () => boolean,
): () => void {
  // 接続より先に受け取り口を置く。接続の時点で未完了の取引が届く
  const unsubscribe = onIapPurchase((purchase) => {
    void recordPurchase(userId, purchase, true);
  });
  void connectIap().then((connected) => {
    if (connected && shouldSweep()) void sweepPurchases(userId);
  });
  return unsubscribe;
}
