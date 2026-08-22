import {
  HaiKind,
  type HaiKindId,
  type Kazehai,
} from "@pai-forge/riichi-mahjong";
import { doubleWindJantouFu } from "../../rules/settings";

/**
 * 雀頭の符計算結果
 * 雀頭符計算結果
 */
export interface JantouFuResult {
  readonly fu: number;
  readonly explanation: string;
}

/** 雀頭が役牌である理由 */
export type JantouFuReason = "場風" | "自風" | "三元牌";

/**
 * 雀頭が役牌である理由を列挙する（役牌でなければ空配列）
 * 雀頭役牌理由
 *
 * 「その雀頭が符を持つか」の判定はこの関数が唯一の定義。符の値と
 * 表示ラベルの組み立ては呼び出し側の責務。
 *
 * @param tile - 雀頭の牌種ID
 * @param bakaze - 場風
 * @param jikaze - 自風
 */
export function jantouFuReasons(
  tile: HaiKindId,
  bakaze: Kazehai,
  jikaze: Kazehai,
): readonly JantouFuReason[] {
  const reasons: JantouFuReason[] = [];
  if (tile === bakaze) reasons.push("場風");
  if (tile === jikaze) reasons.push("自風");
  if (tile >= HaiKind.Haku && tile <= HaiKind.Chun) reasons.push("三元牌");
  return reasons;
}

/**
 * 雀頭の符を計算する
 * 三元牌: 2符、場風: 2符、自風: 2符
 * 連風牌（場風と自風が同一）: 既定2符、renfonpaiAs4Fu=true で4符
 * 数牌・オタ風: 0符
 * 雀頭符計算
 *
 * @param tile - 雀頭の牌種ID
 * @param bakaze - 場風
 * @param jikaze - 自風
 * @param renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 */
export function calculateJantouFu(
  tile: HaiKindId,
  bakaze: Kazehai,
  jikaze: Kazehai,
  renfonpaiAs4Fu = false,
): JantouFuResult {
  const reasons = jantouFuReasons(tile, bakaze, jikaze);

  if (reasons.length === 0) {
    return { fu: 0, explanation: "数牌またはオタ風の雀頭" };
  }

  // 場風かつ自風＝連風牌。ルールにより4符または2符（既定2符）。
  const isRenfonpai = reasons.includes("場風") && reasons.includes("自風");
  const fu = isRenfonpai ? doubleWindJantouFu(renfonpaiAs4Fu) : 2;

  return { fu, explanation: `役牌雀頭（${reasons.join("・")}）` };
}
