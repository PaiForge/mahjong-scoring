import {
  calculateKoScore,
  calculateOyaScore,
  FU_VALUES,
  isInvalidCell,
} from "@mahjong-scoring/core";
import type { Role, RoleScore, WinType } from "@mahjong-scoring/core";
import { HAN_COLS } from "./han-cols";

/** 符×翻表の符行（20〜110符） */
export const FU_ROWS = FU_VALUES;

/**
 * 頻出符（30・40符）
 * 頻出符
 *
 * 符×翻表の行見出しを太字で示す。
 */
export const FREQUENT_FU: ReadonlySet<number> = new Set([30, 40]);

/** 点数表の表示モード（符×翻 / 満貫以上） */
export type ScoreTableViewMode = "normal" | "high_score";

/**
 * 符×翻表の点数グリッドのキー
 * 点数グリッドキー
 */
export function scoreGridKey(han: number, fu: number): string {
  return `${han}-${fu}`;
}

/**
 * 符×翻表の点数グリッドを計算する
 * 点数グリッド計算
 *
 * 存在しない組み合わせ（`isInvalidCell`。例: ロンの 20 符）は持たない。
 * 引くときは {@link scoreGridKey} でキーを作る。
 *
 * @param role 親か子か
 * @param winType ロンかツモか
 * @param options.kiriageMangan 切り上げ満貫を採用するか
 */
export function buildScoreGrid(
  role: Role,
  winType: WinType,
  { kiriageMangan }: { readonly kiriageMangan: boolean },
): ReadonlyMap<string, RoleScore> {
  const grid = new Map<string, RoleScore>();
  for (const fu of FU_ROWS) {
    for (const han of HAN_COLS) {
      if (isInvalidCell(han, fu, winType)) continue;
      grid.set(
        scoreGridKey(han, fu),
        role === "ko"
          ? calculateKoScore(han, fu, { kiriageMangan })
          : calculateOyaScore(han, fu, { kiriageMangan }),
      );
    }
  }
  return grid;
}

/**
 * 符×翻表のセル ID（暗記用に数字を隠す切り替えのキー）
 * 符翻セルID
 */
export function normalCellId(
  role: Role,
  winType: WinType,
  han: number,
  fu: number,
): string {
  return `${role}-${winType}-${han}han-${fu}fu`;
}

/**
 * 満貫以上の表のセル ID（暗記用に数字を隠す切り替えのキー）
 * 満貫以上セルID
 *
 * @param nameKey 区分の辞書キー（mangan / haneman …）
 */
export function highScoreCellId(
  role: Role,
  winType: WinType,
  nameKey: string,
): string {
  return `${role}-${winType}-${nameKey}`;
}
