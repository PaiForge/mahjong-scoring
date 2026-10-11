import "server-only";

import { APPLE_ROOT_CERTS_BASE64 } from "./root-certs.generated";

/**
 * App Store の署名付きデータ（署名付き取引・通知）を検証する Apple のルート証明書
 * Appleルート証明書
 *
 * 署名付きデータは x5c ヘッダーに葉と中間の証明書を持ち、検証器はそれが
 * ここに挙げたルートに繋がることを確かめる。中身は `certs/apple/*.cer`
 * （Apple Root CA - G2 / G3）をビルド前に base64 で埋め込んだもの。実行時に
 * ファイルを読まないのは、サーバー関数の出力トレースに `.cer` が乗らない恐れが
 * あるため（`scripts/generate-apple-root-certs.ts`）。
 */
export function appleRootCertificates(): readonly Buffer[] {
  return APPLE_ROOT_CERTS_BASE64.map((base64) => Buffer.from(base64, "base64"));
}
