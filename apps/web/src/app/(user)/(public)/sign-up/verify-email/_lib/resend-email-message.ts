import type { ResendEmailError } from "../_actions/resend-email";

type ResendEmailMessageKey = "rateLimited" | "resendError";

/**
 * 確認メール再送エラーに対応する翻訳キーを返す。
 * 確認メール再送エラー表示
 */
export function resendEmailMessageKey(
  error: ResendEmailError,
): ResendEmailMessageKey {
  switch (error) {
    case "rateLimited":
      return "rateLimited";
    case "resendFailed":
      return "resendError";
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
}
