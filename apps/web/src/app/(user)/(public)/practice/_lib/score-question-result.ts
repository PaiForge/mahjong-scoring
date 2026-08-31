import { haiIdToMspz, kazeIdToMspz, tehaiToMspz } from "@mahjong-scoring/core";
import type { ScoreQuestion, ScoreTableAnswer } from "@mahjong-scoring/core";

import type { ScoreQuestionDisplayData } from "../score/_components/question-display";
import { createSessionStorageParser } from "./create-session-storage-parser";
import { parseMarkers, parseQuestionTiles } from "./parse-question-tiles";
import type { QuestionTilesSnapshot } from "./parse-question-tiles";
import { hasFieldTypes, isRecord, isStringArray } from "./shape-guards";

/**
 * 出題内容のスナップショット（結果ページでの手牌再表示用）
 * 出題スナップショット
 *
 * sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、total-fu 練習と同様に牌はすべて MSPZ 文字列に落として
 * 保存する。
 */
export interface ScoreQuestionSnapshot extends QuestionTilesSnapshot {
  /** ドラ表示牌（MSPZ） */
  readonly doraMarkers: readonly string[];
  /** リーチ有無 */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌（MSPZ） */
  readonly uraDoraMarkers?: readonly string[];
}

/**
 * 1問ごとの結果データ（点数系練習共通）
 * 点数問題結果
 */
export interface ScoreQuestionResult {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  /** 符。満貫以上の問題では符に依存しないため省略される */
  readonly fu?: number;
  /** 正解の支払い情報 */
  readonly correctAnswer: ScoreTableAnswer;
  /** ユーザーの回答 */
  readonly userAnswer: ScoreTableAnswer;
  /** 正誤 */
  readonly isCorrect: boolean;
  /**
   * 出題内容。結果ページで手牌・ドラを再表示するために持つ。
   * この項目を保存する前の旧データには存在しないため任意
   */
  readonly question?: ScoreQuestionSnapshot;
}

/**
 * 出題から保存用スナップショットを組み立てる
 * 出題スナップショット生成
 */
export function toScoreQuestionSnapshot(
  question: ScoreQuestion,
): ScoreQuestionSnapshot {
  return {
    tehai: tehaiToMspz(question.tehai),
    agariHai: haiIdToMspz(question.agariHai),
    bakaze: kazeIdToMspz(question.bakaze),
    jikaze: kazeIdToMspz(question.jikaze),
    doraMarkers: question.doraMarkers.map(haiIdToMspz),
    isRiichi: question.isRiichi,
    uraDoraMarkers: question.uraDoraMarkers?.map(haiIdToMspz),
  };
}

const VALID_ANSWER_TYPES = new Set(["ron", "oyaTsumo", "koTsumo"]);

/**
 * 回答オブジェクトの type フィールドが有効かを判定する
 * 回答型判定
 */
function hasValidAnswerType(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const typeValue: unknown = Reflect.get(value, "type");
  return typeof typeValue === "string" && VALID_ANSWER_TYPES.has(typeValue);
}

/**
 * 値が ScoreQuestionSnapshot として妥当か検証する
 * 出題スナップショットバリデーション
 *
 * MSPZ として解釈できるかまでは見ない（表示時のパースが失敗したら
 * 手牌の再表示だけを諦める）。ここでは形だけを確かめる。
 */
export function isValidScoreQuestionSnapshot(value: unknown): boolean {
  if (
    !hasFieldTypes(value, {
      tehai: "string",
      agariHai: "string",
      bakaze: "string",
      jikaze: "string",
    })
  ) {
    return false;
  }
  const isRiichi: unknown = Reflect.get(value, "isRiichi");
  const uraDoraMarkers: unknown = Reflect.get(value, "uraDoraMarkers");
  return (
    isStringArray(Reflect.get(value, "doraMarkers")) &&
    (isRiichi === undefined || typeof isRiichi === "boolean") &&
    (uraDoraMarkers === undefined || isStringArray(uraDoraMarkers))
  );
}

/**
 * sessionStorage から取得した値が ScoreQuestionResult として妥当か検証する
 * 問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is ScoreQuestionResult {
  if (
    !hasFieldTypes(value, {
      isOya: "boolean",
      isTsumo: "boolean",
      han: "number",
      isCorrect: "boolean",
    })
  ) {
    return false;
  }
  // 符は満貫以上の問題で省略されるため、任意フィールドとして個別に見る
  const fu: unknown = Reflect.get(value, "fu");
  // 出題スナップショットは保存を始める前の旧データに存在しないため任意
  const question: unknown = Reflect.get(value, "question");
  return (
    (fu === undefined || typeof fu === "number") &&
    (question === undefined || isValidScoreQuestionSnapshot(question)) &&
    hasValidAnswerType(Reflect.get(value, "correctAnswer")) &&
    hasValidAnswerType(Reflect.get(value, "userAnswer"))
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 問題結果パース
 */
export const parseQuestionResults: (
  raw: string | undefined,
) => readonly ScoreQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);

/**
 * 保存された出題スナップショットから手牌表示用のデータを復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （正誤と回答の比較はスナップショットに依存しないため表示できる）。
 * スナップショットを保存する前の旧データも同様に undefined になる。
 *
 * ツモ・ロンの別を引数で受け取るのは、練習によって置き場所が違うため
 * （点数系は結果の直下、翻数即答はスナップショットの中）。
 */
export function restoreScoreQuestion(
  snapshot: ScoreQuestionSnapshot | undefined,
  isTsumo: boolean,
): ScoreQuestionDisplayData | undefined {
  if (!snapshot) return undefined;

  const tiles = parseQuestionTiles(snapshot);
  if (!tiles) return undefined;

  return {
    ...tiles,
    isTsumo,
    doraMarkers: parseMarkers(snapshot.doraMarkers) ?? [],
    isRiichi: snapshot.isRiichi,
    uraDoraMarkers: parseMarkers(snapshot.uraDoraMarkers),
  };
}
