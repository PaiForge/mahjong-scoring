"use client";

import type { ReactNode } from "react";

interface AuthSubmitButtonProps {
  readonly loading: boolean;
  readonly children: ReactNode;
}

/**
 * 認証フォーム共通の送信ボタン
 * 認証送信ボタン
 *
 * `loading` 中は disabled になり、ラベルは呼び出し側が children で渡す。
 */
export function AuthSubmitButton({ loading, children }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="press-sm w-full rounded-lg border-3 border-ink bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
