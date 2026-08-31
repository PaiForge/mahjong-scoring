/**
 * 出題セッション（練習・トレーニング・試験）の最中を表すルートか判定する。
 *
 * 該当するのは `/practice/<種別>/play`, `/practice/<種別>/training`,
 * `/exam/<種別>/play` の 3 形。説明ページと結果ページは含めない
 * （回答の最中ではなく、次の導線を選ぶ画面のため）。
 *
 * @param pathname 判定対象のパス名
 */
export function isSessionRoute(pathname: string): boolean {
  return /^\/(?:practice|exam)\/[^/]+\/(?:play|training)$/.test(pathname);
}
