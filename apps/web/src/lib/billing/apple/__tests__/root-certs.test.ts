// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { appleRootCertificates } from "../root-certs";

/**
 * ルート証明書の不変条件: 埋め込んだ証明書は `certs/apple/*.cer` と同じもの。
 *
 * `.cer` を差し替えて生成し忘れると、古い証明書で検証し続ける。
 * 直すには `pnpm --filter web certs:generate` を実行する。
 */
const CERTS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../certs/apple",
);

describe("appleRootCertificates", () => {
  it("certs/apple の .cer と名前順に一致する", () => {
    const files = readdirSync(CERTS_DIR)
      .filter((name) => name.endsWith(".cer"))
      .sort()
      .map((name) => readFileSync(join(CERTS_DIR, name)));
    expect(files.length).toBeGreaterThan(0);
    expect(appleRootCertificates()).toEqual(files);
  });
});
