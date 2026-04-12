import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";
import { SCORE_YAKU_NAME_MAP, YAKU_OPTIONS } from "../../core/constants";

/**
 * 役ドリルでは除外する英語キー
 * 風牌の役牌は getKazeYakuhaiDisplayName で個別に処理するため、
 * 状況役・偶然役とともにマップから除外する
 * 役ドリル除外キー
 */
const YAKU_DRILL_EXCLUDED_KEYS: ReadonlySet<string> = new Set([
  "Riichi", "Ippatsu", "Haitei", "Houtei", "Rinshan", "Chankan",
  "DoubleRiichi", "Tenhou", "Chiihou", "Yakuhai",
  "Ton", "Nan", "Sha", "Pei",
]);

/**
 * ライブラリの役名（英語キー）から日本語表示名へのマッピング
 * SCORE_YAKU_NAME_MAP から風牌・状況役を除外したサブセット
 * 役名マップ
 */
export const YAKU_NAME_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SCORE_YAKU_NAME_MAP).filter(
    ([key]) => !YAKU_DRILL_EXCLUDED_KEYS.has(key),
  ),
);

/**
 * ユーザーが選択可能な役のリスト（翻数順）
 * YAKU_OPTIONS と同一のリスト（単一ソース化）
 * 選択可能役リスト
 */
export const SELECTABLE_YAKU: readonly string[] = YAKU_OPTIONS;

/**
 * 正解から除外するライブラリ返却役名（状況役・偶然役）
 * 除外役名リスト
 */
export const EXCLUDED_YAKU_FROM_ANSWER: ReadonlySet<string> = new Set([
  "Ippatsu",
  "Haitei",
  "Houtei",
  "Rinshan",
  "Chankan",
  "DoubleRiichi",
  "Tenhou",
  "Chiihou",
]);

/**
 * 風牌の牌種IDから役牌表示名へのマッピング
 * 風牌役名マップ
 */
const KAZE_YAKUHAI_DISPLAY_MAP: Readonly<Record<number, string>> = {
  [HaiKind.Ton]: "役牌 東",
  [HaiKind.Nan]: "役牌 南",
  [HaiKind.Sha]: "役牌 西",
  [HaiKind.Pei]: "役牌 北",
};

/**
 * 風牌の牌種IDが場風・自風として役牌になる場合の表示名を返す
 * ライブラリは風牌の役牌を YakuResult に含めないため、手牌の刻子/槓子から手動で判定する
 * 風牌役牌表示名取得
 */
export function getKazeYakuhaiDisplayName(kazeHaiKindId: Kazehai): string | undefined {
  return KAZE_YAKUHAI_DISPLAY_MAP[kazeHaiKindId];
}
