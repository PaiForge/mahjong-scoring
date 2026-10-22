import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceFuOptions,
  practiceHanOptions,
} from "@mahjong-scoring/features/practice/score/answer-options";
import type { UseScorePracticeAnswerFormResult } from "@mahjong-scoring/features/practice/score/use-score-practice-answer-form";

import { SelectField } from "../../../components/select-field";
import { colors } from "../../../lib/theme";

/**
 * 回答フォームの翻数と符の欄（web の `HanFuFields`）
 * 翻数・符の欄
 *
 * 満貫以上で符が不要になっても欄は残し、注記を欄の中に出す（欄を消すと
 * 下の「点数」と回答ボタンがせり上がる）。
 */
export function HanFuFields({
  form,
  exactHan,
  allowDoubleYakuman,
  disabled,
}: {
  readonly form: Pick<
    UseScorePracticeAnswerFormResult,
    "han" | "fu" | "setHan" | "setFu" | "isFuRequired"
  >;
  readonly exactHan: boolean;
  readonly allowDoubleYakuman: boolean;
  readonly disabled: boolean;
}) {
  const t = useTranslations("agariScore");
  const { han, fu, setHan, setFu, isFuRequired } = form;
  const hanOptions = useMemo(
    () => practiceHanOptions(t, exactHan, allowDoubleYakuman),
    [t, exactHan, allowDoubleYakuman],
  );
  const fuOptions = useMemo(() => practiceFuOptions(t), [t]);

  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
});
