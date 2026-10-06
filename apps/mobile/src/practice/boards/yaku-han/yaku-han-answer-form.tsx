import {
  HAN_OPTIONS,
  yakuHanLabel,
} from "@mahjong-scoring/features/practice/yaku-han/han-options";

import { HanChoiceAnswerForm } from "../../components/han-choice-answer-form";

/**
 * 役翻数練習の回答フォーム（web の `YakuHanAnswerForm`）
 * 役翻数回答フォーム
 *
 * 1翻〜6翻と役満の選択肢をボタンで表示し、タップで即回答する。
 */
export function YakuHanAnswerForm(props: {
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
      translationNamespace="yakuHanChallenge"
      columns={4}
      renderLabel={yakuHanLabel}
    />
  );
}
