import { haiIdToMspz, haisToMspz } from "@mahjong-scoring/core";
import type { MachiFuQuestion } from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("machi-fu");

/**
 * 待ち符練習の1問ごとの結果データ
 * 待ち符問題結果
 *
 * 結果ページで待ち形を再表示するため、出題そのものを MSPZ 文字列として持つ。
 * 符は待ちの形（両面・嵌張・辺張・単騎・双碰）で決まるので、符だけ並べても
 * 振り返りにならない。
 */
export interface MachiFuQuestionResult {
  /**
   * 待ち形を構成する牌（MSPZ）
   *
   * MSPZ は花色ごとの昇順に正規化されるが、待ち形の牌はもともと昇順で
   * 出題される（両面なら 67s、双碰なら小さい対子から）ため、読み戻しても
   * 出題時と同じ並びになる。
   */
  readonly tiles: string;
  /** 和了牌（MSPZ） */
  readonly agariHai: string;
  /** 正解の符 */
  readonly correctFu: number;
  /** ユーザーが選んだ符 */
  readonly userFu: number;
  readonly isCorrect: boolean;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 待ち符問題結果生成
 */
export function toQuestionResult(
  question: MachiFuQuestion,
  userFu: number,
): MachiFuQuestionResult {
  return {
    tiles: haisToMspz(question.tiles),
    agariHai: haiIdToMspz(question.agariHai),
    correctFu: question.answer,
    userFu,
    isCorrect: userFu === question.answer,
  };
}

/**
 * sessionStorage から取得した値が MachiFuQuestionResult として妥当か検証する
 * 待ち符問題結果バリデーション
 */
const questionResultSchema: z.ZodType<MachiFuQuestionResult> = z.object({
  tiles: z.string(),
  agariHai: z.string(),
  correctFu: z.number(),
  userFu: z.number(),
  isCorrect: z.boolean(),
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 待ち符問題結果パース
 */
export const parseMachiFuResults: (
  raw: string | undefined,
) => readonly MachiFuQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
