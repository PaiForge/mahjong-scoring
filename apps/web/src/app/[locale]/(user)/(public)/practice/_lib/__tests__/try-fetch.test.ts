import { describe, it, expect, beforeEach, vi } from "vitest";
import { tryFetch } from "../try-fetch";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("tryFetch", () => {
  it("取得できた値を ok として返す", async () => {
    const result = await tryFetch("tag", "what", () => Promise.resolve(42));

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("値が undefined でも取得に成功していれば ok として返す", async () => {
    const result = await tryFetch("tag", "what", () =>
      Promise.resolve(undefined),
    );

    // 「訊いた結果、無かった」と「訊けなかった」を分けるのがこの型の役目
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("例外は失敗として返し、上へは投げない", async () => {
    const result = await tryFetch("tag", "what", () =>
      Promise.reject(new Error("boom")),
    );

    expect(result).toEqual({ ok: false });
  });

  it("失敗をタグと説明つきで記録する", async () => {
    await tryFetch("resultPage", "failed to fetch exp info", () =>
      Promise.reject(new Error("boom")),
    );

    expect(console.error).toHaveBeenCalledWith(
      "[resultPage] failed to fetch exp info:",
      "boom",
    );
  });
});
