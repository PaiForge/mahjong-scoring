import { isMobileApiErrorCode } from "@mahjong-scoring/features/account/mobile-api";

/**
 * テスト用の `auth/api-client` の置き換え（`callMobileApi` 以外）
 * API クライアントモック
 *
 * api-client は React Native を読むので Node のテストからは import できない。
 * 応答から失敗の理由を読む関数だけを本物と同じ規則で持ち、`callMobileApi` は
 * 各テストが `vi.hoisted` の spy を渡す:
 *
 * ```ts
 * vi.mock("../auth/api-client", async () => ({
 *   ...(await import("../test/api-client-mock")).apiClientMock,
 *   callMobileApi: mocks.callMobileApi,
 * }));
 * ```
 */
export const apiClientMock = {
  errorOf,
  apiFailureOf: async (response: Response) => {
    const error = await errorOf(response);
    return isMobileApiErrorCode(error) ? error : "unknown";
  },
};

async function errorOf(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => undefined);
  return typeof body === "object" && body !== null && "error" in body
    ? body.error
    : undefined;
}

/**
 * JSON の本文を持つ応答を作る
 * JSON 応答
 *
 * @param status - HTTP ステータス
 * @param body - JSON にする本文
 */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}
