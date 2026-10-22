import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import type { ScoreAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-answer-form-props";

import { Button } from "../../components/button";
import { useKoTsumoInput } from "../../hooks/use-display-settings-store";
import { useRuleSettingsStore } from "../../hooks/use-rule-settings-store";
import { colors } from "../../lib/theme";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import { useScoreAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-answer-form";
import { ScoreOptionSelect } from "./score-option-select";

/**
 * 点数系練習共通の回答フォーム
 * 点数回答フォーム
 *
 * web の `ScoreAnswerForm` の移植。props の意味と設計（選択即送信・ルール
 * 固定）は features の {@link ScoreAnswerFormProps} にある。ここはピッカーでの
 * 描画だけを持つ。回答直後の正誤は選択欄自身の枠と地の色で返し、トレーニングの
 * 正解は {@link import("./revealed-score-answer").RevealedScoreAnswer} が別に出す。
 */
export function ScoreAnswerForm({
  isOya,
  isTsumo,
  han,
  onSubmit,
  disabled = false,
  translationNamespace,
  scoreRange,
  autoSubmit = false,
  showFeedback = false,
  lastAnswerCorrect,
  allowDoubleYakuman = false,
  fixedRules = false,
}: ScoreAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const koTsumoInput = useKoTsumoInput();
  const {
    availableScores,
    isOyaTsumo,
    score,
    scoreFromKo,
    scoreFromOya,
    koTsumoPayment,
    selectScore,
    selectFromKo,
    selectFromOya,
    selectKoTsumoPayment,
    isComplete,
    submit,
    showsSubmitButton,
  } = useScoreAnswerForm({
    isOya,
    isTsumo,
    han,
    onSubmit,
    disabled,
    scoreRange,
    autoSubmit,
    kiriageMangan,
    allowDoubleYakuman,
    fixedRules,
    koTsumoInput,
  });
  // 子ツモの分割入力の 2 つの欄は片方だけを染めない。正誤判定は
  // 「子から / 親から」を合わせた 1 つの回答に対して下るため
  const feedback = { showFeedback, lastAnswerCorrect };

  return (
    <View style={styles.form}>
      {availableScores.type === "koTsumoSplit" ? (
        <View style={styles.koTsumoRow}>
          <View style={styles.koTsumoColumn}>
            <Text style={styles.label}>{t("fromKo")}</Text>
            <ScoreOptionSelect
              value={scoreFromKo?.toString()}
              onChange={(v) => selectFromKo(Number(v))}
              options={scoreSelectOptions(availableScores.koScores)}
              placeholder={t("selectScore")}
              accessibilityLabel={t("fromKo")}
              disabled={disabled}
              feedback={feedback}
              testID="score-select-from-ko"
            />
          </View>
          <Text style={styles.slash}>/</Text>
          <View style={styles.koTsumoColumn}>
            <Text style={styles.label}>{t("fromOya")}</Text>
            <ScoreOptionSelect
              value={scoreFromOya?.toString()}
              onChange={(v) => selectFromOya(Number(v))}
              options={scoreSelectOptions(availableScores.oyaScores)}
              placeholder={t("selectScore")}
              accessibilityLabel={t("fromOya")}
              disabled={disabled}
              feedback={feedback}
              testID="score-select-from-oya"
            />
          </View>
        </View>
      ) : availableScores.type === "koTsumoCombined" ? (
        // 「300/500」だけでは並び順が分からない初学者のため、ラベルに
        // 「子から / 親から」の順を添える
        <View>
          <Text style={styles.label}>{t("koTsumoScore")}</Text>
          <ScoreOptionSelect
            value={koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)}
            onChange={(key) => {
              const payment = koTsumoPaymentOfKey(
                availableScores.payments,
                key,
              );
              if (payment) selectKoTsumoPayment(payment);
            }}
            options={koTsumoSelectOptions(availableScores.payments)}
            placeholder={t("selectScore")}
            accessibilityLabel={t("koTsumoScore")}
            disabled={disabled}
            feedback={feedback}
            testID="score-select-ko-tsumo"
          />
        </View>
      ) : (
        <View>
          <Text style={styles.label}>{t("selectScore")}</Text>
          <ScoreOptionSelect
            value={score?.toString()}
            onChange={(v) => selectScore(Number(v))}
            options={scoreSelectOptions(
              availableScores.scores,
              isOyaTsumo ? t("all") : "",
            )}
            placeholder={t("selectScore")}
            disabled={disabled}
            feedback={feedback}
            testID="score-select"
          />
        </View>
      )}

      {/* 自動送信時は「回答する」ボタンを表示しない（選択完了で送信扱い） */}
      {showsSubmitButton && (
        <Button
          onPress={submit}
          size="lg"
          fullWidth
          disabled={disabled || !isComplete}
        >
          {t("answer")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  koTsumoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  koTsumoColumn: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  slash: {
    paddingBottom: 14,
    fontSize: 16,
    fontWeight: "500",
    color: colors.surface500,
  },
});
