import { createHmac, timingSafeEqual } from "node:crypto";

import { jstDayKey } from "@mahjong-scoring/features/jst";
import {
  EMPTY_QUOTA_COUNTS,
  QUOTA_MENUS,
  type QuotaCounts,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";

/**
 * 未ログインの無料枠 cookie の値の組み立てと読み解き
 * 匿名練習回数cookie符号化
 *
 * cookie の読み書き（`next/headers`）と署名鍵の取得（環境変数）は
 * `anonymous-quota-cookie.ts` が持ち、ここは「文字列 ⇄ 回数」の純粋な変換だけ。
 * 署名の照合・日付の照合・形の検査という改ざん対策の規則を、cookie と
 * 環境変数を差し替えずに検証できるようにするため。
 *
 * 値の形は `v1.<base64url の JSON>.<HMAC-SHA256 の base64url>`。JSON は
 * `{ day: "YYYY-MM-DD"（JST）, counts: { <練習>: 回数 } }`。
 */

/** 署名のバージョン。形式を変えるときに上げ、古い cookie は無効として扱う */
const FORMAT_VERSION = "v1";

function sign(key: Buffer, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** JSON から回数を取り出す。形が違えば undefined */
function parseCounts(value: unknown): QuotaCounts | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record: Record<string, unknown> = { ...value };
  const counts: Record<QuotaMenu, number> = { ...EMPTY_QUOTA_COUNTS };
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
 * 今日の回数を署名付きの cookie の値にする
 * 匿名回数符号化
 *
 * @param counts - 練習ごとの今日の回数
 * @param now - 「今日」を決める時刻（JST の日付で持つ）
 * @param key - 署名鍵
 */
export function encodeAnonymousQuotaCookie(
  counts: QuotaCounts,
  now: Date,
  key: Buffer,
): string {
  const payload = Buffer.from(
    JSON.stringify({ day: jstDayKey(now), counts }),
  ).toString("base64url");
  return `${FORMAT_VERSION}.${payload}.${sign(key, payload)}`;
}

/**
 * cookie の値から今日の回数を読む。無い・不正・署名が合わない・別の日なら全部 0
 * 匿名回数復号
 *
 * @param raw - cookie の値（無ければ undefined）
 * @param now - 「今日」を決める時刻。cookie の日付と違えば 0 に戻す
 * @param key - 署名鍵。書いたときと違う鍵では読めない
 */
export function decodeAnonymousQuotaCookie(
  raw: string | undefined,
  now: Date,
  key: Buffer,
): QuotaCounts {
  if (!raw) return EMPTY_QUOTA_COUNTS;

  const [version, payload, signature] = raw.split(".");
  if (version !== FORMAT_VERSION || !payload || !signature) {
    return EMPTY_QUOTA_COUNTS;
  }

  const expected = Buffer.from(sign(key, payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return EMPTY_QUOTA_COUNTS;
  }

  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof decoded !== "object" || decoded === null)
      return EMPTY_QUOTA_COUNTS;
    const record: Record<string, unknown> = { ...decoded };
    if (record.day !== jstDayKey(now)) return EMPTY_QUOTA_COUNTS;
    return parseCounts(record.counts) ?? EMPTY_QUOTA_COUNTS;
  } catch {
    return EMPTY_QUOTA_COUNTS;
  }
}
