import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { allowsDoubleYakuman, koTsumoPaymentKey } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import {
  practiceFuOptions,
  practiceHanOptions,
} from "@mahjong-scoring/features/practice/score/answer-options";
import {
  koTsumoPaymentOfKey,
  koTsumoSelectOptions,
  scoreSelectOptions,
} from "@mahjong-scoring/features/practice/score/score-select-options";
import { useScorePracticeAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";

import { Button } from "../../../components/button";
import { SelectField } from "../../../components/select-field";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "../../../hooks/use-rule-settings-store";
import { useKoTsumoInput } from "../../../hooks/use-display-settings-store";
import { colors } from "../../../lib/theme";
import { ScoreOptionSelect } from "../../components/score-option-select";
import { YakuLabelRow, YakuSelect } from "./yaku-select";

interface ScorePracticeAnswerFormProps {
  readonly onSubmit: (answer: UserAnswer) => void;
  readonly disabled?: boolean;
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly requireYaku?: boolean;
  readonly exactHan?: boolean;
  readonly requireFuForMangan?: boolean;
  /** 回答ボタンの文言。既定は「回答する」 */
  readonly submitLabel?: string;
  /**
   * 「役」のラベル行を役の回答が不要でも出す。「役なし」のボタンの置き場を
   * ツモ・ロンの別によらず確保し、フォームの高さを変えないため
   * （聴牌形の点数計算が立てる）
   */
  readonly reserveYakuRow?: boolean;
  /**
   * 「役なし（ロンできない）」を回答として選べるようにする。押した時点で
   * `onSelect` を呼び、回答ボタンを経由させない（理由は web の同名 prop）
   */
  readonly noYaku?: {
    readonly label: string;
    readonly onSelect: () => void;
  };
  /**
   * 入力欄に読み込んでおく回答。まだ何も入力していない間だけ効く
   * （聴牌形の点数計算で回答済みのマスを選択に加えたとき。web の同名 prop）
   */
  readonly prefill?: UserAnswer;
}

/**
 * 点数計算の無限訓練の回答フォーム（web の `ScorePracticeAnswerForm`）
 * 回答フォーム
 *
 * 役（設定で求めるとき）・翻数・符・点数を選んで回答する。満貫以上で符が
 * 不要になっても符の欄は消さず無効にして残す（欄が消えると、翻数を選んだ
 * 直後に触る点数と回答ボタンが指の下でせり上がるため。web と同じ）。
 * 入力が揃うまで回答ボタンは押せない。
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` を変えて
 * 再マウントさせることで行う。
 */
export function ScorePracticeAnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  exactHan = false,
  requireFuForMangan = false,
  submitLabel,
  reserveYakuRow = false,
  noYaku,
  prefill,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("agariScore");
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const koTsumoInput = useKoTsumoInput();
  const {
    han,
    fu,
    yakus,
    score,
    scoreFromKo,
    scoreFromOya,
    koTsumoPayment,
    setHan,
    setFu,
    setYakus,
    setScore,
    setScoreFromKo,
    setScoreFromOya,
    setKoTsumoPayment,
    isFuRequired,
    availableScores,
    isOyaTsumo,
    isComplete,
    submit,
  } = useScorePracticeAnswerForm({
    onSubmit,
    isTsumo,
    isOya,
    requireYaku,
    requireFuForMangan,
    kiriageMangan,
    allowDoubleYakuman,
    koTsumoInput,
    prefill,
  });

  const hanOptions = useMemo(
    () => practiceHanOptions(t, exactHan, allowDoubleYakuman),
    [t, exactHan, allowDoubleYakuman],
  );
  const fuOptions = useMemo(() => practiceFuOptions(t), [t]);

  // 「役なし」はロンにしか無い回答なので、渡されたときだけ「役」の行の右端に置く
  const noYakuButton = noYaku && (
    <Pressable
      onPress={noYaku.onSelect}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={8}
    >
      {({ pressed }) => (
        <Text style={[styles.noYaku, pressed && styles.noYakuPressed]}>
          {noYaku.label}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={styles.form}>
      {requireYaku ? (
        <YakuSelect
          value={yakus}
          onChange={setYakus}
          disabled={disabled}
          labelAction={noYakuButton}
        />
      ) : reserveYakuRow ? (
        <YakuLabelRow action={noYakuButton} />
      ) : undefined}

      <View>
        <Text style={styles.label}>{t("form.labels.han")}</Text>
        <SelectField
          options={hanOptions}
          value={han}
          onChange={setHan}
          placeholder={t("form.placeholders.select")}
          accessibilityLabel={t("form.labels.han")}
          disabled={disabled}
          testID="han-select"
        />
      </View>

      {/* 満貫以上で符が不要になっても欄は残し、注記を欄の中に出す */}
      <View>
        <Text style={styles.label}>{t("form.labels.fu")}</Text>
        <SelectField
          options={isFuRequired ? fuOptions : []}
          value={isFuRequired ? fu : undefined}
          onChange={setFu}
          placeholder={
            isFuRequired
              ? t("form.placeholders.select")
              : t("form.messages.fuNotRequired")
          }
          accessibilityLabel={t("form.labels.fu")}
          disabled={disabled || !isFuRequired}
        />
      </View>

      {/* 組の欄は「300/500」だけでは並び順が分からない初学者のため、
          ラベルに「子から / 親から」の順を添える */}
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
                value={scoreFromKo?.toString()}
                onChange={(v) => setScoreFromKo(Number(v))}
                options={scoreSelectOptions(availableScores.koScores)}
                placeholder={t("form.placeholders.fromKo")}
                accessibilityLabel={t("form.placeholders.fromKo")}
                disabled={disabled}
              />
            </View>
            <Text style={styles.slash}>/</Text>
            <View style={styles.koTsumoColumn}>
              <ScoreOptionSelect
                value={scoreFromOya?.toString()}
                onChange={(v) => setScoreFromOya(Number(v))}
                options={scoreSelectOptions(availableScores.oyaScores)}
                placeholder={t("form.placeholders.fromOya")}
                accessibilityLabel={t("form.placeholders.fromOya")}
                disabled={disabled}
              />
            </View>
          </View>
        ) : availableScores.type === "koTsumoCombined" ? (
          <ScoreOptionSelect
            value={koTsumoPayment && koTsumoPaymentKey(koTsumoPayment)}
            onChange={(key) => {
              const payment = koTsumoPaymentOfKey(
                availableScores.payments,
                key,
              );
              if (payment) setKoTsumoPayment(payment);
            }}
            options={koTsumoSelectOptions(availableScores.payments)}
            placeholder={t("form.placeholders.select")}
            accessibilityLabel={t("form.labels.koTsumoScore")}
            disabled={disabled}
          />
        ) : (
          <ScoreOptionSelect
            value={score?.toString()}
            onChange={(v) => setScore(Number(v))}
            options={scoreSelectOptions(
              availableScores.scores,
              isOyaTsumo ? t("form.options.all") : "",
            )}
            placeholder={t("form.placeholders.select")}
            accessibilityLabel={t("form.labels.score")}
            disabled={disabled}
          />
        )}
      </View>

      <Button
        onPress={submit}
        size="lg"
        fullWidth
        disabled={disabled || !isComplete}
      >
        {submitLabel ?? t("form.buttons.answer")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
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
  noYaku: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.action,
  },
  noYakuPressed: {
    color: colors.actionActive,
    opacity: 0.7,
  },
});
