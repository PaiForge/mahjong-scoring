import type { TextStyle, ViewStyle } from "react-native";

import { borderWidth, colors, radius } from "./theme";

/**
 * 押すと詳細へ進むカードの骨格（練習一覧の練習カードとネイティブ広告）
 * リンクカードの骨格
 *
 * 細枠の白いカード、上段にタイトル（右に添え物）、下段の右端に緑の
 * 「詳しく」系の文言。広告を練習カードと同じ並びに置くため、枠・余白・
 * 文字の値をここに 1 つだけ持つ。中身（説明・画像・ピル）は各カードが足す。
 */
export const linkCard = {
  card: {
    borderWidth: borderWidth.panel,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    padding: 20,
    gap: 16,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.action,
  },
} as const satisfies Readonly<Record<string, ViewStyle | TextStyle>>;
