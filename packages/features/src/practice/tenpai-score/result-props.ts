import type {
  HaiKindId,
  JudgementResult,
  MachiCellAnswer,
  MachiSelectionJudgement,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";

import type { ScorePracticeModeFlags } from "../score/generator-options";

/**
 * 聴牌形の点数計算の答え合わせ（`TenpaiScoreResult`）の props（web とアプリで共有）
 * 聴牌形結果表示props
 *
 * 上に待ち牌（あなたの回答と正解）、下に待ちごとの点数計算（マスを選ぶ
 * タブと、選んだマスの内訳）を出す。どちらも「あなたの回答」と「正解」を
 * 並べた同じ形にする。
 */
export interface TenpaiScoreResultProps extends ScorePracticeModeFlags {
  readonly question: TenpaiScoreQuestion;
  /** 選んだ待ち牌（あなたの回答）。判定前に開示したときは空 */
  readonly selectedMachi: readonly HaiKindId[];
  /** 待ち牌の判定。「わからない」で待ちを答える前に開示したときは undefined */
  readonly machiJudgement: MachiSelectionJudgement | undefined;
  readonly cellAnswers: Readonly<Record<string, MachiCellAnswer>>;
  /** マスごとの判定。「わからない」での開示では undefined */
  readonly cellResults: Readonly<Record<string, JudgementResult>> | undefined;
  /** 回答を「翻・符」「支払い」の行に分ける（`formatCellAnswerLines`） */
  readonly formatAnswerLines: (
    answer: MachiCellAnswer,
    isTsumo: boolean,
  ) => readonly string[];
  readonly onNext: () => void;
}

/**
 * 役が無くロンできないマスの答え合わせ（`NoYakuResultDisplay`）の props（web とアプリで共有）
 * 役なし結果表示props
 *
 * 正解が「役なし」のマスは点数の出題（`ScoreQuestion`）を持たないので
 * `ResultDisplay` に渡せない。それでも同じ枠・同じ行（役・翻数・符・点数）の
 * 表で出し、タブを切り替えても形が変わらないようにする。
 */
export interface NoYakuResultDisplayProps extends Pick<
  ScorePracticeModeFlags,
  "requireYaku" | "requireHanFu" | "exactHan"
> {
  /** マスへの回答。「わからない」での開示では undefined */
  readonly userAnswer: MachiCellAnswer | undefined;
  /** マスの判定。開示では undefined */
  readonly result: JudgementResult | undefined;
  /** 翻数と符を答えさせたか。答えさせていなければ回答の翻数・符は未回答の印にする */
  readonly requireHanFu: boolean;
}
