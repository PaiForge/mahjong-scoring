import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  buildDemoScoreQuestion,
  type DemoScoreQuestionOptions,
} from "@mahjong-scoring/features/board/demo-score-question";

import { QuestionDisplay } from "../components/question-display";
import { QuestionPrompt } from "../components/question-prompt";

/**
 * 昇級試験（点数計算）の「問題方式」ビジュアルデモを生成するファクトリー関数
 * 昇級試験 遊び方デモ生成
 *
 * web の `createScoreExamHowToPlay` の移植。実際の出題盤面（手牌・状況のみ）を
 * 出題時のまま静的に再現し、その下に出題文を置く。級ごとに違うのはデモの
 * 牌姿（features の `exam/<級>/demo-question.ts`）と翻訳名前空間だけ。
 * 役一覧は出題盤面と同じく出さない。
 */
export function createScoreExamHowToPlay(
  translationNamespace: string,
  demoOptions: DemoScoreQuestionOptions,
): () => ReactNode {
  const question = buildDemoScoreQuestion(demoOptions);

  function ScoreExamHowToPlay() {
    const t = useTranslations(translationNamespace);
    return (
      <View style={styles.root}>
        <QuestionDisplay question={question} />
        <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
      </View>
    );
  }
  ScoreExamHowToPlay.displayName = `ScoreExamHowToPlay(${translationNamespace})`;
  return ScoreExamHowToPlay;
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
