"use client";

/**
 * 認証系・問い合わせフォームの入力欄クラス
 *
 * 単行入力（{@link AuthTextField}）と textarea で共有する。
 */
export const AUTH_INPUT_CLASS =
  "w-full px-3 py-2 bg-white border-3 border-ink rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

interface AuthTextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type: "text" | "email" | "password";
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
}

/**
 * 認証フォーム共通のラベル付きテキスト入力
 * 認証入力フィールド
 *
 * sign-in / sign-up / forgot-password / reset-password の各フォームと、
 * 同じ体裁で組む問い合わせフォームで共有する。
 */
export function AuthTextField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  minLength,
  maxLength,
}: AuthTextFieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-surface-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={AUTH_INPUT_CLASS}
        placeholder={placeholder}
      />
    </div>
  );
}
