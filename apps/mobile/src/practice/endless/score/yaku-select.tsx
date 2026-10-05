import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { MultiSelect } from "../../../components/multi-select";
import { useYakuOptions } from "../../../hooks/use-yaku-options";
import { colors } from "../../../lib/theme";

/**
 * 「役」のラベル行（web の `YakuLabelRow`）
 * 役ラベル行
 *
 * 役の選択欄の見出しであると同時に、「役なし（ロンできない）」のボタンを
 * 置く行でもある。役の回答が不要な設定でも、待ち別点数計算はこの行だけを
 * 出してボタンの置き場にする（役の選択欄は無い）。
 */
export function YakuLabelRow({ action }: { readonly action?: ReactNode }) {
  const t = useTranslations("score");
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{t("form.labels.yaku")}</Text>
      {action}
    </View>
  );
}

/**
 * 役の選択欄（web の `YakuSelect`）
 * 役選択
 *
 * 選択肢の並びは役の選択練習と共有する（設定で並び替えられる）。
 */
export function YakuSelect({
  value,
  onChange,
  disabled = false,
  labelAction,
}: {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly disabled?: boolean;
  /** ラベルの右端に添える操作（{@link YakuLabelRow} に渡す） */
  readonly labelAction?: ReactNode;
}) {
  const tPicker = useTranslations("common.yakuPicker");
  const options = useYakuOptions();

  return (
    <View>
      <YakuLabelRow action={labelAction} />
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={tPicker("placeholder")}
        labels={{
          add: tPicker("add"),
          title: tPicker("title"),
          done: tPicker("done"),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    marginBottom: 8,
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
});
