import type {
  HaiKindId,
  Kazehai,
  Tehai13,
  YakumanRuleConfig,
} from "@pai-forge/riichi-mahjong";
import type { RandomSource } from "../../core/random";
import type { ScoreQuestion, ScoreRange } from "../score/types";

/**
 * 待ち牌 1 つ分の出題
 * 待ち別出題
 *
 * ツモとロンは同じ和了牌でも翻（門前清自摸和）と符（ツモ符・門前加符）が
 * 変わるため、別々の点数計算問題として持つ。それぞれは点数計算総合演習と
 * 同じ {@link ScoreQuestion} で、回答の判定・内訳の表示をそのまま使える。
 */
export interface MachiScoreWait {
  readonly agariHai: HaiKindId;
  /**
   * ツモ和了の出題。門前なら門前清自摸和が必ず付くため常に和了れる。
   * 副露手でツモも役なしになる待ちを持つ聴牌形は出題しない
   */
  readonly tsumo: ScoreQuestion;
  /**
   * ロン和了の出題。役が 1 つも無くロンできない待ちは undefined
   * （回答では「役なし」を選ぶのが正解）。門前の役なし聴牌のほか、
   * 副露手でも暗刻 2 つ + 双碰待ちの形はツモなら三暗刻が付き、ロンだと
   * 明刻になって役が消えるため undefined になりうる
   */
  readonly ron: ScoreQuestion | undefined;
}

/**
 * 待ち別点数計算の問題
 * 待ち別点数計算問題
 *
 * 聴牌形（13 枚）と局面を 1 組持ち、待ち牌ごとにツモ・ロンの点数計算問題を
 * 抱える。ドラ表示牌・裏ドラ表示牌・リーチの有無は局面のものなので問題に
 * 1 つずつで、各待ちの {@link ScoreQuestion} にも同じ値が入っている。
 */
export interface MachiScoreQuestion {
  /** 聴牌形（純手牌 13 枚相当 + 副露） */
  readonly tehai: Tehai13;
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly doraMarkers: readonly HaiKindId[];
  readonly isRiichi: boolean;
  /** 裏ドラ表示牌。リーチしている出題だけが持つ */
  readonly uraDoraMarkers?: readonly HaiKindId[];
  /** 待ち牌ごとの出題。牌種 ID の昇順で、2 つ以上 */
  readonly waits: readonly MachiScoreWait[];
}

/**
 * 待ち別点数計算の問題生成オプション
 * 待ち別点数計算生成オプション
 *
 * 点数計算総合演習のオプション（`QuestionGeneratorOptions`）のうち、
 * 待ちごとに答えが割れる出題でも意味を持つものだけを持つ。役の指定・符の
 * 指定・境界除外は「どの待ちに掛けるか」が定まらないため持たない。
 */
export interface MachiScoreGeneratorOptions {
  /** 副露を含めるかどうか（既定 true） */
  readonly includeFuro?: boolean;
  /**
   * 出題する点数範囲（既定: 絞り込まない）
   * 点数範囲
   *
   * すべての待ち（ツモ・ロンとも）が範囲に入る聴牌形だけを出題する。
   * 高目だけで判定すると、回答の点数選択肢が範囲で固定されている画面で
   * 安目の答えを選べなくなる。
   */
  readonly allowedRanges?: readonly ScoreRange[];
  /** 親（東家）を含めるかどうか（既定 true） */
  readonly includeParent?: boolean;
  /** 子（散家）を含めるかどうか（既定 true） */
  readonly includeChild?: boolean;
  /** 連風牌の雀頭を4符として扱うか（既定 false=2符） */
  readonly renfonpaiAs4Fu?: boolean;
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫、既定 false） */
  readonly kiriageMangan?: boolean;
  /** 役満ルール設定（ダブル役満の形・複合役満の合算。既定: すべて無効） */
  readonly yakumanRules?: YakumanRuleConfig;
  /** 乱数供給源。既定: Math.random */
  readonly rng?: RandomSource;
}
