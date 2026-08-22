"use client";

import type { ReactNode } from "react";

import { Button } from "@/app/(user)/_components/button";

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
    <Button type="submit" size="lg" fullWidth disabled={loading}>
      {children}
    </Button>
  );
}
