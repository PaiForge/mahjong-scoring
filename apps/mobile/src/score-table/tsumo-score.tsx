import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTranslations } from "use-intl";
import type { TsumoPayment } from "@mahjong-scoring/core";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";

import { colors } from "../lib/theme";

/**
 * ツモ点数の2段表示（web の `TsumoScore`）
 * ツモ点数表示
 *
 * 狭い表で「400/700」を 1 行に収めきれず数字が割れるため、縦に積む。
 * 子ツモは区切り線で分数のように上段＝子から・下段＝親からを示し、
 * 親ツモは点数の下に小さく「オール」を添える。上下が何を指すかは表の上の凡例が受け持つ。
 *
 * 「オール」は web と同じ辞書キー（`scoreTable.all`）から引く。練習の回答・
 * 答え合わせ（`formatScoreAnswer`）と教本の本文が親ツモを「オール」と呼ぶので、
 * 表だけ英字の ALL にしない（理由の全文は web の `TsumoScore` の TSDoc）。
 * 読み上げも `formatScoreAnswer` の文字列（"400/700" / "2000オール"）で、
 * 回答欄・答え合わせと同じ読みになる。
 */
export function TsumoScore({
  payment,
  textStyle,
}: {
  readonly payment: TsumoPayment;
  /** 数字の文字の体裁（色・太さ）。呼び出し側のセルに合わせる */
  readonly textStyle?: StyleProp<TextStyle>;
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
        <Text style={[styles.number, textStyle]}>{payment.fromKo}</Text>
        <View style={styles.rule} />
        <Text style={[styles.number, textStyle]}>{payment.fromOya}</Text>
      </View>
    );
  }
  return (
    <View
      style={styles.center}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.number, textStyle]}>{payment.all}</Text>
      <Text style={[styles.all, textStyle]}>{t("all")}</Text>
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
  number: {
    textAlign: "center",
    lineHeight: 17,
  },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: 2,
    // 数字と同じ色（点数表の数字の墨）を薄く敷く
    backgroundColor: colors.foreground,
    opacity: 0.3,
  },
  all: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    opacity: 0.6,
    textAlign: "center",
  },
});
