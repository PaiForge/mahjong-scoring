"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-types";

/**
 * Server Action のエラーコードに加えて、`mapError` が受け取りうるコード
 *
 * 例外（ネットワーク断など）はどのアクションのコードにも当てはまらないため、
 * `"unknown"` として同じ変換関数に流す。
 */
type SubmitErrorCode<E extends string> = E | "unknown";

interface SubmitConfig<E extends string> {
  /**
   * クライアント側の事前検証。エラーメッセージを返すと送信せずに表示する
   * （ローディング状態にはしない）。
   */
  readonly validate?: () => string | undefined;
  /** 実行する Server Action */
  readonly action: () => Promise<ActionResult<E>>;
  /**
   * サーバーエラーコード（または例外時の `"unknown"`）をメッセージに変換する。
   *
   * `code` はアクションが返しうるコードに閉じているため、綴りを間違えた
   * 突き合わせ（`code === "rateLimted"`）はコンパイルエラーになる。
   */
  readonly mapError: (code: SubmitErrorCode<E>) => string;
  /** 成功時の処理（画面遷移・状態更新など） */
  readonly onSuccess: () => void | Promise<void>;
  /**
   * 成功後にローディングを解除する（既定: false）。
   * ページ遷移する場合は解除せずスピナーを維持する。
   */
  readonly stopLoadingOnSuccess?: boolean;
}

/**
 * 認証系フォーム共通の送信状態管理フック
 * 認証フォーム送信
 *
 * error / isLoading の状態と、事前検証 → Server Action 実行 →
 * エラーマッピング → 成功処理の定型フローを一元化する。
 */
export function useAuthFormSubmit(): {
  readonly error: string;
  readonly isLoading: boolean;
  readonly submit: <E extends string>(config: SubmitConfig<E>) => Promise<void>;
} {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async <E extends string>({
    validate,
    action,
    mapError,
    onSuccess,
    stopLoadingOnSuccess = false,
  }: SubmitConfig<E>) => {
    setError("");

    const validationError = validate?.();
    if (validationError !== undefined) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await action();

      if ("error" in result) {
        setError(mapError(result.error));
        setIsLoading(false);
        return;
      }

      await onSuccess();
      if (stopLoadingOnSuccess) setIsLoading(false);
    } catch {
      setError(mapError("unknown"));
      setIsLoading(false);
    }
  };

  return { error, isLoading, submit };
}
