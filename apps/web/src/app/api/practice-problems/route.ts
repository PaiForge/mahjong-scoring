import { authorizeApiRequest } from "@/lib/api-auth";
import { jsonPrivate } from "@/lib/api-response";
import { readMobileJson } from "@/lib/mobile-api/request";
import {
  archivePracticeProblem,
  isPracticeProblemArchiveDisabled,
  PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES,
} from "@/lib/practice-problems/archive";
import { enforceUserRateLimit } from "@/lib/rate-limit-ip";

/**
 * 出題した問題の保存（web 向け。POST）
 * 問題保存API
 *
 * 本文は `PracticeProblemArchiveRequest` の JSON。保存の本体と方針は
 * `lib/practice-problems/archive.ts`。ここは入口の順序と応答の形だけを持つ:
 *
 * 1. 停止スイッチなら認証もせず 204
 * 2. `authorizeApiRequest`（Origin 不正・BAN は 403、IP の枠は 429、未認証は 401）。
 *    cookie で認証するので Origin の検証を外さない
 * 3. アカウント単位の枠（429）。IP の枠だけだと、回線を変えれば 1 アカウントで
 *    枠を増やせる。アプリの入口と同じキーで数える
 * 4. 本文を実際の長さで上限まで読む（超過・JSON でなければ 400）
 * 5. 検証を通らなければ 400、DB の失敗は 500、保存できたら（新規でも既存でも）
 *    本文なしの 204
 */
export async function POST(request: Request): Promise<Response> {
  if (isPracticeProblemArchiveDisabled()) return noContent();

  const auth = await authorizeApiRequest(request, "archivePracticeProblem");
  if (!auth.ok) return auth.response;
  if (enforceUserRateLimit(auth.user.id, "archivePracticeProblem")) {
    return jsonPrivate({ error: "rateLimited" }, { status: 429 });
  }

  const body = await readMobileJson(
    request,
    PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES,
  );
  const result = await archivePracticeProblem(body, "web");
  if (!result.ok) {
    return result.error.type === "invalid"
      ? jsonPrivate({ error: "invalidRequest" }, { status: 400 })
      : jsonPrivate({ error: "serverError" }, { status: 500 });
  }
  return noContent();
}

/** 本文なしの 204。閲覧者ごとの応答なので共有キャッシュに乗せない */
function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
}
