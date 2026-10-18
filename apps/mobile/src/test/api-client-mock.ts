import { vi } from "vitest";
import { isMobileApiErrorCode } from "@mahjong-scoring/features/account/mobile-api";

/**
 * テスト用の `auth/api-client` の置き換え
 * API クライアントモック
 *
 * api-client は React Native を読むので Node のテストからは import できない。
 * 応答から失敗の理由を読む関数は本物と同じ規則で持ち、`callMobileApi` は
 * spy（{@link callMobileApi}）にする。module 形に揃えてあるので、`vi.mock` の
 * ファクトリにそのまま渡せる:
 *
 * ```ts
 * vi.mock("../auth/api-client", async () => await import("../test/api-client-mock"));
 * import { callMobileApi } from "../test/api-client-mock";
 * ```
 *
 * 他の export も置き換えたいテストは {@link apiClientMock} を広げて足す。
 */
export const apiClientMock = {
  errorOf,
  apiFailureOf,
};

/** `callMobileApi` の差し替え先。各テストが応答を `mockResolvedValue` で決める */
export const callMobileApi = vi.fn();

/** 失敗の応答の `error` を読む（本物の `apiFailureOf` と同じ規則） */
export async function apiFailureOf(response: Response) {
  const error = await errorOf(response);
  return isMobileApiErrorCode(error) ? error : "unknown";
}

/** 失敗の応答の `error` を読む。形が違えば undefined */
export async function errorOf(response: Response): Promise<unknown> {
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
