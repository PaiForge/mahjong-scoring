import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { buildNoYakuResultRows } from "@mahjong-scoring/features/practice/tenpai-score/no-yaku-result-rows";

import { useAllowDoubleYakuman } from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "../agari-score/result-table-frame";
import type { NoYakuResultDisplayProps } from "@mahjong-scoring/features/practice/tenpai-score/result-props";

/**
 * 役が無くロンできないマスの答え合わせ（web の `NoYakuResultDisplay`）
 * 役なしの結果表示
 *
 * 正解が「役なし」のマスは点数の出題を持たないので結果表示に渡せない。それでも
 * 同じ枠・同じ行（役・翻数・符・点数）の表で出し、タブを切り替えても形を
 * 変えない。どの行に何を置くかは web と共有の {@link buildNoYakuResultRows} が
 * 決め、ここは行を描くだけ。表の下に、なぜ和了れないかの一文を添える。
 */
export function NoYakuResultDisplay(props: NoYakuResultDisplayProps) {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tYakuNames = useTranslations("yakuNames");
  const tCommon = useTranslations("common");
  const allowDoubleYakuman = useAllowDoubleYakuman();
  const rows = buildNoYakuResultRows(props, {
    t,
    tScore,
    tYakuNames,
    tCommon,
    allowDoubleYakuman,
  });

  return (
    <View style={styles.root}>
      <ResultTableFrame embedded>
        {rows.map((row, index) => (
          <ResultSection
            key={row.key}
            first={index === 0}
            final={row.key === "score"}
          >
            <ResultRow
              final={row.key === "score"}
              label={row.label}
              answer={
                row.answer.kind === "judged" ? (
                  <JudgedValue
                    value={row.answer.value}
                    isCorrect={row.answer.isCorrect}
                  />
                ) : (
                  <ResultUnansweredValue />
                )
              }
              correct={<CorrectValue value={row.correct} />}
            />
          </ResultSection>
        ))}
      </ResultTableFrame>
      <Text style={styles.detail}>{t("result.noYakuDetail")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  detail: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface600,
  },
});
