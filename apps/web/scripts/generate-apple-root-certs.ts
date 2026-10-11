/**
 * App Store の署名付きデータを検証するルート証明書を、`certs/apple/*.cer`（DER）から
 * `src/lib/billing/apple/root-certs.generated.ts`（base64 の文字列の配列）に書き出す。
 *
 * 実行時にファイルシステムから `.cer` を読まないのは、Vercel の出力トレース
 * （サーバー関数に同梱するファイルの自動収集）に `.cer` が乗らない恐れがあるため。
 * ソースに埋め込めばバンドルに必ず入る。
 *
 * `.cer` は Apple PKI（https://www.apple.com/certificateauthority/）の
 * 「Apple Root CA - G2」「Apple Root CA - G3」。公開の証明書で秘密ではない。
 * 差し替えたら再実行すること:
 *   pnpm --filter web certs:generate
 * `src/lib/billing/apple/__tests__/root-certs.test.ts` が `.cer` と生成物の一致を検査する。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const certsDir = join(webDir, "certs", "apple");
const outFile = join(
  webDir,
  "src",
  "lib",
  "billing",
  "apple",
  "root-certs.generated.ts",
);

const names = readdirSync(certsDir)
  .filter((name) => name.endsWith(".cer"))
  .sort();
const lines = names.map(
  (name) =>
    `  // ${name}\n  "${readFileSync(join(certsDir, name)).toString("base64")}",`,
);

writeFileSync(
  outFile,
  `// 生成物。手で書き換えない — \`pnpm --filter web certs:generate\`（scripts/generate-apple-root-certs.ts）

/**
 * Apple のルート証明書（DER を base64 にしたもの。\`certs/apple/*.cer\` の名前順）
 * Appleルート証明書
 */
export const APPLE_ROOT_CERTS_BASE64: readonly string[] = [
${lines.join("\n")}
];
`,
);
console.log(`wrote ${names.length} certificates to ${outFile}`);
