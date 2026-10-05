import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron からの呼び出しの検証
 * Cron認証
 *
 * Vercel は `CRON_SECRET` 環境変数があると、cron の HTTP 呼び出しに
 * `Authorization: Bearer <CRON_SECRET>` を付ける。`/api/cron/*` はこれだけで
 * 守る — セッションも Origin も無い機械の呼び出しで、`authorizeApiRequest` の
 * 前処理（CSRF・IP レート制限・ユーザー認証）はどれも当てはまらない。
 *
 * `CRON_SECRET` が未設定なら **常に拒否** する。「設定を忘れたら誰でも叩ける」
 * より「設定を忘れたら cron が動かない」方が気づきやすく、害も無い。
 */

/**
 * リクエストが cron の呼び出しとして正当か
 * Cron呼び出し検証
 *
 * 比較は定数時間（`timingSafeEqual`）。長さが違えば比較せず拒否する。
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
