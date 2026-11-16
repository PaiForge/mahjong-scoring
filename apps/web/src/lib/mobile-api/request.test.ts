import { describe, expect, it, vi } from "vitest";

import { readMobileJson } from "./request";

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.test", { method: "POST", body, headers });
}

describe("readMobileJson", () => {
  it("長さの申告が無い・過少でも上限超過で受信をキャンセルし、終端を待たない", async () => {
    for (const headers of [
      new Headers(),
      new Headers({ "content-length": "1" }),
    ]) {
      const cancel = vi.fn(() => new Promise<void>(() => {}));
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(4097));
          // close しない。全量を読もうとすると終わらない。
        },
        cancel,
      });
      const request = new Request("https://example.test", {
        method: "POST",
        body: stream,
        headers,
        ...{ duplex: "half" },
      });
      expect(await readMobileJson(request, 4096)).toBeUndefined();
      expect(cancel).toHaveBeenCalledOnce();
    }
  });

  it("UTF-8 の文字がチャンクを跨いでも、上限ちょうどなら読める", async () => {
    const bytes = new TextEncoder().encode('"あ"');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 2));
        controller.enqueue(bytes.slice(2));
        controller.close();
      },
    });
    const request = new Request("https://example.test", {
      method: "POST",
      body: stream,
      ...{ duplex: "half" },
    });
    expect(await readMobileJson(request, bytes.length)).toBe("あ");
  });

  it("受信中のエラーも不正な本文として扱う", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("disconnected"));
      },
    });
    const request = new Request("https://example.test", {
      method: "POST",
      body: stream,
      ...{ duplex: "half" },
    });
    expect(await readMobileJson(request, 4096)).toBeUndefined();
  });

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
