import type { Purchase } from "@/lib/db";

/**
 * アプリのストア（App Store・Google Play）から届いたパスの開始日時を決める
 * パスの開始日時
 *
 * 原則は購入日時。ただし本人に有効か開始待ちの購入があり、それが期限を
 * 持つなら、その中で最も遅い期限から始める（開始待ちで入れる）。
 *
 * 重ね買いはアプリの画面で止めている（有効な購入があれば購入ボタンを出さない）
 * が、すり抜けた 2 枚目のパスもここで繋ぐ（重ね買いの救済）。web は重なった
 * 決済を自動で返金して救うが、App Store には開発者から返金する手段が無く、
 * 本人の払った分を無駄にしないためには後ろに繋ぐしかない。この規則は App Store
 * の事情から来たものだが、Google Play の購入も同じ規則に揃える — ストアごとに
 * 重ね買いの扱いが割れると、同じ人がどの端末で買ったかで結果が変わるため。
 *
 * 買い切り（期限なし）が有効なら購入日時から始める。パスの日数は買い切りに
 * 埋もれて無駄になるが、買い切りの方が常に強いので本人の特典は減らない
 * （画面がボタンを隠すので通常は起きない）。
 *
 * @param purchaseDate - ストアの購入日時
 * @param unexpiredPurchases - 本人の未取消・期限内か永久の購入（Sandbox / Test を
 *   除く。`findUnexpiredPurchases`）
 */
export function storePassStartsAt(
  purchaseDate: Date,
  unexpiredPurchases: readonly Pick<Purchase, "expiresAt">[],
): Date {
  let latest = purchaseDate;
  for (const purchase of unexpiredPurchases) {
    if (purchase.expiresAt === null) return purchaseDate;
    if (purchase.expiresAt > latest) latest = purchase.expiresAt;
  }
  return latest;
}
