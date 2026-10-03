import {
  resolvePracticeVariant,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { VARIANT_PARAM } from "@mahjong-scoring/features/routes";

/**
 * 今のページの URL からバリアントを読む（クライアント専用）
 * 現在バリアント読み出し
 *
 * バリアントの URL パラメータの規約は features の `routes.ts` が持つ。
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
