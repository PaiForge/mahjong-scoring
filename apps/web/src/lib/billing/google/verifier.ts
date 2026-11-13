/**
 * Google Play の購入の課金環境
 * 課金環境（Google Play）
 *
 * - `Test` — ライセンステスターの購入（課金されない）と、開発用のモック購入
 * - `Production` — 実際に課金された購入
 *
 * `purchases.google_environment` にこの値をそのまま入れる。
 */
export const GoogleEnvironment = {
  Test: "Test",
  Production: "Production",
} as const;
export type GoogleEnvironment =
  (typeof GoogleEnvironment)[keyof typeof GoogleEnvironment];

/**
 * Google Play に確かめた購入
 * 検証済みの購入（Google Play）
 */
export interface GooglePurchase {
  /** 購入トークン。購入の冪等キー */
  readonly purchaseToken: string;
  /** Play Console の Product ID */
  readonly productId: string;
  /** 購入したアプリのパッケージ名 */
  readonly packageName: string;
  /** 注文 ID。プロモコードでの引き換え等で欠けうる */
  readonly orderId: string | undefined;
  /** 購入日時 */
  readonly purchaseDate: Date;
  /** 購入の状態。`purchased` だけが記録の対象 */
  readonly state: "purchased" | "pending" | "cancelled";
  /** 課金環境 */
  readonly environment: GoogleEnvironment;
}

/**
 * 購入の検証の結果
 * 検証結果（Google Play）
 *
 * - `invalidToken` — Play がその購入を知らない・応答の形が違う。送り直しても通らない
 * - `unavailable` — Play に確かめられない（認証・通信・5xx）。後で送り直せば通りうる
 */
export type GoogleVerification<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: "invalidToken" | "unavailable" };

/**
 * Google Play の購入を確かめる検証器
 * 購入検証器（Google Play）
 *
 * 記録の規則（`recordGooglePurchase`）と HTTP の入口はこの interface だけを
 * 知り、Play にどう問い合わせるかを知らない。実装は開発用のモック
 * （`verifier-mock.ts`）とテスト用の偽物（`verifier-fake.ts`）だけで、本物は
 * まだ無い。
 *
 * @design 本物の検証器は未実装（Play の商品登録が済むまで書かない）
 *
 * Play Console に商品が無いと本物の購入を作れず、Play Developer API への
 * 問い合わせを確かめられない。確かめられないコードを先に書かず、境界の
 * interface だけを先に固める。返金の取り込み（Real-time developer notifications・
 * Voided Purchases API）も同じ理由で未実装。
 *
 * 本物は Play Developer API の `purchases.products.get(packageName, productId,
 * token)` を呼び、応答を次のように写す想定。この対応は API の文書からの写しで、
 * 実物の応答ではまだ確かめていない:
 *
 * - `purchaseState` 0 / 1 / 2 → `state` の `purchased` / `cancelled` / `pending`
 * - `purchaseType === 0`（ライセンステスターの購入）→ `environment` の `Test`、
 *   それ以外（フィールドが無い場合を含む）→ `Production`
 * - `orderId` → `orderId`（無ければ undefined）
 * - `purchaseTimeMillis` → `purchaseDate`
 * - パッケージ名と Product ID は問い合わせに使った値をそのまま返す
 * - トークンが無い（404・410）・応答の形が違う → `invalidToken`
 * - 認証の失敗・通信の失敗・5xx → `unavailable`
 */
export interface GooglePurchaseVerifier {
  /** アプリから届いた購入トークンを Play に確かめて読む */
  readonly verifyPurchase: (input: {
    readonly productId: string;
    readonly purchaseToken: string;
  }) => Promise<GoogleVerification<GooglePurchase>>;
}
