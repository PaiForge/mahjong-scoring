import { StyleSheet, View } from "react-native";
import {
  parseMarkers,
  restoreTehaiQuestion,
} from "@mahjong-scoring/features/results/parse-question-tiles";
import type { YakuQuestionResult } from "@mahjong-scoring/features/practice/yaku/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { ProblemListAccordion } from "../../components/problem-list-accordion";
import { YakuAnswerComparison } from "./yaku-answer-comparison";

/**
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （役の対比は文字列に依存しないため表示できる）。
 */
function restoreQuestion(result: YakuQuestionResult) {
  const restored = restoreTehaiQuestion(result);
  if (!restored) return undefined;
  return {
    tehai: restored.tehai,
    context: {
      ...restored.context,
      isRiichi: result.isRiichi,
      doraMarkers: parseMarkers(result.doraMarkers) ?? [],
      uraDoraMarkers: parseMarkers(result.uraDoraMarkers),
    },
  };
}

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
        const question = restoreQuestion(result);
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
