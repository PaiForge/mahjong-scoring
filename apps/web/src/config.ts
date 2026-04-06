/**
 * サイト URL（認証コールバック等で使用）
 * サイトURL設定
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * パスワード最小文字数（Supabase config.toml の minimum_password_length と同期）
 * パスワード最小文字数
 */
export const MIN_PASSWORD_LENGTH = 6;
