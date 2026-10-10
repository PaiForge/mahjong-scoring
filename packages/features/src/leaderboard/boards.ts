import {
  PRACTICE_CATEGORIES,
  practiceMenuFromCatalog,
  type PracticeCategory,
} from "../practice/catalog";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  isPracticeVariant,
  menuTypeToSlug,
  practiceMenuByType,
  resolvePracticeVariant,
  slugToMenuType,
  type PracticeBoard,
  type PracticeMenuType,
} from "../practice-menu-types";

/**
 * ランキングの土俵と期間の定義
 * ランキング定義
 *
 * web のランキングとアプリのランキングが同じ土俵を同じ並びで出し、サーバー
 * （web のページ・アプリ向け API）が同じ規則で URL の値を検証するため、ここに置く。
 */

/**
 * ランキングの期間（並びは切り替えの並び）
 * ランキング期間
 *
 * URL の `/leaderboard/<期間>/…`・辞書の `leaderboard.period.<期間>` と同じ文字列。
 */
export const LEADERBOARD_PERIODS = ["all-time", "monthly"] as const;

/** ランキングの期間（{@link LEADERBOARD_PERIODS}） */
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

const periodSet: ReadonlySet<string> = new Set(LEADERBOARD_PERIODS);

/** 値がランキングの期間かを判定する型ガード */
export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
  return periodSet.has(value);
}

/**
 * ランキングを持つ練習種別（一覧の並び順そのもの）
 * ランキング対象
 *
 * 昇級試験は含まない。試験の成果は段級位（`RANK_REGISTRY`）という恒久的な
 * 記録で表現されるものなので、同じ成績をランキングにも並べると達成の物差しが
 * 2 本になる。加えて試験はミス1回で終了するためスコアが合格ライン付近に
 * 詰まりやすく、母集団も受験資格を満たした人に限られるため、順位が実力の
 * 順序を表さない。
 */
export const LEADERBOARD_MENU_TYPES: readonly PracticeMenuType[] =
  PRACTICE_MENU_TYPES.filter((menuType) => !isExamMenuType(menuType));

const menuTypeSet: ReadonlySet<string> = new Set(LEADERBOARD_MENU_TYPES);

/**
 * 練習種別がランキングを持つかを判定する型ガード
 * ランキング対象判定
 *
 * 練習種別として存在するかではなく、{@link LEADERBOARD_MENU_TYPES} に含まれるかを
 * 見る。レジストリ全件を通すと、一覧から外した昇級試験の詳細が直 URL で開けたままになる。
 */
export function isLeaderboardMenuType(
  value: string,
): value is PracticeMenuType {
  return menuTypeSet.has(value);
}

/**
 * ランキングを持つ土俵の一覧（一覧の並び順そのもの）
 * ランキング土俵一覧
 *
 * 練習の並びは {@link LEADERBOARD_MENU_TYPES}、その中のバリアントの並びは
 * レジストリの列挙順。
 */
export const LEADERBOARD_BOARDS: readonly PracticeBoard[] =
  LEADERBOARD_MENU_TYPES.flatMap((menuType) =>
    practiceMenuByType(menuType).variants.map((variant) => ({
      menuType,
      variant,
    })),
  );

/**
 * 土俵がランキングを持つかを判定する
 * 土俵判定
 *
 * ランキングを持つ練習で、かつバリアントがその練習の列挙にあるか。
 * クライアントから任意の値で来る要求では、他の練習のバリアント名を
 * 名乗った土俵をここで落とす。
 */
export function isLeaderboardBoard(board: PracticeBoard): boolean {
  return (
    isLeaderboardMenuType(board.menuType) &&
    isPracticeVariant(board.menuType, board.variant)
  );
}

/**
 * URL のスラッグとクエリから土俵を復元する
 * 土俵解決
 *
 * バリアントは `resolvePracticeVariant` で正規化する（未指定・不正値は
 * その練習の既定）。練習がランキングを持たない（昇級試験）・未知なら undefined
 *
 * @param slug - 練習の slug（URL の `/leaderboard/<期間>/<slug>`）
 * @param rawVariant - URL の `?variant=` の値
 */
export function resolveLeaderboardBoard(
  slug: string,
  rawVariant: string | undefined,
): PracticeBoard | undefined {
  const menuType = slugToMenuType(slug);
  if (menuType === undefined || !isLeaderboardMenuType(menuType)) {
    return undefined;
  }
  return {
    menuType,
    variant: resolvePracticeVariant(menuTypeToSlug(menuType), rawVariant),
  };
}

/**
 * 1 つの分野に属する土俵のまとまり
 * ランキング分野
 */
export interface LeaderboardBoardGroup {
  readonly category: PracticeCategory;
  /** {@link LEADERBOARD_BOARDS} の並びを保った、この分野の土俵 */
  readonly boards: readonly PracticeBoard[];
}

/** その土俵が属する分野。練習カタログ（一覧の絞り込みと同じ分類）が持つ */
function boardCategory(board: PracticeBoard): PracticeCategory | undefined {
  return practiceMenuFromCatalog(menuTypeToSlug(board.menuType))?.category;
}

/**
 * ランキングの土俵を分野（符の計算 / 翻数 / 点数計算）ごとにまとめる
 * 土俵の分野分け
 *
 * 一覧は 17 行あり、行頭の記号 1 つで種目を見分けさせるのは元々無理がある
 * （運べるのはせいぜい分野までで、種目そのものではない）。分野なら名前ごと
 * 見出しに出せるので、行頭には何も置かず見出しで括る。
 *
 * 分類は練習一覧の絞り込みと同じ `PRACTICE_CATALOG` の `category` を引く。
 * ランキング側に分類表を持つと、練習の分野が 2 か所で食い違う。
 *
 * 分野の並びは {@link PRACTICE_CATEGORIES}（学習順）、分野の中の並びは
 * {@link LEADERBOARD_BOARDS}。土俵を持たない分野は見出しごと落とす。
 */
export function leaderboardBoardGroups(): readonly LeaderboardBoardGroup[] {
  return PRACTICE_CATEGORIES.map((category) => ({
    category,
    boards: LEADERBOARD_BOARDS.filter(
      (board) => boardCategory(board) === category,
    ),
  })).filter((group) => group.boards.length > 0);
}
