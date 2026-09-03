/**
 * 和了者の立場と和了方法
 * 立場・和了方法
 *
 * 「親/子」「ロン/ツモ」という2値軸の唯一の定義。
 * 出題・点数計算・点数表・学習ページはすべてここから引く。
 */

/** 親 / 子 */
export type Role = "oya" | "ko";

/** ロン / ツモ */
export type WinType = "tsumo" | "ron";

/** Role 型ガード */
export function isRole(value: string): value is Role {
  return value === "oya" || value === "ko";
}

/** WinType 型ガード */
export function isWinType(value: string): value is WinType {
  return value === "tsumo" || value === "ron";
}

/**
 * 点棒のやり取りの形
 * 支払い形
 *
 * 親/子 × ロン/ツモ の4通りは、点棒の受け渡しとしては3通りしかない。
 * 親ロンと子ロンはどちらも放銃者ひとりから1口（"ron"）、親ツモは全員から
 * 同額の1口（"oyaTsumo"）、子ツモだけが「子から / 親から」の2口
 * （"koTsumo"）になる。点数の選択肢の作りも回答欄の数もこの区分で決まる。
 */
export type PaymentKind = "ron" | "oyaTsumo" | "koTsumo";

/**
 * 立場と和了方法から支払い形を求める
 * 支払い形判定
 *
 * `isTsumo && !isOya` のような条件を各画面に書くと、3通りのどれを指すのかが
 * 読み手に見えず、分類が1箇所ずれても気づけない。判定はここに寄せる。
 */
export function paymentKindOf(isOya: boolean, isTsumo: boolean): PaymentKind {
  if (!isTsumo) return "ron";
  return isOya ? "oyaTsumo" : "koTsumo";
}
