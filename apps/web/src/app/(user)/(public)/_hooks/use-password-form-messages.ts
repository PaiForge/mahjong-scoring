"use client";

import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";
import {
  parsePasswordActionError,
  validatePasswordPair,
} from "@/lib/validations/password";

interface PasswordFormMessages {
  /**
   * パスワードと確認用パスワードを検証し、問題があればメッセージを返す。
   * `useAuthFormSubmit` の `validate` にそのまま渡せる。
   */
  readonly validatePair: (
    password: string,
    confirmPassword: string,
  ) => string | undefined;
  /**
   * Server Action のエラーコードがパスワードポリシー由来なら
   * メッセージへ変換する。該当しなければ undefined。
   */
  readonly mapPasswordError: (code: string) => string | undefined;
}

/**
 * パスワード入力フォーム共通のメッセージ変換
 * パスワードメッセージ変換
 *
 * ペア検証の結果と Server Action のパスワードエラーコードを i18n メッセージへ
 * 落とす手順を一元化する。パスワードポリシーは client/server 共通の Zod スキーマ
 * （`@/lib/validations/password`）が唯一の定義で、ここはその表示層。
 *
 * @param namespace - `passwordMismatch` キーを持つ画面の翻訳名前空間
 */
export function usePasswordFormMessages(
  namespace: string,
): PasswordFormMessages {
  const t = useTranslations(namespace);
  const tPassword = useTranslations("validation.password");

  const validatePair = (password: string, confirmPassword: string) => {
    const pairError = validatePasswordPair(password, confirmPassword);
    if (!pairError) return undefined;
    return pairError.type === "mismatch"
      ? t("passwordMismatch")
      : tPassword(pairError.key, { minLength: MIN_PASSWORD_LENGTH });
  };

  const mapPasswordError = (code: string) => {
    const passwordKey = parsePasswordActionError(code);
    if (!passwordKey) return undefined;
    return tPassword(passwordKey, { minLength: MIN_PASSWORD_LENGTH });
  };

  return { validatePair, mapPasswordError };
}
