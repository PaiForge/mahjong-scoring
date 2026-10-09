import type { ScoreSelectOption } from "@mahjong-scoring/features/practice/score/score-select-options";

import { SelectField } from "../../components/select-field";
import { feedbackFrameStyle } from "../feedback-styles";

/**
 * 回答直後に選択欄が返す正誤
 * セレクト正誤状態
 *
 * セッションの同名の値をそのまま渡す。`lastAnswerCorrect` が undefined の間
 * （未回答・無回答の正解開示中）は色を付けない（web の `SelectFeedbackState`）。
 */
export interface SelectFeedbackState {
  readonly showFeedback: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
}

interface ScoreOptionSelectProps {
  /** 選んだ選択肢の値（未選択・選択肢に無い値は undefined） */
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  /**
   * 選択肢。点数は `scoreSelectOptions`、子ツモの組は `koTsumoSelectOptions`
   * （どちらも features の `practice/score/score-select-options`）で作る
   */
  readonly options: readonly ScoreSelectOption[];
  /** 未選択時に表示するプレースホルダ */
  readonly placeholder: string;
  readonly disabled?: boolean;
  /** 読み上げ用の名前（子ツモの「子から」「親から」など） */
  readonly accessibilityLabel?: string;
  /**
   * 回答直後に枠と地の色で返す正誤。正誤を返さない画面では省略する。
   */
  readonly feedback?: SelectFeedbackState;
  readonly testID?: string;
}

/**
 * 点数選択肢の選択欄（点数回答フォーム共通の 1 カラム）
 * 点数選択セレクト
 *
 * web の `ScoreOptionSelect` の移植。点数を選んで答える練習・試験では
 * 候補を 1 つずつ染め分けられないので、回答した欄自身の枠と地を正誤の
 * 色にする（選択肢ボタンと同じ配色・同じタイミング）。点数（`1000`）も
 * 子ツモの組（`300/500`）も同じ部品で描く。
 */
export function ScoreOptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  accessibilityLabel,
  feedback,
  testID,
}: ScoreOptionSelectProps) {
  const showsFeedback =
    feedback !== undefined &&
    feedback.showFeedback &&
    feedback.lastAnswerCorrect !== undefined;

  return (
    <SelectField
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      frameStyle={
        showsFeedback
          ? feedbackFrameStyle(true, feedback.lastAnswerCorrect)
          : undefined
      }
      testID={testID}
    />
  );
}
