import { IAP_AVAILABLE, IAP_STORE } from "./iap-availability";
import { appleStore } from "./iap-apple";
import { fakeStore } from "./iap-fake";
import type {
  IapProduct,
  IapPurchase,
  IapPurchaseList,
  IapRecordRequest,
  IapStore,
} from "./iap-store";

export { IapErrorCode } from "./iap-store";
export type {
  IapProduct,
  IapPurchase,
  IapPurchaseList,
  IapRecordRequest,
} from "./iap-store";

/**
 * アプリ内課金の入口
 *
 * ビルドが選んだストア（`IAP_STORE`）のアダプタへ委譲する。画面と購入の同期は
 * ここの関数だけを呼び、どのストアかを知らない。ストアを使えない
 * （`IAP_AVAILABLE` が false）ビルドでは、どの関数もストアに触れず、
 * 接続できない・商品も購入も無い・何もしない、として振る舞う。
 */

/** 選んだストアのアダプタ。ストアを使えないビルドでは undefined */
const store: IapStore | undefined = !IAP_AVAILABLE
  ? undefined
  : IAP_STORE === "apple"
    ? appleStore
    : IAP_STORE === "fake"
      ? fakeStore
      : undefined;

/**
 * ストアに接続する。失敗は false
 * ストア接続
 *
 * 何度呼んでも接続は 1 度だけ。失敗したら次の呼び出しでつなぎ直す。
 * 切断はしない — 購入の同期が起動中ずっと購入を待つため。
 */
export function connectIap(): Promise<boolean> {
  return store?.connect() ?? Promise.resolve(false);
}

/**
 * 商品の価格を読む。読めなかった商品は含まない（失敗は空配列）
 * 商品取得
 */
export async function fetchIapProducts(
  productIds: readonly string[],
): Promise<readonly IapProduct[]> {
  return (await store?.fetchProducts(productIds)) ?? [];
}

/**
 * ストアから届く購入を受け取る。解除する関数を返す
 * 購入購読
 *
 * 購入の直後・承認待ちの承認・前回の起動で完了しなかった購入の配り直しが
 * ここへ届く。ストアが同じ購入を配り直すことがあるので、受け取る側が
 * `key` で重複を除く。
 */
export function onIapPurchase(
  listener: (purchase: IapPurchase) => void,
): () => void {
  return store?.onPurchase(listener) ?? (() => {});
}

/**
 * 購入の失敗を受け取る。解除する関数を返す
 * 購入失敗購読
 *
 * 同じ失敗は 1 度だけ届く。取り消し（`user-cancelled`）も届くので、受け取る
 * 側で出し分ける（`IapErrorCode`）。
 */
export function onIapPurchaseError(
  listener: (code: string, message: string) => void,
): () => void {
  return store?.onPurchaseError(listener) ?? (() => {});
}

/**
 * 購入を始める（ストアの購入画面を出す）
 * 購入要求
 *
 * 購入そのものは配らない: 届いた購入は {@link onIapPurchase}、失敗は
 * {@link onIapPurchaseError} に届く。戻りの Promise は購入画面が閉じたら解決し、
 * 買えたならその購入の `key` を返す（取り消し・失敗・承認待ちは undefined）。
 * 購入は自動で完了させない — サーバーに記録してから {@link finishIapPurchase}
 * で完了する。
 *
 * @param userId - 購入するユーザーの ID（UUID）。サーバーがストアの通知から
 *   購入者を引くのに使う（App Store の `appAccountToken`）
 */
export async function requestIapPurchase(
  productId: string,
  userId: string,
): Promise<string | undefined> {
  return store?.requestPurchase(productId, userId);
}

/**
 * 端末の購入を読む（復元・ログイン直後の取り直し）
 * 購入一覧取得
 *
 * ストアを使えないビルドは購入なし。ストアに接続できない・一覧を読めないときは
 * 失敗（{@link IapPurchaseList}）。読む側が「復元できなかった」と「復元できる
 * 購入が無かった」を出し分けるため、空配列に潰さない。
 */
export async function listIapPurchases(): Promise<IapPurchaseList> {
  return (await store?.listPurchases()) ?? { ok: true, purchases: [] };
}

/**
 * 購入を完了（finish）する。ストアは完了した購入を配り直さない
 * 購入完了
 *
 * サーバーが記録した・記録しないと答えた後に呼ぶ。失敗はログだけにする。
 *
 * @param options.consumable - 30 日パス（買い直せる売り方）か。Google Play は
 *   これで consume と acknowledge を分ける（App Store は読まない）
 */
export async function finishIapPurchase(
  purchase: IapPurchase,
  options: { readonly consumable: boolean },
): Promise<void> {
  await store?.finishPurchase(purchase, options);
}

/**
 * 購入をサーバーに記録する要求（パスと本文）
 * 購入記録要求
 *
 * 記録のパスと本文の形はストアごとに違うので、購入を配ったストアの
 * アダプタが組む。ストアを使えないビルドには購入が届かないので、ここへは
 * 来ない（来たら投げる）。
 */
export function iapRecordRequestOf(purchase: IapPurchase): IapRecordRequest {
  if (store === undefined)
    throw new Error("[iap] ストアを使えないビルドで購入を記録しようとした");
  return store.recordRequestOf(purchase);
}
