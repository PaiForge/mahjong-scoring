import { describe, expect, it } from "vitest";

import { readMobileJson } from "./request";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test", { method: "POST", body, headers });
}

describe("readMobileJson", () => {
  it("上限以内の JSON を読む", async () => {
    expect(await readMobileJson(post('{"a":1}'), 100)).toEqual({ a: 1 });
  });

  it("実際の長さが上限を超えたら読まない", async () => {
    expect(await readMobileJson(post(`"${"x".repeat(200)}"`), 100)).toBe(
      undefined,
    );
  });

  it("マルチバイト文字はバイト数で数える", async () => {
    expect(await readMobileJson(post(`"${"あ".repeat(40)}"`), 100)).toBe(
      undefined,
    );
  });

  it("JSON でなければ undefined", async () => {
    expect(await readMobileJson(post("{"), 100)).toBe(undefined);
  });
});
