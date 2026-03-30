import { HaiKind, type Kazehai, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "./type-guards";

/** 風牌（Kazehai） */
export const KAZEHAI: readonly Kazehai[] = [
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
];

/** 三元牌（Sangenhai） */
export const SANGENHAI: readonly HaiKindId[] = [
  HaiKind.Haku,
  HaiKind.Hatsu,
  HaiKind.Chun,
];

/**
 * 数牌の花色ベース値（各花色の1の牌ID）
 * 数牌花色ベース
 */
export const SUIT_BASES: readonly HaiKindId[] = [
  HaiKind.ManZu1,
  HaiKind.PinZu1,
  HaiKind.SouZu1,
].filter(isHaiKindId);
