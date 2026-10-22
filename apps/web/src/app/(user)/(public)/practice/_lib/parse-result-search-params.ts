import {
  FINISH_REASON_PARAM,
  parseFinishReason,
  type FinishReason,
} from "@mahjong-scoring/features/challenge/finish-reason";
import {
  RUN_PARAM,
  parseRunId,
} from "@mahjong-scoring/features/challenge/challenge-run";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { resolvePracticeVariant } from "@mahjong-scoring/features/practice-menu-types";
import {
  isRankSlug,
  type RankSlug,
} from "@mahjong-scoring/features/ranks/registry";
import { VARIANT_PARAM } from "@mahjong-scoring/features/routes";

/** 結果ページの URL クエリの生の形（Next.js 16 の `searchParams`） */
export type ResultSearchParams = Record<
  string,
  string | readonly string[] | undefined
>;

/** 結果ページが URL クエリから読む値 */
export interface ResultQuery {
  /** 走った土俵。未指定・不正値は既定に落ちる（盤面・保存と同じ正規化） */
  readonly variant: string;
  /** 付与 ID（登録直後の特典の案内） */
  readonly grantId: string | undefined;
  /** 昇級バナーに出す級。未知のスラッグはここで落とす */
  readonly promotedSlugs: readonly RankSlug[];
  readonly correct: number;
  readonly total: number;
  /** 回答に使った時間（ms） */
  readonly elapsedMs: number;
  readonly finishReason: FinishReason | undefined;
  readonly runId: ReturnType<typeof parseRunId>;
}

/** 数値の文字列を読む。無い・数でないものは 0 */
function numberOf(value: string | readonly string[] | undefined): number {
  const parsed = Number(typeof value === "string" ? value : 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 結果ページの URL クエリを読む
 * 結果クエリの読み取り
 *
 * play 画面の `useFinishRedirect` が付ける値（`?variant=&correct=&total=&time=`
 * `&run=` と終了の理由）と、記録後に付く値（付与 ID・昇級）を 1 か所で読む。
 * 実在の検証（本人が級を保持しているか）は描く側（PromotionBanner）が行う。
 */
export function parseResultSearchParams(
  params: ResultSearchParams,
  slug: PracticeMenuSlug,
): ResultQuery {
  const rawVariant = params[VARIANT_PARAM];
  const rawGrant = params.grant;
  const rawPromoted = params.promoted;
  return {
    variant: resolvePracticeVariant(
      slug,
      typeof rawVariant === "string" ? rawVariant : undefined,
    ),
    grantId: typeof rawGrant === "string" ? rawGrant : undefined,
    promotedSlugs: (Array.isArray(rawPromoted)
      ? rawPromoted
      : typeof rawPromoted === "string"
        ? [rawPromoted]
        : []
    ).filter(isRankSlug),
    correct: numberOf(params.correct),
    total: numberOf(params.total),
    elapsedMs: numberOf(params.time),
    finishReason: parseFinishReason(params[FINISH_REASON_PARAM]),
    runId: parseRunId(params[RUN_PARAM]),
  };
}
