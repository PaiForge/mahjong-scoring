import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  JudgementResult,
  MachiCellAnswer,
  UserAnswer,
} from "@mahjong-scoring/core";
import { allowsDoubleYakuman } from "@mahjong-scoring/core";
import {
  formatHan,
  formatPayment,
} from "@mahjong-scoring/features/practice/score/format-answer";

import { useYakumanRules } from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "../score/result-table-frame";

/**
 * 役が無くロンできないマスの答え合わせ（web の `NoYakuResultDisplay`）
 * 役なしの結果表示
 *
 * 正解が「役なし」のマスは点数の出題を持たないので結果表示に渡せない。それでも
 * 同じ枠・同じ行（役・翻数・符・点数）の表で出し、タブを切り替えても形を
 * 変えない。「役なし」は翻数の行に置き、符と点数の行は正解に値が無いので「—」。
 * 表の下に、なぜ和了れないかの一文を添える。
 */
export function NoYakuResultDisplay({
  userAnswer,
  result,
  requireYaku,
  simplifyMangan,
}: {
  /** マスへの回答。「わからない」での開示では undefined */
  readonly userAnswer: MachiCellAnswer | undefined;
  /** マスの判定。開示では undefined */
  readonly result: JudgementResult | undefined;
  readonly requireYaku: boolean;
  readonly simplifyMangan: boolean;
}) {
  const t = useTranslations("machiScore");
  const tScore = useTranslations("score");
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  // 点数で答えた（= 役なしのマスに対する誤答）ときだけ翻・符・点数の行に値が入る
  const scoreAnswer =
    userAnswer?.kind === "score" && result !== undefined
      ? { answer: userAnswer.answer, result }
      : undefined;
  const noYakuResult =
    userAnswer?.kind === "noYaku" && result !== undefined ? result : undefined;

  const hanDisplay = (han: number) =>
    formatHan(han, { t: tScore, simplifyMangan, allowDoubleYakuman });
  const paymentDisplay = (answer: UserAnswer) =>
    formatPayment(answer, false, { t: tScore });
  const notApplicable = <CorrectValue value={t("result.notApplicable")} />;

  return (
    <View style={styles.root}>
      <ResultTableFrame>
        {requireYaku && (
          <ResultSection first>
            <ResultRow
              label={tScore("form.labels.yaku")}
              answer={
                scoreAnswer ? (
                  <JudgedValue
                    value={
                      scoreAnswer.answer.yakus.length > 0
                        ? scoreAnswer.answer.yakus.join("、")
                        : tScore("result.details.none")
                    }
                    isCorrect={scoreAnswer.result.isYakuCorrect}
                  />
                ) : (
                  <ResultUnansweredValue />
                )
              }
              correct={<CorrectValue value={tScore("result.details.none")} />}
            />
          </ResultSection>
        )}
        <ResultSection first={!requireYaku}>
          <ResultRow
            label={tScore("form.labels.han")}
            answer={
              scoreAnswer ? (
                <JudgedValue
                  value={hanDisplay(scoreAnswer.answer.han)}
                  isCorrect={scoreAnswer.result.isHanCorrect}
                />
              ) : noYakuResult ? (
                <JudgedValue
                  value={t("cells.noYakuShort")}
                  isCorrect={noYakuResult.isCorrect}
                />
              ) : (
                <ResultUnansweredValue />
              )
            }
            correct={<CorrectValue value={t("cells.noYakuShort")} />}
          />
        </ResultSection>
        <ResultSection>
          <ResultRow
            label={tScore("form.labels.fu")}
            answer={
              scoreAnswer ? (
                <JudgedValue
                  value={`${scoreAnswer.answer.fu ?? "-"}${tScore("form.options.fuSuffix")}`}
                  isCorrect={scoreAnswer.result.isFuCorrect}
                />
              ) : (
                <ResultUnansweredValue />
              )
            }
            correct={notApplicable}
          />
        </ResultSection>
        <ResultSection>
          <ResultRow
            label={tScore("form.labels.score")}
            answer={
              scoreAnswer ? (
                <JudgedValue
                  value={paymentDisplay(scoreAnswer.answer)}
                  isCorrect={scoreAnswer.result.isScoreCorrect}
                />
              ) : (
                <ResultUnansweredValue />
              )
            }
            correct={notApplicable}
          />
        </ResultSection>
      </ResultTableFrame>
      <Text style={styles.detail}>{t("result.noYakuDetail")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  detail: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface600,
  },
});
