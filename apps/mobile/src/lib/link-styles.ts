import { StyleSheet } from "react-native";

import { colors } from "./theme";

/**
 * リンクの文字の体裁
 * リンクスタイル
 *
 * web はテキストリンクを「グレー + 常時下線」の 1 種類にそろえている
 * （hover でしか出ない下線はタッチ端末で見えないため）。ネイティブでは
 * 下線のリンクは web ページの記号で、押せることは行の形（全幅の行・右端の
 * 矢印・押したときの地の色）か、文字の色（アプリのアクセント色）で示すのが
 * 定石。そのため 2 種類に分ける。
 *
 * - {@link linkStyles.rowTitle} — 押せる行の題名。地の文と同じ濃さの太字で、
 *   押せることは行の形が示す（一覧・設定・目次）
 * - {@link linkStyles.textButton} — 単独で置く文字の操作（「終了する」「一覧へ
 *   戻る」「続きを読む」）。アクセント色の太字で、下線は引かない。「単独」は
 *   自分の行を持つか、並ぶものがすべて押せる語（用語の並び・かなの索引）で
 *   あること
 * - {@link linkStyles.inline} — 本文の中の語に掛けるリンク。文の中では色だけ
 *   では見分けにくいので、ここだけ下線を残す。折り返す文の中では末尾の
 *   記号を添えられないため
 * - 凡例の「不正解: N」や内訳の表の役名のように、押せない語と同じ大きさで
 *   同じ行・同じ表に並ぶ語は `InlineLink`（`components/inline-link.tsx`）。
 *   隣に同じ大きさの太字の地の文（凡例の値・表の数値）があると色だけでは
 *   押せる語を見分けられず、ネイティブの `Text` の下線は太さも位置も選べず
 *   web の下線に見えないので、末尾の記号（移る語は矢印、説明が出る語は
 *   ⓘ）で示す
 * - {@link linkStyles.scoreTableValue} — 答え合わせの値そのもの（点数・翻・符）
 *   を押すと点数表が開くもの。値の色を変えず、灰の点線の下線で示す
 *
 * 緑の塗りのボタンは「押して始める面」。文字ボタンは移動するだけの導線で、
 * 色は同じ系統でも面を持たないことで区別する。
 */
export const linkStyles = StyleSheet.create({
  rowTitle: {
    fontWeight: "600",
    color: colors.foreground,
  },
  textButton: {
    fontWeight: "600",
    color: colors.action,
  },
  textButtonPressed: {
    color: colors.actionActive,
    opacity: 0.7,
  },
  inline: {
    color: colors.action,
    textDecorationLine: "underline",
    textDecorationColor: colors.primary300,
  },
  /**
   * 押すと点数表を開く答え合わせの値（正解の点数・内訳の翻数と符）。値の
   * 濃さと大きさは置く側のまま、灰の点線の下線だけを足す（web の
   * `SCORE_TABLE_LINK_CLASSES`）。値を読む妨げにならない記号で押せることを示す
   */
  scoreTableValue: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: colors.surface400,
  },
});
