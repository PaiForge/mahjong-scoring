import { messages } from "@mahjong-scoring/messages/ja";
import { describe, it, expect } from "vitest";
import {
  getPasswordValidationError,
  isPasswordValidationErrorKey,
  parsePasswordActionError,
  PASSWORD_VALIDATION_ERROR_KEYS,
  validatePasswordPair,
} from "./password";

describe("getPasswordValidationError", () => {
  it('returns "tooShort" for a password shorter than MIN_PASSWORD_LENGTH', () => {
    expect(getPasswordValidationError("Abc1")).toBe("tooShort");
  });

  it('returns "tooShort" for an empty string', () => {
    expect(getPasswordValidationError("")).toBe("tooShort");
  });

  it('returns "missingLetter" for a password with only digits', () => {
    expect(getPasswordValidationError("123456")).toBe("missingLetter");
  });

  it('returns "missingDigit" for a password with only letters', () => {
    expect(getPasswordValidationError("abcdef")).toBe("missingDigit");
  });

  it("returns undefined for a valid password", () => {
    expect(getPasswordValidationError("abcde1")).toBeUndefined();
  });

  it("returns undefined for a password with uppercase and digits", () => {
    expect(getPasswordValidationError("Abcde1")).toBeUndefined();
  });

  it('returns "tooShort" for a string of only spaces shorter than min length', () => {
    expect(getPasswordValidationError("     ")).toBe("tooShort");
  });

  it('returns "missingDigit" for spaces that are long enough but have no digit', () => {
    // 6 spaces + a letter = 7 chars, has letter, no digit
    expect(getPasswordValidationError("      a")).toBe("missingDigit");
  });

  it('returns "missingLetter" for spaces that are long enough but have no letter', () => {
    expect(getPasswordValidationError("      1")).toBe("missingLetter");
  });

  it("returns undefined for a valid password with unicode characters", () => {
    // Unicode letters don't match [a-zA-Z], so we need at least one ASCII letter
    expect(getPasswordValidationError("あいうえおabc1")).toBeUndefined();
  });

  it('returns "missingLetter" when only unicode letters are present (no ASCII)', () => {
    expect(getPasswordValidationError("あいうえおかきく1")).toBe(
      "missingLetter",
    );
  });

  it("validates the boundary: exactly 6 characters with letter and digit", () => {
    expect(getPasswordValidationError("abcde1")).toBeUndefined();
  });

  it("validates the boundary: exactly 5 characters is too short", () => {
    expect(getPasswordValidationError("abcd1")).toBe("tooShort");
  });
});

describe("isPasswordValidationErrorKey", () => {
  it.each(["tooShort", "missingLetter", "missingDigit", "weak"] as const)(
    'returns true for "%s"',
    (key) => {
      expect(isPasswordValidationErrorKey(key)).toBe(true);
    },
  );

  it("returns false for an empty string", () => {
    expect(isPasswordValidationErrorKey("")).toBe(false);
  });

  it("returns false for an arbitrary string", () => {
    expect(isPasswordValidationErrorKey("invalidKey")).toBe(false);
  });

  it("returns false for a similar but wrong key", () => {
    expect(isPasswordValidationErrorKey("too_short")).toBe(false);
  });

  it("returns false for a key with wrong casing", () => {
    expect(isPasswordValidationErrorKey("TooShort")).toBe(false);
  });
});

describe("PASSWORD_VALIDATION_ERROR_KEYS", () => {
  // 呼び出し側は invalid のキーを validation.password の名前空間で翻訳する
  it.each(PASSWORD_VALIDATION_ERROR_KEYS)(
    "%s は validation.password の辞書にある",
    (key) => {
      expect(messages.validation.password[key]).toEqual(expect.any(String));
    },
  );
});

describe("validatePasswordPair", () => {
  it("確認用と一致し形式も満たせば問題なし", () => {
    expect(validatePasswordPair("abcde1", "abcde1")).toBeUndefined();
  });

  it("確認用と食い違えば、形式を満たしていても mismatch", () => {
    expect(validatePasswordPair("abcde1", "abcde2")).toEqual({
      type: "mismatch",
    });
  });

  it("確認用と食い違えば、形式の誤りより先に mismatch を返す", () => {
    expect(validatePasswordPair("abc", "abd")).toEqual({ type: "mismatch" });
  });

  it("一致していても形式を満たさなければ invalid と翻訳キーを返す", () => {
    expect(validatePasswordPair("abcdef", "abcdef")).toEqual({
      type: "invalid",
      key: "missingDigit",
    });
  });
});

describe("parsePasswordActionError", () => {
  it("password: の後ろのキーを取り出す", () => {
    expect(parsePasswordActionError("password:tooShort")).toBe("tooShort");
    expect(parsePasswordActionError("password:weak")).toBe("weak");
  });

  it("password: で始まらないエラーは undefined", () => {
    expect(parsePasswordActionError("tooShort")).toBeUndefined();
    expect(parsePasswordActionError("email:tooShort")).toBeUndefined();
    // 接頭辞が同じ長さの別の欄のエラーを、パスワードの誤りと取り違えない
    expect(parsePasswordActionError("username:tooShort")).toBeUndefined();
  });

  it("password: が先頭でなく後ろにあるエラーは undefined", () => {
    expect(parsePasswordActionError("tooShort:password:")).toBeUndefined();
  });

  it("password: の後ろが知らないキーなら undefined", () => {
    expect(parsePasswordActionError("password:unknown")).toBeUndefined();
    expect(parsePasswordActionError("password:")).toBeUndefined();
  });
});
