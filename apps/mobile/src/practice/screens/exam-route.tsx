import type { ReactNode } from "react";
import { useLocalSearchParams } from "expo-router";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";

import type { PracticeScreens } from "../practice-screens";
import { practiceScreensFor } from "../registry";
import { practiceSlugFromBasePath } from "../route-slug";
import { PracticeNotFoundScreen } from "./not-found-screen";

/**
 * `/exam/[exam]/…` のルートから昇級試験を引いて画面を描く
 * 昇級試験ルート
 *
 * {@link import("./practice-route").PracticeRoute} の試験版。パスの `[exam]` を
 * レジストリの `basePath`（`/exam/mangan` 等）と突き合わせ、昇級試験で
 * モバイルに盤面があれば `render` に渡す。未知の名前・試験でない練習・
 * 未移植は「見つからない」。
 */
export function ExamRoute({
  render,
}: {
  readonly render: (
    slug: PracticeMenuSlug,
    screens: PracticeScreens,
  ) => ReactNode;
}) {
  const { exam: param } = useLocalSearchParams<{ exam: string }>();
  const slug =
    typeof param === "string"
      ? practiceSlugFromBasePath(`/exam/${param}`)
      : undefined;
  const screens = slug === undefined ? undefined : practiceScreensFor(slug);
  if (slug === undefined || screens === undefined || !isExamMenu(slug)) {
    return <PracticeNotFoundScreen />;
  }
  return render(slug, screens);
}
