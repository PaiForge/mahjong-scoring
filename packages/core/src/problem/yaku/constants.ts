import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";

/**
 * ライブラリの役名（英語キー）から日本語表示名へのマッピング
 * 役名マップ
 */
export const YAKU_NAME_MAP: Readonly<Record<string, string>> = {
  // 1翻
  Tanyao: "断么九",
  Pinfu: "平和",
  Iipeikou: "一盃口",
  MenzenTsumo: "門前清自摸和",
  Haku: "役牌 白",
  Hatsu: "役牌 發",
  Chun: "役牌 中",

  // 2翻
  SanshokuDoujun: "三色同順",
  Ikkitsuukan: "一気通貫",
  Honchan: "混全帯么九",
  Chiitoitsu: "七対子",
  Toitoi: "対々和",
  Sanankou: "三暗刻",
  Sankantsu: "三槓子",
  SanshokuDoukou: "三色同刻",
  Honroutou: "混老頭",
  Shousangen: "小三元",

  // 3翻
  Honitsu: "混一色",
  Junchan: "純全帯么九",
  Ryanpeikou: "二盃口",

  // 6翻
  Chinitsu: "清一色",

  // 役満
  KokushiMusou: "国士無双",
  Suuankou: "四暗刻",
  Daisangen: "大三元",
  Shousuushii: "小四喜",
  Daisuushii: "大四喜",
  Tsuuiisou: "字一色",
  Chinroutou: "清老頭",
  Ryuuiisou: "緑一色",
  ChuurenPoutou: "九蓮宝燈",
  Suukantsu: "四槓子",
};

/**
 * ユーザーが選択可能な役のリスト（翻数順）
 * 選択可能役リスト
 */
export const SELECTABLE_YAKU: readonly string[] = [
  // 1翻
  "立直",
  "門前清自摸和",
  "断么九",
  "平和",
  "一盃口",
  "役牌 東",
  "役牌 南",
  "役牌 西",
  "役牌 北",
  "役牌 白",
  "役牌 發",
  "役牌 中",
  // 2翻
  "三色同順",
  "一気通貫",
  "混全帯么九",
  "七対子",
  "対々和",
  "三暗刻",
  "三色同刻",
  "三槓子",
  "小三元",
  "混老頭",
  // 3翻
  "混一色",
  "純全帯么九",
  "二盃口",
  // 6翻
  "清一色",
  // 役満
  "国士無双",
  "四暗刻",
  "大三元",
  "字一色",
  "小四喜",
  "大四喜",
  "清老頭",
  "緑一色",
  "九蓮宝燈",
  "四槓子",
];

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
