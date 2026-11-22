import { z } from "zod";
import {
  isAnswerYakuId,
  type ScoreYakuId,
} from "@mahjong-scoring/core/core/yaku-names";
import type { RuleSettings } from "@mahjong-scoring/core/rules/settings";

const positiveInteger = z.number().int().positive().max(2147483647);

/** 解答時のルール設定。欠損を既定値で補わない。 */
export const answerRuleSettingsSchema: z.ZodType<RuleSettings> = z.strictObject(
  {
    renfonpaiAs4Fu: z.boolean(),
    kiriageMangan: z.boolean(),
    suuankouTankiDouble: z.boolean(),
    daisuushiiDouble: z.boolean(),
    kokushiJuusanmenDouble: z.boolean(),
    junseiChuurenDouble: z.boolean(),
    fukugouYakuman: z.boolean(),
  },
);

/** 回答モード。符の必須性は正解でなくフォームにも依存するため入口では強制しない。 */
export const dailyAnswerModeSchema = z.strictObject({
  requireYaku: z.boolean(),
  requireHanFu: z.boolean(),
  exactHan: z.boolean(),
  requireFuForMangan: z.boolean(),
});

/** 入力した解答。誤答も保存するため、正解の数値・符の有無との一致は検証しない。 */
export const submittedDailyAnswerSchema = z.strictObject({
  han: positiveInteger.optional(),
  fu: positiveInteger.optional(),
  score: positiveInteger.optional(),
  scoreFromKo: positiveInteger.optional(),
  scoreFromOya: positiveInteger.optional(),
  yaku: z.array(z.custom<ScoreYakuId>(isAnswerYakuId)).max(47),
});

/** 解答時に固定する端末情報。buildを再送時のヘッダーで上書きしない。 */
export const dailyAnswerClientSchema = z
  .strictObject({
    scoringVersion: positiveInteger.max(32767),
    build: z.string().min(1).max(256).optional(),
    ruleSettings: answerRuleSettingsSchema,
    scoreInput: z.enum(["tiles", "select"]),
    koTsumoInput: z.enum(["combined", "split"]),
  })
  .refine(
    (value) =>
      value.scoreInput !== "tiles" || value.koTsumoInput === "combined",
    {
      message: "タイル入力では子ツモは組で回答する",
    },
  );

/** 詳細v1。わからない場合はanswerを送らない。採点不能はサーバーの受付結果。 */
export const dailyAnswerDetailSchema = z.discriminatedUnion("outcome", [
  z.strictObject({
    v: z.literal(1),
    outcome: z.literal("answered"),
    mode: dailyAnswerModeSchema,
    answer: submittedDailyAnswerSchema,
    client: dailyAnswerClientSchema,
  }),
  z.strictObject({
    v: z.literal(1),
    outcome: z.literal("gaveUp"),
    mode: dailyAnswerModeSchema,
    client: dailyAnswerClientSchema,
  }),
]);

/** 永続化する解答の中身。 */
export type SubmittedDailyAnswer = z.infer<typeof submittedDailyAnswerSchema>;
/** 解答時の端末条件。 */
export type DailyAnswerClient = z.infer<typeof dailyAnswerClientSchema>;
/** 送信・端末の再送待ちに保存する詳細。 */
export type DailyAnswerDetail = z.infer<typeof dailyAnswerDetailSchema>;

/** 詳細の検証結果。未対応版を旧形式に縮退させない。 */
export type ParsedDailyAnswerDetail =
  | { readonly kind: "legacy" }
  | { readonly kind: "valid"; readonly detail: DailyAnswerDetail }
  | { readonly kind: "unsupportedDetail" }
  | { readonly kind: "invalidDetail" };

/** detailだけを検証する。省略だけが旧形式。未対応版は同じ内容で再送できる。 */
export function parseDailyAnswerDetail(
  value: unknown,
): ParsedDailyAnswerDetail {
  if (value === undefined) return { kind: "legacy" };
  const version = z.object({ v: positiveInteger }).safeParse(value);
  if (!version.success) return { kind: "invalidDetail" };
  if (version.data.v !== 1) return { kind: "unsupportedDetail" };
  const parsed = dailyAnswerDetailSchema.safeParse(value);
  return parsed.success
    ? { kind: "valid", detail: parsed.data }
    : { kind: "invalidDetail" };
}
