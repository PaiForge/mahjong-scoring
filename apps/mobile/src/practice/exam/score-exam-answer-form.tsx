import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";

import { ScoreAnswerForm } from "../components/score-answer-form";

interface ScoreExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 選択肢を固定する範囲。出題条件と揃える */
  readonly scoreRange: ScoreOptionRange;
}

/**
 * 昇級試験（点数計算）共通の回答フォーム
 * 昇級試験回答フォーム
 *
 * web の `ScoreExamAnswerForm` の移植。点数のみを選択欄で回答する。役も符も
 * 表示しないため、手牌から翻数（試験によっては符も）を自力で数え、点数表を
 * 引くところまでを受験者が通しで行う。
 *
 * 選択肢は必ず `scoreRange` で固定し、端末のルール設定にも依らせない
 * （`fixedRules`）。翻数から絞ると選択肢の個数がそのまま翻数のヒントになり、
 * 切り上げ満貫が効く境界では端末ごとに選択肢が変わってしまう。合格ラインは
 * 全受験者に同じ 1 本なので、選択肢は端末設定に依存してはならない。
 * 例外は表示設定の子ツモの入力方式で、答え方の形なので試験でも従う
 * （features の `settings/ko-tsumo-input.ts`）。
 *
 * 選択が揃った時点で送信し、「回答する」ボタンは置かない。
 */
export function ScoreExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
  showFeedback = false,
  lastAnswerCorrect,
  translationNamespace,
  scoreRange,
}: ScoreExamAnswerFormProps) {
  return (
    <ScoreAnswerForm
      isOya={isOya(question.jikaze)}
      isTsumo={question.isTsumo}
      han={question.answer.han}
      key={questionIndex}
      onSubmit={onSubmit}
      disabled={disabled}
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      translationNamespace={translationNamespace}
      scoreRange={scoreRange}
      autoSubmit
      fixedRules
    />
  );
}
