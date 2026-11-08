import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { UserAnswer } from "@mahjong-scoring/core";
import {
  formatHan,
  formatPayment,
} from "@mahjong-scoring/features/practice/score/format-answer";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";

import { useAllowDoubleYakuman } from "../../../hooks/use-rule-settings-store";
import { colors } from "../../../lib/theme";
import {
  CorrectValue,
  JudgedValue,
  ResultRow,
  ResultSection,
  ResultTableFrame,
  ResultUnansweredValue,
} from "../agari-score/result-table-frame";
import type { NoYakuResultDisplayProps } from "@mahjong-scoring/features/practice/tenpai-score/result-props";

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
  requireHanFu,
  exactHan,
}: NoYakuResultDisplayProps) {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  // 選んだ役（core の役名）は `yakuNames` で引き、言語の区切りで結ぶ（web と同じ）。
  // 日本語の値は core の名前と「、」なので日本語の表示は変わらない
  const tYakuNames = useTranslations("yakuNames");
  const tCommon = useTranslations("common");
  const allowDoubleYakuman = useAllowDoubleYakuman();

  // 点数で答えた（= 役なしのマスに対する誤答）ときだけ翻・符・点数の行に値が入る
  const scoreAnswer =
    userAnswer?.kind === "score" && result !== undefined
      ? { answer: userAnswer.answer, result }
      : undefined;
  const scoreAnswerHanFu = requireHanFu ? scoreAnswer : undefined;
  const noYakuResult =
    userAnswer?.kind === "noYaku" && result !== undefined ? result : undefined;

  const hanDisplay = (han: number) =>
    formatHan(han, { t: tScore, exactHan, allowDoubleYakuman });
  const paymentDisplay = (answer: UserAnswer) =>
    formatPayment(answer, false, { t: tScore });
  const notApplicable = <CorrectValue value={t("result.notApplicable")} />;

  return (
    <View style={styles.root}>
      <ResultTableFrame embedded>
        {requireYaku && (
          <ResultSection first>
            <ResultRow
              label={tScore("form.labels.yaku")}
              answer={
                scoreAnswer ? (
                  <JudgedValue
                    value={
                      scoreAnswer.answer.yakus.length > 0
                        ? scoreAnswer.answer.yakus
                            .map((name) => yakuLabel(name, tYakuNames))
                            .join(tCommon("listSeparator"))
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
              scoreAnswerHanFu ? (
                <JudgedValue
                  value={
                    scoreAnswerHanFu.answer.han === undefined
                      ? "-"
                      : hanDisplay(scoreAnswerHanFu.answer.han)
                  }
                  isCorrect={scoreAnswerHanFu.result.isHanCorrect}
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
              scoreAnswerHanFu ? (
                <JudgedValue
                  value={`${scoreAnswerHanFu.answer.fu ?? "-"}${tScore("form.options.fuSuffix")}`}
                  isCorrect={scoreAnswerHanFu.result.isFuCorrect}
                />
              ) : (
                <ResultUnansweredValue />
              )
            }
            correct={notApplicable}
          />
        </ResultSection>
        <ResultSection final>
          <ResultRow
            final
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
