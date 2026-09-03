import { revalidatePath } from "next/cache";

import type { AnnouncementInput } from "./validation";

/**
 * お知らせ行を組み立てるのに必要な、入力値以外の文脈
 * お知らせ行文脈
 *
 * 時刻を2つ取るため、位置引数ではなく名前で渡す（取り違えると
 * ピン留め時刻が更新時刻に化ける）。
 */
export interface AnnouncementRowContext {
  /** 行の各時刻の基準となる「今」 */
  readonly now: Date;
  /**
   * 更新前の行が持っているピン留め時刻。新規作成なら `null`。
   * 既にピン留めされている行の時刻を動かさないために要る。
   */
  readonly currentPinnedAt: Date | null;
}

/**
 * ピン留め時刻を決める
 * ピン留め時刻解決
 *
 * `pinnedAt` は「いつピン留めしたか」を表す値であり、ピン留めが続いている
 * 限り動かさない。本文だけを直した更新で現在時刻へ書き戻すと、ピン留めを
 * 時刻順に並べたときに無関係な編集で順序が入れ替わる。
 *
 * @param pinned フォームのピン留めチェック状態
 * @param currentPinnedAt 更新前のピン留め時刻（新規作成なら `null`）
 * @param now ピン留めを新たに立てるときに使う「今」
 */
export function resolvePinnedAt(
  pinned: boolean,
  currentPinnedAt: Date | null,
  now: Date,
): Date | null {
  if (!pinned) return null;
  return currentPinnedAt ?? now;
}

/**
 * お知らせ入力値を announcements テーブルの行値に変換する。
 * お知らせ行変換
 *
 * create / update の両アクションで共通のマッピングを一元化する。
 * `null` は Drizzle のカラム書き込み境界のため許容される。
 *
 * @param data 管理フォームの入力値
 * @param context 「今」と更新前のピン留め時刻。内部で現在時刻を読むと、
 *   入力が同じでも呼ぶたび別の行が出る（＝ 参照透過でない）関数になり、
 *   ピン留め時刻がいつ書き換わるかを呼び出し側から見て決められない
 */
export function toAnnouncementRow(
  data: AnnouncementInput,
  { now, currentPinnedAt }: AnnouncementRowContext,
): {
  slug: string;
  title: string;
  content: string;
  locale: string;
  status: string;
  pinnedAt: Date | null;
  publishedAt: Date | null;
} {
  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    locale: data.locale,
    status: data.status,
    pinnedAt: resolvePinnedAt(data.pinned, currentPinnedAt, now),
    publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
  };
}

/**
 * お知らせ関連ページのキャッシュを無効化する。
 * お知らせ再検証
 */
export function revalidateAnnouncementPaths(slug: string): void {
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath(`/announcements/${slug}`);
}
