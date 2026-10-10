import { z } from "zod";

import { isRankSlug, type RankSlug } from "../ranks/registry";

/**
 * アプリ向けのマイページの API の契約（パス・応答）
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ここにはマイページに固有のものだけを置く。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * マイページのトップの材料を返す API のパス（GET）
 * マイページAPIパス
 */
export const MOBILE_MYPAGE_API_PATH = `${MOBILE_API_PREFIX}/mypage`;

/**
 * マイページのアクティビティに並べる日数（今日を含む直近の日数）
 * アクティビティ日数
 *
 * web のスマホ幅の棒グラフ（直近 7 日）と同じ。アプリは web の PC 幅の
 * 46 週の格子を持たない — 狭い画面では 1 マスが小さくなりすぎて押せない。
 */
export const MOBILE_MYPAGE_ACTIVITY_DAYS = 7;

/**
 * アクティビティの 1 日分
 * アクティビティ日
 */
export interface MobileMypageActivityDay {
  /** JST の暦日（`YYYY-MM-DD`） */
  readonly date: string;
  /** その日に得た経験値の合計 */
  readonly exp: number;
  /**
   * 練習種別（menuType）ごとの経験値。活動の無い日は空。アプリが知らない
   * 種別（サーバーがアプリより新しい版で増えたもの）も落とさずに返し、
   * 名前の出し方はアプリが決める
   */
  readonly expByMenuType: Readonly<Record<string, number>>;
}

/**
 * マイページのトップの材料
 * マイページ応答
 *
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileMypageResponse {
  readonly profile: {
    readonly username: string;
    /** 表示名。未設定なら無い（アプリはユーザー名で代える） */
    readonly displayName?: string;
    /** アバター画像の URL。未設定なら無い */
    readonly avatarUrl?: string;
  };
  /** 取得済みの最上位の段級位。無級なら無い */
  readonly rankSlug?: RankSlug;
  /** 直近 {@link MOBILE_MYPAGE_ACTIVITY_DAYS} 日のアクティビティ（古い順） */
  readonly recentActivity: readonly MobileMypageActivityDay[];
}

/**
 * マイページの API 固有の失敗の理由
 *
 * - `usernameRequired` — ユーザー名を決めていない（409）。マイページは
 *   ユーザー名を決めた人のもので、アプリはその前にユーザー名の設定へ送る
 */
export const MOBILE_MYPAGE_ERROR_CODES = ["usernameRequired"] as const;

/** マイページの API 固有の失敗の理由（{@link MOBILE_MYPAGE_ERROR_CODES}） */
export type MobileMypageErrorCode = (typeof MOBILE_MYPAGE_ERROR_CODES)[number];

const mypageErrorCodeSet: ReadonlySet<string> = new Set(
  MOBILE_MYPAGE_ERROR_CODES,
);

/** 値がマイページの API 固有の失敗の理由かを判定する型ガード */
export function isMobileMypageErrorCode(
  value: unknown,
): value is MobileMypageErrorCode {
  return typeof value === "string" && mypageErrorCodeSet.has(value);
}

const mypageSchema = z.object({
  profile: z.object({
    username: z.string(),
    displayName: z.string().optional(),
    avatarUrl: z.string().optional(),
  }),
  rankSlug: z.string().optional(),
  recentActivity: z.array(
    z.object({
      date: z.string(),
      exp: z.number(),
      expByMenuType: z.record(z.string(), z.number()),
    }),
  ),
});

/**
 * マイページの応答を検証する。形が違えば undefined
 * マイページ応答検証
 *
 * アプリが知らない段級位（サーバーがアプリより新しい版で増やしたもの）は
 * 無級として扱う。
 */
export function parseMobileMypageResponse(
  body: unknown,
): MobileMypageResponse | undefined {
  const parsed = mypageSchema.safeParse(body);
  if (!parsed.success) return undefined;
  const { rankSlug, ...rest } = parsed.data;
  return rankSlug !== undefined && isRankSlug(rankSlug)
    ? { ...rest, rankSlug }
    : rest;
}
