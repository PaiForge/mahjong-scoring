/**
 * 点数表早引き練習の型定義
 * 点数表練習型
 */

import type { Role, WinType } from "../../core/roles";
import type { ScoreRange } from "../score/types";
import type { IdGenerator } from "../../core/id";
import type { RandomSource } from "../../core/random";
import type { Fu } from "@pai-forge/riichi-mahjong";
import type { TsumoPayment } from "../../core/score-calculation";

/**
 * ロン和了の正解
 * ロン正解
 */
export interface RonAnswer {
  readonly type: "ron";
  readonly score: number;
}

/**
 * 点数表練習の正解型（ロン / 親ツモ / 子ツモ）
 * 点数表正解
 *
 * ツモの2種は {@link TsumoPayment} をそのまま使う。かつて同じ判別子で
 * フィールド名だけ違う型を並行して持っており、繋ぐためだけの変換関数が
 * 必要になっていた。
 */
export type ScoreTableAnswer = RonAnswer | TsumoPayment;

/**
 * 点数表早引き練習の1問分のデータ
 * 点数表問題
 */
export interface ScoreTableQuestion {
  readonly id: string;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /**
   * 符。満貫以上（manganPlus）の問題では点数が符に依存しないため `undefined`。
   * 満貫未満の問題では必ず数値が入る。
   */
  readonly fu?: Fu;
  readonly correctAnswer: ScoreTableAnswer;
}

/**
 * ユーザーの回答（現時点では正解と同一構造）
 * 点数表ユーザー回答
 *
 * 正解型とは意味的に区別する。将来的にユーザー回答固有のフィールド
 * （回答時間、確信度など）を追加する可能性がある。
 */
export type ScoreTableUserAnswer = ScoreTableAnswer;

/**
 * 問題生成オプション
 * 点数表生成オプション
 */
export interface ScoreTableGeneratorOptions {
  /** 翻数の最小値（満貫未満帯のみに作用。既定: 1） */
  readonly minHan?: number;
  /** 翻数の最大値（満貫未満帯のみに作用。既定: 3） */
  readonly maxHan?: number;
  /** 符の最小値（満貫未満帯のみに作用。既定: 20） */
  readonly minFu?: number;
  /** 符の最大値（満貫未満帯のみに作用。既定: 60） */
  readonly maxFu?: number;
  /** 出題する役割。既定: 親・子の両方 */
  readonly roles?: readonly Role[];
  /** 出題する和了方法。既定: ツモ・ロンの両方 */
  readonly wins?: readonly WinType[];
  /** 出題する点数帯。既定: 満貫未満のみ（後方互換のため） */
  readonly ranges?: readonly ScoreRange[];
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫、既定 false） */
  readonly kiriageMangan?: boolean;
  /** 問題 ID の採番。既定: crypto.randomUUID */
  readonly idGen?: IdGenerator;
  /** 乱数供給源。既定: Math.random */
  readonly rng?: RandomSource;
}
