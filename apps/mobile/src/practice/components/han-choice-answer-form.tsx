import { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { useQuestionScopedSelection } from "@mahjong-scoring/features/practice/use-question-scoped-selection";

import { Grid } from "../../components/grid";
import { colors } from "../../lib/theme";
import { choiceFeedbackProps } from "../feedback-styles";
import { ChoiceButton } from "./choice-button";
import { QuestionPrompt } from "./question-prompt";

interface HanChoiceAnswerFormProps {
  /** 表示する翻数の選択肢 */
  readonly options: readonly number[];
  /** 正解の翻数 */
  readonly correctHan: number;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  readonly onSubmit: (han: number) => void;
  readonly disabled?: boolean;
  /** `selectHan` キーを持つ翻訳名前空間（例: "yakuHanChallenge"） */
  readonly translationNamespace: string;
  /** グリッドの列数 */
  readonly columns: number;
  /**
   * 選択肢の表示ラベル。翻訳関数を受け取り、役満などの特別表記を各練習が決める。
   */
  readonly renderLabel: (
    han: number,
    t: (key: string, values?: Record<string, number>) => string,
  ) => string;
}

/**
 * 翻数を選択肢ボタンで答える回答フォーム（web の `HanChoiceAnswerForm`）
 * 翻数選択回答フォーム
 *
 * 選択肢をタップした瞬間に回答が確定する。翻数即答練習・役翻数練習で共有し、
 * 選択肢の内容・列数・ラベル表記だけを各練習が指定する。
 */
export const HanChoiceAnswerForm = memo(function HanChoiceAnswerFormComponent({
  options,
  correctHan,
  questionIndex,
  showFeedback,
  onSubmit,
  disabled = false,
  translationNamespace,
  columns,
  renderLabel,
}: HanChoiceAnswerFormProps) {
  const t = useTranslations(translationNamespace);
  const [selectedIndex, setSelectedIndex] =
    useQuestionScopedSelection<number>(questionIndex);

  const handleSelect = useCallback(
    (index: number) => {
      if (disabled) return;
      setSelectedIndex(index);
      onSubmit(options[index]);
    },
    [disabled, onSubmit, options, setSelectedIndex],
  );

  return (
    <View style={styles.root}>
      <QuestionPrompt>{t("selectHan")}</QuestionPrompt>
      <Grid columns={columns} gap={8}>
        {options.map((han, index) => {
          const { feedbackStyle } = choiceFeedbackProps({
            showFeedback,
            isCountingDown: false,
            isSelected: selectedIndex === index,
            isCorrect: han === correctHan,
          });
          return (
            <ChoiceButton
              key={han}
              index={index}
              onSelect={handleSelect}
              disabled={disabled}
              feedbackStyle={feedbackStyle}
              style={styles.choice}
            >
              <Text style={styles.label} numberOfLines={1}>
                {renderLabel(han, t)}
              </Text>
            </ChoiceButton>
          );
        })}
      </Grid>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  choice: {
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface900,
  },
});
