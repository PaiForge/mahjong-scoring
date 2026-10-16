import { z } from "zod";

import { RANK_REGISTRY } from "../ranks/registry";

/**
 * アプリ向けの昇級試験の合格ラインの API の契約（パス・応答）
 *
 * アプリは配布した時点のレジストリを抱えたまま動くので、サーバーで合格ライン
 * （`RANK_REGISTRY` の `minScore`）を変えると、手元の値とサーバーの判定が
 * 食い違う。本番の終了と合否はチャレンジ開始の応答の `goalCount`
 * （`challenge/mobile-api.ts` の `MobileBeginChallengeResponse`）で揃え、
 * 開始前の説明画面の合格条件はこの API で揃える。案内した条件と、開始後に
 * 求める条件を同じサーバーの値にするため。
 *
 * 合格ラインは誰が読んでも同じなので、ログインを要らない（ゲストも説明
 * 画面で合格条件を読む）。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * 昇級試験の合格ラインを返す API のパス（GET）
 * 試験合格ラインAPIパス
 */
export const MOBILE_EXAM_GOALS_API_PATH = `${MOBILE_API_PREFIX}/exams/goals`;

/**
 * 昇級試験の合格ラインの応答
 * 試験合格ライン応答
 *
 * `goals` は試験の menuType から合格ライン（正解数）への対応。
 */
export interface MobileExamGoalsResponse {
  readonly goals: Readonly<Record<string, number>>;
}

/**
 * 今のレジストリから応答を組む（サーバーが返す値）
 * 試験合格ライン応答組み立て
 */
export function examGoalsFromRegistry(): MobileExamGoalsResponse {
  return {
    goals: Object.fromEntries(
      RANK_REGISTRY.map((rank) => [rank.exam.menuType, rank.exam.minScore]),
    ),
  };
}

const goalsSchema = z.object({
  goals: z.record(z.string(), z.unknown()),
});

const goalSchema = z.number().int().positive();

/**
 * 合格ラインの応答を検証する。形が違えば undefined
 * 試験合格ライン応答検証
 *
 * 形が違う値の試験だけを落とす（その試験は手元の値に戻る）。
 */
export function parseMobileExamGoalsResponse(
  body: unknown,
): MobileExamGoalsResponse | undefined {
  const parsed = goalsSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return {
    goals: Object.fromEntries(
      Object.entries(parsed.data.goals).flatMap(([menuType, value]) => {
        const goal = goalSchema.safeParse(value);
        return goal.success ? [[menuType, goal.data]] : [];
      }),
    ),
  };
}
