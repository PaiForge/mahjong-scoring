import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * 風牌の日本語名を取得
 * 風牌名称（Kazehai → 日本語）
 */
export function getKazeName(kaze: Kazehai): string {
  switch (kaze) {
    case HaiKind.Ton:
      return "東";
    case HaiKind.Nan:
      return "南";
    case HaiKind.Sha:
      return "西";
    case HaiKind.Pei:
      return "北";
    default:
      return "";
  }
}
