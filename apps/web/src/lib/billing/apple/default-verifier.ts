import "server-only";

import { readAppleAppId } from "./env";
import { appleRootCertificates } from "./root-certs";
import {
  createAppleSignedDataVerifier,
  type AppleSignedDataVerifier,
} from "./verifier";

/** 作った検証器と、作ったときの App ID */
let cached:
  | { readonly appAppleId: number; readonly verifier: AppleSignedDataVerifier }
  | undefined;

/**
 * 本番の署名検証器を返す。App ID（`APPLE_IAP_APP_APPLE_ID`）が無ければ undefined
 * 既定の署名検証器
 *
 * 取引の記録の API と通知の受け口が使う。モジュールの中で 1 つを使い回し、
 * 要求ごとにルート証明書を読み直したり検証器を作り直したりしない。App ID が
 * 変わったとき（環境変数を差し替えたテスト等）だけ作り直す。
 *
 * App ID が無いのは設定の不備で、検証器を作れない。呼び出し側は「検証できない」
 * として応答する（アプリの API は 503、通知の受け口は 500）。
 */
export function getAppleSignedDataVerifier():
  AppleSignedDataVerifier | undefined {
  const appAppleId = readAppleAppId();
  if (appAppleId === undefined) return undefined;
  if (cached?.appAppleId !== appAppleId) {
    cached = {
      appAppleId,
      verifier: createAppleSignedDataVerifier({
        appAppleId,
        rootCertificates: appleRootCertificates(),
      }),
    };
  }
  return cached.verifier;
}
