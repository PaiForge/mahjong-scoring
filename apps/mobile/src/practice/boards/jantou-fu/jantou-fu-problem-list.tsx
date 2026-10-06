import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { Tile } from "../../../components/tile";
import { getKazeName, parseHais, parseKazehai } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import type { JantouFuQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";

import { colors } from "../../../lib/theme";
import { AnswerComparison } from "../../components/answer-comparison";
import { ProblemListAccordion } from "../../components/problem-list-accordion";

/** 雀頭符の問題別結果（web の `JantouFuProblemList` の移植） */
export function JantouFuProblemList({
  results,
}: {
  readonly results: readonly JantouFuQuestionResult[];
}) {
  const t = useTranslations("jantouFu");
  const tCommon = useTranslations("common");

  const haiWithFu = (hai: HaiKindId | undefined, fu: number) => (
    <View style={styles.haiWithFu}>
      {hai !== undefined && <Tile hai={hai} size="sm" />}
      <Text style={styles.fu}>{t("fu", { value: fu })}</Text>
    </View>
  );

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="jantouFu"
      outcome={(r) => r.outcome}
      renderSummary={(result) => {
        const bakaze = parseKazehai(result.bakaze);
        const jikaze = parseKazehai(result.jikaze);
        if (!bakaze || !jikaze) return undefined;
        return `${getKazeName(bakaze)}${tCommon("round")} ${getKazeName(jikaze)}${tCommon("wind")}`;
      }}
      renderDetail={(result) => (
        <AnswerComparison
          translationNamespace="jantouFu"
          outcome={result.outcome}
          correct={haiWithFu(parseHais(result.correctHai)[0], result.correctFu)}
          user={
            result.selectedHai === undefined || result.selectedFu === undefined
              ? undefined
              : haiWithFu(parseHais(result.selectedHai)[0], result.selectedFu)
          }
          showTitle={false}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  haiWithFu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fu: {
    fontSize: 14,
    color: colors.surface600,
  },
});
