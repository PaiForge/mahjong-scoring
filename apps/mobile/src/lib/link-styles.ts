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
 *   戻る」「続きを読む」）。アクセント色の太字で、下線は引かない
 * - {@link linkStyles.inline} — 本文の中の語に掛けるリンク。文の中では色だけ
 *   では見分けにくいので、ここだけ下線を残す
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
    color: colors.primary700,
  },
  textButtonPressed: {
    color: colors.primary900,
    opacity: 0.7,
  },
  inline: {
    color: colors.primary700,
    textDecorationLine: "underline",
    textDecorationColor: colors.primary300,
  },
});
