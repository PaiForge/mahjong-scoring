import { haiIdToMspz, kazeIdToMspz, tehaiToMspz } from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("yaku");

/**
 * 役選択練習の1問ごとの結果データ
 * 役選択問題結果
 *
 * 結果ページで手牌を再表示するため、出題そのものを MSPZ 文字列として持つ。
 * 役の成否はリーチとドラにも依存するので、手牌だけでなく和了状況一式を残す。
 */
export interface YakuQuestionResult {
  /** 手牌（Extended MSPZ。副露・暗槓を含む） */
  readonly tehai: string;
  /** 場風（MSPZ） */
  readonly bakaze: string;
  /** 自風（MSPZ） */
  readonly jikaze: string;
  /** 和了牌（MSPZ） */
  readonly agariHai: string;
  readonly isTsumo: boolean;
  readonly isRiichi: boolean;
  /**
   * ドラ表示牌（1 枚 1 要素の MSPZ）
   *
   * 1 つの文字列にまとめると花色ごとに並べ替えられ、出題時と順が変わる。
   */
  readonly doraMarkers: readonly string[];
  /** 成立していた役 */
  readonly correctYakuNames: readonly string[];
  /** ユーザーが選んだ役 */
  readonly selectedYakuNames: readonly string[];
  /** 過不足なく選べたか */
  readonly isCorrect: boolean;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 役選択問題結果生成
 */
export function toQuestionResult(
  question: YakuQuestion,
  selectedYakuNames: readonly string[],
  isCorrect: boolean,
): YakuQuestionResult {
  const { context } = question;
  return {
    tehai: tehaiToMspz(question.tehai),
    bakaze: kazeIdToMspz(context.bakaze),
    jikaze: kazeIdToMspz(context.jikaze),
    agariHai: haiIdToMspz(context.agariHai),
    isTsumo: context.isTsumo,
    isRiichi: context.isRiichi,
    doraMarkers: context.doraMarkers.map(haiIdToMspz),
    correctYakuNames: [...question.correctYakuNames],
    selectedYakuNames: [...selectedYakuNames],
    isCorrect,
  };
}

/**
 * sessionStorage から取得した値が YakuQuestionResult として妥当か検証する
 * 役選択問題結果バリデーション
 */
const questionResultSchema: z.ZodType<YakuQuestionResult> = z.object({
  tehai: z.string(),
  bakaze: z.string(),
  jikaze: z.string(),
  agariHai: z.string(),
  isTsumo: z.boolean(),
  isRiichi: z.boolean(),
  doraMarkers: z.array(z.string()),
  correctYakuNames: z.array(z.string()),
  selectedYakuNames: z.array(z.string()),
  isCorrect: z.boolean(),
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 役選択問題結果パース
 */
export const parseYakuResults: (
  raw: string | undefined,
) => readonly YakuQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
