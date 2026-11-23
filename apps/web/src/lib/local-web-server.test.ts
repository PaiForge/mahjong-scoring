import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readTomlValue } from "@/test/read-toml";

/*
 * 手元の web の dev サーバーの待ち受け先と、それを写した場所の食い違いを落とす。
 *
 * - ポートの正は `apps/web/package.json` の `dev`（`next dev -p <ポート>`）
 * - 開くオリジンの正は `supabase/config.toml` の `[auth] site_url`
 *   （`http://mahjong.localhost:<ポート>`）。同じ Mac で別プロダクトの dev も動かすため、
 *   ポートだけでなくホスト名も分けて cookie を混ぜない（`apps/web/README.md`「ローカルのポート」）
 *
 * ブロックを変えるときは、この 2 つを直してから落ちたテストが名指す写しを直す。
 * モバイル・リポジトリ直下のファイルはこのパッケージの外にあるので、
 * `apps/web/turbo.json` の `test` の `inputs` にも足してある。読むファイルを増やしたら揃える。
 */

const WEB_ROOT = resolve(__dirname, "../..");
const REPO_ROOT = resolve(WEB_ROOT, "../..");

function read(path: string): string {
  return readFileSync(resolve(REPO_ROOT, path), "utf8");
}

/** `next dev ... -p <ポート>` のポート */
function devPort(): number {
  const pkg: unknown = JSON.parse(read("apps/web/package.json"));
  const script =
    typeof pkg === "object" && pkg !== null && "scripts" in pkg
      ? (pkg.scripts as Record<string, string>).dev
      : undefined;
  const match = /\bnext dev\b.*\s-p\s+(\d+)\b/.exec(script ?? "");
  if (!match) {
    throw new Error(
      "apps/web/package.json の dev が `next dev ... -p <ポート>` の形でない",
    );
  }
  return Number(match[1]);
}

/** TOML の文字列の値（`"..."`）の中身 */
function unquote(value: string): string {
  const match = /^"(.*)"$/.exec(value);
  if (!match) throw new Error(`文字列ではない: ${value}`);
  return match[1];
}

describe("手元の web の dev サーバーの待ち受け先が揃っている", () => {
  const port = devPort();
  const toml = read("apps/web/supabase/config.toml");
  const siteUrl = unquote(readTomlValue(toml, "auth", "site_url"));

  it("config.toml の site_url が mahjong.localhost の dev のポートを指す", () => {
    expect(siteUrl).toBe(`http://mahjong.localhost:${port}`);
  });

  it("config.toml の additional_redirect_urls に site_url が入っている", () => {
    expect(readTomlValue(toml, "auth", "additional_redirect_urls")).toContain(
      `"${siteUrl}"`,
    );
  });

  it(".env.example の NEXT_PUBLIC_SITE_URL が site_url と同じ", () => {
    const value = /^NEXT_PUBLIC_SITE_URL=(.*)$/m.exec(
      read("apps/web/.env.example"),
    )?.[1];
    expect(value).toBe(siteUrl);
  });

  it("モバイルの LOCAL_WEB_PORT が dev のポートと同じ", () => {
    // テキストとして読む。import すると React Native まで引き込むため
    const match = /export const LOCAL_WEB_PORT = (\d+);/.exec(
      read("apps/mobile/src/lib/site-url.ts"),
    );
    expect(
      match,
      "apps/mobile/src/lib/site-url.ts が LOCAL_WEB_PORT を宣言していない",
    ).not.toBeNull();
    expect(Number(match?.[1])).toBe(port);
  });

  it("sim-release.sh の LOCAL_SITE_URL が dev のポートを指す", () => {
    const match = /^LOCAL_SITE_URL="http:\/\/localhost:(\d+)"$/m.exec(
      read("apps/mobile/scripts/sim-release.sh"),
    );
    expect(
      match,
      "apps/mobile/scripts/sim-release.sh が LOCAL_SITE_URL を宣言していない",
    ).not.toBeNull();
    expect(Number(match?.[1])).toBe(port);
  });

  it(".claude/launch.json の web が dev のポートと site_url で開く", () => {
    const launch = JSON.parse(read(".claude/launch.json")) as {
      configurations: { name: string; port?: number; url?: string }[];
    };
    const web = launch.configurations.find((c) => c.name === "web");
    expect(web).toMatchObject({ port, url: siteUrl });
  });

  it("クラウドセッションの APP_URL が dev のポートを指す", () => {
    const match = /^APP_URL="http:\/\/localhost:(\d+)"$/m.exec(
      read("scripts/claude-cloud/config.sh"),
    );
    expect(
      match,
      "scripts/claude-cloud/config.sh が APP_URL を宣言していない",
    ).not.toBeNull();
    expect(Number(match?.[1])).toBe(port);
  });
});
