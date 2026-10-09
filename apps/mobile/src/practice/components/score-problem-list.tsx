import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import {
  restoreScoreQuestion,
  scoreResultSummary,
  type ScoreQuestionResult,
} from "@mahjong-scoring/features/results/score-question-result";
import {
  scoreTableFocusOf,
  type ScoreTableFocus,
} from "@mahjong-scoring/features/score-table/focus";
import { buildYakumanCapNote } from "@mahjong-scoring/features/results/yakuman-cap-note";

import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import { useFuHanOrder } from "../../hooks/use-display-settings-store";
import { linkStyles } from "../../lib/link-styles";
import { ScoreTableModal } from "../endless/agari-score/score-table-modal";
import { AnswerComparison } from "./answer-comparison";
import { FuBreakdown } from "./fu-breakdown";
import { ProblemListAccordion } from "./problem-list-accordion";
import { QuestionDisplay } from "./question-display";
import { YakuBreakdown } from "./yaku-breakdown";

interface ScoreProblemListProps {
  readonly results: readonly ScoreQuestionResult[];
  /** i18n の翻訳ネームスペース（例: "scoreTableChallenge"） */
  readonly translationNamespace: string;
  /**
   * 正解を表示する際のレンダリング関数（省略時は回答と同じ書式で、押すと
   * その和了の点数早見表を開く文字）
   */
  readonly renderCorrectAnswer?: (
    answer: ScoreTableAnswer,
    result: ScoreQuestionResult,
  ) => ReactNode;
  /** ユーザー回答を表示する際のフォーマット関数（省略時は {@link formatScoreAnswer}） */
  readonly formatAnswer?: (
    answer: ScoreTableAnswer,
    t: (key: string) => string,
  ) => string;
}

/**
 * 点数系練習共通の問題別フィードバック一覧
 * 点数問題一覧
 *
 * web の `ScoreProblemList` の移植。各問を開閉カードで並べ、正誤と正解・
 * ユーザー回答の詳細を確認できる。出題スナップショットが保存されている
 * 場合は出題時と同じ手牌表示も再現する。
 *
 * 詳細は「手牌 → 面子分解 → 符の内訳（符の根拠）→ 翻数の内訳（翻の根拠）→
 * 答え合わせ」の順。符の内訳は満貫未満の問題だけが持つ（満貫以上は符が点数に
 * 効かない）。符と翻数の内訳は既定で閉じる（問われているのは点数で、開いた
 * ままだと行数だけ答え合わせが下へ流れる）。
 *
 * 正解の点数は押すとそのセルをハイライトした点数早見表を開く（web の
 * `ScoreProblemListWithLinks`）。
 */
export function ScoreProblemList({
  results,
  translationNamespace,
  renderCorrectAnswer,
  formatAnswer = formatScoreAnswer,
}: ScoreProblemListProps) {
  const t = useTranslations(translationNamespace);
  // 役満止まりの注記は内訳表（challenge.yakuBreakdown）と同じ語彙で組む
  const tBreakdown = useTranslations("challenge.yakuBreakdown");
  const fuHanOrder = useFuHanOrder();
  const translate = (key: string) => t(key);
  const [scoreTableFocus, setScoreTableFocus] =
    useState<ScoreTableFocus | null>(null);

  return (
    <>
      <ProblemListAccordion
        results={results}
        translationNamespace={translationNamespace}
        outcome={(r) => r.outcome}
        renderSummary={(result) => scoreResultSummary(result, t, fuHanOrder)}
        renderDetail={(result) => {
          const question = restoreScoreQuestion(
            result.question,
            result.isTsumo,
          );
          const yakuDetails = result.question?.yakuDetails;
          const fuDetails = result.question?.fuDetails;

          return (
            <View style={styles.detail}>
              {question && <QuestionDisplay question={question} />}
              {question && (
                <TehaiMentsuBreakdown
                  tehai={question.tehai}
                  context={question}
                />
              )}
              {/* 符の内訳。満貫以上の問題と保存を始める前の旧データには無い */}
              {fuDetails !== undefined && result.fu !== undefined && (
                <FuBreakdown
                  details={fuDetails}
                  answer={result.fu}
                  translationNamespace="challenge.fuBreakdown"
                />
              )}
              {/* 役の内訳。保存を始める前の旧データには無いため任意 */}
              {yakuDetails !== undefined && (
                <YakuBreakdown
                  yakuDetails={yakuDetails}
                  note={buildYakumanCapNote(
                    yakuDetails,
                    result.yakumanMultiplier,
                    (key, values) => tBreakdown(key, values),
                  )}
                />
              )}

              <AnswerComparison
                translationNamespace={translationNamespace}
                outcome={result.outcome}
                correct={
                  renderCorrectAnswer?.(result.correctAnswer, result) ?? (
                    <Text
                      onPress={() =>
                        setScoreTableFocus(
                          scoreTableFocusOf({
                            isOya: result.isOya,
                            isTsumo: result.isTsumo,
                            han: result.han,
                            fu: result.fu,
                          }),
                        )
                      }
                      accessibilityRole="link"
                      style={[styles.correctLink, linkStyles.textButton]}
                    >
                      {formatAnswer(result.correctAnswer, translate)}
                    </Text>
                  )
                }
                user={
                  result.userAnswer === undefined
                    ? undefined
                    : formatAnswer(result.userAnswer, translate)
                }
              />
            </View>
          );
        }}
      />
      {scoreTableFocus !== null && (
        <ScoreTableModal
          isOpen
          onClose={() => setScoreTableFocus(null)}
          focus={scoreTableFocus}
          highlighted
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: 12,
  },
  correctLink: {
    fontSize: 14,
  },
});
