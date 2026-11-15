import "server-only";

import {
  archivePracticeProblem,
  isPracticeProblemArchiveDisabled,
  PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES,
} from "../practice-problems/archive";

import { authorizeMobileRequest } from "./auth";
import { mobilePlatformOf } from "./platform";
import { readMobileJson } from "./request";
import { mobileInvalidRequest, mobileJson, mobilePreflight } from "./response";

/**
 * 出題した問題を保存する（アプリ向け）
 * 問題保存API（アプリ向け）
 *
 * web の `POST /api/practice-problems` と同じ本体（`archivePracticeProblem`）を
 * 呼ぶ。保存の方針は `lib/practice-problems/archive.ts`。入口の順序:
 *
 * 1. 停止スイッチなら認証もせず 204
 * 2. `authorizeMobileRequest`（IP の枠 → Bearer の検証・BAN・退会処理中 → アカウントの枠。
 *    枠のキーは web の入口と同じ `archivePracticeProblem`）
 * 3. 本文を実際の長さで上限まで読み、検証を通らなければ 400 `invalidRequest`
 * 4. 保存できたら（新規でも既存でも）本文なしの 204。DB の失敗は 500 `serverError`
 *
 * ユーザー名を決める前（プロフィール未作成）でも保存する。盤面は利用者に
 * 紐づけないので、ユーザー名の有無で扱いを変える理由が無い。
 *
 * 由来（`source`）は要求の `X-App-Platform`（`mobilePlatformOf`）。この値は申告で
 * 偽れるので、由来の記録以外には使わない。
 */
export async function handleArchivePracticeProblem(
  request: Request,
): Promise<Response> {
  if (isPracticeProblemArchiveDisabled()) return mobileNoContent();

  const auth = await authorizeMobileRequest(request, "archivePracticeProblem");
  if (!auth.ok) return auth.response;

  const body = await readMobileJson(
    request,
    PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES,
  );
  const result = await archivePracticeProblem(body, mobilePlatformOf(request));
  if (!result.ok) {
    return result.error.type === "invalid"
      ? mobileInvalidRequest()
      : mobileJson({ error: "serverError" }, { status: 500 });
  }
  return mobileNoContent();
}

/**
 * 本文なしの 204（アプリ向け）
 *
 * CORS ヘッダはプリフライトの応答（`mobilePreflight`）と同じ組を写す（Expo の web 版で
 * 応答を読めるようにするため）。閲覧者ごとの応答なので共有キャッシュにも乗せない。
 */
function mobileNoContent(): Response {
  const headers = new Headers(mobilePreflight().headers);
  headers.set("Cache-Control", "private, no-store");
  return new Response(null, { status: 204, headers });
}
