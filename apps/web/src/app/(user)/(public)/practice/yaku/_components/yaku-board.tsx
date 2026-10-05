"use client";

import { useTranslations } from "next-intl";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { YakuAnswerComparison } from "./yaku-answer-comparison";
import { YAKU_LIST_HEIGHT_CLASSES, YakuSelectList } from "./yaku-select-list";
import { YakuSelectedChips } from "./yaku-selected-chips";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { toAnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import type { YakuQuestionResult } from "@mahjong-scoring/features/practice/yaku/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useYakuBoard } from "@mahjong-scoring/features/practice/yaku/use-yaku-board";

interface YakuBoardProps extends RecordingPracticeBoardProps<YakuQuestionResult> {
  /** 直前の回答が正解だったか。トレーニングの答え合わせの色に使う */
  readonly lastAnswerCorrect?: boolean;
}

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * 出題状態と回答ロジックは `useYakuBoard` が持ち、チャレンジ・トレーニング両モードで共有する。
 *
 * 答え合わせはトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、成立していた役を
 * 出しても読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果
 * ページの問題別フィードバック一覧で行う。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: YakuBoardProps) {
  const t = useTranslations("yaku");
  const {
    question,
    selectedYaku,
    questionIndex,
    showAnswer,
    handleToggleYaku,
    handleSubmit,
  } = useYakuBoard({
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="yaku"
      />
    );
  }

  const hasSelection = selectedYaku.size > 0;

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 回答中は一覧から選ぶ。止まって答え合わせをする間は、一覧の場所に
          結果ページの問題別フィードバックと同じ対比表を出す。枠は一覧と同じ
          高さにして、入れ替えで盤面の丈を変えない（変えると押したばかりの
          ボタンとその下が動く）。表が枠より長ければ枠の中でスクロールする */}
      {showAnswer ? (
        <div className={`overflow-y-auto ${YAKU_LIST_HEIGHT_CLASSES}`}>
          <YakuAnswerComparison
            correctYakuNames={question.correctYakuNames}
            selectedYakuNames={[...selectedYaku]}
            outcome={
              lastAnswerCorrect === undefined
                ? undefined
                : toAnswerOutcome(lastAnswerCorrect)
            }
          />
        </div>
      ) : (
        <YakuSelectList
          selected={selectedYaku}
          disabled={isCountingDown || showFeedback}
          questionIndex={questionIndex}
          onToggle={handleToggleYaku}
        />
      )}

      {/* 選択中の役（一覧をスクロールすると選んだ役が視界から出るため、
          回答する直前に何を選んだのかをボタンの上で読ませる）。
          回答した瞬間はこの箱が正誤の色に光る。停止中も残す — 対比表の
          「あなたの回答」と重なるが、消すと盤面の丈がその分縮む */}
      <YakuSelectedChips
        selected={selectedYaku}
        disabled={isCountingDown || showFeedback}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onRemove={handleToggleYaku}
      />

      {/* Submit button（チャレンジは押した瞬間に次問題へ進むため「回答する」） */}
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>

      {/* 面子分解は正解開示の一部。回答中に見せると符や待ちの答えが割れるため
          止まっている間だけ出す（結果ページの問題詳細と同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showAnswer && (
        <TehaiMentsuBreakdown
          tehai={question.tehai}
          context={question.context}
        />
      )}
    </div>
  );
}
