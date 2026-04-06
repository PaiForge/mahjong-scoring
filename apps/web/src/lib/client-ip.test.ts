import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { getClientIp } from "./client-ip";
import { headers } from "next/headers";

const mockHeaders = headers as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? "1.2.3.4" : null,
    });
    expect(await getClientIp()).toBe("1.2.3.4");
  });

  it("returns the first IP when multiple IPs are comma-separated", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? "1.2.3.4, 5.6.7.8, 9.10.11.12" : null,
    });
    expect(await getClientIp()).toBe("1.2.3.4");
  });

  it("trims whitespace from the IP", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? "  1.2.3.4  , 5.6.7.8" : null,
    });
    expect(await getClientIp()).toBe("1.2.3.4");
  });

  it("returns undefined when x-forwarded-for header is missing", async () => {
    mockHeaders.mockResolvedValue({
      get: () => null,
    });
    expect(await getClientIp()).toBeUndefined();
  });

  it("returns undefined when x-forwarded-for header is an empty string", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? "" : null,
    });
    expect(await getClientIp()).toBeUndefined();
  });

  it("returns undefined when the first entry is empty after splitting", async () => {
    mockHeaders.mockResolvedValue({
      get: (name: string) =>
        name === "x-forwarded-for" ? " , 5.6.7.8" : null,
    });
    expect(await getClientIp()).toBeUndefined();
  });
});
