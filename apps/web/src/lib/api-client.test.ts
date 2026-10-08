import { afterEach, describe, expect, it, vi } from "vitest";

import { API_ERROR_NETWORK, API_ERROR_UNKNOWN, callApi } from "./api-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("callApi", () => {
  it("成功したら本文を返す", async () => {
    stubFetch(async () => Response.json({ value: 1 }));

    expect(await callApi("/api/x")).toEqual({ ok: true, data: { value: 1 } });
  });

  it("本文の無い成功は data を undefined にする", async () => {
    stubFetch(async () => new Response(null, { status: 204 }));

    expect(await callApi("/api/x")).toEqual({ ok: true, data: undefined });
  });

  it("失敗したら本文のエラーコードを返す", async () => {
    stubFetch(async () =>
      Response.json({ error: "rateLimited" }, { status: 429 }),
    );

    expect(await callApi("/api/x")).toEqual({
      ok: false,
      error: "rateLimited",
    });
  });

  it("失敗の本文にエラーコードが無ければ unknown", async () => {
    stubFetch(async () => new Response("oops", { status: 500 }));

    expect(await callApi("/api/x")).toEqual({
      ok: false,
      error: API_ERROR_UNKNOWN,
    });
  });

  it("サーバーに届かなければ network（unknown と分ける）", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(await callApi("/api/x")).toEqual({
      ok: false,
      error: API_ERROR_NETWORK,
    });
  });
});
