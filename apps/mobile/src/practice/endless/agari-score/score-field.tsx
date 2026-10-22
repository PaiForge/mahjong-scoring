import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import type { UseScorePracticeAnswerFormResult } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";

import { colors } from "../../../lib/theme";
import { ScoreOptionSelect } from "../../components/score-option-select";

/**
 * 回答フォームの点数の欄（web の `ScoreField`）
 * 点数の欄
 *
 * 点数の選択肢の形（`availableScores.type`）で欄が変わる。子ツモの分割入力
 * （組の欄）は「300/500」だけでは並び順が分からない初学者のため、ラベルに
 * 「子から / 親から」の順を添える。
 */
export function ScoreField({
  form,
  disabled,
}: {
  readonly form: Pick<
    UseScorePracticeAnswerFormResult,
    | "availableScores"
    | "score"
    | "scoreFromKo"
    | "scoreFromOya"
    | "koTsumoPayment"
    | "isOyaTsumo"
    | "setScore"
    | "setScoreFromKo"
    | "setScoreFromOya"
    | "setKoTsumoPayment"
  >;
  readonly disabled: boolean;
}) {
  const t = useTranslations("agariScore");
  const { availableScores } = form;
  return (
    <View>
      <Text style={styles.label}>
        {availableScores.type === "single"
          ? t("form.labels.score")
          : t("form.labels.koTsumoScore")}
      </Text>
      {availableScores.type === "koTsumoSplit" ? (
        <View style={styles.koTsumoRow}>
          <View style={styles.koTsumoColumn}>
            <ScoreOptionSelect
              value={form.scoreFromKo?.toString()}
              onChange={(v) => form.setScoreFromKo(Number(v))}
              options={scoreSelectOptions(availableScores.koScores)}
              placeholder={t("form.placeholders.fromKo")}
              accessibilityLabel={t("form.placeholders.fromKo")}
              disabled={disabled}
            />
          </View>
          <Text style={styles.slash}>/</Text>
          <View style={styles.koTsumoColumn}>
            <ScoreOptionSelect
              value={form.scoreFromOya?.toString()}
              onChange={(v) => form.setScoreFromOya(Number(v))}
              options={scoreSelectOptions(availableScores.oyaScores)}
              placeholder={t("form.placeholders.fromOya")}
              accessibilityLabel={t("form.placeholders.fromOya")}
              disabled={disabled}
            />
          </View>
        </View>
      ) : availableScores.type === "koTsumoCombined" ? (
        <ScoreOptionSelect
          value={form.koTsumoPayment && koTsumoPaymentKey(form.koTsumoPayment)}
          onChange={(key) => {
            const payment = koTsumoPaymentOfKey(availableScores.payments, key);
            if (payment) form.setKoTsumoPayment(payment);
          }}
          options={koTsumoSelectOptions(availableScores.payments)}
          placeholder={t("form.placeholders.select")}
          accessibilityLabel={t("form.labels.koTsumoScore")}
          disabled={disabled}
        />
      ) : (
        <ScoreOptionSelect
          value={form.score?.toString()}
          onChange={(v) => form.setScore(Number(v))}
          options={scoreSelectOptions(
            availableScores.scores,
            form.isOyaTsumo ? t("form.options.all") : "",
          )}
          placeholder={t("form.placeholders.select")}
          accessibilityLabel={t("form.labels.score")}
          disabled={disabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  koTsumoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  koTsumoColumn: {
    flex: 1,
  },
  slash: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.surface500,
  },
});
