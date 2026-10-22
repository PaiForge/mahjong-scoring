import type { ReactNode } from "react";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";

import type { PracticeScreens } from "../practice-screens";
import { PracticeMenuRoute } from "./practice-menu-route";

/**
 * `/exam/[exam]/…` のルートから昇級試験を引いて画面を描く
 * 昇級試験ルート
 *
 * {@link import("./practice-route").PracticeRoute} の試験版。パスの `[exam]` を
 * レジストリの `basePath`（`/exam/mangan` 等）と突き合わせ、昇級試験で
 * モバイルに盤面があれば `render` に渡す。未知の名前・試験でない練習・
 * 未移植は「見つからない」（{@link PracticeMenuRoute}）。
 */
export function ExamRoute({
  render,
}: {
  readonly render: (
    slug: PracticeMenuSlug,
    screens: PracticeScreens,
  ) => ReactNode;
}) {
  return (
    <PracticeMenuRoute
      param="exam"
      basePathPrefix="/exam"
      accept={isExamMenu}
      render={render}
    />
  );
}
