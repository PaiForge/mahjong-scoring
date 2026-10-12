import type { RegisterUsernameError } from "../_actions/register-username";

type UsernameValidationMessageKey =
  | "validation.tooShort"
  | "validation.tooLong"
  | "validation.invalidFormat"
  | "validation.reserved"
  | "validation.prohibited"
  | "validation.taken"
  | "validation.alreadySet"
  | "validation.displayNameTooLong"
  | "validation.displayNameProhibited"
  | "validation.rateLimited"
  | "validation.unauthorized"
  | "validation.banned"
  | "validation.error";

/**
 * ユーザー名登録エラーに対応する翻訳キーを返す。
 * ユーザー名登録エラー表示
 */
export function usernameValidationMessageKey(
  error: RegisterUsernameError | "unknown",
): UsernameValidationMessageKey {
  switch (error) {
    // username_required は前後の空白を除くと空。2 文字未満なので、直し方が伝わる tooShort に寄せる
    case "too_short":
    case "username_required":
      return "validation.tooShort";
    case "too_long":
      return "validation.tooLong";
    case "invalid_format":
      return "validation.invalidFormat";
    case "reserved":
      return "validation.reserved";
    case "prohibited":
      return "validation.prohibited";
    case "username_taken":
      return "validation.taken";
    case "username_already_set":
      return "validation.alreadySet";
    case "display_name_too_long":
      return "validation.displayNameTooLong";
    case "display_name_prohibited":
      return "validation.displayNameProhibited";
    case "rateLimited":
      return "validation.rateLimited";
    case "unauthorized":
      return "validation.unauthorized";
    case "banned":
      return "validation.banned";
    case "unknown":
      return "validation.error";
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
}
