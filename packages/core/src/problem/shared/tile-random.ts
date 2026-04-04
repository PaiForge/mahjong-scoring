import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { SUIT_BASES } from "../../core/constants";
import { randomInt, randomChoice } from "../../core/random";
import { isHaiKindId, validateHaiKindId } from "../../core/type-guards";

/**
 * 么九牌（端牌＋字牌）
 * 么九牌リスト
 */
const YAOCHU: readonly HaiKindId[] = [
  HaiKind.ManZu1, HaiKind.ManZu9,
  HaiKind.PinZu1, HaiKind.PinZu9,
  HaiKind.SouZu1, HaiKind.SouZu9,
  HaiKind.Ton, HaiKind.Nan, HaiKind.Sha, HaiKind.Pei,
  HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun,
].filter(isHaiKindId);

/**
 * ランダムな中張牌（2〜8）を生成する
 * 中張牌生成
 */
export function randomSimple(): HaiKindId {
  const base = randomChoice(SUIT_BASES);
  const num = randomInt(2, 8);
  const id = base + num - 1;
  return validateHaiKindId(id).unwrapOr(HaiKind.ManZu5);
}

/**
 * ランダムな么九牌（1,9,字牌）を生成する
 * 么九牌生成
 */
export function randomYaochu(): HaiKindId {
  return randomChoice(YAOCHU);
}
