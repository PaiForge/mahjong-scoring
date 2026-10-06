import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";

import { Grid } from "../../components/grid";
import { colors } from "../../lib/theme";
import { choiceFeedbackProps } from "../feedback-styles";
import { ChoiceButton } from "./choice-button";

/**
 * 符の選択肢グリッド（web の `FuChoiceGrid`）
 *
 * 符の値を並べた選択肢。列数は練習ごとに違う（選択肢の数で決める）。
 * ラベルは `<namespace>.fuOption`。
 */
export function FuChoiceGrid({
  options,
  answer,
  selectedFu,
  showFeedback,
  isCountingDown,
  onSelect,
  columns,
  translationNamespace,
}: {
  readonly options: readonly number[];
  readonly answer: number;
  readonly selectedFu: number | undefined;
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly onSelect: (index: number) => void;
  readonly columns: number;
  readonly translationNamespace: string;
}) {
  const t = useTranslations(translationNamespace);
  return (
    <Grid columns={columns}>
      {options.map((fu, i) => (
        <ChoiceButton
          key={fu}
          index={i}
          onSelect={onSelect}
          style={styles.choice}
          {...choiceFeedbackProps({
            showFeedback,
            isCountingDown,
            isSelected: selectedFu === fu,
            isCorrect: answer === fu,
          })}
        >
          <Text style={styles.label} numberOfLines={1}>
            {t("fuOption", { value: fu })}
          </Text>
        </ChoiceButton>
      ))}
    </Grid>
  );
}

const styles = StyleSheet.create({
  choice: {
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface900,
  },
});
