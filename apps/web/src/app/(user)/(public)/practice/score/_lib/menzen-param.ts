/**
 * 門前縛りの URL パラメータ規約
 * 門前パラメータ
 *
 * 点数計算練習だけが持つ軸（点数表早引きには副露という概念が無い）。
 * 指定が無ければ門前・副露の両方を出す。点数帯や役と同じく、
 * URL の語彙はここだけが持ち、各所で文字列を組み立てない。
 */

/** 門前手だけを出題するかを指定するクエリパラメータ名 */
export const MENZEN_PARAM = "menzen";

/** 門前手だけに絞ることを表す URL トークン */
export const MENZEN_ONLY_TOKEN = "1";

/**
 * `menzen` の値を「門前手だけに絞るか」として解釈する。
 * 門前縛り解釈
 *
 * 未知の値は絞り込みなしとして扱う（手打ち URL や古いリンクで
 * 生成条件が変わらないようにする）。
 */
export function parseMenzenOnly(value: string | null): boolean {
  return value === MENZEN_ONLY_TOKEN;
}
