"use client";

interface AuthTextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type: "email" | "password";
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly minLength?: number;
}

/**
 * 認証フォーム共通のラベル付きテキスト入力
 * 認証入力フィールド
 *
 * sign-in / sign-up / forgot-password / reset-password の各フォームで共有する。
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
        autoComplete={autoComplete}
        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder={placeholder}
      />
    </div>
  );
}
