import { describe, expect, it } from "vitest";

import { jsonPrivate } from "./api-response";

describe("jsonPrivate", () => {
  it("共有キャッシュに乗らないヘッダを付ける", async () => {
    const response = jsonPrivate({ ok: true });

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("ステータスコードを指定できる", () => {
    const response = jsonPrivate({ error: "unknown" }, { status: 500 });

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("呼び出し側のヘッダがあっても Cache-Control は上書きする", () => {
    // 付け忘れではなく「別の値を渡した」ときも共有キャッシュに乗せない
    const response = jsonPrivate(
      { ok: true },
      { headers: { "Cache-Control": "public, max-age=60", "X-Test": "1" } },
    );

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Test")).toBe("1");
  });
});
