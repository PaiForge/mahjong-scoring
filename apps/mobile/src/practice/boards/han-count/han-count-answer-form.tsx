import {
  HAN_OPTIONS,
  hanCountLabel,
} from "@mahjong-scoring/features/practice/han-count/han-options";

import { HanChoiceAnswerForm } from "../../components/han-choice-answer-form";

/**
 * 翻数即答練習の回答フォーム（web の `HanCountAnswerForm`）
 * 翻数回答フォーム
 *
 * 1翻〜12翻と役満の選択肢をボタンで表示し、タップで即回答する。
 */
export function HanCountAnswerForm(props: {
  /** 正解の翻数 */
  readonly correctHan: number;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  readonly onSubmit: (han: number) => void;
  readonly disabled?: boolean;
}) {
  return (
    <HanChoiceAnswerForm
      {...props}
      options={HAN_OPTIONS}
      translationNamespace="hanCountChallenge"
      columns={4}
      renderLabel={hanCountLabel}
    />
  );
}
