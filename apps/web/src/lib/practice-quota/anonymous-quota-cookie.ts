import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

import { jstDayKey } from "@mahjong-scoring/features/jst";
import { jstEndOfDay } from "@mahjong-scoring/features/quota/day";
import {
  QUOTA_MENUS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

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
 */

/** cookie 名 */
export const ANONYMOUS_QUOTA_COOKIE_NAME = "mj_quota";

/** 署名のバージョン。形式を変えるときに上げ、古い cookie は無効として扱う */
const FORMAT_VERSION = "v1";

/** 練習ごとのその日の回数 */
export type AnonymousQuotaCounts = Readonly<Record<QuotaMenu, number>>;

const EMPTY_COUNTS: AnonymousQuotaCounts = { score: 0, "tenpai-score": 0 };

let cachedKey: Buffer | undefined;

/**
 * 署名鍵。無ければ undefined
 * 署名鍵導出
 */
function signingKey(): Buffer | undefined {
  if (cachedKey) return cachedKey;
  const material = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!material) return undefined;
  cachedKey = Buffer.from(
    hkdfSync("sha256", material, "", "practice-quota-cookie", 32),
  );
  return cachedKey;
}

function sign(key: Buffer, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** JSON から回数を取り出す。形が違えば undefined */
function parseCounts(value: unknown): AnonymousQuotaCounts | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record: Record<string, unknown> = { ...value };
  const counts: Record<QuotaMenu, number> = { ...EMPTY_COUNTS };
  for (const menu of QUOTA_MENUS) {
    const count = record[menu];
    if (count === undefined) continue;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return undefined;
    }
    counts[menu] = count;
  }
  return counts;
}

/**
 * cookie から今日の回数を読む。無い・不正・別の日なら全部 0
 * 匿名回数読み取り
 */
export async function readAnonymousQuota(
  now: Date,
): Promise<AnonymousQuotaCounts> {
  const key = signingKey();
  if (!key) return EMPTY_COUNTS;

  const raw = (await cookies()).get(ANONYMOUS_QUOTA_COOKIE_NAME)?.value;
  if (!raw) return EMPTY_COUNTS;

  const [version, payload, signature] = raw.split(".");
  if (version !== FORMAT_VERSION || !payload || !signature) {
    return EMPTY_COUNTS;
  }

  const expected = Buffer.from(sign(key, payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return EMPTY_COUNTS;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof decoded !== "object" || decoded === null) return EMPTY_COUNTS;
    const record: Record<string, unknown> = { ...decoded };
    if (record.day !== jstDayKey(now)) return EMPTY_COUNTS;
    return parseCounts(record.counts) ?? EMPTY_COUNTS;
  } catch {
    return EMPTY_COUNTS;
  }
}

/**
 * 今日の回数を cookie に書く
 * 匿名回数書き込み
 *
 * 署名鍵が無ければ何もしない。Server Action の中からだけ呼ぶこと
 * （Server Component の描画中は cookie を書けない）。
 */
export async function writeAnonymousQuota(
  counts: AnonymousQuotaCounts,
  now: Date,
): Promise<void> {
  const key = signingKey();
  if (!key) return;

  const payload = Buffer.from(
    JSON.stringify({ day: jstDayKey(now), counts }),
  ).toString("base64url");
  const value = `${FORMAT_VERSION}.${payload}.${sign(key, payload)}`;

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
