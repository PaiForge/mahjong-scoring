import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { toAnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import { type YakuQuestionResult } from "@mahjong-scoring/features/practice/yaku/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../../board/tehai-mentsu-breakdown";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { ChallengeSubmitButton } from "../../components/challenge-submit-button";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { YakuAnswerComparison } from "./yaku-answer-comparison";
import { useYakuListHeight, YakuSelectList } from "./yaku-select-list";
import { YakuSelectedChips } from "./yaku-selected-chips";
import { useYakuBoard } from "@mahjong-scoring/features/practice/yaku/use-yaku-board";

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * web の `YakuBoard` の移植。出題状態と回答ロジックは `useYakuBoard` が持ち、チャレンジ・
 * トレーニング両モードで共有する。
 *
 * 答え合わせはトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、成立していた役を
 * 出しても読む間もなく次の問題へ変わってしまうため出さない（振り返りは結果
 * 画面の問題別一覧で行う）。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<YakuQuestionResult>) {
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
  const listHeight = useYakuListHeight();

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  const hasSelection = selectedYaku.size > 0;

  return (
    <View style={styles.board}>
      <TehaiDisplay tehai={question.tehai} context={question.context} />

      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 回答中は一覧から選ぶ。止まって答え合わせをする間は、一覧の場所に
          結果画面の問題別一覧と同じ対比表を出す。枠は一覧と同じ高さにして、
          入れ替えで盤面の丈を変えない。表が枠より長ければ枠の中でスクロールする */}
      {showAnswer ? (
        <ScrollView style={{ height: listHeight }} nestedScrollEnabled>
          <YakuAnswerComparison
            correctYakuNames={question.correctYakuNames}
            selectedYakuNames={[...selectedYaku]}
            outcome={
              lastAnswerCorrect === undefined
                ? undefined
                : toAnswerOutcome(lastAnswerCorrect)
            }
          />
        </ScrollView>
      ) : (
        <YakuSelectList
          selected={selectedYaku}
          disabled={isCountingDown || showFeedback}
          questionIndex={questionIndex}
          onToggle={handleToggleYaku}
        />
      )}

      {/* 選択中の役（一覧をスクロールすると選んだ役が視界から出るため、
          回答する直前に何を選んだのかをボタンの上で読ませる）。回答した瞬間は
          この箱が正誤の色に光る */}
      <YakuSelectedChips
        selected={selectedYaku}
        disabled={isCountingDown || showFeedback}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onRemove={handleToggleYaku}
      />

      {/* チャレンジは押した瞬間に次問題へ進むため「回答する」 */}
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onPress={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>

      {/* 面子分解は正解開示の一部。回答中に見せると答えが割れるため止まって
          いる間だけ出す。置き場所が末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showAnswer && (
        <TehaiMentsuBreakdown
          tehai={question.tehai}
          context={question.context}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 16,
  },
});
