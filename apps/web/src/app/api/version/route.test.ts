// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/_lib/app-version", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/_lib/app-version")>()),
  APP_BUILD_ID: "dpl_123",
}));

import { GET } from "./route";

describe("GET /api/version", () => {
  it("配信中のビルド ID を返し、どこにもキャッシュさせない", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ buildId: "dpl_123" });
  });
});
