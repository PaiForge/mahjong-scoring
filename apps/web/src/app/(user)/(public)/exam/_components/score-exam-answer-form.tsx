"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";
import type { ScoreOptionRange } from "@/app/(user)/(public)/practice/score/_lib/get-available-scores";

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
  /** 選択肢を固定する範囲。出題条件と揃える（{@link ScoreExamAnswerForm} 参照） */
  readonly scoreRange: ScoreOptionRange;
}

/**
 * 昇級試験（点数計算）共通の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役も符も表示しないため、手牌から翻数（試験に
 * よっては符も）を自力で数え、点数表を引くところまでを受験者が通しで行う。
 *
 * 選択肢は必ず `scoreRange` で固定する（点数帯に絞る試験は帯を、絞らない試験は
 * `"all"` を渡す）。翻数から絞ると選択肢の個数がそのまま翻数のヒントになり、
 * さらに切り上げ満貫が効く境界（30符4翻など）では端末ローカルのルール設定で
 * 選択肢が受験者ごとに変わってしまう。試験は leaderboardKey を分けずに全受験者を
 * 同じ土俵で比較するため、選択肢は端末設定に依存してはならない。
 *
 * 親子・ツモロンの別は出題（`question`）から導くので、呼び出し側は渡さない。
 *
 * 回答直後は select の枠と地が正誤を返すが、正解の点数はその場では出さない。
 * 試験の答え合わせは結果ページの問題別フィードバック一覧の役目。
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
    />
  );
}
