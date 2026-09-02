import { haiIdToMspz, kazeIdToMspz } from "@mahjong-scoring/core";
import type { JantouFuChoice, JantouFuQuestion } from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("jantou-fu");

/**
 * 雀頭符練習の1問ごとの結果データ
 * 雀頭符問題結果
 *
 * 同じ牌でも場風・自風しだいで符が変わる練習なので、選んだ牌と正解の牌だけ
 * でなく出題時の風も持つ。符の付かない選択肢は乱数で選ばれた数牌・オタ風で、
 * 振り返る値が無いため保存しない。
 */
export interface JantouFuQuestionResult {
  /** 場風（MSPZ） */
  readonly bakaze: string;
  /** 自風（MSPZ） */
  readonly jikaze: string;
  /** 正解の雀頭（MSPZ） */
  readonly correctHai: string;
  /** 正解の雀頭に付く符 */
  readonly correctFu: number;
  /** ユーザーが選んだ雀頭（MSPZ） */
  readonly selectedHai: string;
  /** ユーザーが選んだ雀頭に付く符 */
  readonly selectedFu: number;
  readonly isCorrect: boolean;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 雀頭符問題結果生成
 *
 * @param selected - ユーザーが選んだ選択肢
 */
export function toQuestionResult(
  question: JantouFuQuestion,
  selected: JantouFuChoice,
): JantouFuQuestionResult {
  // 正解の選択肢はちょうど 1 つ（ジェネレータが役牌 1 枚 + 0 符 3 枚で組む）
  const correct = question.choices.find((choice) => choice.isCorrect);

  return {
    bakaze: kazeIdToMspz(question.context.bakaze),
    jikaze: kazeIdToMspz(question.context.jikaze),
    correctHai: haiIdToMspz(correct?.hai ?? selected.hai),
    correctFu: correct?.fu ?? 0,
    selectedHai: haiIdToMspz(selected.hai),
    selectedFu: selected.fu,
    isCorrect: selected.isCorrect,
  };
}

/**
 * sessionStorage から取得した値が JantouFuQuestionResult として妥当か検証する
 * 雀頭符問題結果バリデーション
 */
const questionResultSchema: z.ZodType<JantouFuQuestionResult> = z.object({
  bakaze: z.string(),
  jikaze: z.string(),
  correctHai: z.string(),
  correctFu: z.number(),
  selectedHai: z.string(),
  selectedFu: z.number(),
  isCorrect: z.boolean(),
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 雀頭符問題結果パース
 */
export const parseJantouFuResults: (
  raw: string | undefined,
) => readonly JantouFuQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
