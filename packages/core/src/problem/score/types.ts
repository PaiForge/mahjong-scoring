import type {
  HaiKindId,
  Tehai14,
  Kazehai,
  ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { FuDetail } from "../../score/fu-calculator";

/**
 * 役の内訳詳細
 * 役内訳
 */
export interface YakuDetail {
  /** 役名（日本語） */
  readonly name: string;
  /** 翻数 */
  readonly han: number;
}

/**
 * 練習問題
 * 点数計算練習問題
 */
export interface ScoreQuestion {
  /** 手牌（14枚） */
  readonly tehai: Tehai14;
  /** 和了牌 */
  readonly agariHai: HaiKindId;
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
  /** 自風 */
  readonly jikaze: Kazehai;
  /** 場風 */
  readonly bakaze: Kazehai;
  /** ドラ表示牌 */
  readonly doraMarkers: readonly HaiKindId[];
  /** リーチ有無 */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌 */
  readonly uraDoraMarkers?: readonly HaiKindId[];
  /** 正解の点数計算結果 */
  readonly answer: ScoreResult;
  /** 符計算の内訳 */
  readonly fuDetails?: readonly FuDetail[];
  /** 役の内訳 */
  readonly yakuDetails?: readonly YakuDetail[];
}

/**
 * ユーザーの回答
 * ユーザー回答
 */
export interface UserAnswer {
  /** 翻数 */
  readonly han: number;
  /** 符（満貫以上の場合は undefined） */
  readonly fu: number | undefined;
  /** 点数（ロンまたは親ツモの場合） */
  readonly score?: number;
  /** 子のツモ時: 子からの点数 */
  readonly scoreFromKo?: number;
  /** 子のツモ時: 親からの点数 */
  readonly scoreFromOya?: number;
  /** 選択された役 */
  readonly yakus: readonly string[];
}

/**
 * 判定結果
 * 回答判定結果
 */
export interface JudgementResult {
  /** 正解かどうか */
  readonly isCorrect: boolean;
  /** 翻が正解かどうか */
  readonly isHanCorrect: boolean;
  /** 符が正解かどうか（満貫以上は常にtrue） */
  readonly isFuCorrect: boolean;
  /** 点数が正解かどうか */
  readonly isScoreCorrect: boolean;
  /** 役が正解かどうか */
  readonly isYakuCorrect: boolean;
}

/**
 * 問題生成オプション
 * 練習問題生成オプション
 */
export interface QuestionGeneratorOptions {
  /** 副露を含めるかどうか */
  readonly includeFuro?: boolean;
  /** 七対子を含めるかどうか */
  readonly includeChiitoi?: boolean;
  /** 出題する点数範囲 */
  readonly allowedRanges?: readonly ("non_mangan" | "mangan_plus")[];
  /** 親（東家）を含めるかどうか */
  readonly includeParent?: boolean;
  /** 子（散家）を含めるかどうか */
  readonly includeChild?: boolean;
}
