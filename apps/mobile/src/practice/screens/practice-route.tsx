import type { ReactNode } from "react";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";

import type { PracticeScreens } from "../practice-screens";
import { PracticeMenuRoute } from "./practice-menu-route";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

/** 昇級試験でない練習だけをこのルートで描く */
const isPracticeMenu = (slug: PracticeMenuSlug) => !isExamMenu(slug);

/**
 * `/practice/[slug]/…` のルートから練習を引いて画面を描く
 * 練習ルート
 *
 * パスの `[slug]` をレジストリの `basePath` と突き合わせ、モバイルに盤面が
 * あれば `render` に渡す。未知の slug・未移植の練習・昇級試験（記録と段級位の
 * 付与にアカウントが要るため、モバイルではまだ扱わない）は「見つからない」
 * （{@link PracticeMenuRoute}）。
 */
export function PracticeRoute({
  render,
}: {
  readonly render: (
    slug: PracticeMenuSlug,
    screens: PracticeScreens,
  ) => ReactNode;
}) {
  return (
    <PracticeMenuRoute
      param="slug"
      basePathPrefix={PRACTICE_PATH}
      accept={isPracticeMenu}
      render={render}
    />
  );
}
