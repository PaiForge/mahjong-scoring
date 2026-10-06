import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { restoreMentsu } from "@mahjong-scoring/features/results/mentsu-serialization";
import type { MentsuFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-fu/types";

import { FuroTiles } from "../../../board/furo-tiles";
import { AnswerComparison } from "../../components/answer-comparison";
import { ProblemListAccordion } from "../../components/problem-list-accordion";

/**
 * 面子符練習の問題別フィードバック一覧
 * 面子符問題一覧
 *
 * web の `MentsuFuProblemList` の移植。展開すると出題された面子と、正解・
 * 自分の回答を確認できる。符は明暗（鳴いているか）と牌の種類で決まるため、
 * 面子を出さずに符だけ並べても何を間違えたのかが読めない。
 */
export function MentsuFuProblemList({
  results,
}: {
  readonly results: readonly MentsuFuQuestionResult[];
}) {
  const t = useTranslations("mentsuFu");
  const fuLabel = (fu: number) => t("fuOption", { value: fu });

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="mentsuFu"
      outcome={(r) => r.outcome}
      renderSummary={(result) => fuLabel(result.correctFu)}
      renderDetail={(result) => {
        const mentsu = restoreMentsu(result.mentsu);
        const { userFu } = result;

        return (
          <View style={styles.detail}>
            {mentsu && (
              <View style={styles.mentsu}>
                <FuroTiles mentsu={mentsu} furo={mentsu.furo} size="sm" />
              </View>
            )}
            <AnswerComparison
              translationNamespace="mentsuFu"
              outcome={result.outcome}
              correct={fuLabel(result.correctFu)}
              user={userFu === undefined ? undefined : fuLabel(userFu)}
              difference={
                userFu === undefined
                  ? undefined
                  : { correct: result.correctFu, user: userFu, format: fuLabel }
              }
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
  mentsu: {
    alignItems: "center",
    paddingVertical: 4,
  },
});
