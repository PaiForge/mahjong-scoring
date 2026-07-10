import { z } from "zod";

import { MIN_PASSWORD_LENGTH } from "../../config";

/**
 * パスワードバリデーションスキーマ。
 * Supabase config.toml の password_requirements = "letters_digits" と同期。
 * パスワードバリデーション
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "tooShort")
  .regex(/[a-zA-Z]/, "missingLetter")
  .regex(/\d/, "missingDigit");

export const PASSWORD_VALIDATION_ERROR_KEYS = [
  "tooShort",
  "missingLetter",
  "missingDigit",
  "weak",
] as const;

export type PasswordValidationErrorKey =
  (typeof PASSWORD_VALIDATION_ERROR_KEYS)[number];

/**
 * 文字列がパスワードバリデーションエラーキーかを判定する型ガード。
 * パスワードエラーキー判定
 */
export function isPasswordValidationErrorKey(
  key: string,
): key is PasswordValidationErrorKey {
  return (PASSWORD_VALIDATION_ERROR_KEYS as readonly string[]).includes(key);
}

/**
 * パスワードのバリデーションエラーキーを返す。正常時は undefined。
 * パスワードバリデーションエラー取得
 */
export function getPasswordValidationError(
  password: string,
): PasswordValidationErrorKey | undefined {
  const result = passwordSchema.safeParse(password);
  if (result.success) return undefined;
  const message = result.error.issues[0].message;
  return isPasswordValidationErrorKey(message) ? message : "weak";
}

/**
 * パスワード設定の検証結果。
 * - `mismatch`: 確認用パスワードと不一致
 * - `invalid`: パスワード形式エラー（`key` は翻訳キー）
 */
export type PasswordPairValidation =
  | { readonly type: "mismatch" }
  | { readonly type: "invalid"; readonly key: PasswordValidationErrorKey };

/**
 * パスワードと確認用パスワードの組をクライアント側で検証する。
 * 問題なければ undefined を返す。
 * パスワード組検証
 *
 * sign-up / reset-password フォームで共有する。エラーの翻訳は呼び出し側が
 * それぞれの名前空間で行う（mismatch はフォーム固有、invalid は validation.password）。
 */
export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): PasswordPairValidation | undefined {
  if (password !== confirmPassword) return { type: "mismatch" };
  const key = getPasswordValidationError(password);
  if (key) return { type: "invalid", key };
  return undefined;
}

/**
 * Server Action が返す `password:<key>` 形式のエラーからバリデーションキーを取り出す。
 * パスワードアクションエラー解析
 *
 * `password:` 形式でない、またはキーが不明な場合は undefined を返す。
 */
export function parsePasswordActionError(
  error: string,
): PasswordValidationErrorKey | undefined {
  if (!error.startsWith("password:")) return undefined;
  const key = error.slice("password:".length);
  return isPasswordValidationErrorKey(key) ? key : undefined;
}
