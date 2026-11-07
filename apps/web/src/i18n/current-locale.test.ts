import { beforeEach, describe, expect, it, vi } from "vitest";

const getLocale = vi.fn<() => Promise<string>>();
vi.mock("next-intl/server", () => ({ getLocale: () => getLocale() }));

import { currentLocale } from "./current-locale";

describe("currentLocale", () => {
  beforeEach(() => {
    getLocale.mockReset();
  });

  it("対応言語はそのまま返す", async () => {
    getLocale.mockResolvedValue("en");
    await expect(currentLocale()).resolves.toBe("en");
    getLocale.mockResolvedValue("ja");
    await expect(currentLocale()).resolves.toBe("ja");
  });

  it("未対応の値は既定の言語（日本語）にする", async () => {
    getLocale.mockResolvedValue("fr");
    await expect(currentLocale()).resolves.toBe("ja");
  });
});
