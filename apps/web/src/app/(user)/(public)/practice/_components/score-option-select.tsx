"use client";

import { getSelectClass } from "../_lib/select-class";

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
}: ScoreOptionSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className={getSelectClass(value !== "")}
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
