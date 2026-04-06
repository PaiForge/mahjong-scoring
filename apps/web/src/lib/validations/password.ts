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
 * パスワードのバリデーションエラーキーを返す。正常時は null。
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
