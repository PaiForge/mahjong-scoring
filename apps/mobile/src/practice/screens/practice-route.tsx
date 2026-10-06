import type { ReactNode } from "react";
import { useLocalSearchParams } from "expo-router";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";

import type { PracticeScreens } from "../practice-screens";
import { practiceScreensFor } from "../registry";
import { practiceSlugFromBasePath } from "../route-slug";
import { PracticeNotFoundScreen } from "./not-found-screen";

/**
 * `/practice/[slug]/…` のルートから練習を引いて画面を描く
 * 練習ルート
 *
 * パスの `[slug]` をレジストリの `basePath` と突き合わせ、モバイルに盤面が
 * あれば `render` に渡す。未知の slug・未移植の練習・昇級試験（記録と段級位の
 * 付与にアカウントが要るため、モバイルではまだ扱わない）は「見つからない」。
 */
export function PracticeRoute({
  render,
}: {
  readonly render: (
    slug: PracticeMenuSlug,
    screens: PracticeScreens,
  ) => ReactNode;
}) {
  const { slug: param } = useLocalSearchParams<{ slug: string }>();
  const slug =
    typeof param === "string"
      ? practiceSlugFromBasePath(`/practice/${param}`)
      : undefined;
  const screens = slug === undefined ? undefined : practiceScreensFor(slug);
  if (slug === undefined || screens === undefined || isExamMenu(slug)) {
    return <PracticeNotFoundScreen />;
  }
  return render(slug, screens);
}
