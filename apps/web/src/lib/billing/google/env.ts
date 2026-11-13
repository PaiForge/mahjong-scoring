import {
  OFFER_KEYS,
  type OfferKey,
  type PlanKey,
} from "@mahjong-scoring/features/billing/plans";

/**
 * Google Play のアプリ内課金の環境変数
 * アプリ内課金環境変数
 *
 * `apple/env.ts` と同じ「無ければ undefined」の形。どれも秘密ではないが、
 * Product ID は Play Console の設定に依るのでコードに書かない。
 *
 * - `GOOGLE_IAP_PRODUCT_ID_<PLAN>_<OFFER>` — 売り方ごとの Product ID
 * - `GOOGLE_IAP_TEST_USER_IDS` — テストの購入（ライセンステスターの購入・
 *   開発用のモック購入）に特典を付けてよい user_id（カンマ区切りの UUID）。許可リスト
 * - `GOOGLE_IAP_MOCK_VERIFIER` — `1` のとき、開発中だけモックの検証器を選ぶ
 *   （{@link isGoogleMockVerifierEnabled}）
 */

/**
 * Android アプリのパッケージ名
 * パッケージ名
 *
 * Play に購入を確かめるときに渡す。ストアに出したアプリの識別子で、環境ごとに
 * 変わらないのでコードに書く。
 */
export const GOOGLE_PLAY_PACKAGE_NAME = "help.mahjong.score";

/**
 * 売り方ごとの Product ID を持つ環境変数名
 * Product ID環境変数名
 *
 * `APPLE_PRODUCT_ID_ENV_NAMES` と同じく表にして、プランや売り方を足したときに
 * ここへの追記をコンパイラに要求させる。
 */
const GOOGLE_PRODUCT_ID_ENV_NAMES: Readonly<
  Record<PlanKey, Readonly<Record<OfferKey, string>>>
> = {
  pro: {
    pass: "GOOGLE_IAP_PRODUCT_ID_PRO_PASS",
    lifetime: "GOOGLE_IAP_PRODUCT_ID_PRO_LIFETIME",
  },
};

/**
 * Android アプリで売る売り方とその Product ID を読む。買い切りが無ければ undefined
 * Product ID取得
 *
 * 買い切りは必須、30 日パスは任意（`readAppleProductIds` と同じ）。パスの
 * Product ID を外すと、Android アプリには買い切りだけが並ぶ。
 */
export function readGoogleProductIds():
  Readonly<Partial<Record<OfferKey, string>>> | undefined {
  const pass = process.env[GOOGLE_PRODUCT_ID_ENV_NAMES.pro.pass];
  const lifetime = process.env[GOOGLE_PRODUCT_ID_ENV_NAMES.pro.lifetime];
  if (!lifetime) return undefined;
  return pass ? { pass, lifetime } : { lifetime };
}

/**
 * Google Play で Pro を販売できる状態か（買い切りの Product ID が設定済み）
 * Google Play の販売可否
 *
 * `isAppleIapOnSale` と同じく経路ごとに判定する。Android アプリが自分の経路の
 * 販売中の商品を引くとき（`GET /plan/offers?platform=android`）はこの経路だけを
 * 見る。一方、回数制限の API は要求から経路を読まず「App Store か Google Play の
 * どちらかで販売中」を根拠にする — 申告した OS で答えが変わると「android と
 * 名乗れば数えない」経路ができてしまうため。払えないペイウォールは、アプリが
 * 自分の経路の販売中の商品が空なら回数制限の API を呼ばないことで防ぐ。
 */
export function isGoogleIapOnSale(): boolean {
  return readGoogleProductIds() !== undefined;
}

/**
 * Product ID から売り方を引く。知らない Product ID なら undefined
 * 売り方の逆引き
 */
export function offerKeyOfGoogleProductId(
  productId: string,
): OfferKey | undefined {
  const ids = readGoogleProductIds();
  if (!ids) return undefined;
  return OFFER_KEYS.find((offer) => ids[offer] === productId);
}

/**
 * テストの購入に特典を付けてよい user_id の集合を読む
 * 許可リスト取得
 *
 * Play のライセンステスターの購入（`purchaseType = 0`）は課金されずに本番
 * サーバーへ届く。全員に特典を付けると、テスト用の配布を受けた人が全員無料で
 * 買い切りを得るので、審査用のデモアカウントと運営のテスターだけをここに載せる
 * （`APPLE_IAP_SANDBOX_USER_IDS` と同じ理由）。開発用のモック購入もテストの購入
 * として扱うので、この許可リストの本人にしか記録しない。未設定・空なら空集合
 * （テストの購入は誰にも記録しない）。
 */
export function readGoogleTestUserIds(): ReadonlySet<string> {
  const value = process.env.GOOGLE_IAP_TEST_USER_IDS ?? "";
  return new Set(
    value
      .split(",")
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0),
  );
}

/**
 * サーバーの検証器にモックを選ぶか
 * モック検証器の有効判定
 *
 * `NODE_ENV` が `production` でなく、かつ `GOOGLE_IAP_MOCK_VERIFIER=1` のときだけ
 * true。モックは `mock:` で始まるトークンだけを受け、購入を必ずテストの購入として
 * 返すので、記録されるのは許可リスト（{@link readGoogleTestUserIds}）の本人だけ。
 * 条件と許可リストの 2 重で守る。
 *
 * 根拠を `NODE_ENV` にするのは、Vercel のビルドが Preview も本番も
 * `NODE_ENV=production` で動くため — フラグを本番に誤って設定してもモックは
 * 選ばれない。`VERCEL_ENV` はシステム環境変数を公開する設定に依って値が無い
 * こともあるので根拠にしない。Apple の偽の検証器のように「本番のモジュール
 * グラフから import しない」ことで守る形は使えない（開発中に実行時に選ぶ必要が
 * ある）ので、この条件で守る。
 */
export function isGoogleMockVerifierEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.GOOGLE_IAP_MOCK_VERIFIER === "1"
  );
}
