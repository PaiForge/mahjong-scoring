"use client";

import type { ReactNode } from "react";

/**
 * プロフィール系フォームの入力欄クラス
 *
 * 単行入力（{@link ProfileTextField}）と textarea で共有する。
 */
export const PROFILE_INPUT_CLASS =
  "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none";

interface ProfileTextFieldProps {
  readonly id: string;
  readonly label: string;
  /** ラベル下の補足説明 */
  readonly description?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly maxLength: number;
  /** ラベル横に必須マークを出す */
  readonly required?: boolean;
  readonly autoFocus?: boolean;
  /** 入力欄の下に置く要素（エラー・注意書き・文字数カウンタなど） */
  readonly children?: ReactNode;
}

/**
 * プロフィール系フォームの単行入力欄
 * プロフィール入力欄
 *
 * 「ラベル + 補足 + 入力欄」の体裁をプロフィール編集とユーザー名登録で共有する。
 */
export function ProfileTextField({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  autoFocus = false,
  children,
}: ProfileTextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-surface-800"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {description && (
        <p className="mb-2 text-xs text-surface-500">{description}</p>
      )}
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
