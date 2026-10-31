import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { koTsumoPaymentKey } from "@mahjong-scoring/core";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import type { UseScorePracticeAnswerFormResult } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";
import type { ScoreInputMode } from "@mahjong-scoring/features/settings/score-input";

import { colors } from "../../../lib/theme";
import { ScoreLabelRow } from "../../components/score-label-row";
import { ScoreOptionSelect } from "../../components/score-option-select";
import { ScoreTilePicker } from "../../components/score-tile-picker";

/**
 * 回答フォームの点数の欄（web の `ScoreField`）
 * 点数の欄
 *
 * 入力方式（`scoreInput`）が `tiles` なら {@link ScoreTilePicker} で描く（子ツモは
 * 組のタイル）。`select` では点数の選択肢の形（`availableScores.type`）で欄が
 * 変わる。子ツモの組の欄は「300/500」だけでは並び順が分からない初学者のため、
 * ラベルに「子から / 親から」の順を添える。ラベル行（{@link ScoreLabelRow}）の
 * 右端に入力方式の切り替えボタンが付く。
 */
export function ScoreField({
  form,
  disabled,
  scoreInput,
  isOya,
  isTsumo,
  autoSubmit = false,
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
  readonly scoreInput: ScoreInputMode;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  /** 選んだ時点で送られるか（タイルを採点待ちの灰で示す） */
  readonly autoSubmit?: boolean;
}) {
  const t = useTranslations("agariScore");
  const { availableScores } = form;
  const label =
    availableScores.type === "single"
      ? t("form.labels.score")
      : t("form.labels.koTsumoScore");
  return (
    <View>
      <ScoreLabelRow label={label} disabled={disabled} />
      {scoreInput === "tiles" && availableScores.type !== "koTsumoSplit" ? (
        <ScoreTilePicker
          available={availableScores}
          isOya={isOya}
          isTsumo={isTsumo}
          value={
            availableScores.type === "koTsumoCombined"
              ? form.koTsumoPayment && koTsumoPaymentKey(form.koTsumoPayment)
              : form.score?.toString()
          }
          onChange={(v) => {
            if (availableScores.type === "single") {
              form.setScore(Number(v));
              return;
            }
            const payment = koTsumoPaymentOfKey(availableScores.payments, v);
            if (payment) form.setKoTsumoPayment(payment);
          }}
          suffix={form.isOyaTsumo ? t("form.options.all") : ""}
          disabled={disabled}
          accessibilityLabel={label}
          autoSubmit={autoSubmit}
        />
      ) : availableScores.type === "koTsumoSplit" ? (
        <View style={styles.koTsumoRow}>
          <View style={styles.koTsumoColumn}>
            <ScoreOptionSelect
              value={form.scoreFromKo?.toString()}
              onChange={(v) => form.setScoreFromKo(Number(v))}
              options={scoreSelectOptions(availableScores.koScores)}
              placeholder={t("form.placeholders.fromKo")}
              accessibilityLabel={t("form.placeholders.fromKo")}
              disabled={disabled}
              testID="score-select-from-ko"
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
              testID="score-select-from-oya"
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
          testID="score-select"
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
          testID="score-select"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
