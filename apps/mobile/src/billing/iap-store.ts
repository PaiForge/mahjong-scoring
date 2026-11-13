import { ErrorCode } from "expo-iap";

/**
 * ストアの商品 1 つ（価格の表示に使う分だけ）
 * ストア商品
 *
 * `displayPrice` はストアが端末の地域の通貨で整えた価格。web の価格は出さない。
 */
export interface IapProduct {
  readonly productId: string;
  readonly displayPrice: string;
}

/**
 * ストアから届いた購入 1 つ（サーバーへ送る分だけ）
 * ストア購入
 *
 * ストアの固有の形（StoreKit の取引・Play Billing の購入）はアダプタの中だけで
 * 持ち、ここには購入の同期が要る 3 つの値だけを載せる。完了（finish）に要る
 * 元の購入オブジェクトはアダプタが `key` で引けるように持つ。
 */
export interface IapPurchase {
  /** この起動中の重複除去と記録待ちのキー。App Store は取引 ID、Google Play は購入トークン */
  readonly key: string;
  readonly productId: string;
  /** サーバーへ送る証拠。App Store は署名付き取引（JWS）、Google Play は購入トークン */
  readonly token: string;
}

/**
 * 端末の購入の一覧を読んだ結果
 * 購入一覧結果
 *
 * 「購入が無い」（`ok` で空）と「読めなかった」（`ok` でない）を分ける。
 * 空配列 1 つで表すと、通信やストアの失敗が「復元できる購入は無かった」と
 * 本人に伝わる。
 */
export type IapPurchaseList =
  | { readonly ok: true; readonly purchases: readonly IapPurchase[] }
  | { readonly ok: false };

/**
 * 購入をサーバーに記録する要求（パスと本文）
 * 購入記録要求
 *
 * 記録のパスと本文の形はストアごとに違う（App Store は `{ jws }`、Google Play は
 * `{ productId, purchaseToken }`）ので、アダプタが組んで返す。
 */
export interface IapRecordRequest {
  readonly path: string;
  readonly body: unknown;
}

/**
 * 購入の失敗の理由（expo-iap のエラーコード）
 * 購入失敗コード
 *
 * 画面が出し分けるのは取り消し（`user-cancelled`）と承認待ち
 * （`deferred-payment`。Ask to Buy）だけで、他はまとめて「購入できなかった」にする。
 * 偽ストアも同じコードで知らせる（`Unknown` は偽ストアの「失敗」に使う）。
 */
export const IapErrorCode = {
  UserCancelled: ErrorCode.UserCancelled,
  DeferredPayment: ErrorCode.DeferredPayment,
  Unknown: ErrorCode.Unknown,
} as const;

/**
 * Pro の購入に使うストアのポート
 * ストアポート
 *
 * 購入の入口（`iap.ts`）はこの形だけを知り、ビルドが選んだストア
 * （`IAP_STORE`）のアダプタへ委譲する。App Store のアダプタは `iap-apple.ts`、
 * 開発用の偽ストアは `iap-fake.ts`。StoreKit 固有の語彙（署名付き取引・取引 ID・
 * 一覧から読んだ取引は完了しない・`isConsumable` を常に false）はアダプタの中に
 * 閉じ、ここに出さない。
 *
 * 振る舞いの約束（どのアダプタも守る）:
 * - 購入は {@link IapStore.onPurchase} で 1 回だけ配る。{@link IapStore.requestPurchase}
 *   の戻り値から配らない（同じ購入が 2 度届き、記録の知らせが 2 回出る）
 * - 失敗は {@link IapStore.onPurchaseError} で 1 回だけ配る。取り消しも配る
 * - 購入は自動で完了しない。サーバーに記録してから {@link IapStore.finishPurchase}
 *   で完了する（完了した購入はストアが配り直さず、記録に失敗すると取り戻せない）
 *
 * 本物の Google Play のアダプタ（まだ無い）が守ること。expo-iap 6 の Android の
 * 振る舞い（`node_modules/expo-iap/build/index.js`）に合わせる:
 * - `requestPurchase` に `request.google.skus` を渡す。無いと `EmptySkuList` で落ちる。
 *   `obfuscatedAccountId` にユーザー ID を載せる（App Store の `appAccountToken` に当たる）
 * - `purchaseState` が `purchased` のものだけ配る（`pending` は払い終わっていない）
 * - 一覧（`getAvailablePurchases`）で読んだ未 acknowledge の購入も完了する。Play は
 *   3 日以内に acknowledge されない購入を自動で返金する。App Store のアダプタのように
 *   「一覧から読んだものは完了しない」を写さない
 * - 完了は `consumable` で consume（`isConsumable: true`）と acknowledge を分ける。
 *   30 日パスは consume する — acknowledge だけにすると同じ商品を買い直せない
 * - `key` は購入トークン。`transactionId`（注文 ID）は省略されうる
 */
export interface IapStore {
  /** ストアに接続する。失敗は false。何度呼んでも接続は 1 度だけ */
  readonly connect: () => Promise<boolean>;
  /** 商品の価格を読む。読めなかった商品は含まない（失敗は空配列） */
  readonly fetchProducts: (
    productIds: readonly string[],
  ) => Promise<readonly IapProduct[]>;
  /** ストアから届く購入を受け取る。解除する関数を返す */
  readonly onPurchase: (
    listener: (purchase: IapPurchase) => void,
  ) => () => void;
  /** 購入の失敗（取り消しを含む）を受け取る。解除する関数を返す */
  readonly onPurchaseError: (
    listener: (code: string, message: string) => void,
  ) => () => void;
  /** 買えたならその購入の key、取り消し・失敗・承認待ちは undefined */
  readonly requestPurchase: (
    productId: string,
    userId: string,
  ) => Promise<string | undefined>;
  /** 端末の購入を読む（復元・ログイン直後の取り直し） */
  readonly listPurchases: () => Promise<IapPurchaseList>;
  /**
   * 購入を完了する。サーバーが記録した・記録しないと答えた後に呼ぶ
   *
   * `consumable` は 30 日パス（買い直せる売り方）か。Google Play はこれで
   * consume と acknowledge を分ける。
   */
  readonly finishPurchase: (
    purchase: IapPurchase,
    options: { readonly consumable: boolean },
  ) => Promise<void>;
  /** 購入をサーバーに記録する要求（パスと本文）を組む */
  readonly recordRequestOf: (purchase: IapPurchase) => IapRecordRequest;
}
