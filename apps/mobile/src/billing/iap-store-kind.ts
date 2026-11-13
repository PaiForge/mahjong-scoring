/**
 * このビルドが Pro の購入に使うストア
 * ストアの種類
 *
 * - `apple` — App Store のアプリ内課金（iOS）
 * - `fake` — 開発用の偽ストア（Android の開発ビルドだけ）。本物の Google Play を
 *   通さずに購入を作り、サーバーの Google の記録のパスへ送る
 * - `none` — Pro を扱わない（ストアに出す Android のビルド・画面確認用の web 版）
 */
export type IapStoreKind = "apple" | "fake" | "none";

/**
 * OS・ビルドの種類・求めたストアから、Pro の購入に使うストアを決める
 * ストアの選択
 *
 * iOS は求めたストアに依らず常に `apple`。Android は開発ビルド（`__DEV__`）で
 * `EXPO_PUBLIC_IAP_STORE=fake` を求めたときだけ偽ストアを選び、それ以外は `none`
 * （Pro を出さない）。
 *
 * 開発ビルドを条件にするのは、ストアに出すビルドに偽ストアを入れないため。
 * `EXPO_PUBLIC_*` はバンドルに焼き込まれるので、環境変数の設定を誤ると本番の
 * バンドルにも `fake` が載る。`__DEV__` は本番のバンドルで false に固定されるので、
 * 環境変数をどう設定してもストア向けのビルドで偽ストアは選ばれない（設定の誤りは
 * `scripts/testflight.sh` も提出前に止める）。Android の Release はローカルの
 * Supabase にログインできず、購入の確認はもともと開発ビルドでしかできないので、
 * 開発ビルドに限っても失うものは無い。
 *
 * iOS で偽ストアに差し替える経路は持たない。偽ストアは Google の記録のパスへ送る
 * 形で、iOS で動かすには Apple の署名付き取引を受ける偽の検証器をサーバーで
 * 実行時に選ぶ仕掛けがもう 1 組要り、Android の確認は一歩も進まない。
 *
 * react-native を読まない純粋な関数にしてあるのは、`__DEV__` と `Platform` が無い
 * Node の単体テストからこの規則を確かめるため（実際の値は `iap-availability.ts` が渡す）。
 *
 * @param os - `Platform.OS`
 * @param isDev - 開発ビルドか（`__DEV__`）
 * @param requested - 求めたストア（`EXPO_PUBLIC_IAP_STORE`）。`fake` だけを読む
 */
export function resolveIapStoreKind({
  os,
  isDev,
  requested,
}: {
  readonly os: string;
  readonly isDev: boolean;
  readonly requested: string | undefined;
}): IapStoreKind {
  if (os === "ios") return "apple";
  if (os === "android" && isDev && requested === "fake") return "fake";
  return "none";
}
