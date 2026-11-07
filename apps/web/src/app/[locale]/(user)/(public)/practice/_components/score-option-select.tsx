"use client";

import type { ScoreSelectOption } from "@mahjong-scoring/features/practice/score/score-select-options";
import { getSelectClass } from "../_lib/select-class";
import type { SelectFeedbackState } from "../_lib/select-class";

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
  /** 対応する `<label>` の `htmlFor` から参照させる id */
  readonly id?: string;
  /** 可視ラベルを持てない場合の代替名（子ツモの「子から」「親から」など） */
  readonly ariaLabel?: string;
  /**
   * 回答直後に枠と地の色で返す正誤（{@link getSelectClass} 参照）。
   * 正誤を返さない画面では省略する。
   */
  readonly feedback?: SelectFeedbackState;
}

/**
 * 点数選択肢の select（点数回答フォーム共通の1カラム）
 * 点数選択セレクト
 *
 * 点数（`1000`）も子ツモの組（`300/500`）も同じ部品で描く。正誤の枠色・
 * プレースホルダ・無効化の扱いを 1 か所に保つため、選択肢は key と表示名の
 * 組で受ける。
 */
export function ScoreOptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  ariaLabel,
  feedback,
}: ScoreOptionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value ?? ""}
      // 未選択の option は選べない（disabled）ので、届く値は必ず選択肢の値
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className={getSelectClass(value !== undefined, feedback)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
