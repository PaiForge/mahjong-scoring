import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { numericAnswerComparison } from "@mahjong-scoring/features/practice/answer-difference";
import { hanOptionLabel } from "@mahjong-scoring/features/practice/han-option-label";
import type { HanCountQuestionResult } from "@mahjong-scoring/features/practice/han-count/types";
import { restoreScoreQuestion } from "@mahjong-scoring/features/results/score-question-result";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import { AnswerComparison } from "../../components/answer-comparison";
import { ProblemListAccordion } from "../../components/problem-list-accordion";
import { HanBreakdown } from "./han-breakdown";

/**
 * 翻数即答練習の問題別一覧（web の `HanCountProblemList`）
 * 翻数問題一覧
 *
 * 展開すると出題された手牌・面子の取り方・翻数の内訳・正解とユーザー回答を
 * 確認できる。並び順は点数系の問題別一覧と同じ「手牌 → 面子の内訳 → 答え合わせ →
 * 翻数の内訳」。
 */
export function HanCountProblemList({
  results,
}: {
  readonly results: readonly HanCountQuestionResult[];
}) {
  const t = useTranslations("hanCountChallenge");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="hanCountChallenge"
      outcome={(r) => r.outcome}
      renderSummary={(result) => hanOptionLabel(result.correctHan, t)}
      renderDetail={(result) => {
        const question = restoreScoreQuestion(
          result.question,
          result.question.isTsumo,
        );
        const { userHan } = result;

        return (
          <View style={styles.detail}>
            {question && (
              <>
                {/* 出題データは盤面のコンテキストを平坦に含むので、そのまま渡す */}
                <TehaiDisplay tehai={question.tehai} context={question} />
                <TehaiMentsuBreakdown
                  tehai={question.tehai}
                  context={question}
                />
              </>
            )}

            <AnswerComparison
              translationNamespace="hanCountChallenge"
              outcome={result.outcome}
              {...numericAnswerComparison(
                result.correctHan,
                userHan,
                (value) => hanOptionLabel(value, t),
                (value) => t("hanOption", { count: value }),
              )}
            />

            <HanBreakdown
              yakuDetails={result.question.yakuDetails}
              correctHan={result.correctHan}
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
