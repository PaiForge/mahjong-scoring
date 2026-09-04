import {
  HaiKind,
  type Kazehai,
  type HaiKindId,
} from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "./type-guards";

/**
 * 全34牌種（萬子・筒子・索子 各9 + 字牌7）。ID の昇順
 * 全牌種
 *
 * 「34 種を走査する」場所はすべてここから引く。`0..33` のループと
 * `validateHaiKindId` の組を各所に書かない。
 */
export const ALL_HAI_KINDS: readonly HaiKindId[] = Object.values(HaiKind);

/** 風牌（Kazehai） */
export const KAZEHAI: readonly Kazehai[] = [
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
];

/**
 * 出題で場風として使う風牌の候補（東場・南場）
 * 場風候補
 *
 * 「出題される局はどの場か」というルールの唯一の定義。全ジェネレータがここから引く。
 * 自風（{@link KAZEHAI}）と違い西場・北場は出題しない。
 */
export const BAKAZE_OPTIONS: readonly Kazehai[] = [HaiKind.Ton, HaiKind.Nan];

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

/**
 * 点数レベル定数
 * 点数レベル
 */
export const ScoreLevel = {
  Normal: "Normal",
  Mangan: "Mangan",
  Haneman: "Haneman",
  Baiman: "Baiman",
  Sanbaiman: "Sanbaiman",
  Yakuman: "Yakuman",
  DoubleYakuman: "DoubleYakuman",
} as const;
