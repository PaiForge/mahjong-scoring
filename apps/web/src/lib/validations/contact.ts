import { z } from "zod";

/**
 * 問い合わせフォームのバリデーション。
 * client（確認画面へ進む前の即時フィードバック）と server action（信頼境界）の
 * 両方で使う。
 * 問い合わせバリデーション
 *
 * 上限値は入力欄の `maxLength` と検証の両方でこのモジュールから引き、
 * フォームに数値を書き写さないこと。
 */

/** 各フィールドの文字数制限 */
export const CONTACT_LIMITS = {
  name: 100,
  subject: 200,
  messageMin: 10,
  message: 5000,
} as const;

/**
 * 単行フィールドに CR / LF を許さない。
 *
 * 件名はそのままメールの Subject ヘッダになる。Resend の SDK 側でも
 * ヘッダ注入は防がれているが、ここで落としておけば依存先の実装に
 * 寄りかからずに済む（多層防御）。
 */
const NO_NEWLINES = /^[^\r\n]*$/;

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "nameRequired")
    .max(CONTACT_LIMITS.name, "nameMaxLength")
    .regex(NO_NEWLINES, "nameInvalid"),
  email: z.email("emailInvalid"),
  subject: z
    .string()
    .min(1, "subjectRequired")
    .max(CONTACT_LIMITS.subject, "subjectMaxLength")
    .regex(NO_NEWLINES, "subjectInvalid"),
  message: z
    .string()
    .min(CONTACT_LIMITS.messageMin, "messageMinLength")
    .max(CONTACT_LIMITS.message, "messageMaxLength"),
});

/** 検証済みの問い合わせ内容 */
export type ContactFormData = z.infer<typeof contactFormSchema>;

/** i18n キー（`contact.errors` 名前空間）と対応するバリデーションエラー */
export const CONTACT_VALIDATION_ERROR_KEYS = [
  "nameRequired",
  "nameMaxLength",
  "nameInvalid",
  "emailInvalid",
  "subjectRequired",
  "subjectMaxLength",
  "subjectInvalid",
  "messageMinLength",
  "messageMaxLength",
] as const;

export type ContactValidationErrorKey =
  (typeof CONTACT_VALIDATION_ERROR_KEYS)[number];

/**
 * 文字列が問い合わせバリデーションのエラーキーかを判定する型ガード。
 * 問い合わせエラーキー判定
 */
export function isContactValidationErrorKey(
  key: string,
): key is ContactValidationErrorKey {
  return (CONTACT_VALIDATION_ERROR_KEYS as readonly string[]).includes(key);
}

/**
 * 問い合わせ内容の検証結果。
 * - `ok: true` — 検証済みの値
 * - `error` — 先頭のバリデーションエラーのキー。フィールド単位のキーに
 *   当てはまらない失敗（オブジェクトの形が違う等、フォーム経由では
 *   起きない入力）は `invalidInput`
 */
export type ContactFormParseResult =
  | { readonly ok: true; readonly value: ContactFormData }
  | {
      readonly ok: false;
      readonly error: ContactValidationErrorKey | "invalidInput";
    };

/**
 * 問い合わせフォームの入力を検証する。
 * 問い合わせ入力検証
 *
 * `unknown` を受けるのは、Server Action がクライアントから渡された値を
 * 型に頼らず検証するため。
 */
export function parseContactForm(input: unknown): ContactFormParseResult {
  const result = contactFormSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  const message = result.error.issues[0]?.message;
  return {
    ok: false,
    error:
      message !== undefined && isContactValidationErrorKey(message)
        ? message
        : "invalidInput",
  };
}
