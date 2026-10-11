/**
 * 押すと点数表を開く値の下線
 * 点数表リンクの下線
 *
 * 答え合わせの値（正解の点数・内訳の合計の翻・符）のうち、押すとその和了の
 * セルをハイライトした点数表が開くものに敷く。テキストリンク（灰の実線）とは
 * 分け、値の読みやすさを保ったまま「押せる」を常時の点線で示す — hover で
 * しか出ない手がかりはタッチ端末で見えない。文字の大きさ・太さ・色は置く側が
 * 決める（値ごとに表の中での濃さが違う）。
 */
export const SCORE_TABLE_LINK_CLASSES =
  "cursor-pointer underline decoration-surface-400 decoration-dotted decoration-2 underline-offset-4 hover:decoration-action";
