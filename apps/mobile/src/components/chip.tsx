import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/** チップの配色 */
export type ChipTone = "primary" | "success" | "amber" | "neutral";

const TONES: Readonly<
  Record<ChipTone, { readonly bg: string; readonly fg: string }>
> = {
  primary: { bg: colors.primary50, fg: colors.primary800 },
  success: { bg: colors.successSubtle, fg: colors.successStrong },
  amber: { bg: colors.amber100, fg: colors.warningStrong },
  neutral: { bg: colors.surface100, fg: colors.surface600 },
};

/**
 * 小さなラベルのチップ（web の `rounded-md` の淡い塗りのバッジ）
 * チップ
 *
 * 状態（取得済み・次の目標）・分類（門前 / 鳴き・コラム）を示す表示だけの印。
 * 枠も影も持たない — 枠と影は押せる面の記号なので、押せない印は塗りだけで
 * 地から浮かせる。「次」や注意を示すものは琥珀色（`amber`）。
 */
export function Chip({
  tone,
  icon,
  children,
}: {
  readonly tone: ChipTone;
  /** 文字の前に置く印（チェック等）。色は {@link chipForeground} で合わせる */
  readonly icon?: ReactNode;
  readonly children: string;
}) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.label, { color: fg }]}>{children}</Text>
    </View>
  );
}

/** チップの文字色（印をチップに添えるときに使う） */
export function chipForeground(tone: ChipTone): string {
  return TONES[tone].fg;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    minHeight: 24,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
