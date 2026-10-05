import { StyleSheet, View } from "react-native";
import { restoreYakuQuestion } from "@mahjong-scoring/features/practice/yaku/answer-comparison";
import type { YakuQuestionResult } from "@mahjong-scoring/features/practice/yaku/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { ProblemListAccordion } from "../../components/problem-list-accordion";
import { YakuAnswerComparison } from "./yaku-answer-comparison";

/**
 * 役選択練習の問題別一覧（web の `YakuProblemList`）
 * 役選択問題一覧
 *
 * 展開すると出題された手牌・面子分解・成立していた役と自分が選んだ役を
 * 確認できる。並び順は点数系・翻数系の問題別一覧と同じ「手牌 → 面子の内訳 →
 * 答え合わせ」。
 */
export function YakuProblemList({
  results,
}: {
  readonly results: readonly YakuQuestionResult[];
}) {
  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yaku"
      outcome={(r) => r.outcome}
      renderDetail={(result) => {
        const question = restoreYakuQuestion(result);
        return (
          <View style={styles.detail}>
            {question && (
              <>
                <TehaiDisplay
                  tehai={question.tehai}
                  context={question.context}
                />
                <TehaiMentsuBreakdown
                  tehai={question.tehai}
                  context={question.context}
                />
              </>
            )}
            <YakuAnswerComparison
              correctYakuNames={result.correctYakuNames}
              selectedYakuNames={result.selectedYakuNames}
              outcome={result.outcome}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: 12,
  },
});
