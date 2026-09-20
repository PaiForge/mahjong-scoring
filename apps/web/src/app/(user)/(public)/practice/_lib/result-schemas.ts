import { z } from "zod";
import type { QuestionTilesSnapshot } from "./parse-question-tiles";

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

/**
 * 1 問の顛末
 * 回答の顛末
 *
 * 正解・不正解に「時間切れ」を加えた 3 値。時間切れは、出題されたまま
 * 答える前に制限時間が来た問題で、チャレンジの最後の 1 問がこれになる
 * （ミス上限で終わったときは直前に答えた問題で終わるので出ない）。
 *
 * 不正解とは別の値にするのは、解けなかったことと間違えたことが違うため。
 * 結果ページの問題別一覧は時間切れの問題も答えを見せるが、正誤の色も
 * 記号も付けず、正解数・不正解数にも数えない（チャレンジの成績は答えた
 * 問題だけで決まる）。
 */
export const AnswerOutcome = {
  Correct: "correct",
  Incorrect: "incorrect",
  TimeUp: "timeUp",
} as const;
export type AnswerOutcome = (typeof AnswerOutcome)[keyof typeof AnswerOutcome];

/** 回答の顛末のスキーマ */
export const answerOutcomeSchema: z.ZodType<AnswerOutcome> =
  z.enum(AnswerOutcome);

/**
 * 正誤の判定から顛末を決める
 * 顛末判定
 *
 * 回答が無い（時間切れ）ときは正誤を判定せず `TimeUp` になる。
 *
 * @param isCorrect - 回答が正解だったか。回答が無ければ undefined
 */
export function toAnswerOutcome(isCorrect: boolean | undefined): AnswerOutcome {
  if (isCorrect === undefined) return AnswerOutcome.TimeUp;
  return isCorrect ? AnswerOutcome.Correct : AnswerOutcome.Incorrect;
}

/** 符を数値で回答する問題に共通する正解・回答・顛末 */
export interface FuAnswerResult {
  readonly correctFu: number;
  /** ユーザーが選んだ符。時間切れで答えられなかった問題では持たない */
  readonly userFu?: number;
  readonly outcome: AnswerOutcome;
}

/** 符を数値で回答する問題に共通する結果スキーマ */
export const fuAnswerResultSchema = z.object({
  correctFu: z.number(),
  userFu: z.number().optional(),
  outcome: answerOutcomeSchema,
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

/** 結果画面で共通に復元する牌の保存形式。 */
export const questionTilesSnapshotSchema = z.object({
  tehai: z.string(),
  agariHai: z.string(),
  bakaze: z.string(),
  jikaze: z.string(),
}) satisfies z.ZodType<QuestionTilesSnapshot>;
