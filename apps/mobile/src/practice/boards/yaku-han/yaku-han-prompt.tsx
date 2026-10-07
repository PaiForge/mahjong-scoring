import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { Chip } from "../../../components/chip";
import { colors } from "../../../lib/theme";

/**
 * 役翻数練習の出題提示（役名と門前/鳴きバッジ。web の `YakuHanPrompt`）
 * 役翻数出題提示
 *
 * 枠線は持たない（盤面側が出題を囲む枠を与える）。バッジは鳴き状態が
 * 出題されない役でも必ず出す。省くと出題が変わるたびに役名の位置が
 * 上下して読みにくくなるため。
 */
export function YakuHanPrompt({
  yakuName,
  isMenzen,
}: {
  /** 出題する役名 */
  readonly yakuName: string;
  /** 門前で出題されているか（false は鳴き） */
  readonly isMenzen: boolean;
}) {
  const t = useTranslations("yakuHanChallenge");

  return (
    <View style={styles.root}>
      <View style={styles.badgeRow}>
        <Chip tone={isMenzen ? "primary" : "amber"}>
          {isMenzen ? t("menzen") : t("naki")}
        </Chip>
      </View>
      <Text style={styles.yakuName}>{yakuName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 12,
  },
  badgeRow: {
    flexDirection: "row",
  },
  yakuName: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.surface900,
    textAlign: "center",
  },
});
