import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LOCAL_SUPABASE_API_PORT,
  LOCAL_SUPABASE_DB_PORT,
} from "./local-supabase";

/*
 * 手元のスタックのポートは `supabase/config.toml` で決まり、TOML を読めないコードに
 * 写してある（`./local-supabase.ts` の TSDoc）。写しがずれたらここで落とすので、
 * ポートを動かす作業は「`config.toml` と、落ちたテストが名指す定数を直す」で済み、
 * リポジトリ全体を grep して回らなくてよい。
 *
 * TOML はパーサーを使わず、セクションを見分ける走査で読む。要るのは整数のキー 2 つだけで、
 * 依存に TOML パーサーが無いため。
 *
 * モバイルのファイルはこのパッケージの外にあり、turbo はそれだけが変わっても
 * このテストを回し直さない。`apps/web/turbo.json` の `test` の `inputs` に足してあるので、
 * 読むファイルを増やしたら両方を揃える。
 */

const WEB_ROOT = resolve(__dirname, "../..");
const CONFIG_TOML = resolve(WEB_ROOT, "supabase/config.toml");
const MOBILE_CONFIG = resolve(
  WEB_ROOT,
  "../mobile/src/auth/supabase-config.ts",
);
const SIM_RELEASE = resolve(WEB_ROOT, "../mobile/scripts/sim-release.sh");

/** `[section]` の直下（`[section.sub]` ではない）にある整数の `key` を読む */
function readTomlPort(toml: string, section: string, key: string): number {
  let current: string | undefined;
  for (const raw of toml.split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    if (current !== section) continue;
    const entry = new RegExp(`^${key}\\s*=\\s*(\\d+)$`).exec(line);
    if (entry) return Number(entry[1]);
  }
  throw new Error(
    `supabase/config.toml の [${section}] に整数の ${key} が無い。env() の値に変えたなら、` +
      "このテストと src/lib/local-supabase.ts の定数を直す",
  );
}

describe("手元の Supabase のポートが supabase/config.toml と一致する", () => {
  const toml = readFileSync(CONFIG_TOML, "utf8");
  const apiPort = readTomlPort(toml, "api", "port");

  it("LOCAL_SUPABASE_API_PORT が [api] port と同じ", () => {
    expect(LOCAL_SUPABASE_API_PORT).toBe(apiPort);
  });

  it("LOCAL_SUPABASE_DB_PORT が [db] port と同じ", () => {
    expect(LOCAL_SUPABASE_DB_PORT).toBe(readTomlPort(toml, "db", "port"));
  });

  it("モバイルの LOCAL_SUPABASE_API_PORT が [api] port と同じ", () => {
    // テキストとして読む。import すると React Native まで引き込むため
    const source = readFileSync(MOBILE_CONFIG, "utf8");
    const match = /export const LOCAL_SUPABASE_API_PORT = (\d+);/.exec(source);
    expect(
      match,
      "apps/mobile/src/auth/supabase-config.ts が LOCAL_SUPABASE_API_PORT を宣言していない",
    ).not.toBeNull();
    expect(Number(match?.[1])).toBe(apiPort);
  });

  it("sim-release.sh の LOCAL_SUPABASE_URL のポートが [api] port と同じ", () => {
    const source = readFileSync(SIM_RELEASE, "utf8");
    const match = /^LOCAL_SUPABASE_URL="http:\/\/127\.0\.0\.1:(\d+)"$/m.exec(
      source,
    );
    expect(
      match,
      "apps/mobile/scripts/sim-release.sh が LOCAL_SUPABASE_URL を宣言していない",
    ).not.toBeNull();
    expect(Number(match?.[1])).toBe(apiPort);
  });
});
