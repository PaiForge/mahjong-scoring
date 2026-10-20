// @vitest-environment node
import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  decodeAnonymousQuotaCookie,
  encodeAnonymousQuotaCookie,
} from "../anonymous-quota-codec";

const KEY = Buffer.from("0123456789abcdef0123456789abcdef");
const OTHER_KEY = Buffer.from("fedcba9876543210fedcba9876543210");
const NOW = new Date("2026-10-01T03:00:00Z"); // JST 12:00
const ZERO = { "agari-score": 0, "tenpai-score": 0 };

/** 署名はそのままに JSON の部分だけ差し替える */
function withPayload(encoded: string, payload: unknown): string {
  const [version, , signature] = encoded.split(".");
  const tampered = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${version}.${tampered}.${signature}`;
}

/** 署名も付け直して（鍵を知っている前提で）JSON の部分を差し替える */
function reencode(payload: unknown, key: Buffer): string {
  const base = encodeAnonymousQuotaCookie(ZERO, NOW, key);
  const [version] = base.split(".");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  // 署名は本物の鍵で作り直す。encode が内部で使う署名と同じ手順
  const signature = createHmac("sha256", key)
    .update(encoded)
    .digest("base64url");
  return `${version}.${encoded}.${signature}`;
}

describe("encodeAnonymousQuotaCookie / decodeAnonymousQuotaCookie", () => {
  it("符号化した回数を同じ日・同じ鍵で読み戻せる", () => {
    const counts = { "agari-score": 2, "tenpai-score": 1 };
    const value = encodeAnonymousQuotaCookie(counts, NOW, KEY);
    expect(decodeAnonymousQuotaCookie(value, NOW, KEY)).toEqual(counts);
  });

  it("値の形は v1.<payload>.<signature>", () => {
    const value = encodeAnonymousQuotaCookie(ZERO, NOW, KEY);
    const parts = value.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("v1");
  });

  it("cookie が無ければ 0", () => {
    expect(decodeAnonymousQuotaCookie(undefined, NOW, KEY)).toEqual(ZERO);
    expect(decodeAnonymousQuotaCookie("", NOW, KEY)).toEqual(ZERO);
  });

  it("日付が変わると 0 に戻る", () => {
    const value = encodeAnonymousQuotaCookie(
      { "agari-score": 1, "tenpai-score": 1 },
      NOW,
      KEY,
    );
    const nextDay = new Date("2026-10-01T16:00:00Z"); // JST 翌 1:00
    expect(decodeAnonymousQuotaCookie(value, nextDay, KEY)).toEqual(ZERO);
  });

  it("署名が合わない（改ざんされた）値は 0 として扱う", () => {
    const value = encodeAnonymousQuotaCookie(
      { "agari-score": 1, "tenpai-score": 0 },
      NOW,
      KEY,
    );
    const tampered = withPayload(value, {
      day: "2026-10-01",
      counts: { "agari-score": 0 },
    });
    expect(decodeAnonymousQuotaCookie(tampered, NOW, KEY)).toEqual(ZERO);
  });

  it("別の鍵で署名した値は読めない", () => {
    const value = encodeAnonymousQuotaCookie(
      { "agari-score": 1, "tenpai-score": 0 },
      NOW,
      OTHER_KEY,
    );
    expect(decodeAnonymousQuotaCookie(value, NOW, KEY)).toEqual(ZERO);
  });

  it("形式が違う値（別バージョン・壊れた値）は 0 として扱う", () => {
    expect(decodeAnonymousQuotaCookie("v0.abc.def", NOW, KEY)).toEqual(ZERO);
    expect(decodeAnonymousQuotaCookie("garbage", NOW, KEY)).toEqual(ZERO);
    expect(decodeAnonymousQuotaCookie("v1..", NOW, KEY)).toEqual(ZERO);
  });

  it("署名は合っていても JSON の形が違えば 0", () => {
    expect(decodeAnonymousQuotaCookie(reencode([], KEY), NOW, KEY)).toEqual(
      ZERO,
    );
    expect(
      decodeAnonymousQuotaCookie(
        reencode({ day: "2026-10-01", counts: { "agari-score": -1 } }, KEY),
        NOW,
        KEY,
      ),
    ).toEqual(ZERO);
    expect(
      decodeAnonymousQuotaCookie(
        reencode({ day: "2026-10-01", counts: { "agari-score": 1.5 } }, KEY),
        NOW,
        KEY,
      ),
    ).toEqual(ZERO);
  });

  it("知らない練習の回数は捨て、無い練習は 0 で埋める", () => {
    expect(
      decodeAnonymousQuotaCookie(
        reencode(
          { day: "2026-10-01", counts: { "agari-score": 3, bogus: 9 } },
          KEY,
        ),
        NOW,
        KEY,
      ),
    ).toEqual({ "agari-score": 3, "tenpai-score": 0 });
  });
});
