import { randomChoice } from "../../core/random";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  HIGH_SCORES,
} from "../../core/score-calculation";
import type {
  ScoreTableQuestion,
  ScoreTableAnswer,
  ScoreTableGeneratorOptions,
  ScoreTableRole,
  ScoreTableWin,
} from "./types";

/** 有効な符の値（10刻み、20〜110） */
const ALL_FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

/** 満貫以上で出題する翻数。各値が HIGH_SCORES のいずれかの帯に対応する */
const MANGAN_PLUS_HAN_VALUES = [5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

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
 * 満貫未満の正解を算出する
 * 満貫未満正解算出
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

/**
 * 翻数から満貫以上の点数帯（HIGH_SCORES の1行）を引く
 * 満貫以上帯の特定
 */
function highScoreBandForHan(han: number): (typeof HIGH_SCORES)[number] {
  if (han <= 5) return HIGH_SCORES[0]; // mangan
  if (han <= 7) return HIGH_SCORES[1]; // haneman
  if (han <= 10) return HIGH_SCORES[2]; // baiman
  if (han <= 12) return HIGH_SCORES[3]; // sanbaiman
  return HIGH_SCORES[4]; // yakuman
}

/**
 * 満貫以上の正解を算出する
 * 満貫以上正解算出
 *
 * 満貫以上は点数が符に依存しないため、翻数から HIGH_SCORES の帯を引いて算出する。
 * `calculateKoScore` / `calculateOyaScore` は満貫で頭打ちになり跳満以上を区別できないため、
 * ここでは使わない。
 */
function buildManganCorrectAnswer(
  isOya: boolean,
  isTsumo: boolean,
  han: number,
): ScoreTableAnswer {
  const band = highScoreBandForHan(han);
  if (isOya) {
    if (isTsumo) {
      return { type: "oyaTsumo", scoreAll: parseTsumoNumber(band.tsumoOya) };
    }
    return { type: "ron", score: band.ronOya };
  }
  if (isTsumo) {
    const parts = band.tsumoKo.split("/");
    return {
      type: "koTsumo",
      scoreFromKo: parseInt(parts[0], 10),
      scoreFromOya: parseInt(parts[1], 10),
    };
  }
  return { type: "ron", score: band.ronKo };
}

/** 問題の出題パラメータ */
interface QuestionParams {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 満貫未満のみ設定。満貫以上では undefined */
  readonly fu?: number;
  readonly range: "nonMangan" | "manganPlus";
}

/**
 * 役割・和了方法の (isOya, isTsumo) ペアを列挙する
 * 役割×和了の列挙
 */
function enumerateRoleWinPairs(
  roles: readonly ScoreTableRole[],
  wins: readonly ScoreTableWin[],
): ReadonlyArray<{ isOya: boolean; isTsumo: boolean }> {
  const pairs: { isOya: boolean; isTsumo: boolean }[] = [];
  for (const role of roles) {
    for (const win of wins) {
      pairs.push({ isOya: role === "oya", isTsumo: win === "tsumo" });
    }
  }
  return pairs;
}

/**
 * 満貫未満の有効な出題パラメータを列挙する
 * 満貫未満組み合わせ列挙
 */
function buildNonManganCombinations(
  pairs: ReadonlyArray<{ isOya: boolean; isTsumo: boolean }>,
  hanRange: readonly number[],
  fuCandidates: readonly number[],
): readonly QuestionParams[] {
  const combinations: QuestionParams[] = [];
  for (const { isOya, isTsumo } of pairs) {
    const winType = isTsumo ? "tsumo" : "ron";
    for (const han of hanRange) {
      for (const fu of fuCandidates) {
        if (!isInvalidCell(han, fu, winType)) {
          combinations.push({ isOya, isTsumo, han, fu, range: "nonMangan" });
        }
      }
    }
  }
  return combinations;
}

/**
 * 満貫以上の出題パラメータを列挙する
 * 満貫以上組み合わせ列挙
 */
function buildManganPlusCombinations(
  pairs: ReadonlyArray<{ isOya: boolean; isTsumo: boolean }>,
): readonly QuestionParams[] {
  const combinations: QuestionParams[] = [];
  for (const { isOya, isTsumo } of pairs) {
    for (const han of MANGAN_PLUS_HAN_VALUES) {
      combinations.push({ isOya, isTsumo, han, range: "manganPlus" });
    }
  }
  return combinations;
}

/**
 * 点数表早引き練習の問題を生成する
 * 点数表問題ジェネレータ
 *
 * 有効な親/子・ツモ/ロン・点数帯（満貫未満/満貫以上）の組み合わせを事前列挙し、
 * ランダムに1つ選出する。満貫未満は翻数×符のセル、満貫以上は翻数の帯から出題する。
 *
 * @param options - 役割・和了方法・点数帯・翻数/符範囲のオプション
 */
export function generateScoreTableQuestion(
  options?: Readonly<ScoreTableGeneratorOptions>,
): ScoreTableQuestion {
  const minHan = options?.minHan ?? 1;
  const maxHan = options?.maxHan ?? 3;
  const minFu = options?.minFu ?? 20;
  const maxFu = options?.maxFu ?? 60;
  const roles = options?.roles ?? ["oya", "ko"];
  const wins = options?.wins ?? ["tsumo", "ron"];
  // 後方互換: 未指定時は満貫未満のみ（従来の振る舞い）
  const ranges = options?.ranges ?? ["nonMangan"];

  const pairs = enumerateRoleWinPairs(
    roles.length > 0 ? roles : ["oya", "ko"],
    wins.length > 0 ? wins : ["tsumo", "ron"],
  );

  const combinations: QuestionParams[] = [];
  if (ranges.includes("nonMangan")) {
    const hanRange = Array.from(
      { length: maxHan - minHan + 1 },
      (_, i) => minHan + i,
    );
    const fuCandidates = getFuCandidates(minFu, maxFu);
    combinations.push(
      ...buildNonManganCombinations(pairs, hanRange, fuCandidates),
    );
  }
  if (ranges.includes("manganPlus")) {
    combinations.push(...buildManganPlusCombinations(pairs));
  }

  const { isOya, isTsumo, han, fu, range } = randomChoice(combinations);
  // 満貫未満は必ず符を持つ。fu の有無で型を絞り込み、型アサーションを避ける。
  const correctAnswer =
    range === "nonMangan" && fu !== undefined
      ? buildCorrectAnswer(isOya, isTsumo, han, fu)
      : buildManganCorrectAnswer(isOya, isTsumo, han);

  return {
    id: crypto.randomUUID(),
    isOya,
    isTsumo,
    han,
    fu,
    correctAnswer,
  };
}
