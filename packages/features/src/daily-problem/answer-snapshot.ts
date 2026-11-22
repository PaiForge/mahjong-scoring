import { z } from "zod";
import {
  isScoreYakuId,
  type ScoreYakuId,
} from "@mahjong-scoring/core/core/yaku-names";

const count = z.number().int().nonnegative().max(2147483647);
const amount = count.positive();
const wind = z.literal([27, 28, 29, 30]);

/** 選出時の正解と属性の保存形式。将来もvごとの読み方を残す。 */
export const dailyAnswerSnapshotSchema = z.strictObject({
  v: z.literal(1),
  scoringVersion: count.positive().max(32767),
  revision: z.string().min(1).max(256).nullable(),
  answer: z.strictObject({
    han: amount,
    fu: count,
    scoreLevel: z.enum([
      "Normal",
      "Mangan",
      "Haneman",
      "Baiman",
      "Sanbaiman",
      "Yakuman",
      "DoubleYakuman",
    ]),
    yakumanMultiplier: count,
    payment: z.discriminatedUnion("type", [
      z.strictObject({ type: z.literal("ron"), amount }),
      z.strictObject({ type: z.literal("oyaTsumo"), amount }),
      z.strictObject({
        type: z.literal("koTsumo"),
        amount: z.tuple([amount, amount]),
      }),
    ]),
    yaku: z
      .array(
        z.strictObject({
          id: z.custom<ScoreYakuId>(isScoreYakuId),
          han: amount,
        }),
      )
      .max(47),
    doraHan: count,
    uraDoraHan: count,
  }),
  facets: z.strictObject({
    isTsumo: z.boolean(),
    isOya: z.boolean(),
    isMenzen: z.boolean(),
    isRiichi: z.boolean(),
    kanCount: count.max(4),
    jikaze: wind,
    bakaze: wind,
    agariHai: count.max(33),
    machi: z
      .enum(["Tanki", "Shanpon", "Ryanmen", "Kanchan", "Penchan"])
      .nullable(),
  }),
});

/** 選出時の情報。受付時の判定ではなく、選出時分類の正本として保持する。 */
export type DailyAnswerSnapshot = z.infer<typeof dailyAnswerSnapshotSchema>;
