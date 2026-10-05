import {
  PRACTICE_MENU_SLUGS,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

/**
 * 画面のパスの最初の 2 段（`/practice/<x>` / `/exam/<x>`）から練習を引く
 * ルート練習解決
 *
 * パスの組み立ては features の `routes.ts`（`practiceHref` 等）が持ち、練習は
 * `/practice/<slug>`、昇級試験はレジストリの `basePath`（`/exam/mangan` 等）に
 * 住む。expo-router は web と同じパス体系でファイルを置くので、画面側は
 * 「このパスはどの練習か」をレジストリの `basePath` と突き合わせて逆に引く。
 * 該当しなければ undefined（未知の slug は画面が「見つからない」を出す）。
 */
export function practiceSlugFromBasePath(
  basePath: string,
): PracticeMenuSlug | undefined {
  return PRACTICE_MENU_SLUGS.find(
    (slug) => practiceMenuBySlug(slug).basePath === basePath,
  );
}
