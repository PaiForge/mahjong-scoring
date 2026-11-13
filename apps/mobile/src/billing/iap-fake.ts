import { Alert } from "react-native";
import {
  GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX,
  MOBILE_GOOGLE_PURCHASES_API_PATH,
} from "@mahjong-scoring/features/billing/mobile-api";

import {
  IapErrorCode,
  type IapPurchase,
  type IapPurchaseList,
  type IapStore,
} from "./iap-store";

/**
 * 開発用の偽ストア（Android の開発ビルドだけ）
 *
 * 本物の Google Play を通さずに購入を作り、サーバーの Google の記録のパスへ送る。
 * サーバーは開発環境でモックの検証器を選んだときだけ、購入トークンが
 * `mock:` で始まる購入を受ける。ストアに出すビルドでは選ばれない
 * （`resolveIapStoreKind` が `__DEV__` を条件にする）。
 *
 * 購入はメモリだけで持ち、アプリを再起動すると消える。再起動をまたいだ
 * 配り直し（未完了の購入が次の起動で届く）は再現しない — サーバーの記録と
 * 完了の流れを試すための足場で、Play の振る舞いの写しではない。
 * 文言は開発者だけが見るので英語の固定文言にし、辞書に足さない。
 */

/** 持っている購入 1 つと、完了したか */
interface HeldPurchase {
  readonly purchase: IapPurchase;
  readonly finished: boolean;
}

/**
 * 持っている購入（key → 購入）。未完了の購入と、完了済みの非消費の購入
 *
 * 消費（consume）した購入は外す — Play も consume した購入を一覧に返さない。
 */
const held = new Map<string, HeldPurchase>();

type PurchaseListener = (purchase: IapPurchase) => void;
type ErrorListener = (code: string, message: string) => void;
const purchaseListeners = new Set<PurchaseListener>();
const errorListeners = new Set<ErrorListener>();

function deliverPurchase(purchase: IapPurchase): void {
  for (const listener of purchaseListeners) listener(purchase);
}

function deliverError(code: string, message: string): void {
  for (const listener of errorListeners) listener(code, message);
}

/**
 * モックの購入トークンを作る
 *
 * `crypto.randomUUID` は Static Hermes に無いので、時刻と乱数で一意にする
 * （同じ起動で衝突しなければ足りる）。
 */
function mockPurchaseToken(): string {
  return `${GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** 偽の購入画面で選べる結果 */
type FakeChoice = "buy" | "fail" | "cancel";

/** 偽の購入画面（3 択のダイアログ）を出し、選んだ結果を返す。閉じたら取り消し */
function askChoice(productId: string): Promise<FakeChoice> {
  return new Promise((resolve) => {
    Alert.alert(
      "Mock purchase",
      productId,
      [
        { text: "Buy", onPress: () => resolve("buy") },
        { text: "Fail", onPress: () => resolve("fail") },
        { text: "Cancel", style: "cancel", onPress: () => resolve("cancel") },
      ],
      { cancelable: true, onDismiss: () => resolve("cancel") },
    );
  });
}

/**
 * 偽の購入画面を出し、選んだ結果で購入・失敗・取り消しを配る
 *
 * 「Buy」は未完了の購入を作って持ち、受け手に配ってから key を返す。
 * 「Cancel」は取り消し（`user-cancelled`）、「Fail」は不明の失敗を配る。
 */
async function requestFakePurchase(
  productId: string,
): Promise<string | undefined> {
  const choice = await askChoice(productId);
  if (choice === "cancel") {
    deliverError(IapErrorCode.UserCancelled, "cancelled");
    return undefined;
  }
  if (choice === "fail") {
    deliverError(IapErrorCode.Unknown, "mock failure");
    return undefined;
  }
  const token = mockPurchaseToken();
  const purchase: IapPurchase = { key: token, productId, token };
  held.set(token, { purchase, finished: false });
  deliverPurchase(purchase);
  return token;
}

/** 持っている購入を返す。メモリから読むので失敗しない */
function listFakePurchases(): Promise<IapPurchaseList> {
  return Promise.resolve({
    ok: true,
    purchases: [...held.values()].map(({ purchase }) => purchase),
  });
}

/**
 * 購入を完了する。消費なら持ち物から外し、非消費なら完了済みとして持ち続ける
 */
function finishFakePurchase(
  purchase: IapPurchase,
  { consumable }: { readonly consumable: boolean },
): Promise<void> {
  if (!held.has(purchase.key)) return Promise.resolve();
  if (consumable) held.delete(purchase.key);
  else held.set(purchase.key, { purchase, finished: true });
  return Promise.resolve();
}

/**
 * 開発用の偽ストア
 * 偽ストア
 *
 * 記録の要求は Google Play と同じパスと本文（`{ productId, purchaseToken }`）。
 * 価格は `MOCK` と出す（本物の価格と取り違えないため）。
 */
export const fakeStore: IapStore = {
  connect: () => Promise.resolve(true),
  fetchProducts: (productIds) =>
    Promise.resolve(
      productIds.map((productId) => ({ productId, displayPrice: "MOCK" })),
    ),
  onPurchase: (listener) => {
    purchaseListeners.add(listener);
    return () => {
      purchaseListeners.delete(listener);
    };
  },
  onPurchaseError: (listener) => {
    errorListeners.add(listener);
    return () => {
      errorListeners.delete(listener);
    };
  },
  requestPurchase: (productId) => requestFakePurchase(productId),
  listPurchases: listFakePurchases,
  finishPurchase: finishFakePurchase,
  recordRequestOf: (purchase) => ({
    path: MOBILE_GOOGLE_PURCHASES_API_PATH,
    body: { productId: purchase.productId, purchaseToken: purchase.token },
  }),
};
