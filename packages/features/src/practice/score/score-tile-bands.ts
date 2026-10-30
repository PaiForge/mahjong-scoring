import type { ScoreRange } from "@mahjong-scoring/core";

import {
  splitScoresByBand,
  type SingleInputScores,
} from "./get-available-scores";
import {
  koTsumoSelectOptions,
  scoreSelectOptions,
  type ScoreSelectOption,
} from "./score-select-options";

/** タイル入力の切り替えに並べる点数帯（左から順） */
export const SCORE_BANDS = [
  "nonMangan",
  "manganPlus",
] as const satisfies readonly ScoreRange[];

/** 1 行に並べるタイルの数。子ツモの組（`1800/3600`）は幅が要るので 3 つ */
export const SCORE_TILE_COLUMNS = {
  single: 4,
  koTsumoCombined: 3,
} as const satisfies Readonly<Record<SingleInputScores["type"], number>>;

/**
 * タイル入力の表示を決める入力
 * 点数タイル帯の条件
 */
export interface ScoreTileBandsParams {
  /** 選択肢（子ツモは組の `koTsumoCombined` だけを受ける） */
  readonly available: SingleInputScores;
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  /**
   * 選んだ選択肢の値（`ScoreSelectOption.value`。点数は `"1000"`、子ツモの組は
   * `"300/500"`）。未選択は undefined
   */
  readonly value: string | undefined;
  /** 利用者が切り替えで開いた帯。まだ触っていなければ undefined */
  readonly chosenBand: ScoreRange | undefined;
  /** 各点数の後置文字列（親ツモの「オール」） */
  readonly suffix?: string;
}

/**
 * タイル入力の表示
 * 点数タイル帯
 */
export interface ScoreTileBands {
  /** 帯ごとの選択肢 */
  readonly options: Readonly<Record<ScoreRange, readonly ScoreSelectOption[]>>;
  /** 両方の帯に選択肢があるか（無ければ切り替えを出さない） */
  readonly hasBoth: boolean;
  /** 開いている帯 */
  readonly band: ScoreRange;
  /**
   * 開いていない帯で選んだままの値（帯の文言と、その値の文言）。
   * 切り替えのボタンに添え、見えない値で送れてしまうことを見せる
   */
  readonly hiddenSelection:
    { readonly band: ScoreRange; readonly label: string } | undefined;
  /** 1 行に並べるタイルの数 */
  readonly columns: number;
  /** 確保する行数（切り替えを出すときは多いほうの帯の行数） */
  readonly rows: number;
}

/**
 * 「満貫未満 / 満貫以上」の切り替えとタイルの表示を決める
 * 点数タイル帯決定
 *
 * select では選択肢が多すぎる（子ロンの全範囲で 30 個）ため、帯を先に選び
 * 片側だけをタイルで並べる。web とモバイルが同じ規則で描くため、判断は
 * ここに 1 つ置き、各アプリは描画だけを持つ。
 *
 * - 切り替えの初期値は問題によらず満貫未満 — 正解のある側を開くと、それ自体が
 *   答えのヒントになる。ただし選択済みの値（聴牌形の点数計算で回答済みのマス）が
 *   あるときはその側を開く。利用者が切り替えたらそれを優先する
 * - 選択肢が片側にしか無いとき（5 翻以上・満貫の練習）は切り替えを出さない
 *   （`hasBoth` が false）
 * - 切り替えても選択は消さない。隠れた側に選んだ値があれば `hiddenSelection` で返す
 * - `rows` は両側のうち多いほうの行数。切り替えで下の「回答する」ボタンが
 *   上下に動かないよう、アプリはこの行数ぶんの高さを確保する
 *
 * このモジュールは純粋。
 */
export function resolveScoreTileBands({
  available,
  isOya,
  isTsumo,
  value,
  chosenBand,
  suffix = "",
}: ScoreTileBandsParams): ScoreTileBands {
  const split = splitScoresByBand(available, isOya, isTsumo);
  const options: ScoreTileBands["options"] = {
    nonMangan: toOptions(split.nonMangan, suffix),
    manganPlus: toOptions(split.manganPlus, suffix),
  };
  const hasBoth = SCORE_BANDS.every((band) => options[band].length > 0);
  const selected = SCORE_BANDS.flatMap((band) =>
    options[band].map((option) => ({ band, option })),
  ).find(({ option }) => option.value === value);
  const band: ScoreRange = hasBoth
    ? (chosenBand ?? selected?.band ?? "nonMangan")
    : options.nonMangan.length > 0
      ? "nonMangan"
      : "manganPlus";
  const hiddenSelection =
    selected !== undefined && selected.band !== band
      ? { band: selected.band, label: selected.option.label }
      : undefined;

  const columns = SCORE_TILE_COLUMNS[available.type];
  const longest = hasBoth
    ? Math.max(...SCORE_BANDS.map((b) => options[b].length))
    : options[band].length;
  return {
    options,
    hasBoth,
    band,
    hiddenSelection,
    columns,
    rows: Math.ceil(longest / columns),
  };
}

function toOptions(
  scores: SingleInputScores,
  suffix: string,
): readonly ScoreSelectOption[] {
  return scores.type === "koTsumoCombined"
    ? koTsumoSelectOptions(scores.payments)
    : scoreSelectOptions(scores.scores, suffix);
}
