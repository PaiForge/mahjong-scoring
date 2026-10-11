import AsyncStorage from "@react-native-async-storage/async-storage";
import { jstDayKey } from "@mahjong-scoring/features/jst";
import {
  peekUsage,
  type QuotaUsage,
} from "@mahjong-scoring/features/quota/answer";
import type { QuotaMenu } from "@mahjong-scoring/features/quota/limits";

import {
  consumeGuestQuota,
  guestQuotaForDay,
  parseGuestQuotaState,
  type GuestQuotaState,
} from "./guest-quota";

/** AsyncStorage のキー */
const STORAGE_KEY = "mahjong-guest-practice-quota";

/** 保存した値を読む。無い・読めない・形が違えば undefined */
async function loadGuestQuota(): Promise<GuestQuotaState | undefined> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    return parseGuestQuotaState(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

/** 保存する。書けなくても止めない（次の 1 問が数えられないだけ） */
async function saveGuestQuota(state: GuestQuotaState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 端末の保存に失敗しても練習は止めない（fail-open）
  }
}

/** 読んで書くまでを 1 本に並べる。連打で 2 つの消費が同じ値を読まないため */
let queue: Promise<unknown> = Promise.resolve();

/**
 * ゲストの枠を 1 問消費する（端末に保存）
 * ゲスト消費（保存）
 *
 * 保存を読めないときは 0 から数える（読めない値で練習を止めない）。
 */
export function consumeStoredGuestQuota(
  menu: QuotaMenu,
  limit: number,
  now: Date = new Date(),
): Promise<QuotaUsage> {
  const run = queue.then(async () => {
    const today = guestQuotaForDay(await loadGuestQuota(), jstDayKey(now));
    const { state, usage } = consumeGuestQuota(today, menu, limit);
    if (usage.allowed) await saveGuestQuota(state);
    return usage;
  });
  queue = run.catch(() => undefined);
  return run;
}

/**
 * ゲストの今日の残りを消費せずに読む
 * ゲスト残数
 */
export async function peekStoredGuestQuota(
  menu: QuotaMenu,
  limit: number,
  now: Date = new Date(),
): Promise<QuotaUsage> {
  const today = guestQuotaForDay(await loadGuestQuota(), jstDayKey(now));
  return peekUsage(limit, today.counts[menu]);
}
