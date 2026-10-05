/**
 * 手の形（門前 / 副露）絞り込みの URL パラメータ規約
 * 手の形パラメータ
 *
 * 点数計算練習だけが持つ軸（点数表早引きには副露という概念が無い）。
 * 指定が無ければ門前・副露の両方を出す。点数帯や役と同じく、
 * URL の語彙はここだけが持ち、各所で文字列を組み立てない。
 */

/** 手の形を指定するクエリパラメータ名 */
export const HAND_SHAPE_PARAM = "hand";

/** 門前手だけを出題することを表す URL トークン */
export const HAND_SHAPE_MENZEN = "menzen";

/** 副露した手だけを出題することを表す URL トークン */
export const HAND_SHAPE_FURO = "furo";

/**
 * 手の形そのもの（門前 / 副露）
 *
 * 絞り込み条件としての {@link HandShape} と違い「指定なし」を含まない。
 * 教本の表のように、門前と副露のどちらかに必ず決まる文脈で使う。
 */
export type FixedHandShape = typeof HAND_SHAPE_MENZEN | typeof HAND_SHAPE_FURO;

/** 手の形の絞り込み。undefined は絞り込みなし */
export type HandShape =
  typeof HAND_SHAPE_MENZEN | typeof HAND_SHAPE_FURO | undefined;

/**
 * `hand` の値を手の形の絞り込みとして解釈する。
 * 手の形解釈
 *
 * 未知の値は絞り込みなしとして扱う（手打ち URL や古いリンクで
 * 生成条件が変わらないようにする）。
 */
export function parseHandShape(value: string | null): HandShape {
  if (value === HAND_SHAPE_MENZEN) return HAND_SHAPE_MENZEN;
  if (value === HAND_SHAPE_FURO) return HAND_SHAPE_FURO;
  return undefined;
}
