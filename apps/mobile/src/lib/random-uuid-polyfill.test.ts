import { describe, expect, it } from "vitest";

import { installRandomUUID, type CryptoHost } from "./random-uuid-polyfill";

const fakeUUID = () => "00000000-0000-4000-8000-000000000000";

describe("installRandomUUID", () => {
  it("crypto が無ければ randomUUID を持つ crypto を置く（Hermes）", () => {
    const host: CryptoHost = {};
    installRandomUUID(host, fakeUUID);
    expect(host.crypto?.randomUUID?.()).toBe(fakeUUID());
  });

  it("crypto はあって randomUUID だけ無ければ足し、他のメソッドを残す", () => {
    const getRandomValues = <T>(array: T) => array;
    const existing: {
      getRandomValues: typeof getRandomValues;
      randomUUID?: () => string;
    } = { getRandomValues };
    const host: CryptoHost = { crypto: existing };
    installRandomUUID(host, fakeUUID);
    expect(host.crypto?.randomUUID?.()).toBe(fakeUUID());
    expect(existing.getRandomValues).toBe(getRandomValues);
    expect(host.crypto).toBe(existing);
  });

  it("randomUUID が既にあれば差し替えない（ブラウザ）", () => {
    const native = () => "11111111-1111-4111-8111-111111111111";
    const host: CryptoHost = { crypto: { randomUUID: native } };
    installRandomUUID(host, fakeUUID);
    expect(host.crypto?.randomUUID).toBe(native);
  });
});
