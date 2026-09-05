import { z } from "zod";

import { FuroType, MentsuType, Tacha } from "@mahjong-scoring/core";
import type {
  FuDetail,
  Furo,
  ScoreTableAnswer,
  YakuDetail,
} from "@mahjong-scoring/core";

/**
 * 結果データの検証スキーマ（練習共通の部品）
 * 結果スキーマ部品
 *
 * sessionStorage から復元した値は型が保証されないため、結果ページで使う前に
 * 形を検証する。各練習の結果型に現れるドメインの部品をここに集める。
 *
 * どのスキーマも `z.ZodType<ドメイン型>` を注釈すること。これがこのモジュール
 * の要点で、注釈があるとドメイン型にフィールドが増えたときスキーマ側が
 * コンパイルエラーになる。注釈が無いと型と検証が黙ってずれる（実際、以前の
 * 手書きの検証は回答の `type` だけを見て `score` や `all` を見ていなかった）。
 *
 * 値の意味までは見ない。MSPZ として解釈できるか、符が実際に取りうる数かは
 * ここでは確かめず、表示時に失敗したらその表示だけを諦める。
 */

/** 副露の種別と出所 */
export const furoSchema: z.ZodType<Furo> = z.object({
  type: z.enum(FuroType),
  from: z.enum(Tacha),
});

/**
 * 完成面子の種別
 *
 * 未完成面子（対子・塔子）は和了形の一部として出題されないため通さない。
 */
export const completedMentsuTypeSchema = z.literal([
  MentsuType.Shuntsu,
  MentsuType.Koutsu,
  MentsuType.Kantsu,
]);

/** 符の内訳 1 件 */
export const fuDetailSchema: z.ZodType<FuDetail> = z.object({
  reason: z.string(),
  fu: z.number(),
});

/** 符を数値で回答する問題に共通する正解・回答・正誤 */
export interface FuAnswerResult {
  readonly correctFu: number;
  readonly userFu: number;
  readonly isCorrect: boolean;
}

/** 符を数値で回答する問題に共通する結果スキーマ */
export const fuAnswerResultSchema = z.object({
  correctFu: z.number(),
  userFu: z.number(),
  isCorrect: z.boolean(),
}) satisfies z.ZodType<FuAnswerResult>;

/** 役の内訳 1 件 */
export const yakuDetailSchema: z.ZodType<YakuDetail> = z.object({
  name: z.string(),
  han: z.number(),
});

/**
 * 点数の回答（ロン / 親ツモ / 子ツモ）
 *
 * 判別子だけでなく支払い額まで見る。判別子しか見ないと、`{ type: "ron" }`
 * だけの壊れた行が `ScoreTableAnswer` として結果ページへ流れ、点数の表示が
 * undefined になる。
 */
export const scoreTableAnswerSchema: z.ZodType<ScoreTableAnswer> =
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("ron"), score: z.number() }),
    z.object({ type: z.literal("oyaTsumo"), all: z.number() }),
    z.object({
      type: z.literal("koTsumo"),
      fromKo: z.number(),
      fromOya: z.number(),
    }),
  ]);
