import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  formatSignedDelta,
  signedDeltaTone,
  type DeltaTone,
} from "@mahjong-scoring/features/challenge/signed-delta";

import { HelpIconButton } from "../components/help-icon-button";
import { InfoModal } from "../components/info-modal";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";

/** 増減の色（web の `DELTA_TONE_CLASSES`） */
const DELTA_TONE_COLORS: Readonly<Record<DeltaTone, string>> = {
  up: colors.success,
  down: colors.destructive,
  flat: colors.surface500,
};

/**
 * 統計値のカード（web のマイレコードの `StatsCard`）
 * 統計カード
 *
 * ベストスコア・平均スコアと、前の期間との差。差は統計値と同じ単位の実数で、
 * 比べられる前の期間の値が無ければ出さない（web と同じ）。`info` を渡すと
 * ラベルの右に「?」を置き、押すと定義の補足を下からのシートで出す。
 */
export function StatsCard({
  label,
  value,
  info,
  comparison,
}: {
  readonly label: string;
  readonly value: string;
  readonly info?: string;
  readonly comparison: {
    readonly change: number | undefined;
    /** 「先週比」などの比較対象 */
    readonly label: string;
    /** 表示する小数桁数。`value` の書式に合わせる（既定 0） */
    readonly fractionDigits?: number;
  };
}) {
  const tCommon = useTranslations("common");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { change, fractionDigits = 0 } = comparison;
  return (
    <View style={[panelFrame, styles.card]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {info !== undefined && (
          <HelpIconButton
            onPress={() => setIsInfoOpen(true)}
            label={tCommon("showDetailInfo")}
            fontSize={12}
          />
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      {change !== undefined && (
        <Text
          style={[
            styles.comparison,
            {
              color: DELTA_TONE_COLORS[signedDeltaTone(change, fractionDigits)],
            },
          ]}
        >
          {comparison.label} {formatSignedDelta(change, fractionDigits)}
        </Text>
      )}
      {info !== undefined && (
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          title={label}
          closeLabel={tCommon("close")}
        >
          {info}
        </InfoModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surface50,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: colors.surface500,
  },
  value: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.surface900,
  },
  comparison: {
    marginTop: 4,
    fontSize: 13,
  },
});
