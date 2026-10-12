import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { MOBILE_USERNAME_ERROR_CODES } from "./mobile-api";
import type {
  UsernameErrorCode,
  UsernameErrorMessageKey,
} from "./username-error-message";
import { usernameErrorMessageKey } from "./username-error-message";

type MessageCase = readonly [UsernameErrorCode, UsernameErrorMessageKey];

describe("usernameErrorMessageKey", () => {
  const cases: readonly MessageCase[] = [
    ["too_short", "tooShort"],
    ["username_required", "tooShort"],
    ["too_long", "tooLong"],
    ["invalid_format", "invalidFormat"],
    ["reserved", "reserved"],
    ["prohibited", "prohibited"],
    ["username_taken", "taken"],
    ["username_already_set", "alreadySet"],
    ["display_name_too_long", "displayNameTooLong"],
    ["display_name_prohibited", "displayNameProhibited"],
    ["rateLimited", "rateLimited"],
    ["unauthorized", "unauthorized"],
    ["banned", "banned"],
    ["unknown", "error"],
  ];

  it.each(cases)("%s を %s に写す", (error, expected) => {
    expect(usernameErrorMessageKey(error)).toBe(expected);
  });

  it.each([...MOBILE_USERNAME_ERROR_CODES, "unknown" as const])(
    "%s の写し先が辞書にある",
    (error) => {
      expect(
        messages.setupUsername.validation[usernameErrorMessageKey(error)],
      ).toEqual(expect.any(String));
    },
  );
});
