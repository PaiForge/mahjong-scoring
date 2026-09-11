/**
 * 出題設定（バリアント）の URL パラメータ規約
 * バリアントパラメータ
 *
 * バリアントを持つ練習（レジストリの `variants`）は、説明ページで選んだ
 * バリアントを `?variant=<key>` で play / training / result へ運ぶ。語彙は
 * レジストリのキーそのもので、URL・`leaderboard_key`・辞書キーで同じ文字列を
 * 使う（変換の表を持たない）。
 *
 * 読む側は必ず `resolvePracticeVariant` で正規化する — 未指定・不正値は
 * その練習の既定（先頭）に落ちるので、盤面・保存・結果ページが同じ土俵に
 * 着地する。
 */
import {
  practiceMenuBySlug,
  resolvePracticeVariant,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";

/** バリアントを指定するクエリパラメータ名 */
export const VARIANT_PARAM = "variant";

/**
 * バリアント付きのクエリ文字列（先頭の `?` を含む。設定を持たない練習は空）
 * バリアントクエリ
 *
 * 設定を持たない練習では常に空文字を返すので、呼び出し側が練習ごとに
 * 分岐しなくてよい。
 */
export function variantQuery(slug: PracticeMenuSlug, variant: string): string {
  if (!practiceMenuBySlug(slug).hasSetup) return "";
  return `?${VARIANT_PARAM}=${encodeURIComponent(resolvePracticeVariant(slug, variant))}`;
}

/**
 * 今のページの URL からバリアントを読む（クライアント専用）
 * 現在バリアント読み出し
 *
 * チャレンジの終了時（`useFinishRedirect`）と中断時（`ChallengeShell` の
 * 「やめる」）が使う。`useSearchParams()` で読むとシェル全体がクライアント
 * 描画になり、静的ルートのプリレンダーが崩れるため、その瞬間に一度だけ
 * `location` から読む。バリアントはセッション中に変わらないので購読は
 * 要らない。描画時に読むリンクには `WithUrlVariant` を使うこと。
 */
export function readVariantFromLocation(slug: PracticeMenuSlug): string {
  const raw =
    typeof window === "undefined"
      ? undefined
      : (new URLSearchParams(window.location.search).get(VARIANT_PARAM) ??
        undefined);
  return resolvePracticeVariant(slug, raw);
}
