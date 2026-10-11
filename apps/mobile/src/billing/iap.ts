import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from "expo-iap";

import { IAP_AVAILABLE } from "./iap-availability";

/**
 * App Store の商品 1 つ（価格の表示に使う分だけ）
 * ストア商品
 *
 * `displayPrice` は StoreKit が端末の地域の通貨で整えた価格。web の価格は出さない。
 */
export interface IapProduct {
  readonly productId: string;
  readonly displayPrice: string;
}

/**
 * StoreKit から届いた取引 1 つ（サーバーへ送る分だけ）
 * 取引
 *
 * `jws` は署名付き取引（`jwsRepresentation`）。サーバーはこれを検証して取引を読む。
 * 完了（finish）に要る元の購入オブジェクトはこのモジュールの中だけで持つ。
 */
export interface IapPurchase {
  readonly transactionId: string;
  readonly productId: string;
  readonly jws: string;
}

/**
 * 購入の失敗の理由（expo-iap のエラーコード）
 *
 * 画面が出し分けるのは取り消し（`user-cancelled`）と承認待ち
 * （`deferred-payment`。Ask to Buy）だけで、他はまとめて「購入できなかった」にする。
 */
export const IapErrorCode = {
  UserCancelled: ErrorCode.UserCancelled,
  DeferredPayment: ErrorCode.DeferredPayment,
} as const;

/**
 * 完了に使う元の購入オブジェクト（取引 ID → expo-iap の Purchase）
 *
 * `finishTransaction` は expo-iap の Purchase を受け取るので、写した
 * {@link IapPurchase} から引けるように持つ。完了したら外す。
 */
const sourcePurchases = new Map<string, Purchase>();

/**
 * expo-iap の Purchase を {@link IapPurchase} に写す。必須の項目（JWS・取引 ID・
 * Product ID）が欠けていれば undefined
 *
 * 欠けた取引はサーバーへ送れず、完了もしない（StoreKit が次の起動で配り直す）。
 */
function toIapPurchase(purchase: Purchase): IapPurchase | undefined {
  const jws = purchase.purchaseToken;
  const { transactionId, productId } = purchase;
  if (
    typeof jws !== "string" ||
    jws === "" ||
    typeof transactionId !== "string" ||
    transactionId === "" ||
    typeof productId !== "string" ||
    productId === ""
  ) {
    console.warn("[iap] 必須の項目が欠けた取引を捨てた", {
      transactionId,
      productId,
      hasJws: typeof jws === "string" && jws !== "",
    });
    return undefined;
  }
  sourcePurchases.set(transactionId, purchase);
  return { transactionId, productId, jws };
}

/** 例外から expo-iap のエラーコードとメッセージを読む */
function errorOf(error: unknown): {
  readonly code: string;
  readonly message: string;
} {
  if (typeof error !== "object" || error === null)
    return { code: ErrorCode.Unknown, message: String(error) };
  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;
  return {
    code: typeof code === "string" ? code : ErrorCode.Unknown,
    message: typeof message === "string" ? message : "",
  };
}

/**
 * StoreKit のイベントを購読する。ネイティブのモジュールが無ければ undefined
 *
 * 購読は同期で例外を投げうる（ネイティブのモジュールを含まないビルド）。
 * 購入の同期はルートレイアウトで購読するので、投げるとアプリ全体が落ちる。
 * 購入できないだけに留める。
 */
function subscribeNative(
  subscribe: () => { readonly remove: () => void },
): { readonly remove: () => void } | undefined {
  try {
    return subscribe();
  } catch (error) {
    console.warn("[iap] イベントを購読できない", errorOf(error));
    return undefined;
  }
}

let connection: Promise<boolean> | undefined;

/**
 * StoreKit に接続する。失敗は false
 * ストア接続
 *
 * 何度呼んでも接続は 1 度だけ。失敗したら次の呼び出しでつなぎ直す。
 * 切断（`endConnection`）はしない — 購入の同期が起動中ずっと取引を待つため。
 */
export function connectIap(): Promise<boolean> {
  if (!IAP_AVAILABLE) return Promise.resolve(false);
  connection ??= initConnection()
    .then((connected) => {
      if (!connected) connection = undefined;
      return connected;
    })
    .catch((error: unknown) => {
      console.warn("[iap] 接続に失敗", errorOf(error));
      connection = undefined;
      return false;
    });
  return connection;
}

/**
 * 商品の価格を読む。読めなかった商品は含まない（失敗は空配列）
 * 商品取得
 *
 * パス（Non-Renewing Subscription）も買い切り（Non-Consumable）も自動更新の
 * 購読ではないので、`all` で読んで ID で引く。
 */
export async function fetchIapProducts(
  productIds: readonly string[],
): Promise<readonly IapProduct[]> {
  if (!IAP_AVAILABLE || productIds.length === 0) return [];
  if (!(await connectIap())) return [];
  try {
    const products = await fetchProducts({
      skus: [...productIds],
      type: "all",
    });
    return (products ?? []).flatMap((product) =>
      typeof product.id === "string" && typeof product.displayPrice === "string"
        ? [{ productId: product.id, displayPrice: product.displayPrice }]
        : [],
    );
  } catch (error) {
    console.warn("[iap] 商品の取得に失敗", errorOf(error));
    return [];
  }
}

/**
 * いまの購入の要求の間に失敗を知らせたか。StoreKit のイベントと要求の拒否で
 * 同じ失敗を 2 度知らせないために使う（{@link requestIapPurchase}）
 */
let errorDeliveredDuringRequest = false;

type ErrorListener = (code: string, message: string) => void;
const errorListeners = new Set<ErrorListener>();

