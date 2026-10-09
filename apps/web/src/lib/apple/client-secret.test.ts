import { generateKeyPairSync, verify } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createAppleClientSecret } from "./client-secret";

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
});

function decodePart(part: string | undefined): unknown {
  return JSON.parse(Buffer.from(part ?? "", "base64url").toString("utf8"));
}

describe("createAppleClientSecret", () => {
  const now = Date.UTC(2026, 9, 9, 0, 0, 0);
  const secret = createAppleClientSecret({
    teamId: "TEAM123456",
    keyId: "KEY1234567",
    privateKey: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    clientId: "help.mahjong.score",
    now,
  });
  const [header, payload, signature] = secret.split(".");

  it("Apple が求めるヘッダと本体を持つ", () => {
    expect(decodePart(header)).toEqual({ alg: "ES256", kid: "KEY1234567" });
    expect(decodePart(payload)).toEqual({
      iss: "TEAM123456",
      iat: now / 1000,
      exp: now / 1000 + 300,
      aud: "https://appleid.apple.com",
      sub: "help.mahjong.score",
    });
  });

  it("鍵で ES256（r || s の 64 バイト）の署名をする", () => {
    const signatureBytes = Buffer.from(signature ?? "", "base64url");
    expect(signatureBytes).toHaveLength(64);
    expect(
      verify(
        "sha256",
        Buffer.from(`${header}.${payload}`),
        { key: publicKey, dsaEncoding: "ieee-p1363" },
        signatureBytes,
      ),
    ).toBe(true);
  });
});
