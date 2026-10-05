import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  FU_VALUES,
  generateTotalFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import {
  DEMO_FU_CONTEXT,
  DEMO_FU_TEHAI,
} from "@mahjong-scoring/features/board/demo-tehai";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
  parseFuQuestionResults,
  type FuExamQuestionResult,
} from "@mahjong-scoring/features/exam/fu/types";
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";

import { TehaiDisplay } from "../../../board/tehai-display";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { FuChoiceGrid } from "../../components/fu-choice-grid";
import { FuProblemList } from "../../components/fu-problem-list";
import { QuestionPrompt } from "../../components/question-prompt";
import { TotalFuQuestionBoard } from "../../components/total-fu-question-board";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";

const NAMESPACE = "fuExamChallenge";

/** 本番と模試で同じ条件の 1 問（依存が無いのでモジュールに置いて参照を固定する） */
function generateExamQuestion() {
  return retryGenerate(
    () => generateTotalFuQuestion(EXAM_GENERATE_OPTIONS),
    EXAM_GENERATION_MAX_RETRIES,
  );
}

/**
 * 昇級試験（手牌の合計符）の出題盤面（web の `FuExamBoard`）
 * 昇級試験盤面
 *
 * 手牌の合計符の練習と同じ構図（{@link TotalFuQuestionBoard}）。模試では
 * 回答後の停止中と「わからない」の開示中に面子分解と符の内訳を出す。
 *
 * ルール設定ストア（連風牌4符）を意図的に読まない: 出題は
 * `EXAM_GENERATE_OPTIONS` が場風＝自風の局面を除いており、設定は符に影響
 * しないため、端末設定に関係なく全受験者が同一条件になる。
 */
function FuExamBoard(props: RecordingPracticeBoardProps<FuExamQuestionResult>) {
  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateExamQuestion}
      translationNamespace={NAMESPACE}
    />
  );
}

/**
 * 昇級試験（手牌の合計符）の「問題方式」ビジュアルデモ（web の `FuExamHowToPlay`）
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面を出題時（未回答）のまま静的に再現する。合計符の練習と同じ
 * 牌姿を使う — 出題形式は同じで、違うのはルールと合格ラインだけだから。
 */
function FuExamHowToPlay() {
  const t = useTranslations(NAMESPACE);
  return (
    <View style={styles.demo}>
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />
      <QuestionPrompt>{t("prompt")}</QuestionPrompt>
      <FuChoiceGrid
        options={FU_VALUES}
        // 未回答の見本なので正誤を染めない（どの選択肢も正解として扱わない）
        answer={-1}
        selectedFu={undefined}
        showFeedback={false}
        isCountingDown={false}
        onSelect={() => undefined}
        columns={3}
        translationNamespace={NAMESPACE}
      />
    </View>
  );
}

/** 昇級試験（手牌の合計符）の画面一式（モバイルが開くのは模試だけ） */
export const fuExamScreens: PracticeScreens = {
  Play: createChallengePlayView<FuExamQuestionResult>({
    slug: PRACTICE_SLUG.fuExam,
    renderBoard: (args) => (
      <FuExamBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.fuExam,
    renderBoard: (args) => (
      <FuExamBoard
        showFeedback={args.showFeedback}
        isTraining={args.isTraining}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: FuExamHowToPlay,
  ProblemList: ({ results }) => (
    <FuProblemList
      results={parseFuQuestionResults(results)}
      translationNamespace={NAMESPACE}
    />
  ),
};

const styles = StyleSheet.create({
  demo: {
    gap: 16,
  },
});
