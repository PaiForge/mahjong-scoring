import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 風牌の日本語名マップ
 * 風牌名称マップ
 */
const KAZE_NAMES: Readonly<Record<Kazehai, string>> = {
  [HaiKind.Ton]: "東",
  [HaiKind.Nan]: "南",
  [HaiKind.Sha]: "西",
  [HaiKind.Pei]: "北",
};

/**
 * 風牌の英語キー名マップ（YAKU_NAME_MAP参照用）
 * 風牌キー名マップ
 */
const KAZE_KEYS: Readonly<Record<Kazehai, string>> = {
  [HaiKind.Ton]: "Ton",
  [HaiKind.Nan]: "Nan",
  [HaiKind.Sha]: "Sha",
  [HaiKind.Pei]: "Pei",
};

/**
 * 風牌の日本語名を取得
 * 風牌名称（Kazehai → 日本語）
 */
export function getKazeName(kaze: Kazehai): string {
  return KAZE_NAMES[kaze] ?? "";
}

/**
 * 自風が東（親）かどうかを判定する
 * 親判定
 */
export function isOya(jikaze: Kazehai): boolean {
  return jikaze === HaiKind.Ton;
}

/**
 * 風牌の英語キー名を取得する（YAKU_NAME_MAP参照用）
 * 風牌キー名取得
 */
export function getKeyForKazehai(kaze: Kazehai): string {
  return KAZE_KEYS[kaze] ?? "";
}
