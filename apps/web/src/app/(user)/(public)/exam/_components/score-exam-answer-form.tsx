"use client";

import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreRange,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { ScoreAnswerForm } from "@/app/(user)/(public)/practice/_components/score-answer-form";

interface ScoreExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 選択肢を固定する点数帯。出題条件と揃える（{@link ScoreExamAnswerForm} 参照） */
  readonly scoreRange: ScoreRange;
}

/**
 * 昇級試験（点数計算）共通の回答フォーム
 * 昇級試験回答フォーム
 *
 * 点数のみを select で回答する。役も符も表示しないため、手牌から翻数（試験に
 * よっては符も）を自力で数え、点数表を引くところまでを受験者が通しで行う。
 *
 * 選択肢は必ず `scoreRange` で点数帯に固定する。翻数から絞ると選択肢の個数が
 * そのまま翻数のヒントになり、さらに切り上げ満貫が効く境界（30符4翻など）では
 * 端末ローカルのルール設定で選択肢が受験者ごとに変わってしまう。試験は
 * leaderboardKey を分けずに全受験者を同じ土俵で比較するため、選択肢は端末設定に
 * 依存してはならない。
 *
 * 親子・ツモロンの別は出題（`question`）から導くので、呼び出し側は渡さない。
 */
export function ScoreExamAnswerForm({
  question,
  questionIndex,
  onSubmit,
  disabled = false,
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
      translationNamespace={translationNamespace}
      scoreRange={scoreRange}
    />
  );
}
