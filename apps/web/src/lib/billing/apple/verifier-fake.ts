import type {
  AppleNotification,
  AppleSignedDataVerifier,
  AppleTransaction,
  AppleVerification,
} from "./verifier";

/**
 * テスト用の偽の検証器を作る
 * 偽の署名検証器
 *
 * 渡した表に JWS（任意の文字列）と検証の結果を並べておくと、その結果を返す。
 * 表に無い JWS は `invalidSignature`。Apple の署名付きデータを作らずに、
 * 記録や HTTP の入口を検証の結果ごとに試すためのもの。単体テストと統合テストの
 * 両方から使うので、`src/test/` ではなく本物の隣に置く。
 */
export function createFakeAppleVerifier({
  transactions = new Map(),
  notifications = new Map(),
}: {
  readonly transactions?: ReadonlyMap<
    string,
    AppleVerification<AppleTransaction>
  >;
  readonly notifications?: ReadonlyMap<
    string,
    AppleVerification<AppleNotification>
  >;
}): AppleSignedDataVerifier {
  return {
    verifyTransaction: async (jws) =>
      transactions.get(jws) ?? { ok: false, reason: "invalidSignature" },
    verifyNotification: async (signedPayload) =>
      notifications.get(signedPayload) ?? {
        ok: false,
        reason: "invalidSignature",
      },
  };
}
