import { RANK_REGISTRY, type RankSlug } from "./registry";

/**
 * 段級位の進捗バーの区切り 1 つの状態
 *
 * - `achieved` 取得済み（帯色で塗る）
 * - `next` 次に取る級（帯色の淡い側で塗る）
 * - `upcoming` それより上の級（淡いグレー）
 */
export type RankProgressSegmentState = "achieved" | "next" | "upcoming";

/** 段級位の進捗バー */
export interface RankProgress {
  /** 取得済みの級の数（無級なら 0） */
  readonly achievedCount: number;
  /** 級の総数 */
  readonly totalCount: number;
  /** 5級から初段までの区切り。レジストリの順 */
  readonly segments: readonly {
    readonly slug: RankSlug;
    readonly state: RankProgressSegmentState;
    /** 現在の段級位か（ラベルを太字にする） */
    readonly isCurrent: boolean;
  }[];
}

/**
 * 段級位の進捗バーの区切りを求める
 * 段級位進捗
 *
 * 道場の先頭に置く「5級から初段まで」の区切り付きのバー（web の
 * `RankProgressBar`・モバイルの道場）が読む。級は下から順にしか取得できない
 * （`evaluateExamEligibility`）ので、現在の級以下をすべて取得済みとして塗る。
 *
 * @param currentSlug - 現在の段級位。未取得（無級）なら undefined
 */
export function buildRankProgress(
  currentSlug: RankSlug | undefined,
): RankProgress {
  const currentIndex =
    currentSlug === undefined
      ? -1
      : RANK_REGISTRY.findIndex((rank) => rank.slug === currentSlug);
  return {
    achievedCount: currentIndex + 1,
    totalCount: RANK_REGISTRY.length,
    segments: RANK_REGISTRY.map((rank, index) => ({
      slug: rank.slug,
      state:
        index <= currentIndex
          ? "achieved"
          : index === currentIndex + 1
            ? "next"
            : "upcoming",
      isCurrent: index === currentIndex,
    })),
  };
}
