import { describe, expect, it } from "vitest";

import type { RegisterUsernameError } from "../../_actions/register-username";
import { usernameValidationMessageKey } from "../username-validation-message";

type MessageCase = readonly [RegisterUsernameError | "unknown", string];

describe("usernameValidationMessageKey", () => {
  const cases: readonly MessageCase[] = [
    ["too_short", "validation.tooShort"],
    ["too_long", "validation.tooLong"],
    ["invalid_format", "validation.invalidFormat"],
    ["reserved", "validation.reserved"],
    ["username_taken", "validation.taken"],
    ["username_already_set", "validation.alreadySet"],
    ["rateLimited", "validation.rateLimited"],
    ["unauthorized", "validation.unauthorized"],
    ["banned", "validation.banned"],
    ["username_required", "validation.error"],
    ["unknown", "validation.error"],
  ];

  it.each(cases)("%s を %s に変換する", (error, expected) => {
    expect(usernameValidationMessageKey(error)).toBe(expected);
  });
});
