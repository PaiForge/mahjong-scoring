import { HaiKind, type Kazehai, type HaiKindId } from "@pai-forge/riichi-mahjong";

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
