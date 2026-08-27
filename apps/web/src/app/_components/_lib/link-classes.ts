/**
 * テキストリンクの共通クラス文字列（blindfold-chess の link-classes 準拠）。
 *
 * `hover:underline` のような hover 時だけのアフォーダンスはタッチ端末では
 * 一切見えず、リンクがただの文字に見えてしまう。ここでは下線を常時引き、
 * hover では色だけを変える。キーボード操作向けに focus-visible のリングも
 * 同梱する（マウスクリックでは出ない）。
 *
 * 通常のテキストリンクにはこの定数を使い、`text-primary-* hover:underline`
 * のような class をページ側で直接書かない。行全体がクリック対象になるもの
 * （`LinkRow` 等）は、行の中のタイトルに {@link ROW_LINK_TITLE_CLASSES} を使う。
 *
 * 下線は文字色より一段淡く置き、hover で濃くする。太さは既定（約 1px）の
 * まま、`underline-offset-4` で文字から離して見せる。
 */

/**
 * focus-visible のリング。常時下線を持たないクリック対象（行全体が
 * リンクのカード等）にも同じキーボード・アフォーダンスを付けたいとき用に
 * 単独でも export する。
 */
export const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// rounded-xs はリングの角用。rounded-sm 以上は globals.css で大きく
// 取り直しているためインラインのリングには合わない。
const LINK_DECORATION =
  "rounded-xs underline underline-offset-4 transition-colors";

const LINK_BASE = `${LINK_DECORATION} ${FOCUS_RING_CLASSES}`;

/** 既定のテキストリンク。本文中のリンクや CTA 下の補助リンクに使う。 */
export const TEXT_LINK_CLASSES = `text-link-primary decoration-primary-300 hover:text-primary-700 hover:decoration-primary-600 ${LINK_BASE}`;

/** 控えめなテキストリンク。フッター・目次・補助導線など地の文に溶かしたい箇所に使う。 */
export const TEXT_LINK_MUTED_CLASSES = `text-muted-foreground decoration-surface-300 hover:text-foreground hover:decoration-surface-500 ${LINK_BASE}`;

/**
 * 行全体がリンクになっている中のタイトル用（`LinkRow`）。
 *
 * 見た目は控えめなテキストリンクと同じだが、hover はタイトルではなく行に
 * 追随させる（行のどこにポインタがあっても色が変わる）ため `hover:` ではなく
 * `group-hover:` を使う。focus-visible のリングは行の `<a>` 側が持つので
 * ここには含めない。
 *
 * 下線を常時引くのは他のテキストリンクと同じ理由。行の中で日付や説明と
 * 並ぶタイトルは、下線が無いとただの文字に見えてリンクだと分からない。
 */
export const ROW_LINK_TITLE_CLASSES = `text-muted-foreground decoration-surface-300 group-hover:text-foreground group-hover:decoration-surface-500 ${LINK_DECORATION}`;
