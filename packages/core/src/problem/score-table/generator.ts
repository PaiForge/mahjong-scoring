import { randomChoice } from "../../core/random";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
} from "../../core/score-calculation";
import type {
  ScoreTableQuestion,
  ScoreTableAnswer,
  ScoreTableGeneratorOptions,
} from "./types";

/** 有効な符の値（10刻み、20〜110） */
const ALL_FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

/**
 * 指定範囲内の符候補を取得する
 * 符候補フィルタ
 */
function getFuCandidates(minFu: number, maxFu: number): readonly number[] {
  return ALL_FU_VALUES.filter((fu) => fu >= minFu && fu <= maxFu);
}

/**
 * ツモ点数文字列から数値部分を抽出する
 * ツモ点数パース
 *
 * `calculateOyaScore` は "4000∀"、`calculateKoScore` は "1000/2000" 形式の文字列を返す。
 * 数字以外の文字を除去して数値に変換する。
 */
function parseTsumoNumber(tsumoStr: string): number {
  return parseInt(tsumoStr.replace(/[^\d]/g, ""), 10);
}

/**
 * 正解を算出する
 * 正解算出
 */
function buildCorrectAnswer(
  isOya: boolean,
  isTsumo: boolean,
  han: number,
  fu: number,
): ScoreTableAnswer {
  if (isOya) {
    const result = calculateOyaScore(han, fu);
    if (isTsumo) {
      return { type: "oyaTsumo", scoreAll: parseTsumoNumber(result.tsumo) };
    }
    return { type: "ron", score: result.ron };
  }

  const result = calculateKoScore(han, fu);
  if (isTsumo) {
    const parts = result.tsumo.split("/");
    return {
      type: "koTsumo",
      scoreFromKo: parseInt(parts[0], 10),
      scoreFromOya: parseInt(parts[1], 10),
    };
  }
  return { type: "ron", score: result.ron };
}

/** 問題の出題パラメータ */
interface QuestionParams {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  readonly fu: number;
}

/**
 * 有効な出題パラメータの全組み合わせを列挙する
 * 有効組み合わせ列挙
 */
function buildValidCombinations(
  hanRange: readonly number[],
  fuCandidates: readonly number[],
): readonly QuestionParams[] {
  const combinations: QuestionParams[] = [];
  for (const isOya of [true, false]) {
    for (const isTsumo of [true, false]) {
      const winType = isTsumo ? "tsumo" : "ron";
      for (const han of hanRange) {
        for (const fu of fuCandidates) {
          if (!isInvalidCell(han, fu, winType)) {
            combinations.push({ isOya, isTsumo, han, fu });
          }
        }
      }
    }
  }
  return combinations;
}

/**
 * 点数表早引きドリルの問題を生成する
 * 点数表問題ジェネレータ
 *
 * 有効な親/子・ツモ/ロン・翻数・符の組み合わせを事前列挙し、ランダムに1つ選出する。
 *
 * @param options - 翻数範囲・符範囲のオプション（将来の拡張用）
 */
export function generateScoreTableQuestion(
  options?: Readonly<ScoreTableGeneratorOptions>,
): ScoreTableQuestion {
  const minHan = options?.minHan ?? 1;
  const maxHan = options?.maxHan ?? 3;
  const minFu = options?.minFu ?? 20;
  const maxFu = options?.maxFu ?? 60;

  const hanRange = Array.from({ length: maxHan - minHan + 1 }, (_, i) => minHan + i);
  const fuCandidates = getFuCandidates(minFu, maxFu);
  const validCombinations = buildValidCombinations(hanRange, fuCandidates);

  const { isOya, isTsumo, han, fu } = randomChoice(validCombinations);
  const correctAnswer = buildCorrectAnswer(isOya, isTsumo, han, fu);

  return {
    id: crypto.randomUUID(),
    isOya,
    isTsumo,
    han,
    fu,
    correctAnswer,
  };
}
