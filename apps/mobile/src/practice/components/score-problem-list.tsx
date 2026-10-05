import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import { formatScoreAnswer } from "@mahjong-scoring/features/results/format-score-answer";
import {
  restoreScoreQuestion,
  type ScoreQuestionResult,
} from "@mahjong-scoring/features/results/score-question-result";
import { buildYakumanCapNote } from "@mahjong-scoring/features/results/yakuman-cap-note";
import { orderFuHan } from "@mahjong-scoring/features/settings/fu-han-order";

import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import { useFuHanOrder } from "../../hooks/use-display-settings-store";
import { AnswerComparison } from "./answer-comparison";
import { ProblemListAccordion } from "./problem-list-accordion";
import { QuestionDisplay } from "./question-display";
import { YakuBreakdown } from "./yaku-breakdown";

interface ScoreProblemListProps {
  readonly results: readonly ScoreQuestionResult[];
  /** i18n の翻訳ネームスペース（例: "scoreTableChallenge"） */
  readonly translationNamespace: string;
  /**
   * 正解を表示する際のレンダリング関数（省略時は回答と同じ書式の文字）
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
 * 詳細は「手牌 → 面子の内訳（符の根拠）→ 翻数の内訳（翻の根拠）→ 答え合わせ」
 * の順。翻数の内訳は既定で閉じる（問われているのは点数で、開いたままだと
 * 役の行数だけ答え合わせが下へ流れる）。
 *
 * web は正解の点数を押すとその条件をハイライトした点数早見表を開く
 * （`ScoreProblemListWithLinks`）が、モバイルにはまだ点数早見表が無いため
 * 正解は文字のまま出す。
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

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace={translationNamespace}
      outcome={(r) => r.outcome}
      renderSummary={(result) =>
        // 符と翻の順は表示設定に従う（出題文と同じ）。満貫以上の問題は
        // 符を持たないため、orderFuHan が符を省く
        [
          result.isOya ? t("oya") : t("ko"),
          result.isTsumo ? t("tsumo") : t("ron"),
          ...orderFuHan(fuHanOrder, {
            fu:
              result.fu === undefined
                ? undefined
                : t("fu", { count: result.fu }),
            han: t("han", { count: result.han }),
          }),
        ].join("・")
      }
      renderDetail={(result) => {
        const question = restoreScoreQuestion(result.question, result.isTsumo);
        const yakuDetails = result.question?.yakuDetails;

        return (
          <View style={styles.detail}>
            {question && <QuestionDisplay question={question} />}
            {question && (
              <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
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
                renderCorrectAnswer?.(result.correctAnswer, result) ??
                formatAnswer(result.correctAnswer, translate)
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
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: 12,
  },
});