function deliverError(code: string, message: string): void {
  errorDeliveredDuringRequest = true;
  for (const listener of errorListeners) listener(code, message);
}

let nativeErrorSubscription: { readonly remove: () => void } | undefined;

/**
 * 購入の失敗を受け取る。解除する関数を返す
 * 購入失敗購読
 *
 * StoreKit のイベントでも、購入の要求の失敗（{@link requestIapPurchase} の
 * 拒否）でも、同じ失敗は 1 度だけ届く。取り消し（`user-cancelled`）も届くので、
 * 受け取る側で出し分ける（{@link IapErrorCode}）。
 */
export function onIapPurchaseError(listener: ErrorListener): () => void {
  if (!IAP_AVAILABLE) return () => {};
  errorListeners.add(listener);
  nativeErrorSubscription ??= subscribeNative(() =>
    purchaseErrorListener((error) => {
      deliverError(error.code ?? ErrorCode.Unknown, error.message);
    }),
  );
  return () => {
    errorListeners.delete(listener);
    if (errorListeners.size === 0) {
      nativeErrorSubscription?.remove();
      nativeErrorSubscription = undefined;
    }
  };
}

type PurchaseListener = (purchase: IapPurchase) => void;
const purchaseListeners = new Set<PurchaseListener>();

function deliverPurchase(purchase: Purchase): void {
  const mapped = toIapPurchase(purchase);
  if (mapped === undefined) return;
  for (const listener of purchaseListeners) listener(mapped);
}

let nativePurchaseSubscription: { readonly remove: () => void } | undefined;

/**
 * StoreKit から届く取引を受け取る。解除する関数を返す
 * 取引購読
 *
 * 購入の直後・Ask to Buy の承認・前回の起動で完了しなかった取引の配り直しが
 * ここへ届く。同じ取引が 2 度届くことがある（購入の要求の戻り値とイベントの
 * 両方から渡す）ので、受け取る側が取引 ID で重複を除く。
 */
export function onIapPurchase(listener: PurchaseListener): () => void {
  if (!IAP_AVAILABLE) return () => {};
  purchaseListeners.add(listener);
  nativePurchaseSubscription ??= subscribeNative(() =>
    purchaseUpdatedListener(deliverPurchase),
  );
  return () => {
    purchaseListeners.delete(listener);
    if (purchaseListeners.size === 0) {
      nativePurchaseSubscription?.remove();
      nativePurchaseSubscription = undefined;
    }
  };
}

/**
 * 購入を始める（App Store の購入画面を出す）
 * 購入要求
 *
 * 結果は待たない: 届いた取引は {@link onIapPurchase}、失敗は
 * {@link onIapPurchaseError} に届く。戻りの Promise は購入画面が閉じたら解決する。
 * 取引は自動で完了させない — サーバーに記録してから完了する（完了した取引は
 * StoreKit が配り直さず、記録に失敗すると取り戻せない）。
 *
 * @param appAccountToken - 購入するユーザーの ID（UUID）。サーバーが App Store の
 *   通知から購入者を引くのに使う
 */
export async function requestIapPurchase(
  productId: string,
  appAccountToken: string,
): Promise<void> {
  if (!IAP_AVAILABLE) return;
  if (!(await connectIap())) {
    deliverError(ErrorCode.NotPrepared, "not connected");
    return;
  }
  errorDeliveredDuringRequest = false;
  try {
    const result = await requestPurchase({
      request: {
        apple: {
          sku: productId,
          appAccountToken,
          andDangerouslyFinishTransactionAutomatically: false,
        },
      },
      type: "in-app",
    });
    const purchases = Array.isArray(result)
      ? result
      : result === null || result === undefined
        ? []
        : [result];
    for (const purchase of purchases) deliverPurchase(purchase);
  } catch (error) {
    // StoreKit のイベントで同じ失敗を受け取っていれば、重ねて知らせない
    if (!errorDeliveredDuringRequest) {
      const { code, message } = errorOf(error);
      deliverError(code, message);
    }
  }
}

/**
 * 端末の Apple ID が持つ購入を読む（復元）。失敗は空配列
 * 購入一覧取得
 *
 * StoreKit の現在の権利（`Transaction.currentEntitlements`）で、買い切り
 * （Non-Consumable）とパス（Non-Renewing Subscription）の最新の取引が返る。
 * パスの期限は StoreKit が知らないので、期限切れのパスも返る（期限の判定は
 * サーバーが持つ）。
 */
export async function listIapPurchases(): Promise<readonly IapPurchase[]> {
  if (!IAP_AVAILABLE) return [];
  if (!(await connectIap())) return [];
  try {
    const purchases = await getAvailablePurchases();
    return purchases.flatMap((purchase) => {
      const mapped = toIapPurchase(purchase);
      return mapped === undefined ? [] : [mapped];
    });
  } catch (error) {
    console.warn("[iap] 購入の一覧の取得に失敗", errorOf(error));
    return [];
  }
}

/**
 * 取引を完了（finish）する。StoreKit は完了した取引を配り直さない
 * 取引完了
 *
 * サーバーが記録した・記録しないと答えた後に呼ぶ。完了済みの取引を
 * もう一度完了しても害は無いので、失敗はログだけにする。
 */
export async function finishIapPurchase(purchase: IapPurchase): Promise<void> {
  if (!IAP_AVAILABLE) return;
  const source = sourcePurchases.get(purchase.transactionId);
  if (source === undefined) return;
  try {
    await finishTransaction({ purchase: source, isConsumable: false });
    sourcePurchases.delete(purchase.transactionId);
  } catch (error) {
    console.warn("[iap] 取引の完了に失敗", {
      transactionId: purchase.transactionId,
      ...errorOf(error),
    });
  }
}
