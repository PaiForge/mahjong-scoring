import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";

import { Button } from "../../../components/button";
import { colors } from "../../../lib/theme";
import { QuestionPrompt } from "../../components/question-prompt";
import { MachiPicker } from "./machi-picker";

/**
 * 待ち牌を選ぶ段階（`machi`。web の `TenpaiMachiPhase`）
 * 待ち牌の段階
 *
 * 回答すると正誤を見せたまま同じ段階に留まり、「点数計算へ進む」で次へ。
 * 判定も進むも盤面の先頭へ戻してから行う。
 */
export function MachiPhase({
  selectedMachi,
  machiJudgement,
  scrollToTop,
  onToggle,
  onSubmit,
  onProceed,
}: {
  readonly selectedMachi: readonly HaiKindId[];
  readonly machiJudgement: MachiSelectionJudgement | undefined;
  readonly scrollToTop: () => void;
  readonly onToggle: (hai: HaiKindId) => void;
  readonly onSubmit: () => void;
  readonly onProceed: () => void;
}) {
  const t = useTranslations("tenpaiScore");
  const handleSubmit = () => {
    scrollToTop();
    onSubmit();
  };
  const handleProceed = () => {
    scrollToTop();
    onProceed();
  };
  return (
    <View style={styles.stage}>
      <QuestionPrompt
        replacement={
          machiJudgement && (
            <Text
              style={[
                styles.verdict,
                {
                  color: machiJudgement.isCorrect
                    ? colors.success
                    : colors.destructive,
                },
              ]}
            >
              {machiJudgement.isCorrect
                ? t("machi.correct", { count: machiJudgement.correct.length })
                : t("machi.incorrect")}
            </Text>
          )
        }
      >
        {t("machi.prompt")}
      </QuestionPrompt>

      <MachiPicker
        selected={selectedMachi}
        onToggle={onToggle}
        judgement={machiJudgement}
      />

      {/* 選択数の行は判定後も高さを残す（消すとボタンが上へずれる） */}
      <View style={styles.submitBlock}>
        <Text style={styles.note}>
          {machiJudgement
            ? ""
            : t("machi.selectedCount", { count: selectedMachi.length })}
        </Text>
        {machiJudgement ? (
          <Button size="lg" fullWidth onPress={handleProceed}>
            {t("machi.proceed")}
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            onPress={handleSubmit}
            disabled={selectedMachi.length === 0}
          >
            {t("machi.submit")}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    gap: 16,
  },
  verdict: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  submitBlock: {
    gap: 8,
  },
  note: {
    minHeight: 16,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: colors.surface500,
  },
});
