import { hkdfSync } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

import { jstEndOfDay } from "@mahjong-scoring/features/quota/day";
import {
  EMPTY_QUOTA_COUNTS,
  type QuotaCounts,
} from "@mahjong-scoring/features/quota/limits";

import {
  decodeAnonymousQuotaCookie,
  encodeAnonymousQuotaCookie,
} from "./anonymous-quota-codec";

/**
 * 未ログインユーザーの無料枠 — 署名付き cookie で数える
 * 匿名練習回数cookie
 *
 * ログインしていない人の消費は DB に紐付ける先が無いので、ブラウザの cookie に
 * 「今日の日付と練習ごとの回数」を持たせる。cookie を消せば枠は戻る —
 * それは「未ログインは弱い制限で可」という決定どおり。防ぐのは値の改ざん
 * だけで、HMAC の署名を付けて検証する。
 *
 * 署名鍵は `SUPABASE_SERVICE_ROLE_KEY` から HKDF で派生させる。秘密を 1 つ
 * 増やさないため。鍵が無い環境（ビルド時など）では署名できないので、cookie を
 * 読めず書けず、未ログインの制限は掛からない（ログを残す）。
 *
 * - httpOnly: ブラウザの JS から読ませない（読める必要がない）
 * - 期限: JST の翌日 0 時。切れれば cookie ごと消えて枠が戻る
 * - 書き込みは Server Action からのみ（`cookies().set` が許される場所）
 *
 * 値の組み立てと読み解き（署名・日付・形の検査）は `anonymous-quota-codec.ts` の
 * 純粋関数。ここは cookie と署名鍵（環境変数）の出し入れだけを持つ。
 */

/** cookie 名 */
export const ANONYMOUS_QUOTA_COOKIE_NAME = "mj_quota";

/**
 * 鍵の素材から署名鍵を派生させる
 * 署名鍵導出
 */
function deriveSigningKey(material: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", material, "", "practice-quota-cookie", 32),
  );
}

/**
 * 派生させた鍵の控え。素材ごと持ち、素材が変わったら派生し直す — 鍵だけを
 * 持つと、最初に読んだ環境変数の鍵をプロセスが終わるまで使い続ける
 */
let cachedKey: { readonly material: string; readonly key: Buffer } | undefined;

/**
 * 署名鍵。無ければ undefined
 * 署名鍵
 */
function signingKey(): Buffer | undefined {
  const material = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) return undefined;
  if (cachedKey?.material !== material) {
    cachedKey = { material, key: deriveSigningKey(material) };
  }
  return cachedKey.key;
}

/**
 * cookie から今日の回数を読む。無い・不正・別の日なら全部 0
 * 匿名回数読み取り
 */
export async function readAnonymousQuota(now: Date): Promise<QuotaCounts> {
  const key = signingKey();
  if (!key) return EMPTY_QUOTA_COUNTS;

  const raw = (await cookies()).get(ANONYMOUS_QUOTA_COOKIE_NAME)?.value;
  return decodeAnonymousQuotaCookie(raw, now, key);
}

/**
 * 今日の回数を cookie に書く
 * 匿名回数書き込み
 *
 * 署名鍵が無ければ何もしない。Server Action の中からだけ呼ぶこと
 * （Server Component の描画中は cookie を書けない）。
 */
export async function writeAnonymousQuota(
  counts: QuotaCounts,
  now: Date,
): Promise<void> {
  const key = signingKey();
  if (!key) return;

  const value = encodeAnonymousQuotaCookie(counts, now, key);
  (await cookies()).set(ANONYMOUS_QUOTA_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: jstEndOfDay(now),
  });
}

/** 署名鍵があるか（無ければ未ログインの制限は掛からない） */
export function canSignAnonymousQuota(): boolean {
  return signingKey() !== undefined;
}
