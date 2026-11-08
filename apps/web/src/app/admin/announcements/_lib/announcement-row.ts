import { revalidatePath } from "next/cache";

import { internalLocalePath } from "@/i18n/public-path";
import { SUPPORTED_LOCALES } from "@mahjong-scoring/features/i18n/locales";
import { parseJstDateTimeLocal } from "@mahjong-scoring/features/jst";

import type { AnnouncementInput } from "./validation";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

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
    publishedAt: data.publishedAt
      ? parseJstDateTimeLocal(data.publishedAt)
      : null,
  };
}

/**
 * お知らせ関連ページのキャッシュを無効化する。
 * お知らせ再検証
 *
 * 管理画面の一覧・公開の一覧・その slug の詳細を捨てる。
 *
 * @design 公開ページは言語ごとの内部パスと、接頭辞なしのパスの両方で呼ぶ
 * 公開のお知らせの実体は `app/[locale]/...` にあり、日本語の公開 URL
 * （`/announcements`）も proxy が内部の `/ja/announcements` へ rewrite して描く。
 * キャッシュの実体は内部のパスにあるので、`SUPPORTED_LOCALES` を回して
 * `internalLocalePath`（`/ja/announcements`・`/en/announcements` と各詳細）で
 * 捨てる。英語の画面は日本語のパスを捨てても捨てられないため、言語ごとに呼ぶ。
 * 接頭辞なしのパスで捨てたときに内部の `/ja/...` に効くかは確かめていないので、
 * 従来の 3 行も残す。存在しないパスや動的なページへの `revalidatePath` は
 * 何もしないだけで害が無い。英語のお知らせは今は fallback 無し・noindex の
 * 動的ページだが、将来 ISR にして索引させるときも管理画面側を変えずに済む。
 * 管理画面（`/admin/...`）は `app/[locale]` の外なので言語ごとには呼ばない。
 *
 * @param slug - 作成・更新・削除したお知らせの slug
 */
export function revalidateAnnouncementPaths(slug: string): void {
  const detailPath = `/announcements/${slug}`;
  revalidatePath("/admin/announcements");
  revalidatePath(ANNOUNCEMENTS_PATH);
  revalidatePath(detailPath);
  for (const locale of SUPPORTED_LOCALES) {
    revalidatePath(internalLocalePath(ANNOUNCEMENTS_PATH, locale));
    revalidatePath(internalLocalePath(detailPath, locale));
  }
}
