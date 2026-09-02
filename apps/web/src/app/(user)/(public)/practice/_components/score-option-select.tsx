"use client";

import { getSelectClass } from "../_lib/select-class";
import type { SelectFeedbackState } from "../_lib/select-class";

interface ScoreOptionSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** 選択肢の点数リスト */
  readonly options: readonly number[];
  /** 未選択時に表示するプレースホルダ */
  readonly placeholder: string;
  readonly disabled?: boolean;
  /** 各選択肢の後置文字列（親ツモの「オール」など） */
  readonly optionSuffix?: string;
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
 */
export function ScoreOptionSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  optionSuffix = "",
  id,
  ariaLabel,
  feedback,
}: ScoreOptionSelectProps) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className={getSelectClass(value !== "", feedback)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((s) => (
        <option key={s} value={s}>
          {s}
          {optionSuffix}
        </option>
      ))}
    </select>
  );
}
