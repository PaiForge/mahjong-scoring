import { describe, expect, it, vi } from "vitest";

// next.config.ts は `withNextIntl` で包まれている。プラグインは設定を返す
// だけなので素通しにし、Next のビルド環境なしで設定を読む
vi.mock("next-intl/plugin", () => ({
  default: () => (config: unknown) => config,
}));

const { default: nextConfig } = await import("../../next.config");

interface RedirectRule {
  readonly source: string;
  readonly destination: string;
  readonly permanent: boolean;
}

async function getRules(): Promise<readonly RedirectRule[]> {
  const redirects = nextConfig.redirects;
  if (!redirects) throw new Error("next.config に redirects() が無い");
  return redirects() as Promise<RedirectRule[]>;
}

describe("next.config の redirects — 段級位一覧の道場への吸収（2026-10）", () => {
  it("/dojo/ranks は /dojo へ恒久リダイレクトする", async () => {
    const rules = await getRules();
    const rule = rules.find((entry) => entry.source === "/dojo/ranks");

    expect(rule?.destination).toBe("/dojo");
    expect(rule?.permanent).toBe(true);
  });

  it("級の詳細（/dojo/ranks/<slug>）は巻き込まない", async () => {
    const rules = await getRules();

    expect(rules.some((entry) => entry.source.startsWith("/dojo/ranks/"))).toBe(
      false,
    );
  });
});
