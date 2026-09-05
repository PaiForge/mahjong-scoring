import type { RegisterUsernameError } from "../_actions/register-username";

type UsernameValidationMessageKey =
  | "validation.tooShort"
  | "validation.tooLong"
  | "validation.invalidFormat"
  | "validation.reserved"
  | "validation.taken"
  | "validation.alreadySet"
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
    case "too_short":
      return "validation.tooShort";
    case "too_long":
      return "validation.tooLong";
    case "invalid_format":
      return "validation.invalidFormat";
    case "reserved":
      return "validation.reserved";
    case "username_taken":
      return "validation.taken";
    case "username_already_set":
      return "validation.alreadySet";
    case "rateLimited":
      return "validation.rateLimited";
    case "unauthorized":
      return "validation.unauthorized";
    case "banned":
      return "validation.banned";
    case "username_required":
    case "unknown":
      return "validation.error";
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
}
