import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.yakuHan);

/**
 * 役翻数練習の1問ごとの結果データ
 * 役翻数問題結果
 */
export interface YakuHanQuestionResult {
  /** 出題した役名 */
  readonly yakuName: string;
  /** 門前で出題されたか（false は鳴き） */
  readonly isMenzen: boolean;
  /** 正解の翻数 */
  readonly correctHan: number;
  /** ユーザーが選択した翻数 */
  readonly userHan: number;
  /** 正誤 */
  readonly isCorrect: boolean;
}

/**
 * sessionStorage から取得した値が YakuHanQuestionResult として妥当か検証する
 * 役翻数問題結果バリデーション
 */
const questionResultSchema: z.ZodType<YakuHanQuestionResult> = z.object({
  yakuName: z.string(),
  isMenzen: z.boolean(),
  correctHan: z.number(),
  userHan: z.number(),
  isCorrect: z.boolean(),
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 役翻数問題結果パース
 */
export const parseYakuHanResults: (
  raw: string | undefined,
) => readonly YakuHanQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
