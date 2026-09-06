"use client";

import { useSearchParams } from "next/navigation";
import {
  resolvePracticeVariant,
  type PracticeMenuSlug,
  type PracticeVariantOf,
} from "@/lib/db/practice-menu-types";
import { VARIANT_PARAM } from "../_lib/variant-param";

/**
 * URL クエリから出題設定のバリアントを読むフック
 * URL バリアント
 *
 * 説明ページの選択パネルが付ける `?variant=` を解釈する（不正値・未指定は
 * その練習の既定）。サーバー側で `searchParams` を読むとルートが動的になり、
 * 初回表示が `loading.tsx` のスケルトンを経由してしまうため、クライアントで
 * 読む。静的ルートでは `useSearchParams()` を使うサブツリーがクライアント
 * 描画になるので、呼び出し側は自前の `Suspense` で包むこと。
 *
 * 戻り値はその練習のバリアントの union に絞られる — `resolvePracticeVariant`
 * がレジストリの列挙に正規化した値なので、型の上でも安全にその表を引ける。
 */
export function useVariantQuery<S extends PracticeMenuSlug>(
  slug: S,
): PracticeVariantOf<S> {
  const searchParams = useSearchParams();
  return resolvePracticeVariant(
    slug,
    searchParams.get(VARIANT_PARAM) ?? undefined,
  );
}
