import { StyleSheet, Text, View } from "react-native";
import type { TsumoPayment } from "@mahjong-scoring/core";

/**
 * ツモ点数の2段表示（web の `TsumoScore`）
 * ツモ点数表示
 *
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく ALL を添える。文字色は親（`color`）に合わせる。
 */
export function TsumoScore({
  payment,
  color,
  dimFromKo = false,
}: {
  readonly payment: TsumoPayment;
  readonly color: string;
  /**
   * 子ツモの上段（子が出す額）を落として、下段だけを前に出すか。
   * 「下段の数字がそのまま親ツモになる」ことを教本の図が指すときに使う
   */
  readonly dimFromKo?: boolean;
}) {
  if (payment.type === "koTsumo") {
    return (
      <View
        style={styles.stack}
        accessible
        accessibilityLabel={`${payment.fromKo}/${payment.fromOya}`}
      >
        <Text style={[styles.value, { color }, dimFromKo && styles.dim]}>
          {payment.fromKo}
        </Text>
        <View style={[styles.rule, { backgroundColor: color }]} />
        <Text style={[styles.value, { color }]}>{payment.fromOya}</Text>
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <Text style={[styles.value, { color }]}>{payment.all}</Text>
      <Text style={[styles.all, { color }]}>ALL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: "stretch",
  },
  center: {
    alignItems: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  rule: {
    height: 1,
    marginVertical: 2,
    opacity: 0.3,
  },
  dim: {
    opacity: 0.4,
  },
  all: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.6,
  },
});
