import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { AccordionCard } from "../../components/accordion-card";
import { colors } from "../../lib/theme";
import { JudgementMark } from "./judgement-mark";

interface ProblemListAccordionProps<T> {
  readonly results: readonly T[];
  /** `<namespace>.result.*` を引く辞書の名前空間 */
  readonly translationNamespace: string;
  readonly outcome: (result: T) => AnswerOutcome;
  /** 見出しに添える 1 行の要約（文字列） */
  readonly renderSummary?: (result: T, index: number) => string | undefined;
  readonly renderDetail: (result: T, index: number) => ReactNode;
}

/**
 * 問題別の結果一覧（web の `ProblemListAccordion`）
 * 問題別結果一覧
 *
 * 1 問 1 枚の開閉カード。見出しに番号・要約・正誤を出し、開くと内訳を見せる。
 */
export function ProblemListAccordion<T>({
  results,
  translationNamespace,
  outcome: outcomeOf,
  renderSummary,
  renderDetail,
}: ProblemListAccordionProps<T>) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");
  if (results.length === 0) return undefined;

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{tResult("problemDetails")}</Text>
      <View style={styles.list}>
        {results.map((result, index) => {
          const outcome = outcomeOf(result);
          const summary = renderSummary?.(result, index);
          return (
            <AccordionCard
              key={index}
              title={
                <View style={styles.title}>
                  <Text style={styles.number}>No.{index + 1}</Text>
                  {summary !== undefined && (
                    <Text style={styles.summary} numberOfLines={1}>
                      {summary}
                    </Text>
                  )}
                </View>
              }
              trailing={
                outcome === AnswerOutcome.TimeUp ? (
                  <Text style={styles.timeUp}>{tCommon("timeUp")}</Text>
                ) : (
                  <>
                    <JudgementMark verdict={outcome} size={14} />
                    <Text
                      style={[
                        styles.verdict,
                        {
                          color:
                            outcome === AnswerOutcome.Correct
                              ? colors.success
                              : colors.destructive,
                        },
                      ]}
                    >
                      {outcome === AnswerOutcome.Correct
                        ? tResult("correct")
                        : tResult("incorrect")}
                    </Text>
                  </>
                )
              }
            >
              {renderDetail(result, index)}
            </AccordionCard>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  heading: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface500,
  },
  list: {
    gap: 8,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  number: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface900,
  },
  summary: {
    fontSize: 14,
    color: colors.surface500,
    flexShrink: 1,
  },
  timeUp: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface500,
  },
  verdict: {
    fontSize: 14,
    fontWeight: "500",
  },
});
