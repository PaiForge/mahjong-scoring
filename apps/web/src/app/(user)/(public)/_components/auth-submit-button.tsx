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
      className="w-full px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
