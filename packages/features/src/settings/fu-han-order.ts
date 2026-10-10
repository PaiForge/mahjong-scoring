/**
 * 符と翻の表記順
 *
 * 「30符 4翻」と「4翻 30符」のどちらで並べるか。点数計算の実力にも正解判定にも
 * 関わらない、純粋な見え方の設定。
 *
 * - `han-first` — 翻→符（既定）。「4翻30符」のように翻を先に言うのが
 *   申告でも解説でも一般的な言い方なので、それに合わせる
 * - `fu-first` — 符→翻。点数表が「符の行 × 翻の列」なので、表を引く
 *   目線と同じ順に揃えたい人向け
 *
 * 表記順の決まりは麻雀のルールには無い（点数さえ合っていればどちらでもよい）ので、
 * ルール設定ではなく表示設定に置く。
 */
export type FuHanOrder = "fu-first" | "han-first";

/** 一般的な言い方の「翻→符」を既定にする */
export const DEFAULT_FU_HAN_ORDER: FuHanOrder = "han-first";

/**
 * 符と翻の表示を設定の順に並べる
 * 符翻並び替え
 *
 * 満貫以上は点数が符に依らないため符を持たない。その場合は翻だけを返す
 * （出題文と結果の要約行が「符を省く」判断を各自で書かないように）。
 *
 * @param order 表記順
 * @param parts 描画済みの符と翻（文字列でも要素でもよい）。符は無いことがある
 */
export function orderFuHan<T>(
  order: FuHanOrder,
  parts: { readonly fu?: T; readonly han: T },
): readonly T[] {
  if (parts.fu === undefined) return [parts.han];
  return order === "fu-first" ? [parts.fu, parts.han] : [parts.han, parts.fu];
}
