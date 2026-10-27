import type { QuestionTilesSnapshot } from "@mahjong-scoring/features/results/parse-question-tiles";
import {
  MentsuType,
  haiIdToMpsz,
  haisToMpsz,
  formatMpsz,
  type Furo,
  type MentsuJantouFuItem,
  type MentsuJantouFuQuestion,
} from "@mahjong-scoring/core";

import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "@mahjong-scoring/features/results/create-session-storage-parser";
import {
  answerOutcomeSchema,
  questionTilesSnapshotSchema,
  completedMentsuTypeSchema,
  furoSchema,
  toAnswerOutcome,
  type AnswerOutcome,
} from "@mahjong-scoring/features/results/result-schemas";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(
  PRACTICE_SLUG.mentsuJantouFu,
);

/**
 * 回答行 1 つ（面子 1 つ、または雀頭）の結果データ
 * 面子雀頭符行結果
 *
 * 結果ページは出題時と同じ体裁で行を描き直すため、牌そのものだけでなく
 * 面子種別と副露まで持つ。副露と槓子は牌を横倒しで晒して見せる要素で、
 * 平らに並べ直すと符の根拠（明刻か暗刻か）が読めなくなる。
 */
export interface MentsuJantouFuItemResult {
  /** 行の牌（MPSZ） */
  readonly tiles: string;
  /** 面子種別。雀頭は "Pair" */
  readonly type: MentsuType | "Pair";
  /** 鳴いて晒しているか */
  readonly isOpen: boolean;
  /** 副露の種別と出所。鳴いていない行では持たない */
  readonly furo?: Furo;
  /** 正解の符 */
  readonly correctFu: number;
  /** ユーザーが選んだ符。時間切れで答えられなかった問題では持たない */
  readonly userFu?: number;
}

/**
 * 面子と雀頭の符練習の 1 問ごとの結果データ
 * 面子雀頭符問題結果
 *
 * 結果ページで手牌と回答行を再表示するため、出題そのものを MPSZ 文字列として
 * 持つ。sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、牌はすべて文字列に落として保存する。
 */
export interface MentsuJantouFuQuestionResult extends QuestionTilesSnapshot {
  readonly isTsumo: boolean;
  /** 手牌の表示順に並んだ回答行 */
  readonly items: readonly MentsuJantouFuItemResult[];
  /** 全行の符を当てられたか（1 行でも外せば不正解）。時間切れなら全行が回答なし */
  readonly outcome: AnswerOutcome;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 面子雀頭符問題結果生成
 *
 * @param userFuList - 回答行と同じ並びの、ユーザーが選んだ符。時間切れで
 *   答えられなかった問題は undefined（全行が埋まった時点で送信するので、
 *   一部の行だけ答えた状態は無い）
 */
export function toQuestionResult(
  question: MentsuJantouFuQuestion,
  userFuList: readonly number[] | undefined,
): MentsuJantouFuQuestionResult {
  const { context } = question;
  const items = question.items.map((item, index) =>
    toItemResult(item, userFuList?.[index]),
  );

  return {
    tehai: formatMpsz(question.tehai),
    agariHai: haiIdToMpsz(context.agariHai),
    bakaze: haiIdToMpsz(context.bakaze),
    jikaze: haiIdToMpsz(context.jikaze),
    isTsumo: context.isTsumo,
    items,
    outcome: toAnswerOutcome(
      userFuList === undefined ? undefined : items.every(isItemCorrect),
    ),
  };
}

/**
 * 回答行 1 つの正誤 — 選んだ符が正解の符と一致すれば正解
 * 回答行正誤
 *
 * 時間切れで答えていない行（`userFu` 無し）は不正解。採点（{@link toQuestionResult}）と
 * 結果一覧の行の色・「n / m 行正解」の数え上げが同じ判定を読む。
 */
export function isItemCorrect(
  item: Pick<MentsuJantouFuItemResult, "correctFu" | "userFu">,
): boolean {
  return item.userFu === item.correctFu;
}

/** 結果一覧の行の見せ方（時間切れ / 正解 / 不正解） */
export type ItemOutcome = "timeUp" | "correct" | "wrong";

/**
 * 結果一覧の行の見せ方
 * 回答行の見せ方
 *
 * 時間切れで答えていない行（`userFu` 無し）は正誤の色を持たず、回答欄に
 * 「時間切れ」を出す（採点上は不正解 — {@link isItemCorrect}）。web と
 * モバイルの一覧が同じ分岐で行の枠と回答の文字の色を決める。
 */
export function itemOutcome(
  item: Pick<MentsuJantouFuItemResult, "correctFu" | "userFu">,
): ItemOutcome {
  if (item.userFu === undefined) return "timeUp";
  return isItemCorrect(item) ? "correct" : "wrong";
}

/** 符を当てた行の数（結果一覧の「n / m 行正解」の n） */
export function countCorrectItems(
  items: readonly Pick<MentsuJantouFuItemResult, "correctFu" | "userFu">[],
): number {
  return items.filter(isItemCorrect).length;
}

/** 回答行 1 つを保存形式に変換する */
function toItemResult(
  item: MentsuJantouFuItem,
  userFu: number | undefined,
): MentsuJantouFuItemResult {
  const furo = item.originalMentsu?.furo;
  return {
    tiles: haisToMpsz(item.tiles),
    type: item.type,
    isOpen: item.isOpen,
    ...(furo ? { furo } : {}),
    correctFu: item.fu,
    userFu,
  };
}

/**
 * 回答行の種別のスキーマ
 *
 * 回答行は完成面子か雀頭のいずれか。未完成面子（対子・塔子）は和了形を
 * 出題する以上あり得ない。
 */
const itemTypeSchema: z.ZodType<MentsuType | "Pair"> = z.union([
  z.literal("Pair"),
  completedMentsuTypeSchema,
]);

/** 回答行の結果のスキーマ */
const itemResultSchema: z.ZodType<MentsuJantouFuItemResult> = z.object({
  tiles: z.string(),
  type: itemTypeSchema,
  isOpen: z.boolean(),
  furo: furoSchema.optional(),
  correctFu: z.number(),
  userFu: z.number().optional(),
});

/**
 * sessionStorage から取得した値が MentsuJantouFuQuestionResult として妥当か検証する
 * 面子雀頭符問題結果バリデーション
 */
const questionResultSchema: z.ZodType<MentsuJantouFuQuestionResult> = z.object({
  ...questionTilesSnapshotSchema.shape,
  isTsumo: z.boolean(),
  items: z.array(itemResultSchema),
  outcome: answerOutcomeSchema,
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 面子雀頭符問題結果パース
 */
export const parseMentsuJantouFuResults: (
  stored: unknown,
) => readonly MentsuJantouFuQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
