import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { isMangan } from "@mahjong-scoring/core";
import type { ScoreExamBoardConfig } from "@mahjong-scoring/features/exam/score-exam-board-config";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
import { buildYakumanCapNote } from "@mahjong-scoring/features/results/yakuman-cap-note";

import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { FuBreakdown } from "../components/fu-breakdown";
import { QuestionDisplay } from "../components/question-display";
import { QuestionPlaceholder } from "../components/question-placeholder";
import { QuestionPrompt } from "../components/question-prompt";
import { RevealedScoreQuestionAnswer } from "../components/revealed-score-answer";
import { YakuBreakdown } from "../components/yaku-breakdown";
import { useScoreQuestionBoard } from "@mahjong-scoring/features/practice/use-score-question-board";
import { useTrainingAnswerVisibility } from "@mahjong-scoring/features/practice/use-training-mode";
import { ScoreExamAnswerForm } from "./score-exam-answer-form";

/**
 * 昇級試験（点数計算）の出題盤面を生成するファクトリー関数
 * 昇級試験盤面生成
 *
 * web の `createScoreExamBoard` の移植。級ごとに違うのは出題条件・点数帯・
 * 翻訳名前空間だけで、手牌の提示から回答フォームまでの構図は共通。
 *
 * どの級も役一覧を表示しない。受験者が手牌から翻数（級によっては符も）を
 * 自力で数えるのが試験の要件であり、役を出すと最初の判断を肩代わりして
 * しまうため。回答は選択欄を選んだ時点で確定し、正誤はその選択欄自身の
 * 枠と地の色が返す。
 *
 * モバイルでは模試（時間無制限・記録なしのトレーニング）だけを開く。模試では
 * 回答後の停止中と「わからない」の開示中に、正解の点数を出題の直下に、
 * 面子分解と翻数の内訳、満貫未満なら符の内訳を回答欄の下に出す（試験は
 * 役一覧を出さないので、点数を間違えたとき「点数表の引き間違い」と
 * 「翻数・符の数え間違い」を内訳なしには切り分けられない。満貫以上では符が
 * 点数に効かないので符の内訳は出さない）。
 *
 * @remarks
 * ルール設定ストア（連風牌4符・切り上げ満貫）を読まないことがこの盤面の
 * 不変条件。模試も本番と同じ問題・同じ選択肢で解けることに意味があるため、
 * 出題も選択肢も端末ローカルの設定に依存させない。
 */
export function createScoreExamBoard(
  config: ScoreExamBoardConfig,
): (props: RecordingPracticeBoardProps<ScoreQuestionResult>) => ReactNode {
  const { translationNamespace, generateOptions, scoreRange, maxRetries } =
    config;

  function ScoreExamBoard({
    showFeedback,
    lastAnswerCorrect,
    isCountingDown = false,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  }: RecordingPracticeBoardProps<ScoreQuestionResult>) {
    const t = useTranslations(translationNamespace);
    const tBreakdown = useTranslations("challenge.yakuBreakdown");

    const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
      generateOptions,
      maxRetries,
      showFeedback,
      onAnswer,
      onRecordResult,
      onPresentQuestion,
    });
    // 模試では開示時だけでなく回答後の停止中も答え合わせを出す。翻数の内訳は
    // 正解でも出すが、正解の点数は出さない（選択欄の色が正誤を示している）
    const { showAnswer, showBreakdown } =
      useTrainingAnswerVisibility(lastAnswerCorrect);

    if (!question) {
      return <QuestionPlaceholder label={t("generating")} />;
    }

    return (
      <View style={styles.board}>
        <QuestionDisplay question={question} />

        <QuestionPrompt
          replacement={
            showAnswer ? (
              <RevealedScoreQuestionAnswer
                question={question}
                translationNamespace={translationNamespace}
              />
            ) : undefined
          }
        >
          {t("questionPrompt")}
        </QuestionPrompt>

        <ScoreExamAnswerForm
          question={question}
          questionIndex={questionIndex}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
          showFeedback={showFeedback}
          lastAnswerCorrect={lastAnswerCorrect}
          translationNamespace={translationNamespace}
          scoreRange={scoreRange}
        />

        {/* 面子分解は正解開示の一部。回答中に見せると符の答えが割れるため
            止まっている間だけ出す。末尾に置くのは開示の瞬間に回答欄を動かさないため */}
        {showBreakdown && (
          <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
        )}

        {showBreakdown &&
          question.fuDetails !== undefined &&
          !isMangan(question.answer.scoreLevel) && (
            <FuBreakdown
              details={question.fuDetails}
              answer={question.answer.fu}
              translationNamespace="challenge.fuBreakdown"
            />
          )}

        {showBreakdown && (
          <YakuBreakdown
            yakuDetails={question.yakuDetails ?? []}
            note={buildYakumanCapNote(
              question.yakuDetails,
              question.answer.yakumanMultiplier,
              tBreakdown,
            )}
          />
        )}
      </View>
    );
  }

  ScoreExamBoard.displayName = `ScoreExamBoard(${translationNamespace})`;

  return ScoreExamBoard;
}

const styles = StyleSheet.create({
  board: {
    gap: 24,
  },
});
