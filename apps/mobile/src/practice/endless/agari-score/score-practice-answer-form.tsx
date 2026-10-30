import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import type { ScorePracticeAnswerFormProps } from "@mahjong-scoring/features/practice/score/score-practice-answer-form-props";
import { useScorePracticeAnswerForm } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";

import { Button } from "../../../components/button";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "../../../hooks/use-rule-settings-store";
import {
  useKoTsumoInput,
  useScoreInput,
} from "../../../hooks/use-display-settings-store";
import { colors } from "../../../lib/theme";
import { HanFuFields } from "./han-fu-fields";
import { ScoreField } from "./score-field";
import { YakuLabelRow, YakuSelect } from "./yaku-select";

/**
 * 点数計算の無限訓練の回答フォーム（web の `ScorePracticeAnswerForm`）
 * 回答フォーム
 *
 * props の意味と振る舞い（判定モード・符の欄を残す理由・役なし・読み込んで
 * おく回答）は features の {@link ScorePracticeAnswerFormProps}。
 */
export function ScorePracticeAnswerForm({
  onSubmit,
  disabled = false,
  isTsumo,
  isOya,
  requireYaku = false,
  requireHanFu = true,
  exactHan = false,
  requireFuForMangan = false,
  submitLabel,
  autoSubmit = false,
  reserveYakuRow = false,
  noYaku,
  prefill,
}: ScorePracticeAnswerFormProps) {
  const t = useTranslations("agariScore");
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  // ダブル役満を採用したルールでは、翻数・点数の選択肢にダブル役満を足す
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());
  const storedKoTsumoInput = useKoTsumoInput();
  const scoreInput = useScoreInput();
  // タイルは子ツモを常に組で答える（2 つのタイル群は帯を決められない）
  const koTsumoInput = scoreInput === "tiles" ? "combined" : storedKoTsumoInput;
  // 点数だけを問う設定のときだけ選んだ時点で送る（他の欄があると、点数が
  // 最後の欄とは限らない）
  const submitsOnSelect = autoSubmit && !requireYaku && !requireHanFu;
  const form = useScorePracticeAnswerForm({
    onSubmit,
    isTsumo,
    isOya,
    requireYaku,
    requireHanFu,
    requireFuForMangan,
    kiriageMangan,
    allowDoubleYakuman,
    koTsumoInput,
    autoSubmit: submitsOnSelect,
    prefill,
  });

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
          value={form.yakus}
          onChange={form.setYakus}
          disabled={disabled}
          labelAction={noYakuButton}
        />
      ) : reserveYakuRow ? (
        <YakuLabelRow action={noYakuButton} />
      ) : undefined}

      {/* 翻数と符を問わない設定では欄ごと出さない（実戦では点数だけを申告する） */}
      {requireHanFu && (
        <HanFuFields
          form={form}
          exactHan={exactHan}
          allowDoubleYakuman={allowDoubleYakuman}
          disabled={disabled}
        />
      )}

      <ScoreField
        form={form}
        disabled={disabled}
        scoreInput={scoreInput}
        isOya={isOya}
        isTsumo={isTsumo}
        autoSubmit={submitsOnSelect}
      />

      {/* 選択即送信なら出さない（選んだ時点で送られる） */}
      {form.showsSubmitButton && (
        <Button
          onPress={form.submit}
          size="lg"
          fullWidth
          disabled={disabled || !form.isComplete}
        >
          {submitLabel ?? t("form.buttons.answer")}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
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
