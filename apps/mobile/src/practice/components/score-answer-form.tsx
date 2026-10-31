import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import type { ScoreAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-answer-form-props";

import { Button } from "../../components/button";
import {
  useKoTsumoInput,
  useScoreInput,
} from "../../hooks/use-display-settings-store";
import { useRuleSettingsStore } from "../../hooks/use-rule-settings-store";
import { colors } from "../../lib/theme";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import { useScoreAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-answer-form";
import { ScoreLabelRow } from "./score-label-row";
import { ScoreOptionSelect } from "./score-option-select";
import { ScoreTilePicker } from "./score-tile-picker";

/**
 * 点数系練習共通の回答フォーム
 * 点数回答フォーム
 *
 * web の `ScoreAnswerForm` の移植。props の意味と設計（選択即送信・ルール
 * 固定）は features の {@link ScoreAnswerFormProps} にある。ここは描画だけを
 * 持つ。入力方式（features の `settings/score-input.ts`）が `tiles` なら
 * {@link ScoreTilePicker}、`select` なら選択欄で描く。回答直後の正誤は、タイルなら
 * 選んだタイル、選択欄なら欄自身の枠と地の色で返し、トレーニングの正解は
 * {@link import("./revealed-score-answer").RevealedScoreAnswer} が別に出す。
 * どの分岐でも点数のラベル行（{@link ScoreLabelRow}）の右端に入力方式の
 * 切り替えボタンが付く。
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
  const storedKoTsumoInput = useKoTsumoInput();
  const scoreInput = useScoreInput();
  // タイルは子ツモを常に組で答える（2 つのタイル群は帯を決められない）
  const koTsumoInput = scoreInput === "tiles" ? "combined" : storedKoTsumoInput;
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
      {scoreInput === "tiles" && availableScores.type !== "koTsumoSplit" ? (
        <View>
          <ScoreLabelRow
            label={
              availableScores.type === "koTsumoCombined"
                ? t("koTsumoScore")
                : t("selectScore")
            }
            disabled={disabled}
          />
          <ScoreTilePicker
            available={availableScores}
            isOya={isOya}
            isTsumo={isTsumo}
            value={
              availableScores.type === "koTsumoCombined"
                ? koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)
                : score?.toString()
            }
            onChange={(v) => {
              if (availableScores.type === "single") {
                selectScore(Number(v));
                return;
              }
              const payment = koTsumoPaymentOfKey(availableScores.payments, v);
              if (payment) selectKoTsumoPayment(payment);
            }}
            suffix={isOyaTsumo ? t("all") : ""}
            disabled={disabled}
            accessibilityLabel={
              availableScores.type === "koTsumoCombined"
                ? t("koTsumoScore")
                : t("selectScore")
            }
            autoSubmit={autoSubmit}
            feedback={feedback}
          />
        </View>
      ) : availableScores.type === "koTsumoSplit" ? (
        // この分岐だけ欄全体のラベルが無く「子から」「親から」の 2 つになる。切り替えの
        // ボタンのために行を 1 本足すと他の分岐と高さが揃わないので、右の列（親から）の
        // ラベル行の右端に置く。select + 分割は設定ページで選んだ人しか辿れないが、
        // タイルへ戻る入口を全変種で揃える。左の列のラベルは、ボタンを含む右の行と
        // 高さを揃えるため同じ最小の高さの箱に入れる
        <View style={styles.koTsumoRow}>
          <View style={styles.koTsumoColumn}>
            <View style={styles.plainLabelRow}>
              <Text style={styles.label}>{t("fromKo")}</Text>
            </View>
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
            <ScoreLabelRow label={t("fromOya")} disabled={disabled} />
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
          <ScoreLabelRow label={t("koTsumoScore")} disabled={disabled} />
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
          <ScoreLabelRow label={t("selectScore")} disabled={disabled} />
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
  /** 右の列の {@link ScoreLabelRow}（28 のボタンを含む）と同じ高さ・余白にする */
  plainLabelRow: {
    minHeight: 28,
    marginBottom: 8,
    justifyContent: "center",
  },
  label: {
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
