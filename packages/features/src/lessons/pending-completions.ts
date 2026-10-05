import { z } from "zod";

import {
  isCurriculumChapterSlug,
  type CurriculumChapterSlug,
} from "../curriculum/registry";

/**
 * 未同期のレッスン完了 — 端末に預けてあとでサーバーへ記録する分
 * 未同期のレッスン完了
 *
 * @description
 * レッスンは未ログインでも最後まで受けられるが、完了の印（`lesson_completions`）
 * はログイン済みの本人にしか書けない。登録前に終えたレッスンを本登録の後に
 * 引き継ぐため、完了をいったん端末のストレージに預け、ログイン済みのホームが
 * 読み出してサーバーへ記録する。ログイン済みの保存が通信エラーで失敗した
 * ときも同じ置き場に預け、ホームで再試行する — 「次の一歩へ」進んだ瞬間に
 * 進捗が黙って消える経路を無くすため。
 *
 * このモジュールは中身の形と規則（有効期限・持ち主の照合・重複の畳み方）だけを
 * 持つ純粋な部品で、ストレージへの読み書きはアプリ側が行う（web は
 * localStorage。メール確認のリンクは別タブで開くため、タブに閉じた
 * sessionStorage では登録フローの途中で失われる）。
 *
 * @design 持ち主と有効期限で、無関係なアカウントへの引き継ぎを防ぐ
 * 預かりはこの端末のブラウザにしか無い。同じブラウザを別の人が使い、別の
 * アカウントでログインすれば、未ログインで終えたレッスンはその人のものに
 * なり得る。完全には防げないので、次の 2 つで範囲を狭める:
 *
 * - 未ログインで終えた完了は 24 時間（{@link PENDING_LESSON_COMPLETION_TTL_MS}）
 *   で捨てる。想定する流れは「レッスンを終えてすぐ登録し、確認メールを開く」
 *   で、翌日に開いても間に合う長さ
 * - ログイン済みの保存に失敗して預けた完了には本人の `userId` を付け、
 *   同じ本人がログインしたときだけ同期する（別のアカウントには見せない）
 *
 * 別の端末・別のブラウザで登録を続けた場合は引き継げない。レッスンは数分で
 * 終わるので、ホームが同じレッスンをもう一度案内することで回復する。
 *
 * @design 同期は冪等
 * サーバーの記録は `ON CONFLICT DO NOTHING` で、同じスラッグを何度送っても
 * 1 行しか入らない。預かり側でもスラッグごとに 1 件に畳み、同期に成功した
 * 分だけを捨てる（失敗したら残して次のホーム表示で再試行する）。
 */

/** 未ログインで終えた完了を預かる長さ（ミリ秒） */
export const PENDING_LESSON_COMPLETION_TTL_MS = 24 * 60 * 60 * 1000;

/** 預けた完了 1 件 */
export interface PendingLessonCompletion {
  /** 終えたレッスン（章の slug） */
  readonly slug: CurriculumChapterSlug;
  /** 終えた時刻（epoch ミリ秒）。有効期限の起点 */
  readonly completedAt: number;
  /**
   * ログイン済みで保存に失敗したときの本人の id。未ログインで終えた完了は
   * 持たない（登録後に誰がログインしても引き継ぐ）
   */
  readonly userId?: string;
}

const entrySchema = z.object({
  slug: z.string(),
  completedAt: z.number().int().nonnegative(),
  userId: z.string().min(1).optional(),
});

const storedSchema = z.object({
  version: z.literal(1),
  entries: z.array(entrySchema),
});

/**
 * ストレージの文字列から有効な預かりだけを読み出す
 * 預かりの読み出し
 *
 * 壊れた JSON・形の違う値・レジストリに無いスラッグ・期限切れは捨てる。
 * 読めなければ空（預かり無し）として扱い、例外は投げない。
 *
 * @param raw ストレージに入っていた文字列（無ければ null / undefined）
 * @param now 現在時刻（epoch ミリ秒）
 */
export function parsePendingLessonCompletions(
  raw: string | null | undefined,
  now: number,
): readonly PendingLessonCompletion[] {
  if (!raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = storedSchema.safeParse(json);
  if (!parsed.success) return [];

  return parsed.data.entries.flatMap((entry) => {
    if (!isCurriculumChapterSlug(entry.slug)) return [];
    if (now - entry.completedAt > PENDING_LESSON_COMPLETION_TTL_MS) return [];
    return [
      entry.userId === undefined
        ? { slug: entry.slug, completedAt: entry.completedAt }
        : {
            slug: entry.slug,
            completedAt: entry.completedAt,
            userId: entry.userId,
          },
    ];
  });
}

/**
 * 預かりをストレージに入れる文字列にする
 * 預かりの書き出し
 */
export function serializePendingLessonCompletions(
  entries: readonly PendingLessonCompletion[],
): string {
  return JSON.stringify({ version: 1, entries });
}

/**
 * 預かりに 1 件足す。同じスラッグが既にあれば新しい方で置き換える
 * 預かりの追加
 *
 * 置き換えるのは、やり直して終えた時刻を有効期限の起点にするため。
 * 持ち主（`userId`）も新しい方に揃える。
 */
export function addPendingLessonCompletion(
  entries: readonly PendingLessonCompletion[],
  entry: PendingLessonCompletion,
): readonly PendingLessonCompletion[] {
  return [...entries.filter((item) => item.slug !== entry.slug), entry];
}

/**
 * 預かりからスラッグを取り除く（同期に成功した分・サーバーが拒否した分）
 * 預かりの除去
 */
export function removePendingLessonCompletions(
  entries: readonly PendingLessonCompletion[],
  slugs: readonly string[],
): readonly PendingLessonCompletion[] {
  const removing = new Set(slugs);
  return entries.filter((item) => !removing.has(item.slug));
}

/**
 * ログインした本人が同期してよい預かりを選ぶ
 * 同期対象の選択
 *
 * 持ち主の無い完了（未ログインで終えた分）と、本人の id が付いた完了だけを
 * 返す。別の id が付いた完了は返さない（その人がログインするまで残り、
 * 期限が来たら読み出し時に捨てられる）。
 *
 * @param entries 預かり
 * @param userId ログインしている本人の id
 */
export function selectSyncableLessonCompletions(
  entries: readonly PendingLessonCompletion[],
  userId: string,
): readonly PendingLessonCompletion[] {
  return entries.filter(
    (item) => item.userId === undefined || item.userId === userId,
  );
}
