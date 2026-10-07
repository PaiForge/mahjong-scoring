// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** `cookies()` の最小スタブ。set の引数も残す */
const jar = new Map<string, string>();
const setCalls: { name: string; value: string; options: unknown }[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string, options: unknown) => {
      jar.set(name, value);
      setCalls.push({ name, value, options });
    },
  }),
}));

const NOW = new Date("2026-10-01T03:00:00Z"); // JST 12:00
const COOKIE = "mj_quota";

async function loadModule() {
  vi.resetModules();
  return await import("../anonymous-quota-cookie");
}

beforeEach(() => {
  jar.clear();
  setCalls.length = 0;
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-for-tests");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("writeAnonymousQuota / readAnonymousQuota", () => {
  it("書いた回数を同じ日に読み戻せる", async () => {
    const mod = await loadModule();
    await mod.writeAnonymousQuota({ score: 1, "tenpai-score": 0 }, NOW);

    expect(await mod.readAnonymousQuota(NOW)).toEqual({
      score: 1,
      "tenpai-score": 0,
    });
  });

  it("cookie は httpOnly・lax・path=/ で、期限は JST の翌日 0 時", async () => {
    const mod = await loadModule();
    await mod.writeAnonymousQuota({ score: 1, "tenpai-score": 0 }, NOW);

    expect(setCalls[0]?.name).toBe(COOKIE);
    expect(setCalls[0]?.options).toEqual(
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date("2026-10-01T15:00:00Z"),
      }),
    );
  });

  it("日付が変わると 0 に戻る", async () => {
    const mod = await loadModule();
    await mod.writeAnonymousQuota({ score: 1, "tenpai-score": 1 }, NOW);

    const nextDay = new Date("2026-10-01T16:00:00Z"); // JST 翌 1:00
    expect(await mod.readAnonymousQuota(nextDay)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
  });

  it("署名が合わない（改ざんされた）cookie は 0 として扱う", async () => {
    const mod = await loadModule();
    await mod.writeAnonymousQuota({ score: 1, "tenpai-score": 0 }, NOW);

    const [version, payload, signature] = jar.get(COOKIE)!.split(".");
    const tampered = Buffer.from(
      JSON.stringify({ day: "2026-10-01", counts: { score: 0 } }),
    ).toString("base64url");
    jar.set(COOKIE, `${version}.${tampered}.${signature}`);

    expect(await mod.readAnonymousQuota(NOW)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
    expect(payload).not.toBe(tampered);
  });

  it("形式が違う cookie（別バージョン・壊れた値）は 0 として扱う", async () => {
    const mod = await loadModule();
    jar.set(COOKIE, "v0.abc.def");
    expect(await mod.readAnonymousQuota(NOW)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
    jar.set(COOKIE, "garbage");
    expect(await mod.readAnonymousQuota(NOW)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
  });

  it("別の鍵で署名した cookie は読めない", async () => {
    const first = await loadModule();
    await first.writeAnonymousQuota({ score: 1, "tenpai-score": 0 }, NOW);

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "another-key");
    const second = await loadModule();
    expect(await second.readAnonymousQuota(NOW)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
  });
});

describe("署名鍵が無いとき", () => {
  it("canSignAnonymousQuota は false、書き込みは何もしない", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const mod = await loadModule();

    expect(mod.canSignAnonymousQuota()).toBe(false);
    await mod.writeAnonymousQuota({ score: 1, "tenpai-score": 0 }, NOW);
    expect(setCalls).toHaveLength(0);
    expect(await mod.readAnonymousQuota(NOW)).toEqual({
      score: 0,
      "tenpai-score": 0,
    });
  });
});
