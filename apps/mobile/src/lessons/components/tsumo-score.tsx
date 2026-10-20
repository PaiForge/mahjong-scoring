import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { TsumoPayment } from "@mahjong-scoring/core";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";

/**
 * ツモ点数の2段表示（web の `TsumoScore`）
 * ツモ点数表示
 *
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく「オール」を添える。文字色は親（`color`）に合わせる。
 *
 * 「オール」は点数早見表と同じ辞書キー（`scoreTable.all`）から引く。練習の回答・
 * 答え合わせ（`formatScoreAnswer`）と教本の本文が親ツモを「オール」と呼ぶので、
 * 表だけ英字の ALL にしない（理由の全文は web の `TsumoScore` の TSDoc）。
 * 読み上げも `formatScoreAnswer` の文字列（"400/700" / "2000オール"）で、
 * 回答欄・答え合わせと同じ読みになる。
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
  const t = useTranslations("scoreTable");
  const accessibilityLabel = formatScoreAnswer(payment, t);
  if (payment.type === "koTsumo") {
    return (
      <View
        style={styles.stack}
        accessible
        accessibilityLabel={accessibilityLabel}
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
    <View
      style={styles.center}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.value, { color }]}>{payment.all}</Text>
      <Text style={[styles.all, { color }]}>{t("all")}</Text>
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
