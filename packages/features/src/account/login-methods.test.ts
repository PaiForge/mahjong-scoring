import { describe, expect, it } from "vitest";

import {
  evaluateIdentityRemoval,
  hasWebLoginMethod,
  isApplePrivateRelayEmail,
  type LinkedIdentity,
} from "./login-methods";

const email: LinkedIdentity = {
  id: "id-email",
  provider: "email",
  email: "me@example.com",
};
const googleA: LinkedIdentity = {
  id: "id-google-a",
  provider: "google",
  email: "a@gmail.com",
};
const googleB: LinkedIdentity = {
  id: "id-google-b",
  provider: "google",
  email: "b@gmail.com",
};
const apple: LinkedIdentity = {
  id: "id-apple",
  provider: "apple",
  email: "x@privaterelay.appleid.com",
};

describe("evaluateIdentityRemoval", () => {
  it("無い連携は外せない", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA], hasPassword: true },
        "id-missing",
      ),
    ).toEqual({ allowed: false, reason: "notLinked" });
  });

  it("メールアドレスの連携は外す対象ではない", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [email, googleA], hasPassword: true },
        email.id,
      ),
    ).toEqual({ allowed: false, reason: "notRemovable" });
  });

  it("パスワードがあれば唯一の Google を外せる", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA], hasPassword: true },
        googleA.id,
      ),
    ).toEqual({ allowed: true, identity: googleA });
  });

  it("パスワードが無くても別の Google が残れば外せる（付け替え）", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA, googleB], hasPassword: false },
        googleA.id,
      ),
    ).toEqual({ allowed: true, identity: googleA });
  });

  it("パスワードが無く唯一の Google を外すと web の手段が無くなるので断る", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA], hasPassword: false },
        googleA.id,
      ),
    ).toEqual({ allowed: false, reason: "lastWebMethod" });
  });

  it("Apple が残っても web の手段には数えない", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA, apple], hasPassword: false },
        googleA.id,
      ),
    ).toEqual({ allowed: false, reason: "lastWebMethod" });
  });

  it("メールアドレスの連携だけが残ってもパスワードが無ければ断る", () => {
    // メールアドレスの変更を終えた Google の人には、パスワードの無い
    // email の連携ができている。認証サーバーは連携が 2 つあるので外させるが、
    // 外すとどこからもログインできない
    expect(
      evaluateIdentityRemoval(
        { identities: [email, googleA], hasPassword: false },
        googleA.id,
      ),
    ).toEqual({ allowed: false, reason: "lastWebMethod" });
  });

  it("Google が残れば Apple を外せる", () => {
    expect(
      evaluateIdentityRemoval(
        { identities: [googleA, apple], hasPassword: false },
        apple.id,
      ),
    ).toEqual({ allowed: true, identity: apple });
  });
});

describe("hasWebLoginMethod", () => {
  it("パスワードか Google があれば true", () => {
    expect(hasWebLoginMethod({ identities: [], hasPassword: true })).toBe(true);
    expect(
      hasWebLoginMethod({ identities: [googleA], hasPassword: false }),
    ).toBe(true);
  });

  it("Apple だけ・email の連携だけでは false", () => {
    expect(hasWebLoginMethod({ identities: [apple], hasPassword: false })).toBe(
      false,
    );
    expect(hasWebLoginMethod({ identities: [email], hasPassword: false })).toBe(
      false,
    );
  });
});

describe("isApplePrivateRelayEmail", () => {
  it("中継アドレスのドメインを大文字小文字を問わず見分ける", () => {
    expect(isApplePrivateRelayEmail("abc123@privaterelay.appleid.com")).toBe(
      true,
    );
    expect(isApplePrivateRelayEmail("abc123@PrivateRelay.AppleID.com")).toBe(
      true,
    );
  });

  it("それ以外のアドレスと未設定は false", () => {
    expect(isApplePrivateRelayEmail("me@icloud.com")).toBe(false);
    expect(isApplePrivateRelayEmail("privaterelay.appleid.com")).toBe(false);
    expect(isApplePrivateRelayEmail(undefined)).toBe(false);
  });
});
