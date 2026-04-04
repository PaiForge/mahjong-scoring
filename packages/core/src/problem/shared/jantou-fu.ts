import { HaiKind, type HaiKindId, type Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 雀頭の符計算結果
 * 雀頭符計算結果
 */
export interface JantouFuResult {
  readonly fu: number;
  readonly explanation: string;
}

/**
 * 雀頭の符を計算する
 * 三元牌: 2符、場風: 2符、自風: 2符、連風牌（場風と自風が同一）: 2符
 * 数牌・オタ風: 0符
 * 雀頭符計算
 *
 * @param tile - 雀頭の牌種ID
 * @param bakaze - 場風
 * @param jikaze - 自風
 */
export function calculateJantouFu(
  tile: HaiKindId,
  bakaze: Kazehai,
  jikaze: Kazehai,
): JantouFuResult {
  if (tile >= HaiKind.Haku && tile <= HaiKind.Chun) {
    return { fu: 2, explanation: "役牌雀頭（三元牌）" };
  }

  const reasons: string[] = [];
  if (tile === bakaze) reasons.push("場風");
  if (tile === jikaze) reasons.push("自風");

  if (reasons.length > 0) {
    // 連風牌（場風と自風が同一の風牌雀頭）は2符として扱う。
    // 4符とするルールも存在するが、本アプリでは2符を採用する。
    return { fu: 2, explanation: `役牌雀頭（${reasons.join("・")}）` };
  }

  return { fu: 0, explanation: "数牌またはオタ風の雀頭" };
}
