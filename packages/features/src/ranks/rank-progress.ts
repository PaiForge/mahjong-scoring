import type { RankStatus } from "./rank-status";
import { RANK_REGISTRY, type RankSlug } from "./registry";

/** 段級位の進捗バー */
export interface RankProgress {
  /** 取得済みの級の数（無級なら 0） */
  readonly achievedCount: number;
  /** 級の総数 */
  readonly totalCount: number;
  /** 5級から初段までの区切り。レジストリの順 */
  readonly segments: readonly {
    readonly slug: RankSlug;
    /**
     * 区切りの状態（`achieved` は帯色、`next` は帯色の淡い側、`unachieved` は
     * 淡いグレーで塗る）。語彙は段級位一覧の {@link RankStatus} と同じ
     */
    readonly state: RankStatus;
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
 * （`evaluateExamEligibility`）ので、現在の級以下をすべて取得済みとして塗る
 * （保持集合から引く `resolveRankStatus` と違い、飛び番の付与は考えない）。
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
            : "unachieved",
      isCurrent: index === currentIndex,
    })),
  };
}
