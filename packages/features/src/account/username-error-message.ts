import type { MobileUsernameErrorCode } from "./mobile-api";

/**
 * ユーザー名登録の失敗のうち、web とアプリが同じ文言で伝えるもの
 *
 * 登録の本体が弾く理由（{@link MobileUsernameErrorCode}。web の Server Action と
 * アプリ向け API で同じ集合）に、入口の回数制限・認証・BAN と、理由の分からない
 * 失敗（`unknown`）を足したもの。アプリだけが持つ失敗（`network` や
 * `authUnavailable` 等）はここに含めず、アプリ側で写す。
 */
export type UsernameErrorCode =
  | MobileUsernameErrorCode
  | "rateLimited"
  | "unauthorized"
  | "banned"
  | "unknown";

/** 辞書 `setupUsername.validation.*` のキー */
export type UsernameErrorMessageKey =
  | "tooShort"
  | "tooLong"
  | "invalidFormat"
  | "reserved"
  | "prohibited"
  | "taken"
  | "alreadySet"
  | "displayNameTooLong"
  | "displayNameProhibited"
  | "rateLimited"
  | "unauthorized"
  | "banned"
  | "error";

/**
 * ユーザー名登録の失敗を辞書 `setupUsername.validation.*` のキーに写す
 * ユーザー名登録エラー表示
 *
 * web とアプリの両方がこの 1 つの表を引く。プラットフォームごとに表を持つと、
 * 同じ失敗が別の文言になって静かに食い違う。
 */
export function usernameErrorMessageKey(
  error: UsernameErrorCode,
): UsernameErrorMessageKey {
  switch (error) {
    // username_required は前後の空白を除くと空。2 文字未満なので、直し方が伝わる tooShort に寄せる
    case "too_short":
    case "username_required":
      return "tooShort";
    case "too_long":
      return "tooLong";
    case "invalid_format":
      return "invalidFormat";
    case "reserved":
      return "reserved";
    case "prohibited":
      return "prohibited";
    case "username_taken":
      return "taken";
    case "username_already_set":
      return "alreadySet";
    case "display_name_too_long":
      return "displayNameTooLong";
    case "display_name_prohibited":
      return "displayNameProhibited";
    case "rateLimited":
      return "rateLimited";
    case "unauthorized":
      return "unauthorized";
    case "banned":
      return "banned";
    case "unknown":
      return "error";
    default: {
      const exhaustive: never = error;
      return exhaustive;
    }
  }
}
