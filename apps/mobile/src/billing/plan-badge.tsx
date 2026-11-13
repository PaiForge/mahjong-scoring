import { StyleSheet, Text, View } from "react-native";
import type { PlanBadge as PlanBadgeKind } from "@mahjong-scoring/features/billing/plan-badge";

import { colors, radius } from "../lib/theme";

const TONES: Readonly<
  Record<PlanBadgeKind, { readonly bg: string; readonly fg: string }>
> = {
  pro: { bg: colors.podiumGold, fg: colors.surface900 },
  vip: { bg: colors.surface900, fg: colors.white },
};

/**
 * プランのバッジ（Pro / VIP）
 *
 * 現在の状態の見出しの横に添える、表示だけの小さなラベル。種類は
 * `planBadgeOf(status)` が `kind` から導いたものをそのまま受け、画面で
 * `kind === "granted"` を書かない（web のマイページ・管理画面と対応をずらさないため）。
 * VIP は別のプランではなく、運営から付与された Pro という出どころの印なので、
 * 見出しの文言（「Pro（付与）」等。期限を運ぶ）は変えずにこのバッジを足す。
 *
 * 色は web のバッジに揃える: Pro は金の地（`podiumGold`）に墨の文字、VIP は
 * 墨の地（`surface900`）に白抜き。形は同じで、色だけで両者を分ける。枠も影も
 * 持たない（押せない印なので、`Chip` と同じく塗りだけで地から浮かせる）。
 *
 * 出してよいのは本人のプラン画面だけ。他の利用者に見える場所には置かない —
 * 他の利用者に見せる情報を増やさないため（アプリは他の利用者の情報を出さない）。
 */
export function PlanBadge({
  badge,
  label,
}: {
  readonly badge: PlanBadgeKind;
  /** 見える表記（`mobilePlan.status.badge.pro` / `.vip`） */
  readonly label: string;
}) {
  const { bg, fg } = TONES[badge];
  return (
    <View
      style={[styles.badge, { backgroundColor: bg }]}
      testID={`plan-badge-${badge}`}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
