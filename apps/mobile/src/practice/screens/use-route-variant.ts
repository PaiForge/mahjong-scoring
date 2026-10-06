import { useLocalSearchParams } from "expo-router";
import {
  resolvePracticeVariant,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { VARIANT_PARAM } from "@mahjong-scoring/features/routes";

/**
 * URL の `?variant=` を正規化して返す
 * ルートバリアント
 *
 * 未指定・不正値はその練習の既定（先頭）に落ちる。盤面・結果が同じ土俵に
 * 着地するよう、読む側は必ずここを通す（web の `useVariantQuery` と同じ）。
 */
export function useRouteVariant(slug: PracticeMenuSlug): string {
  const params = useLocalSearchParams<{ [VARIANT_PARAM]?: string }>();
  const raw = params[VARIANT_PARAM];
  return resolvePracticeVariant(
    slug,
    typeof raw === "string" ? raw : undefined,
  );
}
