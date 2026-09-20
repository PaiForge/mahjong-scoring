import { describe, expect, it } from "vitest";

import { CONTACT_LIMITS, parseContactForm } from "./contact";

const base = {
  name: "Alice",
  email: "alice@example.com",
  subject: "Hello",
  message: "This is a message that is at least ten chars long.",
};

describe("parseContactForm", () => {
  it("正しい入力を受け付け、検証済みの値を返す", () => {
    expect(parseContactForm(base)).toEqual({ ok: true, value: base });
  });

  it("オブジェクトでない入力は invalidInput", () => {
    expect(parseContactForm(undefined)).toEqual({
      ok: false,
      error: "invalidInput",
    });
    expect(parseContactForm("text")).toEqual({
      ok: false,
      error: "invalidInput",
    });
  });

  describe("name", () => {
    it("上限ちょうどは通り、1 文字超えると nameMaxLength", () => {
      expect(
        parseContactForm({ ...base, name: "a".repeat(CONTACT_LIMITS.name) }).ok,
      ).toBe(true);
      expect(
        parseContactForm({
          ...base,
          name: "a".repeat(CONTACT_LIMITS.name + 1),
        }),
      ).toEqual({ ok: false, error: "nameMaxLength" });
    });

    it("空は nameRequired、改行入りは nameInvalid", () => {
      expect(parseContactForm({ ...base, name: "" })).toEqual({
        ok: false,
        error: "nameRequired",
      });
      expect(parseContactForm({ ...base, name: "Ali\nce" })).toEqual({
        ok: false,
        error: "nameInvalid",
      });
    });
  });

  describe("subject", () => {
    it("上限ちょうどは通り、1 文字超えると subjectMaxLength", () => {
      expect(
        parseContactForm({
          ...base,
          subject: "s".repeat(CONTACT_LIMITS.subject),
        }).ok,
      ).toBe(true);
      expect(
        parseContactForm({
          ...base,
          subject: "s".repeat(CONTACT_LIMITS.subject + 1),
        }),
      ).toEqual({ ok: false, error: "subjectMaxLength" });
    });

    it.each([
      ["LF", "Hello\nBcc: attacker@example.com"],
      ["CR", "Hello\rBcc: attacker@example.com"],
    ])("%s を含む件名を拒む（ヘッダ注入対策）", (_, subject) => {
      expect(parseContactForm({ ...base, subject })).toEqual({
        ok: false,
        error: "subjectInvalid",
      });
    });
  });

  describe("message", () => {
    it("下限未満は messageMinLength、上限超えは messageMaxLength", () => {
      expect(
        parseContactForm({
          ...base,
          message: "m".repeat(CONTACT_LIMITS.messageMin - 1),
        }),
      ).toEqual({ ok: false, error: "messageMinLength" });
      expect(
        parseContactForm({
          ...base,
          message: "m".repeat(CONTACT_LIMITS.message + 1),
        }),
      ).toEqual({ ok: false, error: "messageMaxLength" });
    });

    it("本文の改行は許す", () => {
      expect(
        parseContactForm({
          ...base,
          message: "line one\nline two, at least ten characters",
        }).ok,
      ).toBe(true);
    });
  });

  describe("email", () => {
    it("形式が不正なら emailInvalid", () => {
      expect(parseContactForm({ ...base, email: "not-an-email" })).toEqual({
        ok: false,
        error: "emailInvalid",
      });
      expect(parseContactForm({ ...base, email: "" })).toEqual({
        ok: false,
        error: "emailInvalid",
      });
    });
  });
});
