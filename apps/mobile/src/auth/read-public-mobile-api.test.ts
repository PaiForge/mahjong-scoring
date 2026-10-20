import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/app-site-url", () => ({ SITE_URL: "https://example.test" }));

import { readPublicMobileApi } from "./read-public-mobile-api";

const fetchMock = vi.fn();
const parse = (body: unknown) =>
  typeof body === "object" && body !== null && "ok" in body
    ? { ok: true }
    : undefined;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("readPublicMobileApi", () => {
  it("サイトの URL に続けて送り、成功の本文が契約の形なら値", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    expect(await readPublicMobileApi("/api/x", parse)).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/x",
      undefined,
    );
  });

  it("失敗の応答・契約と違う形・通信の失敗は undefined", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    expect(await readPublicMobileApi("/api/x", parse)).toBeUndefined();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ other: 1 }), { status: 200 }),
    );
    expect(await readPublicMobileApi("/api/x", parse)).toBeUndefined();
    fetchMock.mockRejectedValue(new TypeError("network"));
    expect(await readPublicMobileApi("/api/x", parse)).toBeUndefined();
  });

  it("fetch の指定（中断の signal 等）をそのまま渡す", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const controller = new AbortController();
    await readPublicMobileApi("/api/x", parse, { signal: controller.signal });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/x", {
      signal: controller.signal,
    });
  });
});
