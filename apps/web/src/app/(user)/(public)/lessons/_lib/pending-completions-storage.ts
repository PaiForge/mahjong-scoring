import {
  addPendingLessonCompletion,
  parsePendingLessonCompletions,
  removePendingLessonCompletions,
  serializePendingLessonCompletions,
  type PendingLessonCompletion,
} from "@mahjong-scoring/features/lessons/pending-completions";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

/**
 * 未同期のレッスン完了の置き場（web は localStorage）
 * 未同期完了の保存
 *
 * 規則（有効期限・持ち主・畳み方）は features の `pending-completions` が持ち、
 * ここは localStorage への読み書きだけを担う。メール確認のリンクは別タブで
 * 開くため、タブに閉じた sessionStorage ではなく localStorage を使う
 * （同じブラウザなら別タブでも読める）。
 *
 * localStorage はプライベートウィンドウや設定で使えないことがあるので、
 * 読み書きはすべて try/catch で包み、失敗は「預かり無し」として黙って扱う
 * （預けられなくても学習自体は終わっている。失われるのは引き継ぎだけ）。
 */

const STORAGE_KEY = "mahjong-scoring:pending-lesson-completions";

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(entries: readonly PendingLessonCompletion[]): void {
  try {
    if (entries.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        serializePendingLessonCompletions(entries),
      );
    }
  } catch {
    // 預けられなくても学習は終わっている。引き継ぎだけが失われる
  }
}

/**
 * 有効な預かりを読み出す（期限切れ・壊れたものは落ちる）
 *
 * @param now 期限の判定に使う現在時刻（ミリ秒）
 */
export function readPendingLessonCompletions(
  now: number = Date.now(),
): readonly PendingLessonCompletion[] {
  return parsePendingLessonCompletions(readRaw(), now);
}

/**
 * レッスンの完了を預ける
 *
 * @param slug 終えたレッスン（章の slug）
 * @param userId ログイン済みで保存に失敗したときの本人の id。未ログインなら省く
 * @param now 完了時刻（ミリ秒）。既存の預かりの期限判定にも同じ時刻を使う
 */
export function rememberPendingLessonCompletion(
  slug: CurriculumChapterSlug,
  userId?: string,
  now: number = Date.now(),
): void {
  const entry: PendingLessonCompletion =
    userId === undefined
      ? { slug, completedAt: now }
      : { slug, completedAt: now, userId };
  write(addPendingLessonCompletion(readPendingLessonCompletions(now), entry));
}

/** 同期が済んだ（またはサーバーが拒否した）スラッグを預かりから外す */
export function forgetPendingLessonCompletions(slugs: readonly string[]): void {
  write(removePendingLessonCompletions(readPendingLessonCompletions(), slugs));
}
