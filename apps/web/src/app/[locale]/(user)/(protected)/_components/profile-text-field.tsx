"use client";

import type { ReactNode } from "react";

/**
 * プロフィール系フォームの入力欄クラス
 *
 * 単行入力（{@link ProfileTextField}）と textarea で共有する。
 */
export const PROFILE_INPUT_CLASS =
  "w-full rounded-lg border border-surface-400 bg-white px-3 py-2.5 text-sm text-surface-800 placeholder:text-surface-400 focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none";

interface ProfileTextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly maxLength: number;
  /** ラベル横に必須マークを出す */
  readonly required?: boolean;
  readonly autoFocus?: boolean;
  /** ラベルと同じ行の右端に置く要素（入力欄を埋める補助ボタンなど） */
  readonly labelAction?: ReactNode;
  /** 入力欄の下に置く要素（エラー・注意書き・文字数カウンタなど） */
  readonly children?: ReactNode;
}

/**
 * プロフィール系フォームの単行入力欄
 * プロフィール入力欄
 *
 * 「ラベル + 入力欄」の体裁をプロフィール編集とユーザー名登録で共有する。
 */
export function ProfileTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  autoFocus = false,
  labelAction,
  children,
}: ProfileTextFieldProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-surface-800"
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoComplete="off"
        className={PROFILE_INPUT_CLASS}
      />
      {children}
    </div>
  );
}
